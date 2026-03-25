import type { Transcripts } from '../types'

export function buildExtractionPrompt(transcripts: Transcripts): string {
  return `You are an organizational intelligence system for a digital publishing company (Inkitt).
Analyze the standup transcripts from three teams below and return a single JSON object.

<transcripts>
<product_team>
${transcripts.product}
</product_team>

<data_science_team>
${transcripts.datascience}
</data_science_team>

<content_publishing_team>
${transcripts.content}
</content_publishing_team>
</transcripts>

Return ONLY valid JSON matching this exact schema — no markdown, no extra text:

{
  "teams": [
    {
      "team": "product" | "datascience" | "content",
      "summary": "2-sentence summary of the standup",
      "wins": ["string"],
      "risksAhead": ["string"],
      "blockers": [
        {
          "id": "unique short id, e.g. P1",
          "description": "clear 1-sentence description of the blocker",
          "severity": "red" | "amber" | "green",
          "type": "technical" | "dependency" | "resource" | "process" | "external",
          "owner": "name or team responsible",
          "crossTeamDependency": "which other team this depends on or blocks (null if none)",
          "okrImpact": "which OKR or goal is at risk (null if none)"
        }
      ]
    }
  ],
  "digest": {
    "oneLiner": "One sentence executive summary of the most critical org-wide issue today",
    "crossTeamDependencies": [
      "Plain English description of each cross-team dependency, e.g. 'DS → Product: collaborative filtering model delayed; blocks recommendation carousel launch'"
    ],
    "items": [
      {
        "rank": 1,
        "headline": "Short action-oriented headline (max 10 words)",
        "detail": "2-3 sentences of context",
        "requiredAction": "Specific action needed, by whom, by when",
        "owner": "DRI (directly responsible individual or team)",
        "okrTag": "OKR or initiative name",
        "severity": "red" | "amber" | "green"
      }
    ]
  }
}

Severity guide:
- red: blocking a launch, customer commitment, or OKR target within 7 days
- amber: at risk of becoming red within 2 weeks if not addressed
- green: minor, FYI, or already resolved

The digest.items array should contain the top 5 most important items ordered by OKR impact and urgency.
Cross-team dependency detection: flag blockers where one team's output is another team's input.
The CEO digest should be action-oriented: each item must have a clear required action and owner.`
}
