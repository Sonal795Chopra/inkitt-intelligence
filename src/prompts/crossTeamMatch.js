import Anthropic from '@anthropic-ai/sdk'

// ─── Prompt ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an organizational intelligence system that detects cross-team blockers,
silent dependencies, and coordination failures from structured standup extraction data.

You will receive an array of team extraction objects. Each object contains members with blocker,
timeline, commitment, and ambiguous_items fields. Your job is to reason across all teams and
surface connections that no single team can see on their own.

## Output contract
Return ONLY a single valid JSON object matching the schema provided. No markdown, no prose.

## The five matching rules — apply all five, in order

### Rule 1 — waiting_dependency
For every member where blocker.type is "waiting_known" or "waiting_unknown":
  - Semantically match their blocker.description against every other member's:
    * working_on
    * closed[] items
    * commitment.what
    * timeline.notes
  - If the blocker description and another member's work clearly refer to the same deliverable,
    feature, data, or decision → emit a waiting_dependency match.
  - Use semantic matching, not keyword matching. "cohort segmentation data" matches
    "validating and backfilling event pipeline data for downstream use."
  - Cross team boundaries: only match members on DIFFERENT teams.

### Rule 2 — missed_delivery
For every member where blocker.exists is false BUT:
  - Their timeline.notes, blocker.description, or the team's ambiguous_items mention a late,
    undelivered, or missed commitment to another team
  → Check if any member on another team has a blocker or dependency that corresponds to
    that exact missed delivery.
  → Emit a missed_delivery match connecting the person who missed with the person waiting.
  - This rule catches the case where someone says "no blockers" but has quietly caused one elsewhere.

### Rule 3 — architectural_conflict
For every ambiguous_item across any team that uses language suggesting overlap, duplication,
conflict, or "stepping on each other":
  - Search all other teams' members' working_on, timeline.notes, and commitment.what for
    semantically related work.
  - If two members on different teams are building things that interact with the same system,
    data layer, user-facing feature, or shared resource → emit an architectural_conflict.
  - Require at least one side to have raised the concern (even casually) in ambiguous_items
    or timeline.notes.

### Rule 4 — shared_bottleneck
  - Collect all members across all teams where blocker.waiting_on_team is non-empty.
  - If the same team name appears in waiting_on_team for members from two or more DIFFERENT teams
    → that team is a shared_bottleneck.
  - Emit one shared_bottleneck entry per bottleneck team.
  - total_days_lost = sum of days_blocked for all members waiting on that team.
  - Also emit individual waiting_dependency matches for each of the constituent blockers.

### Rule 5 — unowned_request
  - Scan every team's ambiguous_items for entries that describe an external request
    (from another team) with no confirmed owner on the receiving team.
  - Cross-reference the request description against other teams' blockers to find who is waiting.
  - Emit an unowned_request match connecting the waiting member to the team where ownership
    was unclear.

## Determining the "silent" field
silent = true when NEITHER team explicitly named or acknowledged the connection in their standup.

Signals that make silent = FALSE (at least one side knew):
  - A member explicitly named the other team's person by name as their blocker source
  - A member's commitment.what explicitly mentions notifying or updating the other team
  - The team lead summarised the cross-team dependency in the standup

Signals that make silent = TRUE (neither side connected the dots):
  - One team is waiting on another team, and the other team's standup never mentioned
    the waiting team or the specific deliverable
  - Both teams mentioned a potential overlap vaguely ("might overlap", "I heard they're
    doing something") without confirming the conflict with each other
  - A request fell through a gap (e.g. ownership confusion on the receiving team)
    and no one on either side knows the full picture

Default to silent = true when uncertain.

## Severity rules — derive dynamically, no hardcoding
  critical — days_unresolved >= 3 AND okr_impact is non-empty AND silent = true
  high     — days_unresolved >= 2 OR match blocks a named external deadline
  medium   — everything else

days_unresolved: use the maximum days_blocked across the two members involved.
  If days_blocked = 0 on both sides, use days_unresolved = 1 as a floor.

## CEO escalation rules
Escalate to CEO only when ALL of the following are true:
  - severity = "critical"
  - silent = true
  - days_unresolved >= 3

Each escalation entry must have a plain-English reason that a CEO can act on immediately,
a match_id reference, and urgency = "today" or "this_week".

## Output schema (return exactly this structure)
{
  "matches": [
    {
      "match_id": "match_001",
      "type": "waiting_dependency | missed_delivery | architectural_conflict | shared_bottleneck | unowned_request",
      "severity": "critical | high | medium",
      "team_a": "",
      "person_a": "",
      "team_b": "",
      "person_b": "",
      "description": "",
      "days_unresolved": 0,
      "okr_impact": "",
      "recommended_action": "",
      "silent": true
    }
  ],
  "shared_bottlenecks": [
    {
      "team": "",
      "blocking_count": 0,
      "teams_affected": [],
      "total_days_lost": 0
    }
  ],
  "escalate_to_ceo": [
    {
      "reason": "",
      "match_id": "",
      "urgency": "today | this_week"
    }
  ]
}

## Important
- match_id values must be unique strings: "match_001", "match_002", etc.
- Every match must have a concrete recommended_action (verb + who + by when).
- okr_impact: name the specific OKR or goal at risk. Empty string if none.
- Do not emit duplicate matches for the same pair of people.
- shared_bottlenecks is a summary array — one entry per bottleneck team, not one per match.
- escalate_to_ceo may be an empty array if no matches qualify.`

// ─── API call ─────────────────────────────────────────────────────────────────

/**
 * Detect cross-team blockers, silent dependencies, and coordination failures
 * from an array of extracted team standup objects.
 *
 * @param {object[]} extractedTeams  Array of team extraction objects (output of extractStandup)
 * @returns {Promise<object>}        Match results: matches, shared_bottlenecks, escalate_to_ceo
 */
export async function matchCrossTeamBlockers(extractedTeams) {
  const apiKey = sessionStorage.getItem('inkitt_anthropic_key')
  if (!apiKey) {
    throw new Error('No API key set.')
  }
  if (!Array.isArray(extractedTeams) || extractedTeams.length < 2) {
    throw new Error('matchCrossTeamBlockers requires at least two team extractions.')
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Apply all five matching rules to these ${extractedTeams.length} team extractions.
Return the matches JSON object.

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

  if (!Array.isArray(parsed.matches)) {
    throw new Error(`Unexpected response structure: ${JSON.stringify(parsed).slice(0, 200)}`)
  }

  return parsed
}
