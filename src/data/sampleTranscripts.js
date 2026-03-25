// Real Inkitt standup transcripts used in test runs.
// Loaded instantly by "Load Sample" buttons — no API call needed.

export const SAMPLE_TRANSCRIPTS = {
  product: `# Inkitt — Product Team Standup
Date: Monday, March 23, 2026
Time: 9:02 AM
Team: Product
Participants: Maya (Team Lead), Rohan, Lena, James, Priya, Tomás

Maya: Alright, let's go. It's 9:02, we've got a hard stop at 9:07 so let's keep it tight. Rohan, you're up.

Rohan: Yeah, so — Friday I finished the spec for the reader recommendation shelf on the home feed. It's in Notion, I dropped the link in the product channel. Today I'm starting the acceptance criteria for the A/B test. The test is supposed to go live April 3rd. No blockers on my end, but I do need sign-off from Maya on the spec before Wednesday otherwise the April 3rd date starts to slip.

Maya: Got it, I'll review it today. Lena?

Lena: So I've been working on the retention nudge flow — the push notification sequence for readers who haven't opened the app in 7 days. I finished the wireframes last week, they're in Figma. Today I'm writing the copy variants for the three nudge messages. My blocker — and this has been the case since Thursday actually — is that I need the cohort data from the DS team to know which reader segments to target. I asked Aditya on Thursday, he said he'd get it to me Friday, it didn't come. I followed up Friday afternoon, no response. I don't know if it's deprioritized or what. Without that data I can't finalize which segments the nudge goes to, and this whole flow is tied to OKR 2.1, the retention target. So it's starting to feel like a real problem.

Maya: Okay, that's flagged. How much does this push your timeline?

Lena: If I get the data today I'm fine. If it slips to Wednesday, I lose a day but we're okay. Past Wednesday and the April 7th launch is at risk.

Maya: Got it. I'll ping the DS lead directly after this. James?

James: Uh, yeah. So I closed the competitive analysis on TikTok's in-app reading feature last week — sent it to Maya and the CEO. Today I'm working on the monetization options doc, looking at how we could layer a tipping mechanic on top of the Galatea reader experience. No blockers. One flag though — I was in a cross-functional sync last week and I heard Engineering is also doing something with the reader feed ranking? I'm not totally sure what it is but it feels like it might overlap with Rohan's recommendation shelf work. Might be worth a quick check.

Rohan: Yeah I heard that too, I think it's Vikram's team. I don't know if they know about my spec.

Maya: Okay, that's two things I need to follow up on. Priya?

Priya: I'm good. Closed the onboarding flow redesign specs on Friday, engineering picked it up this morning actually which is great. Today I'm doing a first pass on the writer dashboard — the analytics view for authors to see their readership. No blockers. I do want to flag that the writer dashboard is going to need event tracking data from the data pipeline, probably in about two weeks. So not a blocker now but I wanted to put it on the radar early so we don't hit the same situation Lena is in.

Maya: Smart. Can you put that dependency in writing somewhere so it doesn't fall through the cracks?

Priya: Yeah I'll add it to the dependency log.

Maya: Good. Tomás, quick.

Tomás: Yeah, sorry, I'm going to be fast. So I've been heads down on the content moderation spec — the flagging flow for inappropriate content on Galatea. Closed the edge case review on Friday. Today I'm writing up the escalation logic for human review. My blocker is actually a question — I need to know what the Content team's SLA is for human review once something gets flagged. I emailed them last Tuesday, I haven't heard back. If I don't have that number I can't finish the spec. It's not blocking me today but it will by Wednesday.

Maya: Okay, I'll add that to my follow-up list. Alright — so to summarize what I'm taking away: I need to review Rohan's spec today, I need to escalate the DS data issue for Lena, I need to figure out whether Engineering's feed ranking work conflicts with Rohan's recommendation shelf, and I need to chase the Content team for Tomás. That's four follow-ups from one standup. Okay. Let's go. Good standup everyone.`,

  datascience: `# Inkitt — Data Science Team Standup
Date: Monday, March 23, 2026
Time: 9:32 AM
Team: Data Science
Participants: Aditya (Team Lead), Noor, Vikram, Sasha, Jin, Mei

Aditya: Alright let's go, I know everyone's slammed this week so let's keep it under five. Noor, start us off.

Noor: Yeah so I spent most of Friday and this morning cleaning the Galatea event pipeline — there were duplicate click events coming in from the iOS client, something changed in the SDK version they pushed last week. It's mostly clean now but I'm still validating. Today I'm finishing validation and then I need to backfill three days of clean data before anything downstream can use it. No blockers but just — this took way longer than expected and it pushed everything else I had this week. I had a cohort segmentation task for someone on Product, I think it was Lena, and I haven't gotten to it. I feel bad about it but the pipeline had to come first.

Aditya: Yeah we'll talk about that. Vikram?

Vikram: So I'm deep in the new feed ranking model — the one that personalizes story order based on reader behavior signals. I've been on this for two weeks, it's going well. Today I'm running offline evaluation on the candidate model, comparing it against the current ranker on historical data. If the numbers look good I want to move to shadow mode by Wednesday. My blocker is compute — I need a bigger GPU instance to run the full eval, I submitted the request to infra on Thursday and haven't heard back. If I don't get it by today the Wednesday timeline slips to Friday.

Aditya: I'll chase infra after this. How confident are you in the model?

Vikram: Pretty confident. The early results are good. One thing I want to flag — I've been building this on top of the same reader engagement signals that I think the Product team uses for their recommendation work. I don't know exactly what they're building but if they're also changing how recommendations work on the feed, we might be stepping on each other. I haven't talked to anyone on Product about it.

Aditya: Okay, noted. I'll see if I can find out what they're doing. Sasha?

Sasha: I closed the churn prediction model v2 last Wednesday — it's been running in production since Thursday and the early signals look good, lift is about 18% over the baseline. Today I'm writing up the results doc so the CEO can see it. My ask is actually for Aditya — I need thirty minutes this week to walk you through the model card before we share it more broadly. Can we find time?

Aditya: Yes, let's do Wednesday morning. Jin?

Jin: So I've been working on the author earnings attribution model — trying to figure out which reader behaviors actually drive monetization for writers on Galatea. It's a hard problem, lots of confounders. No meaningful progress to report honestly, I've been going in circles on the feature selection. Today I'm going to step back and write out the problem framing again from scratch, sometimes that helps. My blocker is I need to talk to someone on the Product team about how the tipping mechanic is supposed to work — I've heard it's being specced out right now and I need to understand the intended user flow before I can define the right outcome variable for the model. I don't know who owns it on the Product side.

Aditya: I think that's James. I'll connect you.

Jin: Great, yeah, even a 15-minute call would unblock me.

Aditya: Mei, quick.

Mei: Yep, fast. I'm on the content quality scoring model — flagging low-quality stories before they surface in recommendations. I closed the labeling schema last week, today I'm starting to build the training dataset. I need about 500 labeled examples from the Content team — stories they've already manually reviewed. I emailed their lead last week, got a partial response, they said they'd pull it together but I haven't seen anything yet. It's not blocking me today, I can prep other parts of the pipeline, but I'll need it by end of week.

Aditya: Okay I'll follow up with Content too. Alright — quick summary from my side. We have three things I'm worried about. One, the pipeline cleanup ate Noor's week and we now have at least one delivery to Product that's late — I need to send Lena an update today and give her a realistic date, probably Wednesday. Two, Vikram's compute request needs to move today or his timeline slips. Three, we have three people — Vikram, Jin, Mei — who need to sync with Product or Content and none of those conversations have happened yet. That's a coordination gap we need to close this week. Anything else before we break?

Noor: One thing — when I finish the backfill, is there a way to notify downstream teams automatically? Because right now I have to manually tell everyone the data is ready and I always forget someone.

Aditya: Good point. No good answer right now, we do it manually. Okay, let's go.`,

  content: `# Inkitt — Content/Publishing Team Standup
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

Sofia: Okay so that one fell through. I'll own it and get back to Mei today. Alright, good standup everyone. Lots of good energy this week, the spring campaign is going to be great.`,
}
