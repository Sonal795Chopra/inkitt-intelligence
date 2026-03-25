import { test } from 'vitest'
import { matchCrossTeamBlockers } from '../prompts/crossTeamMatch.js'

// ─── Extracted team JSONs from previous extraction runs ───────────────────────
// These are the verbatim outputs of extractStandup() for each team.

const PRODUCT_EXTRACTION = {
  "team": "product",
  "date": "2026-03-23",
  "members": [
    {
      "name": "Rohan",
      "working_on": "Writing acceptance criteria for A/B test on recommendation shelf",
      "okr_tag": "Experiment Velocity",
      "closed": ["Reader recommendation shelf spec (posted to Notion)"],
      "blocker": {
        "exists": true,
        "type": "waiting_known",
        "description": "Needs Maya's sign-off on the spec before Wednesday or the April 3rd A/B test launch date starts to slip.",
        "waiting_on_team": "",
        "waiting_on_person": "Maya",
        "days_blocked": 0
      },
      "timeline": {
        "status": "at_risk",
        "deadline": "2026-04-03",
        "notes": "April 3rd go-live is contingent on Maya reviewing spec by Wednesday; also potential overlap with Engineering's feed ranking work is unresolved."
      },
      "commitment": { "what": "Start writing acceptance criteria for the A/B test", "by": "today", "at_risk": false }
    },
    {
      "name": "Lena",
      "working_on": "Writing copy variants for three retention nudge push notification messages",
      "okr_tag": "User Retention",
      "closed": ["Retention nudge flow wireframes (in Figma)"],
      "blocker": {
        "exists": true,
        "type": "waiting_known",
        "description": "Waiting on cohort/segment data from DS team (Aditya) since Thursday; promised for Friday, not delivered, follow-up unanswered — cannot finalise target segments without it.",
        "waiting_on_team": "Data Science",
        "waiting_on_person": "Aditya",
        "days_blocked": 3
      },
      "timeline": {
        "status": "at_risk",
        "deadline": "2026-04-07",
        "notes": "Data received today = fine; by Wednesday = one day lost but manageable; after Wednesday = April 7th launch is at risk."
      },
      "commitment": { "what": "Complete copy variants for three nudge messages (contingent on receiving segment data)", "by": "", "at_risk": true }
    },
    {
      "name": "James",
      "working_on": "Writing monetization options doc including tipping mechanic on Galatea reader experience",
      "okr_tag": "General",
      "closed": ["Competitive analysis on TikTok's in-app reading feature"],
      "blocker": {
        "exists": false,
        "type": "none",
        "description": "No blocker. Flagged potential overlap between Engineering's feed ranking work and Rohan's recommendation shelf spec, but James himself is unblocked.",
        "waiting_on_team": "",
        "waiting_on_person": "",
        "days_blocked": 0
      },
      "timeline": {
        "status": "on_track",
        "deadline": "",
        "notes": "Potential overlap with Vikram's (DS/Engineering) feed ranking work flagged but unconfirmed."
      },
      "commitment": { "what": "Work on monetization options doc for tipping mechanic", "by": "today", "at_risk": false }
    },
    {
      "name": "Priya",
      "working_on": "First pass on writer dashboard analytics view for authors",
      "okr_tag": "Reader Engagement",
      "closed": ["Onboarding flow redesign specs (picked up by engineering this morning)"],
      "blocker": {
        "exists": false,
        "type": "none",
        "description": "No current blocker. Proactively flagged upcoming dependency on data pipeline event tracking (~2 weeks out) to avoid a future block.",
        "waiting_on_team": "",
        "waiting_on_person": "",
        "days_blocked": 0
      },
      "timeline": { "status": "on_track", "deadline": "", "notes": "" },
      "commitment": { "what": "Add data pipeline dependency to the dependency log", "by": "today", "at_risk": false }
    },
    {
      "name": "Tomás",
      "working_on": "Writing escalation logic for human review in content moderation spec",
      "okr_tag": "Content Safety",
      "closed": ["Edge case review for content flagging flow"],
      "blocker": {
        "exists": true,
        "type": "waiting_unknown",
        "description": "Emailed Content team last Tuesday for their human-review SLA; no response received. Unclear if deprioritised or mis-routed — doesn't know who specifically owns the answer.",
        "waiting_on_team": "Content",
        "waiting_on_person": "",
        "days_blocked": 5
      },
      "timeline": {
        "status": "at_risk",
        "deadline": "",
        "notes": "Not blocking today but will block spec completion by Wednesday if SLA is not received."
      },
      "commitment": { "what": "Write escalation logic for human review (pending SLA input from Content team)", "by": "Wednesday", "at_risk": true }
    }
  ],
  "team_health": "amber",
  "extraction_confidence": 0.85,
  "ambiguous_items": [
    "members[Rohan].blocker.type: Classified as waiting_known (Maya sign-off) but also an emerging waiting_unknown re: Engineering/Vikram feed ranking overlap — the more severe (waiting_known) was used per rules; the overlap risk is separately flagged in timeline.",
    "members[James].okr_tag: Tipping mechanic on Galatea could map to 'Reader Engagement' or 'General'; insufficient detail to determine a precise OKR tag, defaulted to General.",
    "members[Priya].okr_tag: Writer dashboard analytics could map to 'Reader Engagement' (author side of engagement) or 'General'; mapped to Reader Engagement as closest fit.",
    "members[Tomás].blocker.waiting_on_team: Transcript says 'Content team' — could mean the internal Content editorial team or a separate moderation team; mapped to 'Content' as stated.",
    "team_health: Two waiting blockers exist (Lena and Tomás) but only Lena's directly threatens a named launch deadline (April 7th); classified amber rather than red.",
    "members[Lena].days_blocked: Blocker started Thursday March 19; today is Monday March 23 — counted as 3 calendar days (Thu–Mon), though only ~1 business day elapsed; field set to 3 (calendar)."
  ]
}

