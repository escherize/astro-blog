---
layout: ../../layouts/BlogPost.astro
title: "Crossums: A Number Puzzle Roguelike"
pubDate: 2025-02-24T00:00:00Z
description: "Delete numbers until the math works out. A roguelike puzzle game about strategic subtraction."
author: "Bryan"
tags: ["games", "puzzle", "roguelike", "crossums"]
---

# Crossums

I've been building a puzzle game called **Crossums**—a mashup of crossword-style grids and sum-based logic, wrapped in a roguelike progression system.

The pitch: **Delete numbers until each row and column hits its target sum.**

Simple to understand. Surprisingly deep to master.

---

## How to Play

You're given a grid of numbers. Each row and column has a **target sum** displayed on the edges.

Your job: **delete cells** until the remaining numbers in each row and column add up to exactly the target.

That's it. No adding. No moving. Just strategic subtraction.

### The Rules

1. **Every puzzle has exactly one solution** — you're finding it, not choosing it
2. **The timer is your only enemy** — run out of time and it's game over
3. **Undo is free** — the only cost is time, so experiment freely
4. **Clean play is rewarded** — fewer mistakes means better scores

### Controls

- **Tap a cell** to delete it (it disappears)
- **Tap again** to restore it (if you made a mistake)
- **Circle a cell** to mark it as "definitely keeping this" (optional, but helps)

---

## The Roguelike Layer

Crossums isn't just puzzle after puzzle. There's a meta-game:

### Progression
- **8 stages**, 3 puzzles each
- Grids grow from 3×3 to 6×6
- Later stages introduce negative numbers

### Money & Operators
After each puzzle, your score converts to **money ($)**. Between stages, you hit the **shop** where you can buy **operators**—Balatro-style modifiers that boost your scoring:

| Operator | Effect |
|----------|--------|
| **Row Master** | +50 points per completed row |
| **Purist** | +300 points if you never circled a cell |
| **Speed Demon** | +100 points if solved under 10 seconds |
| **Perfectionist** | ×3 score if zero missteps |

Operators reward *how* you play, not what the puzzle contains. Fast and clean? Big bonuses. Slow and messy? You'll scrape by.

### The Streak System
Solve puzzles without too many mistakes and your **streak multiplier** grows (up to 3×). But make 4+ missteps in a single puzzle and the streak resets to zero.

It creates a risk/reward tension: do you rush for speed, or slow down to stay clean?

---

## Why It Works

The single-solution design is key. In early prototypes, puzzles had multiple valid solutions—but that made operators like "keep 7s for bonus" feel random. You couldn't *plan* around them.

With single-solution puzzles:
- **The puzzle is the challenge** (finding the one answer)
- **Operators modify rewards** (how much you earn for finding it)
- **Player skill matters** (speed, accuracy, clean play)

It's the difference between "hope for good RNG" and "execute well."

---

## The Vibe

The game leans into a **flat-pack furniture** aesthetic (think IKEA assembly instructions meets number puzzles). Clean grids, minimal chrome, satisfying "click" when you delete a cell.

The timer keeps things tense. The operators keep things interesting. The streak system keeps you honest.

---

## Try It

Crossums is playable now. If you like puzzles, roguelikes, or just want to see if you can beat my high scores:

<div style="text-align: center; margin: 2rem 0;">
  <a href="/crossums" style="display: inline-block; padding: 1rem 2rem; background: var(--color-accent); color: white; text-decoration: none; font-family: var(--font-display); font-weight: bold; font-size: 1.25rem; border-radius: 8px; border: 2px solid var(--color-fg); box-shadow: 4px 4px 0 var(--color-fg); transition: all 0.15s ease;">
    Play Crossums →
  </a>
</div>

---

## What's Next

Current focus:
- Polish the operator system (more interesting choices)
- Improve the score screen (show *why* you earned what you earned)
- Mobile optimization (touch controls, responsive layout)

If you play it and have feedback, I'd love to hear it. The game is still evolving, and good ideas make it better.
