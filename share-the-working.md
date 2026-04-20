# Share the Working, Not the Summary

Last week I spent an hour with Claude investigating whether we should rethink how we handle search indexing. The conversation was messy - dead ends, wrong assumptions I corrected mid-thread, a breakthrough on page three of the transcript. I dropped the whole trace in Slack with one line: "rough exploration, ~70% confident in the conclusion, haven't validated the performance claims."

Three people read it. One caught a flawed assumption I'd missed. Another used a dead end from early in the conversation - something I'd abandoned - to solve a different problem entirely.

The "polished" version of that investigation would have been a two-paragraph summary. It would have communicated the conclusion and none of the reasoning. The dead end that turned out to be useful? Gone. The flawed assumption? Invisible - just silently corrected in the summary, so nobody could learn from it.

I've started thinking of this as **sharing the working, not the summary**. And I think most teams are doing it backwards.

---

## The Working Is the Product

A summary tells you what someone concluded. The working tells you what they *considered* - what they explored, what they ruled out, where they were confused, what assumptions they made along the way.

For anything ephemeral - spikes, investigations, debugging sessions, "should we use X?" explorations - the working is almost always more valuable than the conclusion. Because conclusions are point-in-time answers. The working is the *shape of the problem*. Someone coming back to this in six weeks doesn't need your answer. They need to understand what you were looking at, so they can form their own.

When you curate, you throw away what you think is unimportant. But you can't predict what the next reader needs. They might need your dead ends (shows the problem's shape), the alternatives you ruled out (saves them from re-exploring), or the wrong turns (often more informative than the right ones).

A polished summary is lossy compression. Sometimes that compression is worth it - permanent docs, onboarding guides, anything with a long shelf life. But for ephemeral work? The context dies before the polish pays off. You spend two hours writing up a clean version of a three-day investigation, and by the time you're done, the decision it informed has already been made.

---

## The Bar Is Too High

We all know how "I'll clean this up and share it later" ends. It doesn't.

The implicit standard for sharing on most engineering teams is "publication quality." Not because anyone set that standard explicitly - it's just the equilibrium. Nobody wants to be the person who dumps a messy doc in a shared channel. So the bar stays high, and 90% of valuable context never gets shared at all.

Think about what dies this way: spike results, investigation findings, architecture explorations, "why we didn't do X" reasoning, debugging sessions that revealed something interesting about the system. All of it locked in someone's head or buried in a Claude thread they'll close tomorrow.

This is an **archaeology problem**, not a documentation problem. The artifacts exist - or existed. We just don't preserve them. Six weeks later someone asks "why was this built this way?" and the answer is gone. It was in a conversation, in someone's head, in a Slack thread nobody can find.

Lowering the bar for sharing doesn't mean lowering quality. It means recognizing that a rough artifact shared today beats a polished one shared never.

---

## AI Changed the Economics

Before AI, your "working" lived mostly in your head. Sharing it meant writing it up from memory - reconstructing a messy investigation into clean prose. That's expensive. Most people don't do it.

After AI, the working is already a text artifact. The Claude transcript exists. The agent trace exists. The investigation is *already written down*, complete with the dead ends and wrong turns and corrections. The cost of sharing went from "reconstruct from memory" to "copy, paste, add a one-liner."

But the volume changed too. You now generate *so much* working that polishing all of it is impossible. The old model - polish then share - collapses under the volume AI produces.

| | Before AI | After AI |
|---|---|---|
| Working generated | Low | 10x more |
| Cost to share raw working | High (didn't exist as text) | Near zero (already text) |
| Cost to create summary | High (write from memory) | Medium (edit transcript) |
| Context lost in summary | Most of it | Most of it |

The reframe: this isn't a problem. AI didn't just generate more code. It generated more *context* - more investigation traces, more reasoning artifacts, more "here's what I explored and why." That context is the most valuable thing your team has ever had access to. You just have to actually share it.

---

## Calibration Makes It Polite

Here's the objection: "I don't want to dump unpolished garbage on my team."

Fair. The distinction that matters is between an **uncalibrated dump** and a **calibrated share**.<sup>1</sup>

| Mode | Example | Effect |
|------|---------|--------|
| Uncalibrated dump | "Here's my report on X, can you check it?" | Rude. Makes the reader do your evaluation work. |
| Calibrated share | "~90% right, weak spots are the migration section." | Respectful. You gauged reliability, they route attention. |

Same artifact. Completely different social contract.

A calibration note does triple duty:

- **Epistemic signal** - tells the reader how much to trust it
- **Politeness signal** - shows you evaluated quality before sharing
- **Verification guide** - tells them where to push harder

In practice this looks like:

- "Rough exploration, ~70% confident, haven't validated perf claims"
- "AI-assisted investigation. I agree with the conclusion but haven't checked the code examples"
- "Raw transcript of a spike. Skip to the last 3 messages for the conclusion if you're in a hurry"

The calibration note is what makes sharing raw artifacts **respectful instead of lazy**. It's not zero effort - you have to actually read your own output and assess where it's weak. That's real work. It's just *different* work than polishing, and it preserves far more context.

---

## When This Doesn't Work

**External communication.** Raw traces don't work across team or org boundaries where there's no shared context. Calibration assumes shared trust and shared vocabulary.

**High-stakes decisions.** If the artifact is the basis for a major architecture change or product pivot, it deserves more than a calibration note. The reader needs to be able to evaluate what they're reading, and a raw trace of someone else's AI conversation is hard to evaluate without deep context.

**Team culture.** This requires a team where "rough" doesn't mean "low effort." If your team reads raw traces as laziness, you need to build that norm explicitly. Share a few calibrated traces yourself first. Demonstrate that the calibration note is the effort.

**Volume management.** If everyone shares everything, you get noise. Calibration notes help readers triage, but teams may also need conventions about *where* raw traces go - a specific channel, a wiki section, a shared folder. Somewhere with low friction to post and easy to ignore if it's not relevant to you.

---

The context your team needs most is the context that currently dies in your Claude transcripts, your scratch notes, your head. A one-line calibration note is all that stands between "lost forever" and "available to anyone who needs it."

Don't defend slop. Advocate for working. Calibration is what makes it polite. Archaeology is what makes it valuable.

Share the working.

---

<sup>1</sup> This framing is *not* "AI slop is good, actually." Uncalibrated AI output dumped on teammates is rude for the same reason any uncalibrated dump is rude - it transfers your evaluation work to the reader. The argument is specifically that the *raw trace plus calibration* is more useful than the *curated summary*, because the summary throws away context the reader might need. The error rate of the AI isn't the point. The information density of the artifact is.