const DS_EXTRACTION = {
  "team": "datascience",
  "date": "2026-03-23",
  "members": [
    {
      "name": "Noor",
      "working_on": "Validating and backfilling cleaned Galatea event pipeline data",
      "okr_tag": "General",
      "closed": [],
      "blocker": {
        "exists": false,
        "type": "none",
        "description": "No blocker stated, though pipeline cleanup caused downstream schedule slippage for a Product cohort segmentation task.",
        "waiting_on_team": "",
        "waiting_on_person": "",
        "days_blocked": 0
      },
      "timeline": {
        "status": "at_risk",
        "deadline": "",
        "notes": "Pipeline cleanup took longer than expected, pushing the cohort segmentation task for Lena (Product) late; Aditya plans to send Lena an update with a revised Wednesday estimate."
      },
      "commitment": { "what": "Finish validation and backfill three days of clean pipeline data", "by": "EOD today", "at_risk": false }
    },
    {
      "name": "Vikram",
      "working_on": "Offline evaluation of new feed ranking personalisation model",
      "okr_tag": "Personalisation",
      "closed": [],
      "blocker": {
        "exists": true,
        "type": "waiting_known",
        "description": "GPU compute request submitted to infra on Thursday (March 19) has not been fulfilled; if not resolved today, shadow-mode launch slips from Wednesday to Friday.",
        "waiting_on_team": "Infrastructure",
        "waiting_on_person": "",
        "days_blocked": 4
      },
      "timeline": {
        "status": "at_risk",
        "deadline": "2026-03-25",
        "notes": "Wednesday shadow-mode target slips to Friday if infra does not provision larger GPU instance today. Also flagged potential overlap with Product team's recommendation shelf work — no conversation has happened."
      },
      "commitment": { "what": "Complete offline evaluation and move to shadow mode if compute arrives", "by": "2026-03-25", "at_risk": true }
    },
    {
      "name": "Sasha",
      "working_on": "Writing results documentation for churn prediction model v2",
      "okr_tag": "User Retention",
      "closed": ["Churn prediction model v2 shipped to production (Wednesday March 18)"],
      "blocker": {
        "exists": true,
        "type": "waiting_known",
        "description": "Needs 30-minute model card review with Aditya before broader sharing; Aditya confirmed Wednesday morning.",
        "waiting_on_team": "",
        "waiting_on_person": "Aditya",
        "days_blocked": 0
      },
      "timeline": { "status": "on_track", "deadline": "", "notes": "" },
      "commitment": { "what": "Complete results doc for CEO review; model card walkthrough with Aditya", "by": "2026-03-25", "at_risk": false }
    },
    {
      "name": "Jin",
      "working_on": "Author earnings attribution model for Galatea monetisation",
      "okr_tag": "General",
      "closed": [],
      "blocker": {
        "exists": true,
        "type": "waiting_unknown",
        "description": "Needs to understand the tipping mechanic user flow from the Product team to define the correct outcome variable; does not know who owns it — Aditya suggested it may be James and offered to connect them.",
        "waiting_on_team": "Product",
        "waiting_on_person": "",
        "days_blocked": 0
      },
      "timeline": {
        "status": "at_risk",
        "deadline": "",
        "notes": "No meaningful progress due to feature selection uncertainty; stepping back to reframe the problem while waiting on Product contact."
      },
      "commitment": { "what": "Rewrite problem framing from scratch to clarify feature selection approach", "by": "EOD today", "at_risk": false }
    },
    {
      "name": "Mei",
      "working_on": "Building training dataset for content quality scoring model",
      "okr_tag": "Content Safety",
      "closed": ["Labeling schema for content quality scoring model"],
      "blocker": {
        "exists": true,
        "type": "waiting_unknown",
        "description": "Emailed Content team lead last week for 500 labeled story examples; received a partial response with a promise to deliver but nothing arrived. Not blocking today but needed by end of week.",
        "waiting_on_team": "Content",
        "waiting_on_person": "",
        "days_blocked": 4
      },
      "timeline": {
        "status": "at_risk",
        "deadline": "2026-03-27",
        "notes": "Can work on other pipeline components today but labeled data from Content team must arrive by end of week to stay on track."
      },
      "commitment": { "what": "Prepare other parts of the training pipeline while awaiting labeled data", "by": "end of week", "at_risk": false }
    }
  ],
  "team_health": "amber",
  "extraction_confidence": 0.82,
  "ambiguous_items": [
    "members[Noor].blocker: Noor explicitly says 'no blockers' but the pipeline delay has caused a missed delivery to Product (Lena's cohort segmentation). Classified as 'none' per her own statement but timeline marked at_risk.",
    "members[Vikram].okr_tag: Work spans both Personalisation (feed ranking) and a potential coordination overlap with Product recommendations — tagged Personalisation as primary signal.",
    "members[Vikram].blocker.days_blocked: Blocker raised Thursday March 19; today is Monday March 23 = 4 calendar days.",
    "members[Mei].blocker.days_blocked: Email sent 'last week' — estimated Thursday March 19 as most recent likely send date, giving 4 days; exact day unknown.",
    "members[Jin].blocker: Initially classified waiting_unknown (no named owner) but Aditya suggested 'James' on Product. Kept as waiting_unknown because Jin confirmed the connection is not yet made and the owner was not confirmed from Jin's side.",
    "members[Sasha].blocker: The need for Aditya's review could be classified as 'none' since Aditya agreed immediately.",
    "team_health: Three waiting blockers exist but only Vikram's directly threatens a near-term launch deadline."
  ]
}

