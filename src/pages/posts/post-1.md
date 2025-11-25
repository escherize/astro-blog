---
title: "Goto in Clojure: Why I Built It and Why It's Fun"
pubDate: 2025-11-24
description: "A deep dive into my experimental `goto` macro for Clojure—how it works, why it's cool, and why Dijkstra might still yell at me."
author: "Bryan"
image:
  url: "https://docs.astro.build/assets/rose.webp"
  alt: "Abstract shape on a dark background."
tags: ["clojure", "macros", "goto", "experimental", "control flow"]
---

# Goto in Clojure
[Original post on X](https://x.com/escherize/status/1948930729477644695)

I recently posted an experiment on X—an honest-to-goodness **`goto` in Clojure**.
People had opinions. As they should. This post explains:

- why the experiment is interesting
- how the macro works
- what makes it possible in Clojure
- why "goto considered harmful" still matters—and why I'm playing with it anyway

---

## Why It's Cool

Writing a `goto` in Clojure is interesting because it breaks expectations.

Clojure is:

- functional
- immutable by default
- built around expressions instead of statements
- based on structured control flow

So introducing something as imperative and low-level as a `goto` feels like welding a manual transmission onto a Tesla. It shouldn't work. And yet—thanks to macros and the homoiconic nature of Lisp—it **does**.

It’s a good demonstration of:

- **Clojure’s macro power**
- **Expressiveness** (even "taboo" constructs can be modeled)
- **Playfulness**
- Understanding *why* certain control-flow patterns are discouraged

This is less "I want goto" and more "look what Clojure lets us build."

---

## How It Works (Conceptually)

A `goto` needs two pieces:

1. A **label** — `(label :start)`
2. A **jump** — `(goto :start)`

Clojure doesn't have native goto or labels, but we can emulate it by rewriting the entire block into a **state machine**.

The macro transforms your code into something like:

```clojure
(loop [state :start]
  (case state
    :start (recur :middle)
    :middle (recur :done)
    :done :finished))
```

There’s no actual bytecode jump—just tail recursion.
The macro hides that logic and gives you something that *feels* like `goto` at the source level.

Lisp makes this possible because code is data. We can walk the forms, detect labels, rewrite jumps, and build a dispatching loop automatically.

---

## The Macro Side

The macro generally:

1. Scans for `(label :foo)`
2. Splits the body into labeled sections
3. Rewrites `(goto :foo)` into `(recur :foo)`
4. Emits a `loop` + `case` state machine
5. Expands into pure Clojure, no runtime tricks

Tiny sketch of the idea:

```clojure
(defmacro goto-block [& body]
  (let [labels (extract-labels body)
        rewritten (rewrite-gotos body labels)]
    `(loop [state ~(first labels)]
       (case state
         ~@rewritten))))
```

Example usage:

```clojure
(goto-block
  (label :start)
  (println "Start")
  (goto :middle)

  (label :middle)
  (println "Middle")
  (goto :done)

  (label :done)
  (println "Done"))
```

This expands into a structured state machine.
No bytecode hacks. No JVM trickery. Just macros and recursion.

---

## But Isn't Goto Considered Harmful?

Yes. Absolutely.

Dijkstra’s classic critique applies:

- Unstructured jumps complicate reasoning
- Control flow becomes invisible
- Code becomes fragile and hard to maintain

That’s *why* this experiment is fun—building a forbidden construct reveals **why** it was forbidden, and shows how powerful Clojure’s macro system is.

Clojure gives you excellent structured tools (`loop/recur`, state machines, `core.async`, multimethods).
This experiment is educational—not a recommendation.

---

## Final Thoughts

Macros let you reshape a language in unexpected ways.
Sometimes that produces elegant abstractions; sometimes it produces cursed but enlightening experiments.

Recreating `goto` in Clojure sits right in that sweet spot:

- technically interesting
- conceptually instructive
- totally impractical
- undeniably fun

If you want more detail or the full macro, check the original thread:

👉 <https://x.com/escherize/status/1948930729477644695>
