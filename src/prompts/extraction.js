import Anthropic from '@anthropic-ai/sdk'

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a precision standup transcript parser for a digital publishing company.
Your job is to extract structured data from a single team's standup transcript.

## Output contract
Return ONLY a single valid JSON object. No markdown fences, no prose, no explanation.
If you are unsure about a field, use the AMBIGUOUS pattern described below rather than guessing.

## Field-by-field extraction rules

### team
Identify from context: "product", "datascience", "content", "engineering", "marketing",
"design", or "unknown" if not determinable.

### date
Extract any date mentioned (e.g. "March 23", "Monday", "today"). Normalise to ISO 8601
(YYYY-MM-DD) when a full date is available. Use "" if absent.

### members[]
One entry per person who speaks or is spoken about with attributed work.
- name: First name or handle as used in the transcript. Never invent.
- working_on: Concise noun phrase (≤12 words) for their primary task this period.
- okr_tag: Map to the closest OKR or initiative. Infer from keywords:
    "engagement" → "Reader Engagement"
    "churn", "retention" → "User Retention"
    "recommendation", "personali" → "Personalisation"
    "safety", "moderation", "label" → "Content Safety"
    "experiment", "A/B" → "Experiment Velocity"
    "launch", "campaign" → "Launch Readiness"
    "cost", "infra", "AWS" → "Infrastructure Efficiency"
    If no clear match: "General"
- closed: Array of completed items mentioned (shipped, done, signed off, merged, etc.).
  Empty array if none.

### blocker
This is the most important field. Apply the type taxonomy strictly:

  "none"            — No blocker mentioned. Person is unblocked.

  "fundamental"     — The current approach cannot proceed without a design/architecture change,
                      OR a critical assumption turned out to be wrong (e.g. data corruption,
                      wrong API, external service defunct). NOT just "it's hard".

  "waiting_known"   — Blocked waiting for a specific, named deliverable, person, team, or
                      decision. The dependency is clear and acknowledged by both sides.

  "waiting_unknown" — Something is missing or stuck but the blocker is vague: the person
                      doesn't know who owns it, hasn't heard back, or the dependency is
                      implied but not confirmed.

  Rules:
  - If someone says "waiting on X" and X is a named team/person → waiting_known
  - If someone says "still haven't heard back" or "not sure who owns this" → waiting_unknown
  - If a tool is broken, data is corrupted, or an approach must be abandoned → fundamental
  - Multiple blockers in one turn: use the most severe (fundamental > waiting_unknown > waiting_known)
    and mention others in description.
  - exists: true if type != "none"
  - waiting_on_team / waiting_on_person: populate when type is waiting_known. Empty string otherwise.
  - days_blocked: integer calendar days from when the blocker was first raised to today.
    Count all days including weekends — do not use business days.
    Examples: raised Thursday, today Monday = 4. Raised last Tuesday, today Monday = 6.
    If only a vague duration is given ("a few days", "last week") use your best estimate.
    Use 0 if no timing information is available.
  - description: one clear sentence. If vague speech → quote the original and add your reading.

### timeline
  - status: "on_track" unless the transcript contains risk/delay signals.
    on_track  — no concern raised, or issue is already resolved
    at_risk   — explicit hedging ("might slip", "uncertain", "trying to recover")
    delayed   — explicitly missed a deadline or will not hit the target
  - deadline: any date or sprint reference mentioned for their work. "" if none.
  - notes: concise context if at_risk or delayed. "" otherwise.

### commitment
  - what: the explicit next-step or deliverable the person commits to (look for "I'll",
    "we'll", "by Thursday", "will send", "going to"). "" if no explicit commitment.
  - by: deadline for the commitment ("EOD today", "Thursday", "end of sprint"). "" if none.
  - at_risk: true if they qualify the commitment with uncertainty ("if X happens", "hopefully").

