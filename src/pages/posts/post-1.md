---
layout: ../../layouts/BlogPost.astro
title: "Goto in Clojure: Why I Built It and How It Actually Works"
pubDate: 2024-11-24T00:00:00Z
description: "A `goto` macro for Clojure that uses ex-info exceptions and a trampoline. How the labels become thunks, how the jumps become throws, and why Dijkstra still has a point."
author: "Bryan"
image:
  url: "https://docs.astro.build/assets/rose.webp"
  alt: "Abstract shape on a dark background."
tags: ["clojure", "macros", "goto", "experimental", "control flow"]
---

# Goto in Clojure

[github.com/escherize/clj-goto](https://github.com/escherize/clj-goto) · [original X post](https://x.com/escherize/status/1948930729477644695)

I posted an experiment on X: an honest-to-goodness **`goto` in Clojure**. People had opinions. As they should.

---

## Why It's Cool

Writing a `goto` in Clojure breaks expectations. Clojure is functional, immutable by default, built around expressions instead of statements, and based on structured control flow. So introducing something as imperative and low-level as a `goto` feels like welding a manual transmission onto a Tesla. It shouldn't work. Thanks to macros and the homoiconic nature of Lisp, it **does**.

It's a good demonstration of Clojure's expressive power: even "taboo" constructs can be modeled. Mostly it's a chance to play, and to feel out *why* certain control-flow patterns are discouraged.

Read it as "look what Clojure lets us build."

---

## What it looks like to use

```clojure
(require '[clj-goto.core :as goto])

(def n (atom 0))

(goto/block
  [:label :start]
  (println "Starting up")
  (goto :add)

  [:label :add]
  (swap! n inc)
  (if (>= @n 5) (goto :end) (goto :add))

  [:label :end]
  (println "all done!"))

@n
;; => 5
```

Two pieces: a `[:label :foo]` marker and a `(goto :foo)` call. The body of `block` is just normal Clojure interleaved with these markers.

---

## What the macro actually does

There's no `loop`/`recur` here. The trick is exceptions for control flow.

**Step 1: split the body by label.** The macro walks the body and partitions it into pairs of `[label, body]`, then builds a map of label name to a zero-arg function (a thunk) for the body that follows it:

```clojure
{:start (fn start [] (println "Starting up") (goto :add))
 :add   (fn add   [] (swap! n inc) (if (>= @n 5) (goto :end) (goto :add)))
 :end   (fn end   [] (println "all done!"))}
```

The body between two labels becomes the body of one thunk. No rewriting of your expressions inside the thunk; whatever you wrote runs as-is when the thunk is called.

**Step 2: replace `goto` with an exception-thrower.** The symbol `goto` in your source is rewritten (via `clojure.walk/postwalk`) to a freshly gensym'd function:

```clojure
(fn [label]
  (throw (ex-info "" {:clj-goto.core/label label})))
```

So `(goto :end)` literally throws an `ex-info` whose data carries the namespaced keyword `:clj-goto.core/label` pointing at the destination. The label gets smuggled out of the function via the exception.

**Step 3: the engine.** A loop calls the current thunk inside a `try`/`catch`. If the thunk completes normally, return its result. If it throws an `ExceptionInfo` carrying our namespaced label key, recur with that label as the new state and call the next thunk:

```clojure
(loop [label initial-label]
  (let [out (try ((get blocks label))
                 (catch Exception e e))]
    (if-let [next-label (and (instance? clojure.lang.ExceptionInfo out)
                             (:clj-goto.core/label (ex-data out)))]
      (recur next-label)
      out)))
```

That's the entire mechanism. Each label segment is a function, `goto` is a non-local exit via exception, the engine is a trampoline that catches and dispatches.

---

## Why exceptions, not `recur`?

The naive `loop`/`recur` version doesn't actually work. `recur` only jumps to the *enclosing* `loop` or `fn`. If a `(goto :end)` is nested inside a `let`, an `if`, or any other form, you can't `recur` out of it from where it appears. You'd have to lift everything to the top of the loop and rewrite the user's code aggressively.

Exceptions don't care about lexical scope. Throwing from inside a `let` inside an `if` inside a `when` works exactly the same as throwing from the top of the thunk. The exception walks up the stack until it hits the engine's `try`. That's the whole reason this implementation is so short.

Using exceptions for control flow is venerable. Common Lisp has `catch`/`throw` doing essentially the same thing, and Scheme's `call/cc` is the more powerful cousin. JVM exceptions are slower than `recur`, but for a goto-block running a few thousand iterations it's fine.

The namespaced keyword (`::label`, which expands to `:clj-goto.core/label`) is what lets the engine ignore *real* exceptions: catch everything, then check the ex-data for our keyword. If it isn't there, the exception was someone else's.

---

## But Isn't Goto Considered Harmful?

Yes. Dijkstra's critique applies: unstructured jumps complicate reasoning, control flow becomes invisible, code becomes fragile and hard to maintain.

That's *why* the experiment is fun. Building a forbidden construct reveals **why** it was forbidden, and shows how much expressive room Clojure's macro system gives you.

Clojure already has `loop`/`recur`, multimethods, `core.async`, and protocols for almost any control flow you'd want. This is educational, not a recommendation.

---

## Final Thoughts

Macros let you reshape a language in unexpected ways. Sometimes elegant abstractions; sometimes cursed but enlightening experiments. Recreating `goto` in Clojure sits in that sweet spot: technically interesting, conceptually instructive, totally impractical, undeniably fun.

[Repo](https://github.com/escherize/clj-goto) · [Original thread](https://x.com/escherize/status/1948930729477644695)
