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

I gave the same coding agent two nearly identical prompts in two fresh sessions. Same model (Claude; the specific version will be wrong by the time you read this), same harness (Claude Code), no system-prompt customization, no follow-up turns inside the session. The only thing that varied was the language name.

> make me a chess game, 2 players, with **go** (the programming language) and htmx

> make me a chess game, 2 players, with **gleam** (the programming language) and htmx

Whatever the agent produced is what each language's "path of least resistance" looks like, filtered through one foundation model's training. n is one; treat the *shape* as suggestive, not the specific feature gaps as stable. Both repos are public so you can rerun the grep counts below or fork and iterate.

## What the agent built

Both projects work. They run a two-player hot-seat game in a browser, use htmx to swap board state on click, and implement enough rules for a real game.

**Go Chess** ([1shot-hotseat-chess-go](https://github.com/escherize/1shot-hotseat-chess-go)):

![Go Chess: cool dark UI, board with white king in check highlighted red, moves sidebar showing SAN notation including Bf4, exf4, Qd3, Qh4, Nf3, Qg4](/chess-tradeoffs/go_chess.png)

**Gleam Chess** ([1shot-hotseat-chess-gleam](https://github.com/escherize/1shot-hotseat-chess-gleam)):

![Gleam Chess: warmer dark UI with gold accents, captured pieces shown above and below the board, last-move highlight in yellow, black king in check, move log "1. d4 d5  2. e3 e6  3. Qg4 Qd6  4. Qxg7 Bxg7  5. Bb5+", debug status block underneath](/chess-tradeoffs/gleam_chess.png)

The visual personalities differ. Go reaches for a Lichess-style cool palette and a sidebar. Gleam goes for warm panels, captured-pieces strips above and below the board, last-move and check highlights, and a debug-readout footer. Both render real SAN move logs. Both detect check.

Underneath, they aren't the same product:

| | Go | Gleam |
|---|---|---|
| Total LOC | 1,435 | 1,265 |
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

The Go version is more *finished in the small*. More rules covered, more edge cases handled, more features wired through to the UI. The Gleam version is more *set up to be extended*. Smaller core, cleaner module boundaries, sum-typed everything, no global mutable state. Same prompt, two opposite payoffs.

## The shape of each codebase

The Go agent produced idiomatic Go: a `main.go` with HTTP handlers, a `chess/` subpackage, mutable state behind a mutex, status as a string (`""`, `"check"`, `"checkmate"`, `"stalemate"`), HTML in `html/template` files. Five seconds to `go run .` and you're playing chess. The engine sits in one 649-line file because Go culture tolerates that.

The Gleam agent produced idiomatic Gleam: five files split by concern (`types`, `board`, `moves`, `game_state`, `render`), sum types for everything (`GameStatus { InProgress | Check | Checkmate | Stalemate }`), an OTP actor managing state via typed messages, an immutable `Game` record updated with `Game(..game, selected: None)` syntax. The HTML is built by string concatenation because Gleam's web ecosystem doesn't yet have a beloved templating story.

The agent reached for what each language's community reaches for. That is the entire experiment.

## "Is this square attacked?", in two flavors

The clearest place to see the tradeoff is check detection. Both engines need to answer "given a board, is square X attacked by side Y?" and they reach for completely different shapes.

In **Gleam**, it looks like this:

```gleam
pub fn is_attacked(board: Board, sq: Square, by_color: Color) -> Bool {
  dict.fold(board, False, fn(acc, from, piece) {
    case acc {
      True -> True
      False ->
        case piece.color == by_color {
          False -> False
          True -> list.contains(pseudo_legal_moves(board, from), sq)
        }
    }
  })
}

pub fn is_in_check(board: Board, color: Color) -> Bool {
  case find_king(board, color) {
    None -> False
    Some(king_sq) -> is_attacked(board, king_sq, types.other_color(color))
  }
}
```

Twelve lines. Fold over the board, ask each enemy piece if it can reach this square, reuse the same `pseudo_legal_moves` we already wrote for movement. One source of truth for how each piece moves. Adding a new piece type is one new arm in `pseudo_legal_moves` and check detection updates for free.

In **Go**, the same idea is hand-rolled per piece type:

```go
func (g *Game) squareAttacked(sq Square, by Color) bool {
    r, f := sq.Rank(), sq.File()

    // Pawn attacks
    pawnDir := 1
    if by == Black { pawnDir = -1 }
    for _, df := range []int{-1, 1} {
        pr, pf := r-pawnDir, f+df
        if pr >= 0 && pr <= 7 && pf >= 0 && pf <= 7 {
            p := g.Board[Sq(pr, pf)]
            if p.Type == Pawn && p.Color == by { return true }
        }
    }
    // Knights
    for _, o := range knightOffsets { /* ... */ }
    // Sliding: rook/queen
    for _, d := range rookDirs { /* ... */ }
    // Sliding: bishop/queen
    for _, d := range bishopDirs { /* ... */ }
    // King
    for _, o := range kingOffsets { /* ... */ }
    return false
}
```

About 70 lines fully expanded. Specifically faster than the Gleam version because it doesn't generate every enemy piece's full move list just to check one square. But it's also a *second* hand-written description of how each piece moves, parallel to `PseudoLegalMoves`. Add a new piece tomorrow and you must remember to edit both. Tests can pass for a long time before that drift surfaces.

That single function is the whole experiment in miniature: Go gets you running faster and tuned tighter on the hot path; Gleam gets you a single source of truth that costs more lines today and saves them later.

## By the numbers

Cyclomatic complexity ([McCabe 1976](https://ieeexplore.ieee.org/document/1702388/)) is the classic structural measure, but for the imperative-vs-functional axis simpler proxies tell the same story. Mutation count is one of them: Moseley and Marks argue in [*Out of the Tar Pit*](https://curtclifton.net/papers/MoseleyMarks06a.pdf) (2006) that mutable state is the single largest source of accidental complexity in software. The rest is grep-counting.

| Metric | Go | Gleam | What it tells you |
|---|---|---|---|
| Functions defined | 43 | 56 | Gleam decomposes work into more, smaller pieces |
| Type definitions | 13 (all structs) | 8 (7 are sum types, in one file) | Gleam concentrates the data model; Go scatters structs |
| `for` loops | 26 | 0 | Gleam never iterates; it folds, maps, and recurses |
| `if` + `switch` | 104 | 0 | Go branches; Gleam dispatches |
| `case` (pattern match) | 0 | 75 | every Gleam branch is exhaustive by construction |
| `list.fold` / `map` / `filter` / `flat_map` calls | 0 | 20 | functional iteration |
| Mutation sites | ~84 | 0 | the headline number |

Eighty-four mutation sites on one side, zero on the other. The Gleam codebase has *no rebindable variables at all*: every `let` is a one-shot binding, every "update" is a new record built with `Game(..game, selected: None)`, and the state machine is an actor that replaces its state with a fresh value each turn. The Go codebase mutates a `*Game` in place 44 times via struct field assignment and another 14 times via `g.Board[sq] = piece`. Both work. They do not feel the same to extend, debug, or fearlessly copy a snapshot of.

The function-count cut is the other interesting one. Roughly the same total LOC, but Gleam splits the work into ~30% more functions: smaller pieces, more named seams, more places where you can read a single function in isolation. Mutation is one source of complexity among several (McCabe captures branching, Halstead captures vocabulary), but it's the source the agents disagreed about most.

> *Methodology, for the curious or the skeptical.* Functions: `grep -c "^func "` for Go, `grep -cE "^(pub )?fn "` for Gleam. Loops: `grep -cE "^\s*for "`. Pattern matches: `grep -cE "(^|\s)case "`. Mutations: `grep -cE "(g|s|cp)\.[A-Za-z_]+ *="` plus `\[[^]]+\] *=` plus `\+\+|--` plus `^\s*var `. Floor estimates; multi-line declarations get under-counted. Run them on the public repos to verify.

## What the languages did to the same problem

**Type systems push design.** Gleam has six piece kinds, two colors, and four game statuses, all expressed as exhaustive sum types with the compiler enforcing that every `case` covers them. Go has the same six piece kinds but represents them as `iota` constants on `int`, and represents game status as a string compared with `==`. A typo in `g.Status == "checmate"` compiles fine in Go. A missing `Checkmate ->` arm in Gleam doesn't. Invisible in v1, load-bearing during a refactor.

**Mutability buys speed of writing. Immutability buys speed of changing.** Go's "is this move legal?" runs five lines: copy the game struct, mutate the copy, ask if the king is attacked. Gleam's equivalent needed a separate `apply_move_raw` function (so it could be reused inside legality checking without recursing through status computation) and explicit record-update syntax everywhere. The Gleam version has more code, but every state transition is visible and aliasing is impossible.

**Standard libraries vs hex packages.** Go's stdlib gave the agent `embed`, `html/template`, `net/http`, `sync`, `flag`. Zero dependencies. Gleam needed `wisp`, `mist`, `gleam_otp`, `gleam_erlang`, `gleam_http`, `gleam_stdlib`. You could call this measuring ecosystem maturity rather than language. Fair, except "what library lands first when the agent needs HTTP" is *exactly* the language's path of least resistance, which is exactly what we're measuring. Go's binary is self-contained; Gleam's needs hex deps and a working BEAM install.

**Concurrency and templating.** The Go agent reached for `sync.Mutex` around a shared `*Game`: one line, zero learning, zero compiler enforcement that you actually locked. The Gleam agent reached for an OTP actor: typed `Message` variants, an `actor.call` round-trip per request, state owned by exactly one process. BEAM moves you toward correctness-by-construction; Go moves you toward "easy to start, easy to misuse." The clearest DX gap was templating: Go's HTML lives in files with auto-escaping; Gleam's HTML lives in 200-line string literals with no escaping (currently safe only because all interpolated values are internally controlled). Any web project in either language hits this gap immediately.

## Easier to finish vs easier to extend

Pull all of that together and you get one axis the agent's choices line up on: easier to finish in the small, or easier to keep extending.

Go landed closer to "easier to finish." Mutable struct, hand-rolled fast-path attack detection, stringly-typed status, tight HTTP handlers in one file. Five seconds from `go run .` to a playable game. More rules covered (en passant, promotion picker, full castling-rights bookkeeping), more polish baked in. Adding a feature is touching the right spot in `chess.go` and trusting yourself not to break the parallel attack-detection branch.

Gleam landed closer to "easier to extend." Immutable record, pattern-matched everything, one source of truth per concept, every state transition visible. Slower to feature-complete (no en passant, auto-queen on promotion), but the seams are clean. Adding a piece type is a compile-error-driven exercise: the type checker tells you every site that needs to change.

There's a fair counter: Gleam has less code on the public web than Go, so part of what we're seeing is "the language with denser training data produces more complete one-shot output." I can't disentangle that from "the language is more imperative-friendly." For an operator handing prompts to agents, both are useful to know, and "which language has the most public sample code" is itself a real input to "which language gets the agent furthest in one shot."

If you're scoping a one-week prototype, go with the language that lets you finish in the small. If you're scoping a five-year codebase that twelve people will touch, go with the one that lets you extend without holding your breath. The agent didn't pick a side; it just wrote whichever side each language's culture has already chosen.

If you write code as a human, the same takeaway holds: you will, on average, write the language's path of least resistance. Pick the language whose default failure mode you can live with.

If you operate agents, the agent's output is a high-fidelity sample of "what the median author of language X would write, given that language's typical training-data density." For "which language should I use?", that's a more honest answer than any benchmark.

## References

- McCabe, T. J. (1976). [A Complexity Measure](https://ieeexplore.ieee.org/document/1702388/). *IEEE Transactions on Software Engineering*. Open PDF: [literateprogramming.com/mccabe.pdf](http://www.literateprogramming.com/mccabe.pdf).
- Moseley, B., & Marks, P. (2006). [*Out of the Tar Pit*](https://curtclifton.net/papers/MoseleyMarks06a.pdf). [Hacker News thread](https://news.ycombinator.com/item?id=34954126).