const CONTENT_EXTRACTION = {
  "team": "content",
  "date": "2026-03-23",
  "members": [
    {
      "name": "Daniela",
      "working_on": "Author outreach emails for April spring romance spotlight series",
      "okr_tag": "Launch Readiness",
      "closed": [],
      "blocker": {
        "exists": true,
        "type": "waiting_known",
        "description": "Needs Marcus's finalized title shortlist (12 from 30) to lock the editorial calendar; handoff was due last Wednesday.",
        "waiting_on_team": "",
        "waiting_on_person": "Marcus",
        "days_blocked": 5
      },
      "timeline": {
        "status": "at_risk",
        "deadline": "end of week (2026-03-27)",
        "notes": "Calendar could lock Wednesday if Marcus handoff happens today; overall April deadline still intact but tighter than planned."
      },
      "commitment": { "what": "Finish author outreach emails for spotlight series", "by": "EOD today", "at_risk": false }
    },
    {
      "name": "Marcus",
      "working_on": "Curating final 12-title shortlist for spring Galatea romance campaign",
      "okr_tag": "Launch Readiness",
      "closed": [],
      "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 },
      "timeline": {
        "status": "at_risk",
        "deadline": "EOD today (handoff to Daniela)",
        "notes": "Shortlist was due last Wednesday; 5-day delay has compressed the April campaign calendar timeline."
      },
      "commitment": { "what": "Finish title curation shortlist and hand off to Daniela", "by": "EOD today", "at_risk": false }
    },
    {
      "name": "Yuki",
      "working_on": "Clearing weekend backlog of ~340 flagged stories in moderation queue",
      "okr_tag": "Content Safety",
      "closed": [],
      "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 },
      "timeline": { "status": "on_track", "deadline": "", "notes": "" },
      "commitment": { "what": "Reply to Tomás with moderation SLA numbers for human review escalations", "by": "this morning", "at_risk": false }
    },
    {
      "name": "Ren",
      "working_on": "Rewriting author onboarding FAQ and getting started guides",
      "okr_tag": "General",
      "closed": ["Community guidelines rewrite"],
      "blocker": {
        "exists": true,
        "type": "waiting_unknown",
        "description": "Getting started guide first draft is delayed (originally due last Monday, then pushed to today, now needs until Wednesday); Ren is unsure who downstream is waiting on it.",
        "waiting_on_team": "",
        "waiting_on_person": "",
        "days_blocked": 0
      },
      "timeline": {
        "status": "delayed",
        "deadline": "Wednesday 2026-03-25 (revised)",
        "notes": "Getting started guide originally due 2026-03-16, pushed to 2026-03-23, now slipping further to Wednesday; downstream impact unclear."
      },
      "commitment": { "what": "Start on FAQ rewrite; deliver getting started guide first draft", "by": "Wednesday 2026-03-25", "at_risk": true }
    },
    {
      "name": "Preethi",
      "working_on": "Q2 content performance report covering engagement, category trends, and retention",
      "okr_tag": "Reader Engagement",
      "closed": [],
      "blocker": {
        "exists": true,
        "type": "waiting_unknown",
        "description": "Emailed Aditya (DS team) on Thursday 2026-03-19 to validate retention methodology but has not received a reply; report is overdue to CEO since last Friday.",
        "waiting_on_team": "datascience",
        "waiting_on_person": "Aditya",
        "days_blocked": 4
      },
      "timeline": {
        "status": "delayed",
        "deadline": "2026-03-20 (last Friday, missed)",
        "notes": "Report was due to CEO last Friday; blocked on DS methodology confirmation for retention section; ~2 hours of work remaining once unblocked."
      },
      "commitment": { "what": "Follow up with Aditya again to unblock retention methodology validation", "by": "EOD today", "at_risk": true }
    },
    {
      "name": "Sofia",
      "working_on": "Resolving cross-team communication gaps and coordinating spring campaign oversight",
      "okr_tag": "General",
      "closed": [],
      "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 },
      "timeline": { "status": "on_track", "deadline": "", "notes": "" },
      "commitment": { "what": "Respond to Mei (DS team) about labeled story data request that fell through the cracks", "by": "EOD today", "at_risk": false }
    }
  ],
  "team_health": "amber",
  "extraction_confidence": 0.78,
  "ambiguous_items": [
    "blocker.type for Ren: classified as waiting_unknown because downstream dependency is unconfirmed ('I'm not sure who's waiting on it'), but could be argued as no blocker since Ren believes no one is immediately using it",
    "blocker.days_blocked for Daniela: Marcus said shortlist was due 'last Wednesday' (2026-03-18); today is Monday 2026-03-23 = 5 days",
    "members.Preethi.blocker: classified waiting_unknown because Aditya has not replied; could be waiting_known since Aditya is named",
    "commitment.Ren: 'I'm probably going to need until Wednesday' is hedged — at_risk set to true",
    "Sofia's labeled story data request: unclear which team member should own this response; Sofia self-assigned, but the original DS requester 'Mei' is only mentioned once",
    "team field: transcript says 'Content/Publishing'; mapped to 'content' per schema options"
  ]
}

