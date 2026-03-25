import type { Transcripts } from '../types'

export const SAMPLE_TRANSCRIPTS: Transcripts = {
  product: `Product Team Standup — March 23, 2026

Priya (PM): Good morning everyone. Quick round-table. Marcus, you start.

Marcus (Engineering Lead): We shipped the new recommendation carousel yesterday — QA signed off.
But we're stuck waiting on the Data Science team's collaborative filtering model. They said last
week it would be ready by Friday, still no update. Without it the carousel just shows top-sellers,
not personalized. This is blocking our Q2 OKR on reader engagement (target: +20% session depth).

Priya: Noted. What's the blast radius if it slips another week?

Marcus: We'd miss the April 1 launch window for the spring fiction campaign. Marketing has already
committed to that date externally.

Lena (Design): The new onboarding flow designs are done and in Figma. I need engineering review
by Thursday or we can't hand off to mobile. Also — small thing but the illustration assets from
the Content team for chapter previews still haven't arrived. Chapter preview is supposed to go
into beta this sprint.

Priya: Got it. I'll ping the Content team. Anything else?

Marcus: Yeah — our AWS costs spiked 40% last week because someone left a test cluster running.
Finance flagged it. No blocker per se but it needs a post-mortem.

Priya: I'll own that. Overall green on most fronts except the DS dependency. We need that model.`,

  datascience: `Data Science Standup — March 23, 2026

Ryo (DS Lead): Morning. Quick updates.

On the collaborative filtering model — we ran into a data quality issue. The reading event logs
had a schema change two sprints ago and nobody told us. We've been training on corrupted features
for three weeks. We caught it Thursday. We need the Data Engineering team (under Platform) to
backfill clean events from the warehouse. I've filed the ticket, they say it'll take 3–5 days.
This directly delays our handoff to Product for the recommendation carousel.

Amara (Senior DS): The content similarity embeddings are done and deployed to staging. That part
is good. But the A/B testing framework we were supposed to use — ExperimentKit v2 — has a bug
where variant assignment is leaking between users in the same session. We reported it to the
Platform team. No ETA on fix. We can't run any rigorous experiments until it's resolved.
This puts our experiment velocity OKR at risk.

Ryo: Also — we're waiting on the Content team to label ~5,000 stories for our moderation
classifier. They committed to 2,000 labels/week but we've only received 800 this week. At this
rate we won't hit the safety launch deadline.

Amara: One win: the churn prediction model hit 84% AUC on holdout — above target. Ready for
Product review whenever they want to productionize it.

Ryo: That's us. Blockers galore today.`,

  content: `Content & Publishing Standup — March 23, 2026

Sofia (Content Lead): Let's keep it tight. Sam?

Sam (Senior Editor): We're behind on the illustration assets for Product's chapter preview feature.
Our illustrator contracted COVID and we have no backup. We have 12 of the 30 assets done.
I'm reaching out to two freelancers today. If they can start immediately we might recover,
but it's uncertain. Product needs them by end of week.

Sofia: This is a real risk. What's the minimum viable set?

Sam: If we can get 20 assets, Product said they can do a soft launch. So 8 more.

Diego (Publishing Ops): On the story labeling for the DS moderation classifier — we're running
behind. We had a labeling tool outage for two days. Our actual throughput when the tool works
is fine (2,500/week) but we lost ground. We're at 800 for this week so far. I've asked IT to
prioritize the tool fix and we're doing overtime labels this weekend to catch up.

Sofia: Okay. Will we hit the DS deadline?

Diego: If the tool is fixed by tomorrow, yes. If not, we'll be 3–4 days late.

Sofia: I need an answer by EOD today from IT. Please escalate. Anything else?

Sam: The spring fiction campaign editorial calendar is final — 47 titles confirmed,
two anchor authors. Marketing has the brief. That's a win.

Sofia: Good. Main blockers: illustration gap and labeling tool outage.`,
}
