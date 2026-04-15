# Programming Language Scalability

- **Source:** https://blog.sulami.xyz/posts/programming-language-scalability/
- **HN Discussion:** https://news.ycombinator.com/item?id=39988345
- **Published:** 2024-04-09

## Why this is good

Style: conversational but precise. Grounded in real experience (CircleCI Clojure -> Go, Ruby on Rails monolith). Uses a clear definition as the anchor for the whole post. Opinionated rankings backed by reasoning. Footnotes for tangential detail.

## Core thesis

"A programming language is more scalable if an engineer unfamiliar with a code base written in it produces correct code more quickly."

Scalability is often at odds with *peak effectiveness* - the features that make domain experts most productive (macros, DSLs, metaprogramming) are exactly the features that hurt newcomers.

## Key observations

- Dynamic typing + "automagical" abstractions = hard for unfamiliar engineers
- Clojure's "everything is a map" problem - a dozen different shapes all called "a build"
- Ruby's metaprogramming makes it hard to track where methods come from, even for LSP
- Macro culture + emphasis on expressiveness leads to competing design patterns optimized for each author's preferences
- "I believe in setting yourself up for success despite yourself"
- At scale, you can't depend on everyone being good (or average) at their job

## Scalability factors (from the post)

1. **Prevalence** - hiring ease, ecosystem, available knowledge
2. **Guardrails** - memory safety, static types, editor support (LSP)
3. **Standardized tooling** - build, format, test
4. **Low language extension surface** - macros/DSLs reduce scalability (the Lisp Curse)
5. **Mainstream syntax/execution model** - deviation = harder to learn

## His ranking (web backend context)

Most scalable -> least: Rust, Go, Java/Kotlin, Python, Ruby, JS/TS, Erlang/Elixir, Clojure, Haskell

Viable picks: Rust, Go, Java/Kotlin (statically typed + mainstream)

## Relevance to post-6

This post's "scalability" definition maps almost perfectly to our "what's good for humans is good for agents" thesis. An agent is the ultimate "engineer unfamiliar with a codebase." The factors that help unfamiliar humans (types, explicit code, predictable patterns, standardized tooling) are exactly what helps agents. We should emulate the style: experience-grounded, definition-driven, opinionated but fair.