### team_health
Aggregate across all members:
  "red"   — ≥1 fundamental blocker OR ≥2 waiting blockers affecting a launch deadline
  "amber" — 1–2 waiting blockers, or at_risk timelines, no immediate launch threat
  "green" — all members on_track, no blockers or minor blockers only

### extraction_confidence
Float 0.0–1.0.
  1.0 — all fields clearly stated, no inference needed
  0.8 — minor inference (dates, OKR tags) but high signal overall
  0.6 — several fields inferred from context
  0.4 — transcript is vague, partial, or heavily colloquial
  < 0.4 — insufficient signal; flag major gaps in ambiguous_items

### ambiguous_items
Array of strings. Add an entry for each of:
  - A name you couldn't disambiguate
  - A blocker whose type you're uncertain about
  - A commitment with no clear owner
  - Any field where you had two plausible interpretations
  - Missing context that would change the extraction (e.g. "unclear which team owns X")
Format: "<field>: <what's ambiguous and why>"

## Handling vague standup speech
Standups are informal. Apply these heuristics:
- "Still on X" → working_on = X, no change in status unless qualifier
- "Wrapped up Y" / "Y is out" → closed includes Y
- "Need Z from them" → waiting_known if "them" is previously identified, else waiting_unknown
- "Should be done by Friday" → commitment.by = "Friday", commitment.at_risk = false
- "Hopefully done by Friday" → commitment.at_risk = true
- "Ran into an issue with..." without naming owner → waiting_unknown or fundamental depending on nature
- Passive voice with no owner ("it's broken", "hasn't been fixed") → waiting_unknown unless team is named
- Mentions of a prior sprint promise not yet delivered → days_blocked > 0, estimate from context`

// ─── Schema (inlined in user message for Claude to reference) ─────────────

const OUTPUT_SCHEMA = `{
  "team": "string",
  "date": "ISO-8601 or empty string",
  "members": [
    {
      "name": "string",
      "working_on": "string",
      "okr_tag": "string",
      "closed": ["string"],
      "blocker": {
        "exists": false,
        "type": "none | fundamental | waiting_known | waiting_unknown",
        "description": "string",
        "waiting_on_team": "string",
        "waiting_on_person": "string",
        "days_blocked": 0
      },
      "timeline": {
        "status": "on_track | at_risk | delayed",
        "deadline": "string",
        "notes": "string"
      },
      "commitment": {
        "what": "string",
        "by": "string",
        "at_risk": false
      }
    }
  ],
  "team_health": "green | amber | red",
  "extraction_confidence": 0.0,
  "ambiguous_items": ["string"]
}`

// ─── API call ─────────────────────────────────────────────────────────────────

/**
 * Parse a single team's standup transcript into structured JSON.
 *
 * @param {string} transcriptText  Raw standup transcript (any length)
 * @returns {Promise<object>}      Parsed extraction matching the schema above
 */
export async function extractStandup(transcriptText) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing VITE_ANTHROPIC_API_KEY. Add it to your .env file.')
  }

  if (!transcriptText || !transcriptText.trim()) {
    throw new Error('Transcript is empty.')
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract structured data from this standup transcript.

Return a JSON object matching this schema exactly:
${OUTPUT_SCHEMA}

<transcript>
${transcriptText.trim()}
</transcript>`,
      },
    ],
  })

  const message = await stream.finalMessage()

  // With adaptive thinking, the response may include a thinking block first.
  // Find the text block that contains our JSON.
  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock) {
    throw new Error('Claude returned no text content.')
  }

  const raw = textBlock.text.trim()

  // Strip accidental markdown fences (shouldn't happen but be defensive)
  const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error(`JSON parse failed. Raw response:\n${cleaned}`)
  }

  // Lightweight structural validation — catch hallucinated schemas early
  if (!parsed.team || !Array.isArray(parsed.members)) {
    throw new Error(`Unexpected response structure. Got: ${JSON.stringify(parsed).slice(0, 200)}`)
  }

  return parsed
}
