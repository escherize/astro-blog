---
layout: ../../layouts/BlogPost.astro
title: "Crossums: A Number Puzzle Roguelike"
pubDate: 2026-02-24T00:00:00Z
description: "Delete numbers until the math works out. A roguelike puzzle game about strategic subtraction."
author: "Bryan"
tags: ["games", "puzzle", "roguelike", "crossums"]
---

# Crossums

I made a puzzle game where you *remove* numbers instead of placing them. Every row and column has a target sum. Your job: delete cells until what's left adds up perfectly.

No adding. No moving. Just strategic subtraction.

The catch: every puzzle has exactly one solution. You're not choosing an answer—you're hunting for *the* answer, against the clock.

---

## The Balatro Brain Worm

I couldn't stop thinking about Balatro's operator system. Those little modifiers that don't change *what* you're doing—they change *how much you care* about doing it well.

Crossums has the same hook. Between stages you hit a shop and buy **operators**:

| Operator | The Deal |
|----------|----------|
| **Row Master** | +50 per completed row |
| **Purist** | +300 if you never circled a cell |
| **Speed Demon** | +100 for solving under 10 seconds |
| **Perfectionist** | ×3 multiplier for zero mistakes |

Suddenly "just solve it" becomes "solve it *fast*, solve it *clean*, solve it without using the safety net." Same puzzle, completely different tension.

Your **streak multiplier** (up to 3×) rewards consecutive clean solves. But 4+ mistakes in a single puzzle? Back to 1×. The game is constantly asking: do you rush for speed bonuses and risk blowing your streak, or play it safe and leave points on the table?

---

## Why Single Solutions Matter

Early prototypes allowed multiple valid answers. It felt broken—operators like "bonus for keeping 7s" became pure luck. Did the puzzle happen to need 7s? Who knows!

Single solutions fix this completely. The puzzle is deterministic. The *only* variable is you: how fast, how accurate, how stylish. No RNG excuses. You earned that score or you didn't.

It's the difference between slot machines and speedrunning.

---

## The Progression Arc

8 stages, 3 puzzles each. Grids grow from 3×3 (approachable) to 6×6 (sweaty). Stage 5 introduces negative numbers, which scrambles all your intuitions about what "adds up" means.

The whole run takes maybe 15 minutes if you're quick. But the scoring system has enough depth that "winning" and "winning well" are very different achievements.

---

<div style="text-align: center; margin: 2rem 0;">
  <a href="/crossums" style="display: inline-block; padding: 1rem 2rem; background: var(--color-accent); color: white; text-decoration: none; font-family: var(--font-display); font-weight: bold; font-size: 1.25rem; border-radius: 8px; border: 2px solid var(--color-fg); box-shadow: 4px 4px 0 var(--color-fg); transition: all 0.15s ease;">
    Play Crossums →
  </a>
</div>
