---
layout: ../../layouts/BlogPost.astro
title: "Same prompt, two languages: an agent builds chess in Go and in Gleam"
pubDate: 2026-05-01T00:00:00Z
description: "I gave the same coding agent two near-identical prompts. The only thing that changed was the language name. Here's what came back."
author: "Bryan"
image:
  url: "/chess-tradeoffs/go_chess.png"
  alt: "Two chess boards rendered in different web styles, side by side."
tags: ["agents", "go", "gleam", "language-design", "ai-coding"]
---

# Same prompt, two languages

I gave the same coding agent two nearly identical prompts in two fresh sessions. The model was the same, the harness was the same, the htmx constraint was the same. The only thing that varied was the language name.

> make me a chess game, 2 players, with **go** and htmx

> make me a chess game, 2 players, with **gleam** (the programming language) and htmx

Whatever the agent produced is what each language's "path of least resistance" looks like, filtered through one foundation model's training.

## What the agent built

Both projects work. They run a two-player hot-seat game in a browser, use htmx to swap board state on click, and implement enough rules for a real game.

**Go Chess:**

![Go Chess: cool dark UI, board with white king in check highlighted red, moves sidebar showing SAN notation including Bf4, exf4, Qd3, Qh4, Nf3, Qg4](/chess-tradeoffs/go_chess.png)

**Gleam Chess:**

![Gleam Chess: warmer dark UI with gold accents, captured pieces shown above and below the board, last-move highlight in yellow, black king in check, move log "1. d4 d5  2. e3 e6  3. Qg4 Qd6  4. Qxg7 Bxg7  5. Bb5+", debug status block underneath](/chess-tradeoffs/gleam_chess.png)

The visual personalities differ. Go reaches for a Lichess-style cool palette and a sidebar. Gleam goes for warm panels, captured-pieces strips above and below the board, last-move and check highlights, and a debug-readout footer. Both render real SAN move logs. Both detect check.

Underneath, they aren't the same product:

| | Go | Gleam |
|---|---|---|
| Files of source | 2 Go + 2 templates + 1 CSS | 6 Gleam files |
| Largest file | `chess/chess.go` at 649 LOC | `render.gleam` at 437 LOC (mostly inline CSS) |
| External deps | none (stdlib only) | 6 hex packages |
| State | Mutable struct behind `sync.Mutex` | Immutable record inside an OTP actor |
| HTML | `html/template` files on disk | Strings concatenated in code |
| Promotion | modal picker, `ErrPromotionNeeded` API | silent auto-queen |
| En passant | yes | not visibly handled |
| Castling rights | four explicit booleans | `has_moved` flag on every piece |
| Last-move highlight | no | yes |
| Captured pieces panel | no | yes |

The Go version is a more complete chess engine packed into one large file. The Gleam version is a richer player-facing UI built on a smaller, cleaner core split across well-named modules.

## The shape of each codebase

The Go agent produced idiomatic Go. A `main.go` with HTTP handlers, a `chess/` subpackage, mutable state behind a mutex, status as a string (`""`, `"check"`, `"checkmate"`, `"stalemate"`), HTML in `html/template` files. Five seconds to `go run .` and you're playing chess. The engine sits in one 649-line file because Go culture tolerates that.

The Gleam agent produced idiomatic Gleam. Five files split by concern (`types`, `board`, `moves`, `game_state`, `render`), sum types for everything (`GameStatus { InProgress | Check | Checkmate | Stalemate }`), an OTP actor managing state via typed messages, an immutable `Game` record updated with `Game(..game, selected: None)` syntax. The HTML is built by string concatenation because Gleam's web ecosystem doesn't yet have a beloved templating story.

The agent reached for what each language's community reaches for. That is the entire experiment.

## What the languages did to the same problem

Type systems push design. Gleam has six piece kinds, two colors, and four game statuses, all expressed as exhaustive sum types with the compiler enforcing that every `case` covers them. Go has the same six piece kinds but represents them as `iota` constants on `int`, and represents game status as a string compared with `==`. A typo in `g.Status == "checmate"` compiles fine in Go. A missing `Checkmate ->` arm in Gleam doesn't. The difference is invisible in v1 and load-bearing during a refactor.

Mutability buys speed of writing. Immutability buys speed of changing. Go's "is this move legal?" runs five lines: copy the game struct, mutate the copy, ask if the king is attacked. The agent reached for that immediately. Gleam's equivalent needed a separate `apply_move_raw` function (so it could be reused inside legality checking without recursing through status computation) and explicit record-update syntax everywhere. The Gleam version has more code, but every state transition is visible and aliasing is impossible.

Standard libraries shape what gets built. Go's stdlib gave the agent `embed`, `html/template`, `net/http`, `sync`, `flag`. Zero dependencies, and the whole thing is `go run .` on any Go install, forever. Gleam needed `wisp`, `mist`, `gleam_otp`, `gleam_erlang`, `gleam_http`, `gleam_stdlib`. The ecosystem is younger; the prompt-to-running-product distance shows it. Go's binary is self-contained; Gleam's needs hex-fetched dependencies and a working BEAM install.

For concurrency, the Go agent reached for `sync.Mutex` around a shared `*Game`. One line, zero learning, zero compiler enforcement that you actually locked before touching the game. The Gleam agent reached for an OTP actor: typed `Message` variants, an `actor.call` round-trip per request, state owned by exactly one process. More machinery, no possible race. BEAM languages move you toward correctness-by-construction; Go moves you toward "easy to start, easy to misuse."

The clearest DX gap was templating. Go's HTML lives in `templates/*.html` files with auto-escaping, editor support, and clear separation from logic. Gleam's HTML lives in 200-line string literals inside `render.gleam`, with no escaping (currently safe only because all interpolated values are internally controlled), no syntax highlighting, no template tooling. Any web project in either language hits this gap immediately.

## What this experiment doesn't show

Worth being careful here. The Gleam version has silent feature gaps (auto-queening on promotion, no en passant) where Go is correct, so type safety is no substitute for completeness. Both implementations are roughly the same size and were written in comparable time, so productivity differences (if any) wouldn't show up at v1. And the agent's "Gleam style" is a sample of public Gleam code, not evidence of anything intrinsic to the language. Same for Go. What we are measuring is each language's culture, frozen in the model's weights.

That last part is what the experiment is really about.

The agent reached for whichever architecture was statistically most natural in each language. In Go that meant a working monolith with mutable state, stringly-typed enums, and rules-engine completeness. In Gleam that meant a clean modular split, sum types, immutability, and visibly more attention to player-facing UI flourish than to rules edge cases.

If you write code as a human, this is more useful than benchmarks or syntax taste. You will, on average, write the language's path of least resistance. So pick the language whose default failure mode you can live with: a feature-complete codebase that resists refactoring, or a clean codebase that takes longer to feature-complete.

If you operate agents, the framing is different. The agent's output is a high-fidelity sample of "what the median author of language X would write." For "which language should I use?", that's a more honest answer than any benchmark.

## Appendix: the prompts

The literal first messages of each session, unmodified:

```
make me a chess game, 2 players, with go and htmx
```

```
make me a chess game, 2 players, with gleam (the programming language) and htmx
```

That is it. The file layout, state model, feature set, and HTML strategy are all what the agent thought was the obvious thing to do, given only a language name.
