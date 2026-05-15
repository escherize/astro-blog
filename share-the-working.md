# Share the Working, Not the Summary

You spent three days investigating whether to rethink search indexing. You have a Claude transcript full of dead ends, wrong assumptions you corrected mid-thread, and a breakthrough on page three. Now you need to share what you found.

The old instinct says: distill it. Write a clean two-paragraph summary. Strip the slop. Present the conclusion.

I'm asking you not to do that. Send me the slop.

Yes, the slop. Not a curated version. Not a cleaned-up summary. The raw AI output, warts and all. I'll tell you why in a second, but let's be honest about the framing up front: this *is* the "AI slop is good, actually" argument. Pretending otherwise would be dishonest.

---

## The Way I Read Has Changed

I don't read your doc top-to-bottom anymore. I load it into a context window and ask questions. I paste your messy investigation into Claude and say "what did they conclude about indexing latency?" or "what alternatives did they rule out and why?" or "are there any flawed assumptions in here?"

This changes what's useful to me as a receiver:

- A **polished summary** gives me your conclusion and maybe two supporting points. If I have a follow-up question that you didn't anticipate, I'm stuck. The context that would answer it was curated away.
- **Raw slop** gives me everything. The dead ends (which show the shape of the problem), the wrong turns (which tell me what *doesn't* work), the mid-stream corrections (which reveal where the tricky parts are). My LLM can find what I need in there. Yours already did.

The polished doc is optimized for a reader who parses linearly and needs everything pre-digested. That reader is being replaced by a human+LLM pair that's *better at extraction than you are at curation*. I can pull the signal from your slop faster than you can separate them for me.

---

## Why Slop Beats Polished (For This Workflow)

When you curate slop into a summary, you throw away what *you* think is unimportant. But you can't predict what I need. Maybe I need:

- The alternative you ruled out (because my constraints are different)
- The dead end that reveals a system behavior you didn't comment on
- The wrong assumption (because I'm about to make the same one)
- The exact phrasing of a question that unlocked a breakthrough

A summary is lossy compression optimized for *your* model of what I'll find useful. Raw slop lets *me* decide - with my LLM doing the extraction.

This isn't hypothetical. Last week someone shared a raw investigation trace - no edits, no summary, just the transcript. Three things happened:

1. I got their conclusion in 30 seconds (asked the LLM to summarize)
2. I caught a flawed assumption they'd silently corrected in later messages
3. Someone else used an abandoned dead end from early in the conversation to solve a *different* problem

The polished version would have delivered #1 and killed #2 and #3.

---

## The Context Window Is the New Reading Tool

Here's what my workflow actually looks like when I receive raw working:

**Vet it:** "Read this investigation. Are there any logical gaps or unsupported claims?" - I get a reliability assessment in seconds, calibrated against the actual reasoning chain, not just the conclusion.

**Absorb it:** "Summarize the key findings and open questions in 5 bullets" - I get the polished summary *on demand*, shaped for what I actually need right now, not what the author guessed I'd need.

**Reshape it:** "Given this investigation, what would change if we also needed to support X?" - I can extend their thinking without re-doing their work.

**Interrogate it:** "They ruled out approach B on page 2. What was their reasoning? Do I agree?" - I can drill into specific decisions without asking the author to reconstruct from memory.

All of this requires the *raw context* to exist. A two-paragraph summary can't answer follow-up questions. A transcript can.

---

## "But I Don't Want to Dump Slop on My Team"

You're going to anyway. The question is whether you lie about it.

The thing you actually owe the reader is a label. Not a calibration note, not a craft summary, not a two-minute distillation - just an honest tag on the artifact: "this is AI slop, I haven't fully vetted it." That one line flips the whole social contract. You're not smuggling AI output past them as your considered judgment; you're handing them a transcript and being clear about what it is. They take it from there.

If you want to go further and add a calibration note - "weak spot is the migration section," "haven't validated perf claims" - great, that's genuinely useful. It does triple duty:

- **Epistemic signal** - tells me how much to trust it
- **Attention router** - tells me (and my LLM) where to push harder
- **Politeness signal** - shows you put eyes on it before hitting send

But this is a nice-to-have, not a gate. The thing that separates "sharing the working" from "making your mess someone else's problem" isn't craft - it's honesty. Label the slop as slop. That's the whole bar.

---

## The Norm Needs to Flip

Right now, the implicit standard for sharing on most teams is "publication quality." Nobody set that standard explicitly - it's just the equilibrium. Nobody wants to be the person who dumps a rough doc in a shared channel.

So the bar stays high, and 90% of valuable context never gets shared. Spike results die in Claude transcripts. Investigation findings evaporate when someone closes a tab. "Why we didn't do X" reasoning lives in one person's head until they leave the company.

The old norm made sense when readers had to linearly parse everything they received. High cost of reading meant high bar for sharing.

The new economics:

| | Old reader (human, linear) | New reader (human + LLM) |
|---|---|---|
| Cost to process a messy doc | High | Low |
| Value of raw context | Low (hard to extract signal) | High (LLM extracts it) |
| Value of polished summary | High (pre-digested) | Medium (already lost context) |
| Optimal sharing format | Curated | Raw slop, labeled honestly |

The bar should drop. Not because polish doesn't matter - it does for permanent docs, onboarding guides, anything with a long shelf life. But for ephemeral work - spikes, investigations, debugging sessions, explorations - honestly-labeled slop beats polished summary every time. Because the receiver can now process it.

---

## When This Doesn't Work

**No LLM in the workflow.** If your team reads everything linearly without AI assistance, polished docs still win. This argument assumes the receiver has a context window available.

**Cross-org communication.** Raw traces don't work across trust boundaries. Calibration assumes shared vocabulary and shared context about the system.

**High-stakes permanent decisions.** If the artifact is the basis for a major architecture commitment, it deserves more structure. But even here - share the working *alongside* the polished version. The polished doc is for the decision record. The working is for anyone who needs to understand the reasoning later.

---

## What I'm Actually Asking For

When you finish an investigation, a spike, a debugging session - anything where you generated context that might be useful to others:

1. **Save it to a file.** Gist, wiki page, shared folder, whatever has low friction. The context window dies when you close the tab. The file doesn't.
2. **Label it slop.** "Raw AI output, not vetted." One line. Done.
3. **Share it.** Don't apologize. Don't curate. The slop is the product.

I'd rather have your rough, partly-wrong, AI-generated investigation trace than your perfectly written two-paragraph summary. Not because I'm lazy. Because I have a tool that can extract more value from the former than the latter could ever contain.

---

## Kicker: the label is the 2026 hack

Writing "this is slop, not vetted" on top of a transcript is a crutch. It works, but it's 2026 tooling.

Here's where this is going: the model that produced the slop already *knows* which parts it's confident about and which it guessed at. That signal exists. It's just not surfaced. The obvious next move is to render it into the artifact itself - low-confidence passages greyed out, medium ones faded, high-confidence sharp. Skim a document and your eye routes to what the model actually believes. Drill into the grey to see the reasoning, sure, but only if you care.

No human-written calibration note. No "~70% confident." The artifact shows its own confidence, continuously, at the token level. Someone should build this.

Until then: share the slop.<sup>1</sup>

---

<sup>1</sup> Yes, this is the "AI slop is good, actually" argument. I'm saying it out loud because the hedge is dishonest - if I tell you to share a raw transcript and then claim it's not slop, I'm just relabeling the thing. It's slop. The claim is that honestly-labeled slop beats a curated summary, because the receiver's extraction tools are now better than the sender's curation instincts. The information density is the point. The mess is the medium.