// ─── Test ──────────────────────────────────────────────────────────────────────

test('matchCrossTeamBlockers — Product + DS + Content', async () => {
  const result = await matchCrossTeamBlockers([
    PRODUCT_EXTRACTION,
    DS_EXTRACTION,
    CONTENT_EXTRACTION,
  ])

  // ── Full JSON ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70))
  console.log('  CROSS-TEAM MATCH RESULT')
  console.log('═'.repeat(70) + '\n')
  console.log(JSON.stringify(result, null, 2))
  console.log('\n' + '─'.repeat(70))

  // ── Match summary table ────────────────────────────────────────────────────
  console.log('\nMATCH SUMMARY')
  console.log('─'.repeat(70))
  console.log(`Total matches:       ${result.matches.length}`)
  console.log(`Shared bottlenecks:  ${result.shared_bottlenecks.length}`)
  console.log(`CEO escalations:     ${result.escalate_to_ceo.length}`)
  console.log()

  const bySeverity = { critical: [], high: [], medium: [] }
  for (const m of result.matches) {
    bySeverity[m.severity]?.push(m)
  }

  for (const [sev, matches] of Object.entries(bySeverity)) {
    if (!matches.length) continue
    console.log(`── ${sev.toUpperCase()} (${matches.length}) ──`)
    for (const m of matches) {
      const silent = m.silent ? '🔇 SILENT' : '📢 known'
      console.log(`  [${m.match_id}] ${m.type}  ${silent}  day ${m.days_unresolved}`)
      console.log(`    ${m.team_a}/${m.person_a} ↔ ${m.team_b}/${m.person_b}`)
      console.log(`    ${m.description}`)
      console.log(`    Action: ${m.recommended_action}`)
      if (m.okr_impact) console.log(`    OKR: ${m.okr_impact}`)
      console.log()
    }
  }

  if (result.shared_bottlenecks.length) {
    console.log('SHARED BOTTLENECKS')
    console.log('─'.repeat(70))
    for (const b of result.shared_bottlenecks) {
      console.log(`  ${b.team}: ${b.blocking_count} teams waiting (${b.teams_affected.join(', ')}) — ${b.total_days_lost} days lost`)
    }
    console.log()
  }

  if (result.escalate_to_ceo.length) {
    console.log('CEO ESCALATIONS')
    console.log('─'.repeat(70))
    for (const e of result.escalate_to_ceo) {
      console.log(`  [${e.urgency.toUpperCase()}] ${e.match_id}: ${e.reason}`)
    }
    console.log()
  }
}, 120_000)
