---
layout: ../../layouts/BlogPost.astro
title: "Go and Gleam don't write the same chess game"
pubDate: 2026-05-01T00:00:00Z
description: "I gave the same coding agent two near-identical prompts. The only thing that changed was the language name. Here's what came back."
author: "Bryan"
image:
  url: "/chess-tradeoffs/go_chess.png"
  alt: "Two chess boards rendered in different web styles, side by side."
tags: ["agents", "go", "gleam", "language-design", "ai-coding"]
---

# Go and Gleam don't write the same chess game

I gave the same coding agent two nearly identical prompts in two fresh sessions. Same model (Claude; the version will be wrong by the time you read this), same harness (Claude Code), no system-prompt customization, no follow-up turns. The only thing that varied was the language name.

> make me a chess game, 2 players, with **go** (the programming language) and htmx

> make me a chess game, 2 players, with **gleam** (the programming language) and htmx

What the agent produced is what each language's "path of least resistance" looks like, filtered through one foundation model's training. n is one; treat the *shape* as suggestive, not the specific feature gaps as stable. Both repos are public so you can rerun the grep counts below or fork and iterate.

## What the agent built

Both projects work. They run a two-player hot-seat game in a browser, use htmx to swap board state on click, and implement enough rules for a real game.

**Go Chess** ([1shot-hotseat-chess-go](https://github.com/escherize/1shot-hotseat-chess-go)):

![Go Chess: cool dark UI, board with white king in check highlighted red, moves sidebar showing SAN notation including Bf4, exf4, Qd3, Qh4, Nf3, Qg4](/chess-tradeoffs/go_chess.png)

**Gleam Chess** ([1shot-hotseat-chess-gleam](https://github.com/escherize/1shot-hotseat-chess-gleam)):

![Gleam Chess: warmer dark UI with gold accents, captured pieces shown above and below the board, last-move highlight in yellow, black king in check, move log "1. d4 d5  2. e3 e6  3. Qg4 Qd6  4. Qxg7 Bxg7  5. Bb5+", debug status block underneath](/chess-tradeoffs/gleam_chess.png)

Both render real [SAN](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)) move logs and highlight the king when in check. The Gleam version adds last-move highlights and captured-pieces strips above and below the board; the Go version puts moves in a sidebar. Otherwise the visuals are nearly identical: dark theme, wood-toned squares, [Lichess](https://lichess.org)-ish palette.

Underneath, they aren't the same product:

| | Go | Gleam |
|---|---|---|
| Total LOC | 1,435 | 1,265 |
| Largest file | `chess.go` at 649 LOC | `render.gleam` at 437 LOC (mostly inline CSS) |
| Largest engine file | `chess.go` at 649 LOC | `moves.gleam` at 383 LOC |
| External deps | none (stdlib only) | 6 hex packages |
| State | Mutable struct behind `sync.Mutex` | Immutable record inside an OTP actor |
| HTML | `html/template` files on disk | Strings concatenated in code |
| Promotion | modal picker, `ErrPromotionNeeded` API | silent auto-queen |
| En passant | yes | not visibly handled |
| Castling rights | four explicit booleans | `has_moved` flag on every piece |
| Last-move highlight | no | yes |
| Captured pieces panel | no | yes |

The Go version is more *finished in the small*: more rules covered, more edge cases handled, more features wired through to the UI. The Gleam version is more *set up to be extended*: smaller core, cleaner module boundaries, sum-typed everything, no global mutable state. Same prompt, two opposite payoffs.

## The shape of each codebase

The Go agent produced idiomatic Go: a `main.go` with HTTP handlers, a `chess/` subpackage, mutable state behind a mutex, status as a string (`""`, `"check"`, `"checkmate"`, `"stalemate"`), HTML in `html/template` files. Five seconds to `go run .` and you're playing chess. The engine sits in one 649-line file because Go culture tolerates that.

The Gleam agent produced something that *looks* idiomatic from a distance: five files, sum types for everything (`GameStatus { InProgress | Check | Checkmate | Stalemate }`), and an immutable `Game` record updated with `Game(..game, selected: None)` syntax. Up close, the file split is *not* idiomatic: real Gleam projects organize by domain, not by kind, and a dedicated `types` module is actually an anti-pattern.[^1] The agent reached for the kind-based split anyway, presumably because that's what it sees most often in other languages' training data. So the architectural defaults the model picks up are real, but they aren't always the *language community's* defaults.

[^1]: Thanks to LittleLily from the Gleam Discord for catching that.

Gleam tracks state by passing it through an [OTP actor](https://www.erlang.org/doc/system/design_principles.html). Concretely: there's a long-running process that owns the single `Game` value, and every HTTP request sends it a typed message (`Get`, `Click(square)`, `Reset`). The actor processes messages one at a time, computes a new `Game` from the old one, and tells itself "from now on, my state is *this* value." Nothing mutates in place, nothing else can touch the state, and concurrency just isn't a thing because there's only one actor and it processes messages serially. Where Go uses `sync.Mutex` and trusts you to lock, Gleam uses an actor and there's nothing to lock because there's nothing shared.

## "Is this square attacked?", in two flavors

The clearest place to see the tradeoff is check detection. Both engines need to answer "given a board, is square X attacked by side Y?" and they reach for completely different shapes.

In **Gleam**:

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

It also doesn't short-circuit. `dict.fold` walks every entry even after `acc` becomes `True`. The same logic with `list.any` stops at the first attacker:

```gleam
pub fn is_attacked(board: Board, sq: Square, by_color: Color) -> Bool {
  board |> dict.to_list |> list.any(fn(entry) {
    let #(from, piece) = entry
    piece.color == by_color
      && list.contains(pseudo_legal_moves(board, from), sq)
  })
}
```

Cleaner and faster. The agent reached for `dict.fold` because that's what shows up most in tutorials, but `list.any` is the right primitive when you want to stop early. And once you have this, `is_in_check` collapses to `is_attacked(board, find_king(board, color), other_color(color))`, which is small enough to inline if you don't want the name.

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

Cyclomatic complexity ([McCabe 1976](https://ieeexplore.ieee.org/document/1702388/)) is the classic structural measure. For the imperative-vs-functional axis, simpler proxies tell the same story; Moseley and Marks make the case in [*Out of the Tar Pit*](https://curtclifton.net/papers/MoseleyMarks06a.pdf) (2006) that mutable state is the single largest source of accidental complexity. Here's what grep turned up:

| Metric | Go | Gleam |
|---|---|---|
| Functions defined | 43 | 56 |
| Type definitions | 13 | 8 |
| `for` loops | 26 | 0 |
| `if` + `switch` | 104 | 0 |
| `case` (pattern match) | 0 | 75 |
| `list.fold` / `map` / `filter` / `flat_map` | 0 | 20 |
| Mutation sites | ~84 | 0 |

A few of those zeros are languages-don't-have-it. Gleam has no `if`, no `switch`, no `for`: every branch is `case`, every iteration is `list.fold`/`list.map` or recursion. Go has no exhaustive pattern matching, and the stdlib doesn't ship `slices.Map`/`Filter`/`Reduce` (Go 1.23 added the `iter` package as a foundation; functional helpers usually still come from third-party libs).

Gleam splits the work into ~30% more functions, each one doing less. Its eight types live in [one file](https://github.com/escherize/1shot-hotseat-chess-gleam/blob/main/src/chess/types.gleam) and seven are sum types, so the data model is concentrated and exhaustive; Go's thirteen structs are spread across the codebase.

The bottom row is the headline. Eighty-four mutation sites on one side, zero on the other. The Gleam codebase has *no rebindable variables at all*: every `let` is a one-shot binding, every "update" is a new record, and the actor just replaces its state with a fresh value each turn. The Go codebase mutates a `*Game` in place 44 times via struct field assignment and another 14 times via `g.Board[sq] = piece`. Both work. They do not feel the same to extend, debug, or pass around. Mutation is one source of complexity among several (McCabe captures branching, Halstead captures vocabulary), but it's the source the agents disagreed about most.

## What the languages did to the same problem

**Type systems push design.** Gleam has six piece kinds, two colors, and four game statuses, all expressed as exhaustive sum types with the compiler enforcing that every `case` covers them. Go has the same six piece kinds but represents them as `iota` constants on `int`, and represents game status as a string compared with `==`. A typo in `g.Status == "checmate"` compiles fine in Go. A missing `Checkmate ->` arm in Gleam doesn't. Invisible in v1, load-bearing during a refactor.

**Mutability buys speed of writing. Immutability buys speed of changing.** Go's "is this move legal?" runs five lines: copy the game struct, mutate the copy, ask if the king is attacked. Gleam's equivalent needed a separate `apply_move_raw` function (so it could be reused inside legality checking without recursing through status computation) and explicit record-update syntax everywhere. The Gleam version has more code, but every state transition is explicit. Pass a `Game` to ten different functions and not one of them can mutate the value behind your back.

**Standard libraries vs hex packages.** Go's stdlib gave the agent `embed`, `html/template`, `net/http`, `sync`, `flag`. Zero dependencies, `go run .` and you're running. Gleam needed `wisp`, `mist`, `gleam_otp`, `gleam_erlang`, `gleam_http`, `gleam_stdlib`. Hex deps and a working BEAM install before the binary runs.

**Concurrency and templating.** The Go agent reached for `sync.Mutex` around a shared `*Game` (one line, no learning curve). The Gleam agent reached for an OTP actor (typed messages, sequential delivery, state never shared). Different shapes for different defaults. Templating is the larger gap: Go's HTML lives in files with auto-escaping; Gleam's HTML lives in 200-line string literals with no escaping (currently safe only because all interpolated values are internally controlled). Any web project in either language hits this immediately.

## Easier to finish vs easier to extend

Pull all of that together and one axis emerges: easier to finish in the small, or easier to keep extending.

Go landed closer to "easier to finish." Mutable struct, hand-rolled fast-path attack detection, stringly-typed status, tight HTTP handlers in one file. More rules covered (en passant, promotion picker, full castling-rights bookkeeping). Adding a feature is touching the right spot in `chess.go` and trusting yourself not to break the parallel attack-detection branch.

Gleam landed closer to "easier to extend." Immutable record, pattern-matched everything, one source of truth per concept. Slower to feature-complete (no en passant, auto-queen on promotion), but the seams are clean. Adding a piece type is a compile-error-driven exercise: the type checker tells you every site that needs to change.

A fair counter: Gleam has less code on the public web than Go does, so part of what we're seeing is "the language with denser training data produces more complete one-shot output." I can't disentangle that from "the language is more imperative-friendly." For an operator handing prompts to agents, both are useful to know.

If you're scoping a one-week prototype, pick the language that lets you finish in the small. If you're scoping a five-year codebase that twelve people will touch, pick the one that lets you extend without holding your breath. The agent didn't pick a side; it just wrote whichever side each language's culture has already chosen.

For human writers, the takeaway is the same: you will, on average, write the language's path of least resistance. Pick the language whose default failure mode you can live with.

For agent operators, the agent's output is a high-fidelity sample of "what the median author of language X would write." For "which language should I use?", that's a more honest answer than any benchmark.

## Did it replicate?

After publishing, I ran the same two prompts again. Fresh sessions, same model, same harness, empty directories, no other context. Two new chess engines.

**The Go replication landed in the same shape**: mutable struct behind a `sync.Mutex`, `html/template` files, zero external dependencies, one large engine file. 1,060 LOC vs the original's 1,435 (engine file 636 vs 649). Feature set reproduced almost exactly: en passant, full castling rights, promotion picker UI, check/checkmate/stalemate.

**The Gleam replication kept the actor and the immutability and the string-concat HTML**, but the modular split varied. The replication collapsed into 4 files instead of 6, with `board.gleam` at 730 LOC playing the role that the original split between `moves.gleam` (383 LOC), `types.gleam`, and `board.gleam`. Same defaults underneath, different file boundaries on top.

The most interesting result: the **Gleam replication added en passant and a real promotion picker**, both features the original lacked. So the gaps that looked like "Gleam culture struggles with edge cases" were one-shot stochastic noise, not a structural property. The architectural defaults (actor vs mutex, immutable vs mutable, string-concat vs templates, sum types vs `iota`) are stable across runs. The specific feature coverage is not.

That's the disclaimer from the top of this post, now with data: treat the *shape* as suggestive. Don't anchor on the specific feature gaps.

## References

- McCabe, T. J. (1976). [A Complexity Measure](https://ieeexplore.ieee.org/document/1702388/). *IEEE Transactions on Software Engineering*. Open PDF: [literateprogramming.com/mccabe.pdf](http://www.literateprogramming.com/mccabe.pdf).
- Moseley, B., & Marks, P. (2006). [*Out of the Tar Pit*](https://curtclifton.net/papers/MoseleyMarks06a.pdf).
