import { test } from 'vitest'
import { generateCEODigest } from '../prompts/ceoDigest.js'

// ─── Verbatim matcher output from testMatcher.js run ─────────────────────────

const MATCHER_OUTPUT = {
  "matches": [
    {
      "match_id": "match_001",
      "type": "waiting_dependency",
      "severity": "critical",
      "team_a": "product",
      "person_a": "Lena",
      "team_b": "datascience",
      "person_b": "Noor",
      "description": "Lena (Product) has been blocked for 3 calendar days waiting on cohort/segment data from DS, originally promised by Aditya on Friday. Noor (DS) is actively validating and backfilling the Galatea event pipeline data that feeds that exact cohort segmentation task. Noor's standup explicitly notes Aditya plans to send Lena a revised Wednesday estimate, but Lena's standup shows her follow-up to Aditya has gone unanswered. The April 7th retention nudge launch is directly at risk if data does not arrive by Wednesday.",
      "days_unresolved": 3,
      "okr_impact": "User Retention — April 7th retention nudge launch deadline at risk",
      "recommended_action": "Aditya (DS lead) must send Lena a confirmed delivery timestamp by 10am today and copy both team leads; if Wednesday delivery holds, Lena's team must be notified immediately to compress copy-variant timeline.",
      "silent": false
    },
    {
      "match_id": "match_002",
      "type": "missed_delivery",
      "severity": "critical",
      "team_a": "datascience",
      "person_a": "Noor",
      "team_b": "product",
      "person_b": "Lena",
      "description": "Noor's own standup notes that pipeline cleanup took longer than expected and pushed the cohort segmentation task for Lena (Product) late. Noor reported no blocker for herself, but has silently caused a 3-day block for Lena on the retention nudge launch. The DS standup does not contain any direct acknowledgment to Lena that the Friday commitment was missed — only a plan to send a revised estimate.",
      "days_unresolved": 3,
      "okr_impact": "User Retention — April 7th retention nudge launch deadline at risk",
      "recommended_action": "Noor and Aditya must jointly send Lena a written confirmation of revised delivery date by 10am today; DS team lead should formally log this as a missed cross-team commitment to prevent recurrence.",
      "silent": false
    },
    {
      "match_id": "match_003",
      "type": "waiting_dependency",
      "severity": "high",
      "team_a": "datascience",
      "person_a": "Jin",
      "team_b": "product",
      "person_b": "James",
      "description": "Jin (DS) needs to understand the tipping mechanic user flow from Product to define the correct outcome variable for the author earnings attribution model. James (Product) is actively writing the monetisation options doc including the tipping mechanic on Galatea reader experience. Aditya suggested the owner may be James but the connection has not been confirmed or made. Jin is currently blocked on feature selection and is reframing the problem from scratch while waiting.",
      "days_unresolved": 1,
      "okr_impact": "Galatea monetisation model — feature selection undefined, blocking model development",
      "recommended_action": "Aditya should introduce Jin and James via Slack today; James should share his in-progress monetisation doc with Jin by EOD so Jin can confirm the outcome variable and resume model work tomorrow.",
      "silent": true
    },
    {
      "match_id": "match_004",
      "type": "architectural_conflict",
      "severity": "high",
      "team_a": "product",
      "person_a": "Rohan",
      "team_b": "datascience",
      "person_b": "Vikram",
      "description": "Rohan (Product) is writing acceptance criteria for an A/B test on a reader recommendation shelf with a hard April 3rd launch date. Vikram (DS) is running offline evaluation of a new feed ranking personalisation model targeting shadow-mode launch by Wednesday March 25. Both Rohan's timeline notes and James's blocker description explicitly flag an unresolved overlap between Engineering/Vikram's feed ranking work and Rohan's recommendation shelf spec. Vikram's standup also flags the potential overlap with Product's recommendation shelf. Neither team has had a direct conversation about whether these interact with the same ranking layer, user-facing shelf, or data signals.",
      "days_unresolved": 1,
      "okr_impact": "Experiment Velocity — April 3rd A/B test launch; Personalisation — Wednesday shadow-mode launch",
      "recommended_action": "Rohan and Vikram must hold a 30-minute technical alignment call by tomorrow (Tuesday March 24) to determine whether feed ranking model inputs and recommendation shelf logic share the same data layer or user surface; findings must be documented before Rohan finalises acceptance criteria.",
      "silent": true
    },
    {
      "match_id": "match_005",
      "type": "waiting_dependency",
      "severity": "critical",
      "team_a": "product",
      "person_a": "Tomás",
      "team_b": "content",
      "person_b": "Yuki",
      "description": "Tomás (Product) emailed the Content team last Tuesday for human-review SLA figures to complete the content moderation escalation logic spec; his blocker has been open for 5 days with no response. Yuki (Content) has explicitly committed in today's standup to reply to Tomás with moderation SLA numbers for human review escalations this morning. Neither standup acknowledges the other — Tomás does not know Yuki owns the answer, and Yuki's commitment does not reference Tomás's 5-day wait.",
      "days_unresolved": 5,
      "okr_impact": "Content Safety — content moderation escalation spec blocked, Wednesday completion deadline at risk",
      "recommended_action": "Yuki must send Tomás the SLA figures by 11am today as committed; both team leads should confirm receipt and close the loop given the 5-day silence that caused the delay.",
      "silent": true
    },
    {
      "match_id": "match_006",
      "type": "waiting_dependency",
      "severity": "critical",
      "team_a": "datascience",
      "person_a": "Mei",
      "team_b": "content",
      "person_b": "Sofia",
      "description": "Mei (DS) emailed the Content team lead last week requesting 500 labeled story examples for the content quality scoring model training dataset; she received a partial response with a promise but no delivery after 4 days. Sofia (Content) has explicitly committed today to respond to Mei about the labeled story data request that fell through the cracks. Mei's timeline requires the data by end of this week (March 27) to stay on track. Sofia's standup acknowledges the gap but it is unclear whether she has the authority or capacity to actually deliver 500 examples.",
      "days_unresolved": 4,
      "okr_impact": "Content Safety — content quality scoring model training dataset blocked, March 27 deadline at risk",
      "recommended_action": "Sofia must confirm with Mei by EOD today exactly who will produce the 500 labeled examples and provide a firm delivery date; if Sofia cannot own delivery, Content team lead must assign a named owner immediately.",
      "silent": false
    },
    {
      "match_id": "match_007",
      "type": "unowned_request",
      "severity": "critical",
      "team_a": "datascience",
      "person_a": "Mei",
      "team_b": "content",
      "person_b": "Sofia",
      "description": "Mei (DS) submitted a request for 500 labeled story examples to the Content team last week. Content's ambiguous_items explicitly flag that it is unclear which Content team member should own this response — Sofia self-assigned in her commitment but was not the original designated owner. The original DS requester is only mentioned once in Content's standup. This ownership gap caused the 4-day delay and risks the March 27 content quality model deadline.",
      "days_unresolved": 4,
      "okr_impact": "Content Safety — labeled training data for content quality scoring model; March 27 delivery deadline",
      "recommended_action": "Content team lead must formally assign a single named owner for Mei's labeled data request by 10am today and communicate that name to Mei directly; Sofia should coordinate but a domain expert (likely Yuki given moderation expertise) may need to do the labeling work.",
      "silent": true
    },
    {
      "match_id": "match_008",
      "type": "waiting_dependency",
      "severity": "critical",
      "team_a": "content",
      "person_a": "Preethi",
      "team_b": "datascience",
      "person_b": "Noor",
      "description": "Preethi (Content) emailed Aditya (DS) on Thursday March 19 to validate the retention methodology in the Q2 content performance report, which was due to the CEO last Friday (March 20). The report is now 3+ days overdue to the CEO with no reply from DS. Noor (DS) is actively validating and backfilling cleaned Galatea event pipeline data — which is the same data pipeline that underpins retention metrics. DS's pipeline delays are the likely root cause of the methodology uncertainty Preethi needs resolved. Neither DS standup mentions Preethi's overdue CEO report.",
      "days_unresolved": 4,
      "okr_impact": "Reader Engagement — Q2 content performance report overdue to CEO since March 20",
      "recommended_action": "DS team lead must triage Preethi's methodology validation request with Aditya as urgent today given CEO deadline already missed; Aditya should give Preethi a 30-minute sync or written response by noon today so the report can be submitted to the CEO this afternoon.",
      "silent": true
    },
    {
      "match_id": "match_009",
      "type": "shared_bottleneck",
      "severity": "critical",
      "team_a": "product",
      "person_a": "Tomás",
      "team_b": "datascience",
      "person_b": "Mei",
      "description": "The Content team is a shared bottleneck blocking members from two different teams. Tomás (Product) has waited 5 days for human-review SLA data from Content with no response. Mei (DS) has waited 4 days for 500 labeled story examples from Content with only a partial unfulfilled response. Combined, these two open requests represent 9 days of blocked work across Product and DS, both with Content Safety OKR implications.",
      "days_unresolved": 5,
      "okr_impact": "Content Safety — both content moderation spec (Product) and content quality scoring model (DS) blocked on Content team deliverables",
      "recommended_action": "Content team lead (Sofia or above) must hold an emergency 15-minute triage today to assign named owners for both the SLA request (to Tomás) and the labeled data request (to Mei), with delivery commitments for both by EOD today.",
      "silent": true
    },
    {
      "match_id": "match_010",
      "type": "shared_bottleneck",
      "severity": "high",
      "team_a": "product",
      "person_a": "Lena",
      "team_b": "content",
      "person_b": "Preethi",
      "description": "The Data Science team (specifically Aditya's bandwidth) is a shared bottleneck blocking members from two different teams. Lena (Product) has been waiting 3 days for cohort segmentation data from Aditya/DS. Preethi (Content) has been waiting 4 days for retention methodology validation from Aditya. Aditya is also committed to a model card review with Sasha (DS internal) by Wednesday. Aditya's responsiveness is a single point of failure across three concurrent obligations.",
      "days_unresolved": 4,
      "okr_impact": "User Retention (Lena's April 7th launch); Reader Engagement (Preethi's overdue CEO report)",
      "recommended_action": "DS team lead must immediately audit Aditya's queue and either unblock both Lena and Preethi directly today or delegate each to Noor or Sasha respectively; Aditya should not be the sole contact for cross-team data requests.",
      "silent": true
    }
  ],
  "shared_bottlenecks": [
    {
      "team": "content",
      "blocking_count": 2,
      "teams_affected": ["product", "datascience"],
      "total_days_lost": 9
    },
    {
      "team": "datascience",
      "blocking_count": 2,
      "teams_affected": ["product", "content"],
      "total_days_lost": 7
    }
  ],
  "escalate_to_ceo": [
    {
      "reason": "Preethi (Content) submitted a Q2 performance report to you that is now 3+ days overdue because Data Science has not responded to a methodology validation request sent Thursday. Only ~2 hours of work remain once unblocked. You are waiting on a report that is stuck in an unanswered cross-team email. DS team lead needs to assign Aditya or a delegate to respond to Preethi by noon today so you receive the report this afternoon.",
      "match_id": "match_008",
      "urgency": "today"
    },
    {
      "reason": "Product's content moderation escalation spec (Tomás) has been silently blocked for 5 days because a request to the Content team was never routed to an owner. The owner (Yuki) committed in today's standup to respond this morning — but Tomás still does not know this. The Content Safety spec risks missing its Wednesday deadline. Confirm Yuki has sent the SLA to Tomás by mid-morning today.",
      "match_id": "match_005",
      "urgency": "today"
    },
    {
      "reason": "The April 7th User Retention nudge launch is at risk because Data Science missed a Friday data delivery commitment to Product (Lena) and has not formally communicated the slip. The cohort segmentation data is now 3 days late. DS says Wednesday is the revised estimate but Product has received no official update. If Wednesday slips further, the April 7th deadline is broken. DS team lead must send Lena a written revised commitment by 10am today.",
      "match_id": "match_001",
      "urgency": "today"
    }
  ]
}

