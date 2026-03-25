import Anthropic from '@anthropic-ai/sdk'

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a chief of staff writing the CEO's morning organizational briefing.
You have two inputs: the output of a cross-team blocker analysis and the raw team extraction data.
Your job is to distill everything into a tight, action-oriented digest the CEO can read in 90 seconds.

## Tone and language rules
- Write like a trusted advisor speaking directly to the CEO, not like a system report
- Use plain English. No acronyms unless universally known. No technical jargon.
- Every sentence must earn its place. Cut hedging words: "might", "could potentially", "it seems"
- Name people and teams specifically. "Aditya (DS lead)" not "a member of the data science team"
- State facts, not interpretations. "The report is 4 days late" not "there may be a delay"
- Recommended actions must be imperative: "Call X" / "Confirm Y by noon" / "Decide Z today"

## Item selection rules — strictly apply in order
1. Start from the matcher output escalate_to_ceo array — these are the floor, always include them
2. Add any remaining critical+silent matches not already covered
3. Fill remaining slots (up to 5 total) with high-severity matches affecting named deadlines
4. Never include:
   - Matches where silent = false AND both sides have already committed to resolve it today
   - Internal blockers within a single team (person waiting on their own team lead)
   - Items where days_unresolved = 0 and no deadline is threatened
5. If fewer than 5 qualifying items exist, stop at the real count — do not pad

## Status assignment
🔴  severity = critical OR action is needed today to prevent a deadline breach
🟡  severity = high, action needed this week, no immediate deadline breach today
✅  resolved or acknowledged by both sides with committed action already in flight

## Ordering
Sort by: 🔴 first, then 🟡, then ✅
Within same status: sort by days_unresolved descending (longest wait first)

## Headline rule
One sentence. Name the single most urgent, actionable signal — the thing that if the CEO
does nothing else today, this is the one thing. It should imply the action, not just describe
the problem. Example form: "X is blocked and will miss Y deadline unless Z happens by today."

## how_long field
Plain English duration. "3 days" / "since last Tuesday (5 days)" / "overdue since last Friday"
Not ISO dates. Not "days_unresolved: 4". Write it like you'd say it in a meeting.

## company_pulse rules
- teams_on_track: ONLY include a team if ALL THREE conditions are true:
    1. It appears in the provided team extractions
    2. Its team_health field is "green"
    3. It has zero matches in the matcher output (neither team_a nor team_b)
  If a team did not submit a transcript, do not mention it at all.
  Absence of data is not the same as all good. An empty array is correct when no team qualifies.
- teams_at_risk: teams with critical matches OR that are a shared_bottleneck
- total_days_lost_to_waiting: sum of total_days_lost across all shared_bottleneck entries
- shared_bottlenecks: for each bottleneck, write one plain sentence:
  "Content team: 2 teams waiting, 9 combined days lost"

## Output contract
Return ONLY a single valid JSON object. No markdown fences, no prose, no preamble.`

// ─── API call ─────────────────────────────────────────────────────────────────

/**
 * Generate the CEO's morning organizational briefing.
 *
 * @param {object}   matcherOutput   Output of matchCrossTeamBlockers()
 * @param {object[]} extractedTeams  Array of team extraction objects
 * @returns {Promise<object>}        CEO digest matching the schema
 */
export async function generateCEODigest(matcherOutput, extractedTeams) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing VITE_ANTHROPIC_API_KEY. Add it to your .env file.')
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Generate the CEO morning digest from this data.

Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Return a JSON object with this exact schema:
{
  "digest_date": "string — today's date in plain English e.g. Monday, March 23 2026",
  "headline": "string — one sentence, the single most urgent signal today",
  "items": [
    {
      "priority": 1,
      "status": "🔴 | 🟡 | ✅",
      "title": "string — 6 words max, noun phrase",
      "situation": "string — 2-3 sentences max, plain English, specific names and numbers",
      "how_long": "string — plain English duration",
      "okr_impact": "string — which goal is at risk and how",
      "action": "string — imperative sentence, named person, specific deadline",
      "owner": "string — first name and team e.g. Aditya (DS)",
      "due": "today | by [day of week]"
    }
  ],
  "company_pulse": {
    "teams_on_track": ["string"],
    "teams_at_risk": ["string"],
    "total_days_lost_to_waiting": 0,
    "shared_bottlenecks": ["string"]
  }
}

<cross_team_matches>
${JSON.stringify(matcherOutput, null, 2)}
</cross_team_matches>

<team_extractions>
${JSON.stringify(extractedTeams, null, 2)}
</team_extractions>`,
      },
    ],
  })

  const message = await stream.finalMessage()
  const textBlock = message.content.find(b => b.type === 'text')
  if (!textBlock) throw new Error('Claude returned no text content.')

  const cleaned = textBlock.text.trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    throw new Error(`JSON parse failed. Raw response:\n${cleaned}`)
  }

  if (!parsed.headline || !Array.isArray(parsed.items)) {
    throw new Error(`Unexpected response structure: ${JSON.stringify(parsed).slice(0, 200)}`)
  }

  return parsed
}
