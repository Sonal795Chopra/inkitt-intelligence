import { test } from 'vitest'
import { extractStandup } from '../prompts/extraction.js'

// ─── Transcript ───────────────────────────────────────────────────────────────

const TRANSCRIPT = `
# Inkitt — Content/Publishing Team Standup
Date: Monday, March 23, 2026
Time: 10:15 AM
Team: Content/Publishing
Participants: Sofia (Team Lead), Daniela, Marcus, Yuki, Ren, Preethi

Sofia: Good morning everyone, let's do a quick check-in. We've got a big week, lots of good stuff happening. Daniela, kick us off.

Daniela: Morning! So last week I was working on the editorial calendar for the April Galatea push — we're planning a spring romance campaign, 12 featured titles, promotional banners, author spotlights. I've got a draft calendar in Notion. It's mostly done, I just need to finalize the title selection with Marcus and then it's ready to share. Today I'm going to finish the author outreach emails for the spotlight series. Really excited about this campaign, I think it's going to do well.

Sofia: Love it. When do you think the calendar will be fully locked?

Daniela: End of this week for sure. Maybe Wednesday if Marcus and I can connect today.

Sofia: Great. Marcus?

Marcus: Yeah so I've been doing the title curation for the spring campaign — going through the Galatea catalog, identifying stories with strong engagement signals for the romance category. I've got a shortlist of about 30 titles, need to get it down to 12. Today I'm finishing the curation. One thing I want to flag — I was supposed to have this shortlist ready last Wednesday for Daniela to start building the calendar around, so we're a few days behind on that handoff. Daniela's been flexible about it which I appreciate. I think we're still okay for the overall April timeline but it's tighter than I'd like.

Sofia: Okay, let's make sure that handoff happens today. Yuki?

Yuki: Hi, so I'm working on the content moderation queue — we had a backlog build up over the weekend, about 340 stories flagged for review. I'm going through them today. It's a lot but it's manageable. I do want to flag — Tomás from Product emailed me last Tuesday about our SLA for human review escalations, something about a spec he's writing. I read the email, I meant to respond, and then the weekend backlog hit and I just — didn't get back to him. I'll do that today, sorry about that.

Sofia: Please do, that sounds like it might be blocking him.

Yuki: Yeah I think it might be. I'll send him numbers this morning.

Sofia: Good. Ren?

Ren: So I'm leading the author onboarding content refresh — we're rewriting the getting started guides, the FAQ, the community guidelines. I finished the community guidelines rewrite last week, that's done. Today I'm starting on the FAQ. The getting started guide is the big one and I haven't started it yet — that was originally due last Monday, I pushed it to this Monday, and honestly I'm probably going to need until Wednesday for a first draft. It's more involved than I scoped. Not a blocker exactly, just — it's taking longer than I said it would.

Sofia: How does Wednesday affect downstream?

Ren: I think it's fine? I'm not sure who's waiting on it actually. I don't think anyone is using it immediately.

Sofia: Okay, let's confirm that. Preethi?

Preethi: Hi, yeah. So I've been working on the Q2 content performance report — looking at which story categories drove the most reader engagement last quarter, which authors had breakout moments, that kind of thing. It was supposed to go to the CEO last Friday. I have a draft but I wasn't happy with the retention section — the numbers felt off and I wanted to double-check the methodology with the DS team before sending. I emailed Aditya on Thursday but haven't heard back. So the report is sitting in my drafts. I didn't want to send something I wasn't confident in. Today I'll try to reach out to Aditya again.

Sofia: Okay, let me know if you don't hear back and I'll escalate. How long would it take to finalize once you get the DS input?

Preethi: Honestly like two hours. It's just that one section. The rest is solid.

Sofia: Alright. From my side — I want to flag that we have two outstanding requests from other teams that came in last week that I don't think we've fully responded to. Tomás in Product needed our moderation SLA — Yuki's on that. And I think there was something from DS too, about labeled story data for a model they're building. I'm not sure who owns that response on our end. Does anyone know what that's about?

Ren: I saw that email. I thought Yuki was handling it?

Yuki: I didn't know it was mine. I thought it was a general inbox thing.

Sofia: Okay so that one fell through. I'll own it and get back to Mei today. Alright, good standup everyone. Lots of good energy this week, the spring campaign is going to be great.
`.trim()

// ─── What the extraction must get right ──────────────────────────────────────
//
// Person   | Blocker type     | days_blocked | OKR tag
// ---------|------------------|--------------|---------------------
// Daniela  | waiting_known    | 3 (Wed→Mon)  | Launch Readiness
// Marcus   | fundamental      | 3 (self-slip) | Launch Readiness
// Yuki     | none (but created one for Tomás) | 0 | Trust & Safety
// Ren      | fundamental      | 8 (Mon→Mon)  | General / Writer Growth
// Preethi  | waiting_known    | 4 (Thu→Mon)  | User Retention
//
// team_health: red (CEO report delayed, two missed external commitments, 3/5 slipped)
// Key: Yuki's admission should surface as a cross-team flag (Tomás day 5)
//      Ownership confusion on Mei's data request should land in ambiguous_items

// ─── Test ─────────────────────────────────────────────────────────────────────

test('extractStandup — Content/Publishing Team standup (full parse)', async () => {
  const result = await extractStandup(TRANSCRIPT)

  // ── Print the full extraction ──────────────────────────────────────────────
  console.log('\n' + '═'.repeat(70))
  console.log('  EXTRACTION RESULT')
  console.log('═'.repeat(70) + '\n')
  console.log(JSON.stringify(result, null, 2))
  console.log('\n' + '─'.repeat(70))

  // ── Print a human-readable digest of what was found ───────────────────────
  console.log('\nSCORECARD')
  console.log('─'.repeat(70))
  console.log(`team:                 ${result.team}`)
  console.log(`date:                 ${result.date}`)
  console.log(`team_health:          ${result.team_health}`)
  console.log(`extraction_confidence:${result.extraction_confidence}`)
  console.log(`members parsed:       ${result.members.length}`)
  console.log()

  for (const m of result.members) {
    const b = m.blocker
    const blocked = b.exists
      ? `🔴 ${b.type}  (${b.days_blocked}d)  ← ${b.waiting_on_person || b.waiting_on_team || '?'}`
      : '✅ none'
    console.log(`  ${m.name.padEnd(8)} | ${m.timeline.status.padEnd(10)} | ${blocked}`)
    console.log(`           | okr: ${m.okr_tag}`)
    if (m.commitment.what) {
      const risk = m.commitment.at_risk ? ' ⚠️' : ''
      console.log(`           | commitment: "${m.commitment.what}" by ${m.commitment.by}${risk}`)
    }
    console.log()
  }

  if (result.ambiguous_items.length) {
    console.log('AMBIGUOUS ITEMS')
    console.log('─'.repeat(70))
    result.ambiguous_items.forEach((a, i) => console.log(`  ${i + 1}. ${a}`))
    console.log()
  }
}, 120_000)