// ─── Team extractions (verbatim from extraction runs) ─────────────────────────

const PRODUCT_EXTRACTION = {
  "team": "product", "date": "2026-03-23",
  "members": [
    { "name": "Rohan", "working_on": "Writing acceptance criteria for A/B test on recommendation shelf", "okr_tag": "Experiment Velocity", "closed": ["Reader recommendation shelf spec (posted to Notion)"], "blocker": { "exists": true, "type": "waiting_known", "description": "Needs Maya's sign-off on the spec before Wednesday or the April 3rd A/B test launch date starts to slip.", "waiting_on_team": "", "waiting_on_person": "Maya", "days_blocked": 0 }, "timeline": { "status": "at_risk", "deadline": "2026-04-03", "notes": "April 3rd go-live contingent on Maya reviewing spec by Wednesday; potential overlap with Vikram's feed ranking work unresolved." }, "commitment": { "what": "Start writing acceptance criteria for the A/B test", "by": "today", "at_risk": false } },
    { "name": "Lena", "working_on": "Writing copy variants for three retention nudge push notification messages", "okr_tag": "User Retention", "closed": ["Retention nudge flow wireframes (in Figma)"], "blocker": { "exists": true, "type": "waiting_known", "description": "Waiting on cohort/segment data from DS team (Aditya) since Thursday; promised for Friday, not delivered, follow-up unanswered.", "waiting_on_team": "Data Science", "waiting_on_person": "Aditya", "days_blocked": 3 }, "timeline": { "status": "at_risk", "deadline": "2026-04-07", "notes": "Past Wednesday and the April 7th launch is at risk." }, "commitment": { "what": "Complete copy variants (contingent on segment data)", "by": "", "at_risk": true } },
    { "name": "James", "working_on": "Writing monetization options doc including tipping mechanic on Galatea reader experience", "okr_tag": "General", "closed": ["Competitive analysis on TikTok's in-app reading feature"], "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "on_track", "deadline": "", "notes": "Potential overlap with Vikram's feed ranking work flagged but unconfirmed." }, "commitment": { "what": "Work on monetization options doc for tipping mechanic", "by": "today", "at_risk": false } },
    { "name": "Priya", "working_on": "First pass on writer dashboard analytics view for authors", "okr_tag": "Reader Engagement", "closed": ["Onboarding flow redesign specs"], "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "on_track", "deadline": "", "notes": "" }, "commitment": { "what": "Add data pipeline dependency to dependency log", "by": "today", "at_risk": false } },
    { "name": "Tomás", "working_on": "Writing escalation logic for human review in content moderation spec", "okr_tag": "Content Safety", "closed": ["Edge case review for content flagging flow"], "blocker": { "exists": true, "type": "waiting_unknown", "description": "Emailed Content team last Tuesday for human-review SLA; no response, 5 days.", "waiting_on_team": "Content", "waiting_on_person": "", "days_blocked": 5 }, "timeline": { "status": "at_risk", "deadline": "", "notes": "Will block spec by Wednesday if SLA not received." }, "commitment": { "what": "Write escalation logic pending SLA from Content", "by": "Wednesday", "at_risk": true } }
  ],
  "team_health": "amber", "extraction_confidence": 0.85,
  "ambiguous_items": ["members[Rohan].blocker: overlap with Vikram's feed ranking work flagged in timeline", "members[Tomás].blocker.waiting_on_team: Content team, no named person"]
}

const DS_EXTRACTION = {
  "team": "datascience", "date": "2026-03-23",
  "members": [
    { "name": "Noor", "working_on": "Validating and backfilling cleaned Galatea event pipeline data", "okr_tag": "General", "closed": [], "blocker": { "exists": false, "type": "none", "description": "No blocker stated, though pipeline cleanup caused downstream slippage for a Product cohort segmentation task.", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "at_risk", "deadline": "", "notes": "Pipeline cleanup pushed cohort segmentation task for Lena (Product) late; revised Wednesday estimate." }, "commitment": { "what": "Finish validation and backfill three days of clean pipeline data", "by": "EOD today", "at_risk": false } },
    { "name": "Vikram", "working_on": "Offline evaluation of new feed ranking personalisation model", "okr_tag": "Personalisation", "closed": [], "blocker": { "exists": true, "type": "waiting_known", "description": "GPU compute request submitted to infra Thursday; not fulfilled; Wednesday shadow-mode launch slips to Friday without it.", "waiting_on_team": "Infrastructure", "waiting_on_person": "", "days_blocked": 4 }, "timeline": { "status": "at_risk", "deadline": "2026-03-25", "notes": "Flagged potential overlap with Product recommendation shelf — no conversation yet." }, "commitment": { "what": "Complete offline evaluation and move to shadow mode if compute arrives", "by": "2026-03-25", "at_risk": true } },
    { "name": "Sasha", "working_on": "Writing results documentation for churn prediction model v2", "okr_tag": "User Retention", "closed": ["Churn prediction model v2 shipped to production"], "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "on_track", "deadline": "", "notes": "" }, "commitment": { "what": "Complete results doc for CEO review", "by": "2026-03-25", "at_risk": false } },
    { "name": "Jin", "working_on": "Author earnings attribution model for Galatea monetisation", "okr_tag": "General", "closed": [], "blocker": { "exists": true, "type": "waiting_unknown", "description": "Needs tipping mechanic user flow from Product to define outcome variable; doesn't know who owns it.", "waiting_on_team": "Product", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "at_risk", "deadline": "", "notes": "No meaningful progress; reframing problem from scratch." }, "commitment": { "what": "Rewrite problem framing", "by": "EOD today", "at_risk": false } },
    { "name": "Mei", "working_on": "Building training dataset for content quality scoring model", "okr_tag": "Content Safety", "closed": ["Labeling schema"], "blocker": { "exists": true, "type": "waiting_unknown", "description": "Emailed Content team lead last week for 500 labeled story examples; partial response, nothing delivered, 4 days.", "waiting_on_team": "Content", "waiting_on_person": "", "days_blocked": 4 }, "timeline": { "status": "at_risk", "deadline": "2026-03-27", "notes": "Needs labeled data by end of week." }, "commitment": { "what": "Prep other pipeline components while waiting", "by": "end of week", "at_risk": false } }
  ],
  "team_health": "amber", "extraction_confidence": 0.82,
  "ambiguous_items": ["members[Noor].blocker: said no blockers but caused missed delivery to Product/Lena", "members[Vikram]: overlap with Product recommendation shelf, no conversation yet"]
}

const CONTENT_EXTRACTION = {
  "team": "content", "date": "2026-03-23",
  "members": [
    { "name": "Daniela", "working_on": "Author outreach emails for April spring romance spotlight series", "okr_tag": "Launch Readiness", "closed": [], "blocker": { "exists": true, "type": "waiting_known", "description": "Needs Marcus's finalized title shortlist; handoff was due last Wednesday.", "waiting_on_team": "", "waiting_on_person": "Marcus", "days_blocked": 5 }, "timeline": { "status": "at_risk", "deadline": "2026-03-27", "notes": "Calendar locks Wednesday if Marcus handoff happens today." }, "commitment": { "what": "Finish author outreach emails", "by": "EOD today", "at_risk": false } },
    { "name": "Marcus", "working_on": "Curating final 12-title shortlist for spring Galatea romance campaign", "okr_tag": "Launch Readiness", "closed": [], "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "at_risk", "deadline": "EOD today", "notes": "Shortlist was due last Wednesday; 5-day delay compressed April calendar." }, "commitment": { "what": "Finish shortlist and hand off to Daniela", "by": "EOD today", "at_risk": false } },
    { "name": "Yuki", "working_on": "Clearing weekend backlog of ~340 flagged stories", "okr_tag": "Content Safety", "closed": [], "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "on_track", "deadline": "", "notes": "" }, "commitment": { "what": "Reply to Tomás with moderation SLA numbers", "by": "this morning", "at_risk": false } },
    { "name": "Ren", "working_on": "Rewriting author onboarding FAQ and getting started guides", "okr_tag": "General", "closed": ["Community guidelines rewrite"], "blocker": { "exists": true, "type": "waiting_unknown", "description": "Getting started guide delayed (due last Monday, now Wednesday); Ren unsure who downstream is waiting on it.", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "delayed", "deadline": "Wednesday 2026-03-25", "notes": "Originally due 2026-03-16, now slipping to Wednesday." }, "commitment": { "what": "Deliver getting started guide first draft", "by": "Wednesday", "at_risk": true } },
    { "name": "Preethi", "working_on": "Q2 content performance report for CEO", "okr_tag": "Reader Engagement", "closed": [], "blocker": { "exists": true, "type": "waiting_unknown", "description": "Emailed Aditya (DS) Thursday to validate retention methodology; no reply; report was due to CEO last Friday.", "waiting_on_team": "datascience", "waiting_on_person": "Aditya", "days_blocked": 4 }, "timeline": { "status": "delayed", "deadline": "2026-03-20 (missed)", "notes": "~2 hours of work remaining once unblocked." }, "commitment": { "what": "Follow up with Aditya to unblock retention methodology", "by": "EOD today", "at_risk": true } },
    { "name": "Sofia", "working_on": "Resolving cross-team communication gaps", "okr_tag": "General", "closed": [], "blocker": { "exists": false, "type": "none", "description": "", "waiting_on_team": "", "waiting_on_person": "", "days_blocked": 0 }, "timeline": { "status": "on_track", "deadline": "", "notes": "" }, "commitment": { "what": "Respond to Mei (DS) about labeled story data request that fell through", "by": "EOD today", "at_risk": false } }
  ],
  "team_health": "amber", "extraction_confidence": 0.78,
  "ambiguous_items": ["Sofia's labeled data request: no confirmed owner until Sofia self-assigned live in standup", "Preethi.blocker: could be waiting_known since Aditya named, but no acknowledgement from DS side"]
}

// ─── Test ──────────────────────────────────────────────────────────────────────

test('generateCEODigest — full org digest', async () => {
  const digest = await generateCEODigest(
    MATCHER_OUTPUT,
    [PRODUCT_EXTRACTION, DS_EXTRACTION, CONTENT_EXTRACTION],
  )

  // ── Full JSON ──────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70))
  console.log('  CEO MORNING DIGEST')
  console.log('═'.repeat(70) + '\n')
  console.log(JSON.stringify(digest, null, 2))
  console.log('\n' + '─'.repeat(70))

  // ── Rendered digest ────────────────────────────────────────────────────────
  console.log(`\n📋 ${digest.digest_date}`)
  console.log(`\n⚡ ${digest.headline}\n`)
  console.log('─'.repeat(70))

  for (const item of digest.items) {
    console.log(`\n${item.status}  #${item.priority} — ${item.title.toUpperCase()}`)
    console.log(`   ${item.situation}`)
    console.log(`   ⏱  ${item.how_long}`)
    if (item.okr_impact) console.log(`   🎯 ${item.okr_impact}`)
    console.log(`   ✋ ACTION: ${item.action}`)
    console.log(`   Owner: ${item.owner}  |  Due: ${item.due}`)
  }

  console.log('\n' + '─'.repeat(70))
  console.log('\n📊 COMPANY PULSE')
  console.log(`   On track:  ${digest.company_pulse.teams_on_track.join(', ') || 'none'}`)
  console.log(`   At risk:   ${digest.company_pulse.teams_at_risk.join(', ')}`)
  console.log(`   Days lost to waiting: ${digest.company_pulse.total_days_lost_to_waiting}`)
  if (digest.company_pulse.shared_bottlenecks.length) {
    console.log('   Bottlenecks:')
    digest.company_pulse.shared_bottlenecks.forEach(b => console.log(`     • ${b}`))
  }
  console.log()
}, 120_000)
