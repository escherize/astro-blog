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

> make me a chess game, 2 players, with **go** (the programming language) and htmx

> make me a chess game, 2 players, with **gleam** (the programming language) and htmx

Whatever the agent produced is what each language's "path of least resistance" looks like, filtered through one foundation model's training.

### Methodology

- One model, one agent harness (Claude Code), no system-prompt customization.
- Fresh session per language so neither agent could see the other's output.
- Same tools available to both (file ops, shell). The only variable was the language name in the prompt.
- No follow-up turns within the session. The first message is also the last.
- Both repos are public so you can run them yourself: [Go](https://github.com/escherize/1shot-hotseat-chess-go), [Gleam](https://github.com/escherize/1shot-hotseat-chess-gleam).

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

Both repos are public:

- **[github.com/escherize/1shot-hotseat-chess-go](https://github.com/escherize/1shot-hotseat-chess-go)**
- **[github.com/escherize/1shot-hotseat-chess-gleam](https://github.com/escherize/1shot-hotseat-chess-gleam)**

The Go version is more *finished in the small*. More rules covered, more edge cases handled, more features wired through to the UI. The Gleam version is more *set up to be extended*. Smaller core, cleaner module boundaries, sum-typed everything, no global mutable state. Same prompt, two opposite payoffs.

## The shape of each codebase

The Go agent produced idiomatic Go. A `main.go` with HTTP handlers, a `chess/` subpackage, mutable state behind a mutex, status as a string (`""`, `"check"`, `"checkmate"`, `"stalemate"`), HTML in `html/template` files. Five seconds to `go run .` and you're playing chess. The engine sits in one 649-line file because Go culture tolerates that.

The Gleam agent produced idiomatic Gleam. Five files split by concern (`types`, `board`, `moves`, `game_state`, `render`), sum types for everything (`GameStatus { InProgress | Check | Checkmate | Stalemate }`), an OTP actor managing state via typed messages, an immutable `Game` record updated with `Game(..game, selected: None)` syntax. The HTML is built by string concatenation because Gleam's web ecosystem doesn't yet have a beloved templating story.

The agent reached for what each language's community reaches for. That is the entire experiment.

## "Is this square attacked?", in two flavors

The clearest place to see the tradeoff is check detection. Both engines need to answer "given a board, is square X attacked by side Y?" Both reach for completely different shapes.

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

Twelve lines. The whole function is "fold over the board, ask each enemy piece if it can reach this square, reuse the same `pseudo_legal_moves` we already wrote for movement." One source of truth for how each piece moves. Adding a new piece type is one new arm in `pseudo_legal_moves` and check detection updates for free.

In **Go**, the same idea is hand-rolled per piece type:

```go
func (g *Game) squareAttacked(sq Square, by Color) bool {
    r, f := sq.Rank(), sq.File()

    // Pawn attacks: a pawn of color `by` sits one rank toward its own side
    // and captures one file left/right onto `sq`.
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

About 70 lines fully expanded. It's specifically faster than the Gleam version because it doesn't generate every enemy piece's full move list just to check one square. But it's also a *second* hand-written description of how each piece moves, parallel to `PseudoLegalMoves`. Add a new piece tomorrow and you must remember to edit both. Tests can pass for a long time before that drift surfaces.

That single function is the whole experiment in miniature: Go gets you running faster and tuned tighter on the hot path; Gleam gets you a single source of truth that costs more lines today and saves them later.

## Imperative vs functional, by the numbers

Cyclomatic complexity ([McCabe 1976](https://ieeexplore.ieee.org/document/1702388/)) and Halstead complexity are the classic ways to measure code structure, but for the imperative-vs-functional axis there are simpler proxies that show the same story. Moseley and Marks make the case in [*Out of the Tar Pit*](https://curtclifton.net/papers/MoseleyMarks06a.pdf) (2006) that mutable state is the single largest source of accidental complexity in software, so I counted that one explicitly. The rest is grep-counting `for` vs `case`, `if` vs pattern match, function count, type count.

| Metric | Go | Gleam | What it tells you |
|---|---|---|---|
| Functions defined | 43 | 56 | Gleam decomposes work into more, smaller pieces |
| Type definitions | 13 (all structs) | 8 (7 are sum types, in one file) | Gleam concentrates the data model; Go scatters structs |
| `for` loops | 26 | 0 | Gleam never iterates; it folds, maps, and recurses |
| `if` + `switch` | 104 | 0 | Go branches; Gleam dispatches |
| `case` (pattern match) | 0 | 75 | every Gleam branch is exhaustive by construction |
| `list.fold` / `map` / `filter` / `flat_map` calls | 0 | 20 | functional iteration |
| Mutation sites (struct field writes, indexed writes, `++`/`--`, `var`) | ~84 | 0 | the headline number |

Eighty-four mutation sites on one side, zero on the other. The Gleam codebase has *no rebindable variables at all*: every `let` is a one-shot binding, every "update" is a new record built with `Game(..game, selected: None)`, and the state machine is an actor that replaces its state with a fresh value each turn. The Go codebase mutates a `*Game` in place 44 times via struct field assignment and another 14 times via `g.Board[sq] = piece`. Both work. They do not feel the same to extend, debug, or fearlessly copy a snapshot of.

The function count cut is the other interesting one. Roughly the same total LOC, but Gleam splits the work into ~30% more functions. Smaller pieces, more named seams, more places where you can read a single function and understand what it does in isolation. That is the same axis the *Tar Pit* paper points at: not less code, but less *coupling between parts of the code*.

### References

- McCabe, T. J. (1976). [A Complexity Measure](https://ieeexplore.ieee.org/document/1702388/). *IEEE Transactions on Software Engineering*, SE-2(4), 308 to 320. DOI: [10.1109/TSE.1976.233837](https://doi.org/10.1109/TSE.1976.233837). Open PDF: [literateprogramming.com/mccabe.pdf](http://www.literateprogramming.com/mccabe.pdf).
- Moseley, B., & Marks, P. (2006). [*Out of the Tar Pit*](https://curtclifton.net/papers/MoseleyMarks06a.pdf). Discussion: [Hacker News thread](https://news.ycombinator.com/item?id=34954126), [the morning paper summary](https://blog.acolyer.org/2015/03/20/out-of-the-tar-pit/).

## What the languages did to the same problem

**Type systems push design.** Gleam has six piece kinds, two colors, and four game statuses, all expressed as exhaustive sum types with the compiler enforcing that every `case` covers them. Go has the same six piece kinds but represents them as `iota` constants on `int`, and represents game status as a string compared with `==`. A typo in `g.Status == "checmate"` compiles fine in Go. A missing `Checkmate ->` arm in Gleam doesn't. The difference is invisible in v1 and load-bearing during a refactor.

**Mutability buys speed of writing. Immutability buys speed of changing.** Go's "is this move legal?" runs five lines: copy the game struct, mutate the copy, ask if the king is attacked. The agent reached for that immediately. Gleam's equivalent needed a separate `apply_move_raw` function (so it could be reused inside legality checking without recursing through status computation) and explicit record-update syntax everywhere. The Gleam version has more code, but every state transition is visible and aliasing is impossible.

**Standard libraries shape what gets built.** Go's stdlib gave the agent `embed`, `html/template`, `net/http`, `sync`, `flag`. Zero dependencies, and the whole thing is `go run .` on any Go install, forever. Gleam needed `wisp`, `mist`, `gleam_otp`, `gleam_erlang`, `gleam_http`, `gleam_stdlib`. The ecosystem is younger; the prompt-to-running-product distance shows it. Go's binary is self-contained; Gleam's needs hex-fetched dependencies and a working BEAM install.

**Concurrency pulled in opposite directions.** The Go agent reached for `sync.Mutex` around a shared `*Game`. One line, zero learning, zero compiler enforcement that you actually locked before touching the game. The Gleam agent reached for an OTP actor: typed `Message` variants, an `actor.call` round-trip per request, state owned by exactly one process. More machinery, no possible race. BEAM languages move you toward correctness-by-construction; Go moves you toward "easy to start, easy to misuse."

**The clearest DX gap was templating.** Go's HTML lives in `templates/*.html` files with auto-escaping, editor support, and clear separation from logic. Gleam's HTML lives in 200-line string literals inside `render.gleam`, with no escaping (currently safe only because all interpolated values are internally controlled), no syntax highlighting, no template tooling. Any web project in either language hits this gap immediately.

## Easier to finish vs easier to extend

Pull all of that together and you get one axis the agent's choices line up on: **easier to finish in the small**, or **easier to keep extending**.

Go landed closer to "easier to finish." Mutable struct, hand-rolled fast-path attack detection, stringly-typed status, tight HTTP handlers in one file. Five seconds from `go run .` to a playable game. More rules covered, more polish baked in. Adding a feature is a matter of touching the right spot in `chess.go` and trusting yourself not to break the parallel attack-detection branch.

Gleam landed closer to "easier to extend." Immutable record, pattern-matched everything, one source of truth per concept, every state transition visible. Slower to feature-complete (no en passant, no promotion picker), but the seams are clean. Adding a piece type or a new game-status variant is a compile-error-driven exercise: the type checker tells you every site that needs to change, and you change it.

If you're scoping a one-week prototype: go with the language that lets you finish in the small. If you're scoping a five-year codebase that twelve people will touch: go with the one that lets you extend without holding your breath. The agent didn't pick a side here; it just wrote whichever side each language's culture has already chosen.

## Anticipated objections

In the spirit of pre-empting the comments section.

**"n equals one. You can't generalize from a single sample."** Correct. One run, one model, one prompt phrasing. A single trial is anecdotally interesting, not statistically meaningful. The point of the post is the *shape difference*, which holds up across the few re-runs I did informally; the specific feature gaps probably aren't stable across runs.

**"You're measuring ecosystem maturity, not the language."** Partly true. The Gleam agent reached for `wisp` plus `mist` because that's the current Gleam web story; the Go agent reached for `net/http` because Go has carried it for fifteen years. But "what library lands first when the agent needs HTTP" *is* the language's path of least resistance, and that is exactly what I claim to be measuring.

**"Mutation isn't the only complexity source. *Out of the Tar Pit* is one paper."** Right. I cited it because it's the cleanest articulation of the mutation-as-complexity argument; it isn't the only argument. McCabe's cyclomatic complexity captures branching, Halstead captures vocabulary size, "lines of code" captures something else. The 84-vs-0 mutation gap is the most striking single number, but it isn't the entire story.

**"Why one-shot? Real users iterate."** One-shot is a deliberately constrained sample. It tells you what the model defaults to before any human pressure shapes it. Iterative work would tell you a different (also useful) thing. "Agent plus five follow-ups plus a code review" is a different experiment, worth doing.

**"Of course Gleam is missing en passant. There's less Gleam chess code on the public web."** Probably. Training-data density almost certainly contributes here, and I don't have a clean way to control for it. Worth noting that "the language with more public code produces more complete one-shot output" is itself a useful result for an agent operator to know.

**"What model?"** Claude. I'm not naming the version, because it'll be the wrong version by the time you read this; the point isn't model-vendor scoring.

**"Show your grep methodology."** Functions: `grep -c "^func "` for Go, `grep -cE "^(pub )?fn "` for Gleam. Loops: `grep -cE "^\s*for "`. Pattern matches: `grep -cE "(^|\s)case "`. Mutations: `grep -cE "(g|s|cp)\.[A-Za-z_]+ *="` plus `\[[^]]+\] *=` plus `\+\+|--` plus `^\s*var `. Numbers are floor estimates; multi-line declarations and a few other edge cases get under-counted. Run them on the public repos if you want to verify.

## What this experiment doesn't show

Worth being careful here. The Gleam version has silent feature gaps (auto-queening on promotion, no en passant) where Go is correct, so type safety is no substitute for completeness. Both implementations are roughly the same size and were written in comparable time, so productivity differences (if any) wouldn't show up at v1. And the agent's "Gleam style" is a sample of public Gleam code, not evidence of anything intrinsic to the language. Same for Go. What we are measuring is each language's culture, frozen in the model's weights.

That last part is what the experiment is really about.

The agent reached for whichever architecture was statistically most natural in each language. In Go that meant a working monolith with mutable state, stringly-typed enums, and rules-engine completeness. In Gleam that meant a clean modular split, sum types, immutability, and visibly more attention to player-facing UI flourish than to rules edge cases.

If you write code as a human, this is more useful than benchmarks or syntax taste. You will, on average, write the language's path of least resistance. So pick the language whose default failure mode you can live with.

If you operate agents, the framing is different. The agent's output is a high-fidelity sample of "what the median author of language X would write." For "which language should I use?", that's a more honest answer than any benchmark.

## Appendix: the prompts

The literal first messages of each session, with the language name as the only variable:

```
make me a chess game, 2 players, with go (the programming language) and htmx
```

```
make me a chess game, 2 players, with gleam (the programming language) and htmx
```

That is it. The file layout, state model, feature set, and HTML strategy are all what the agent thought was the obvious thing to do, given only a language name.
