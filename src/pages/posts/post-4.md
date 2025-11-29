---
layout: ../../layouts/BlogPost.astro
title: "Glick80: When Functional Purity Meets Retro Gaming"
author: "Bryan"
description: "I brought Gleam's type-safe functional programming to the TIC-80 fantasy console. Pure functions, 8-bit graphics, and zero mutations—what could go wrong?"
image:
  url: "https://docs.astro.build/assets/arc.webp"
  alt: "Pixelated game controller with functional programming symbols"
pubDate: 2024-11-28T00:00:00Z
tags: ["gleam", "tic-80", "fantasy-console", "functional-programming", "game-dev", "retro"]
---

Picture this: You're writing a game where Mario jumps, but Mario can't actually *jump*—he can only return a new Mario who happens to be in a slightly different position. Welcome to **glick80**, where I've brought pure functional programming to the wonderfully constrained world of 8-bit gaming.

<div style="display: flex; justify-content: center; margin: 32px 0;">
  <iframe 
    src="/jstarget/index.html" 
    width="680" 
    height="428" 
    frameborder="0"
    style="border: none; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); background: #000;"
    allowfullscreen>
  </iframe>
</div>

*Use the arrow keys to move the sprite around. Hover and click to see mouse interactions!*

[Check out the project on GitHub](https://github.com/escherize/glick80)

---

## Two Awesome Things You've Never Heard Of

### TIC-80: The Fantasy Console That Actually Exists

First up: **TIC-80**. Imagine if someone in 1985 designed the perfect 8-bit computer for making games, but it only exists as software you run on your modern machine. That's a fantasy console—a virtual computer with intentional limitations that spark creativity.

TIC-80 gives you:
- A whopping 240×136 pixels (take that, 4K!)
- 16 colors at a time (chosen from millions, but still)
- 256 sprites, each a mighty 8×8 pixels
- 4-channel chiptune audio
- Built-in editors for code, sprites, maps, and music

It's like a creative sandbox where constraints are features, not bugs. These limitations force you to be clever—no hiding behind fancy shaders or gigabyte textures. Just you, some pixels, and pure creativity.

### Gleam: The Language That Makes Erlang Jealous

Now meet **Gleam**—a type-safe functional language that compiles to Erlang (or JavaScript, if that's your thing). Imagine if Rust and Elixir had a baby, and that baby was really into making sure your code never crashes.

Gleam features:
- **No null, no exceptions**—just Results and Options
- **Type inference** so good you'll forget you're using a typed language
- **Pattern matching** that makes switch statements cry
- **Immutability by default** (mutation is so 2010)
- Runs on the BEAM (Erlang's VM), so it scales to millions of concurrent processes

It's functional programming without the PhD requirement.

---

## The Unholy Marriage: Glick80

Here's the thing about game development: it's traditionally a mutation fest. You have a player at position (x, y), they press right, boom—you mutate x. The screen refreshes, you draw at the new position. Simple.

But what if we didn't mutate anything? What if every frame was a pure function?

That's glick80. I took TIC-80's inherently imperative game loop and wrapped it in Gleam's warm, functional embrace.

### How It Works (The Magic Behind the Curtain)

Traditional TIC-80 (in Lua):
```lua
-- Mutable global state (the horror!)
player_x = 120
player_y = 68

function TIC()
  -- Directly mutate position
  if btn(2) then player_x = player_x - 1 end
  if btn(3) then player_x = player_x + 1 end
  
  cls(0)
  spr(1, player_x, player_y)
end
```

Glick80 style (in Gleam):
```gleam
import glick80/api.{btn, cls, spr}

pub type State {
  State(player_x: Float, player_y: Float)
}

pub fn tic(state: State) -> State {
  // Create new state based on input
  let new_x = case btn(2), btn(3) {
    True, False -> state.player_x -. 1.0
    False, True -> state.player_x +. 1.0
    _, _ -> state.player_x
  }
  
  // Draw with current state
  cls(0)
  spr(1, new_x, state.player_y)
  
  // Return the new state (no mutations!)
  State(player_x: new_x, player_y: state.player_y)
}
```

The secret sauce? A tiny JavaScript shim that:
1. Holds your state between frames (shh, don't tell the purists)
2. Calls your pure Gleam functions
3. Threads the returned state to the next frame

You get immutability and type safety. TIC-80 gets its game loop. Everyone wins!

### The Variadic Function Problem (Or: When Defaults Meet Types)

Here's a fun challenge I hit: Lua loves default arguments. Take the `btnp` function that checks if a button was just pressed:

```lua
-- In Lua, these all work:
btnp(0)                -- Just check button 0
btnp(0, 30, 6)        -- Check with hold and period parameters
```

But Gleam doesn't do optional arguments—it's deliberately simple, no variadic functions, no default parameters. Every function signature is exact.

I considered a few solutions:
1. **Option types everywhere**: `btnp(id: Int, hold: Option(Int), period: Option(Int))` — but calling `btnp(0, None, None)` gets old fast
2. **Record types**: Pass a config object — even worse ergonomics
3. **The Goldilocks solution**: Multiple functions!

So I went with paired functions for each variadic TIC-80 function:

```gleam
// Simple version for common use
@external(javascript, "../tic_ffi.mjs", "btnp")
pub fn btnp(id: Int) -> Bool

// Full version when you need the extra params
@external(javascript, "../tic_ffi.mjs", "btnp")
pub fn btnp_full(id: Int, hold: Int, period: Int) -> Bool
```

Same underlying JavaScript function, different Gleam signatures. You get the simplicity of `btnp(0)` most of the time, with `btnp_full(0, 30, 6)` when you need it. Type safety preserved, ergonomics maintained, everyone's happy.

This pattern repeats throughout the API—simple functions for common cases, `_full` variants for power users. It's more Gleam functions to maintain, but the developer experience is worth it.

### The Development Workflow Magic

Here's another nerdy detail: TIC-80 cartridges are just text files with special markers. A typical `.tic` file looks like:

```
// title:  My Game
// author: Bryan
// desc:   A functional game
// script: js

[your JavaScript code here]

// <TILES>
[sprite data in hex]
// <SPRITES>
[more game assets]
```

So I wrote a tiny Node.js script that automatically injects compiled Gleam → JavaScript into existing cartridges:

```javascript
#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const TIC_PATH = process.env.TIC_PATH;
const rel = process.argv[2] || "jstarget.js";
const target = path.join(TIC_PATH, rel);
const CART = "dist/cart.js";
const START = "// script:  js";
const END = "// <TILES>";

// Read your compiled Gleam code
const cart = fs.readFileSync(CART, "utf8");
// Read existing cartridge
const txt = fs.readFileSync(target, "utf8");

// Find the code section boundaries
const startIdx = txt.indexOf(START);
const endIdx = txt.indexOf(END, startIdx);

// Replace just the code section, keep sprites/audio intact
const head = txt.slice(0, startIdx + START.length);
const tail = txt.slice(endIdx);
const out = `${head}\n${cart}\n${tail}`;

fs.writeFileSync(target, out, "utf8");
console.log(`Patched: ${target}`);
```

This script:
1. **Finds your TIC-80 directory** (using the `TIC_PATH` environment variable)
2. **Reads your compiled Gleam JavaScript** from `dist/cart.js`
3. **Locates the code section** in your existing cartridge (between `// script: js` and `// <TILES>`)
4. **Surgically replaces only the code**, preserving all your sprites, maps, and audio
5. **Creates a backup** (because accidents happen)

The workflow becomes:
```bash
# Write Gleam code
vim src/game.gleam

# Compile to JavaScript  
gleam build

# Hot-patch into TIC-80 cartridge
node patch-cart.js

# Test in TIC-80
# Repeat!
```

No manual copy-paste. No losing your pixel art. Just pure functional logic flowing seamlessly into your retro game. It's like version control for your game's brain while keeping its body intact.

---

## Why This Actually Matters

### 1. Testable Game Logic

When your game logic is pure functions, testing becomes trivial:

```gleam
pub fn test_player_moves_right() {
  let initial = State(player_x: 50.0, player_y: 50.0)
  let pressed_right = ButtonState(right: True, ..)
  
  let result = update_player(initial, pressed_right)
  
  assert result.player_x == 51.0
}
```

No mocking frameworks. No setup/teardown. Just functions.

### 2. Time Travel Debugging

Since every state is immutable, you can store history:

```gleam
pub type GameState {
  GameState(
    current: State,
    history: List(State),  // Previous 60 frames
    future: List(State)    // For undo/redo
  )
}
```

Implementing replay systems or undo/redo becomes almost trivial.

### 3. Predictable Behavior

No hidden mutations means no spooky action at a distance. When something goes wrong, the bug is in the function you're looking at, not in some global state modified three files away.

---

## The Constraints Are the Point

You might ask: "Why limit yourself to 240×136 pixels AND functional programming?"

Because constraints breed creativity. When you can't throw more pixels at a problem, you learn to make each pixel count. When you can't mutate state, you learn to think in transformations.

Plus, there's something deeply satisfying about making a game that would run on a calculator using techniques from tomorrow's programming languages.

---

## Try It Yourself!

Want to give glick80 a spin? Here's a minimal setup:

```bash
# Install Gleam
brew install gleam  # or your package manager of choice

# Create a new project
gleam new my_awesome_game
cd my_awesome_game
```

Then add glick80 to your `gleam.toml`:

```toml
[dependencies]
gleam_stdlib = "~> 0.34"
glick80 = { git = "https://github.com/escherize/glick80", ref = "main" }
```

Build and run:
```bash
# Download dependencies and build
gleam build

# Run in TIC-80
gleam run
```

Then write your pure functional game:

```gleam
import glick80/api
import glick80/state.{State}

pub fn main() {
  // This bootstraps everything
  state.main()
}

pub fn boot() -> State {
  State(x: 120.0, y: 68.0, t: 0)
}

pub fn tic(state: State) -> State {
  api.cls(0)
  
  // Draw a bouncing sprite
  let y = state.y +. Float.sin(state.t /. 10.0) *. 5.0
  api.spr(1, state.x, y)
  
  State(..state, t: state.t +. 1.0)
}
```

Want to see the full source? Here's the complete [game.gleam file](https://github.com/escherize/glick80/blob/master/src/game.gleam) that powers the demo above:

<details>
<summary>Click to view the complete source code</summary>

```gleam
import glick80_api.{Mouse} as g

const width: Int = 240
const height: Int = 136

pub type V2 {
  V2(x: Float, y: Float)
}

pub type Player {
  Player(pos: V2, vel: V2, speed: Float)
}

pub type State {
  State(t: Int, p: Player)
}

pub const initial_state = State(
  t: 0,
  p: Player(pos: V2(96.0, 24.0), vel: V2(0.0, 0.0), speed: 1.0),
)

fn dir(neg_pressed: Bool, pos_pressed: Bool) -> Float {
  case neg_pressed, pos_pressed {
    True, False -> -1.0
    False, True -> 1.0
    _, _ -> 0.0
  }
}

fn clamp(x: Float, lo: Float, hi: Float) -> Float {
  case x <. lo, x >. hi {
    True, _ -> lo
    _, True -> hi
    _, _ -> x
  }
}

fn v2add(a: V2, b: V2) -> V2 {
  let V2(ax, ay) = a
  let V2(bx, by) = b
  V2(ax +. bx, ay +. by)
}

fn scale(a: V2, s: Float) -> V2 {
  let V2(ax, ay) = a
  V2(ax *. s, ay *. s)
}

fn lerp(a: V2, b: V2, t: Float) -> V2 {
  let V2(ax, ay) = a
  let V2(bx, by) = b
  V2(ax +. { bx -. ax } *. t, ay +. { by -. ay } *. t)
}

pub fn update(state: State) -> State {
  let State(t, Player(pos, vel, speed)) = state

  let up = g.btn(0)
  let down = g.btn(1)
  let left = g.btn(2)
  let right = g.btn(3)

  let v_next =
    V2(
      clamp(vel.x +. dir(left, right), 0.0 -. speed, speed),
      clamp(vel.y +. dir(up, down), 0.0 -. speed, speed),
    )
    |> lerp(vel, 0.2)
    |> scale(0.9)
  let p_next = v2add(pos, v_next)
  State(t + 1, Player(p_next, v_next, speed))
}

pub fn draw(state: State) -> Nil {
  let State(_t, Player(pos, _vel, _speed)) = state
  let id: Int = 1
  let m = g.mouse()
  let Mouse(mx, my, _left, _middle, _right, _scrollx, _scrolly) = m
  g.cls(14)

  g.rect(width - mx - 3, height - my - 3, mx - 3, my - 3, 4)
  g.rectb(width - mx, height - my, mx, my, 5)

  g.spr_full(id, pos.x, pos.y, ck: 14, scale: 3.2, flip: 0, rot: 0, w: 2, h: 2)

  g.circb(mx, my, 20, 2)
  g.circ(mx, my, 15, 3)
  g.line(0, 0, mx, my, 6)

  g.print(m, 10, 10)
  g.print(#("my", my), 10, 20)

  g.print("HELLO WORLD!", 84, 84)
  Nil
}

pub fn tic(state: State) -> State {
  let next_state = update(state)
  draw(next_state)
  next_state
}
```

</details>

This demonstrates several functional programming concepts in action:
- **Immutable state transformations**: `update()` returns new state rather than mutating
- **Pure functions**: `draw()` has no side effects (just returns drawing commands)
- **Pattern matching**: Used extensively for input handling and vector operations
- **Function composition**: Vector operations are chained with the pipe operator `|>`

---

## Live Demo

Want to see it in action? Here's a simple glick80 game running right in your browser:

<div style="display: flex; justify-content: center; margin: 40px 0;">
  <iframe 
    src="/jstarget/index.html" 
    width="680" 
    height="428" 
    frameborder="0"
    style="border: none; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); background: #000;"
    allowfullscreen>
  </iframe>
</div>

*Built with glick80 - pure functional programming meets retro gaming!*

---

## What's Next?

Glick80 is still evolving. Some ideas brewing:

- **Entity Component System** (but functional)
- **Particle effects** using persistent data structures
- **Network multiplayer** leveraging Gleam's actor model
- **Visual debugger** showing state transformations

The beauty is that Gleam's type system catches our mistakes at compile time, while TIC-80's constraints keep our ambitions in check.

---

## Final Thoughts: Why Mix Oil and Water?

Functional programming and game development are traditionally like oil and water—they don't mix well. Games are all about mutable state, frame updates, and side effects. Functional programming abhors all three.

But sometimes the best ideas come from forcing incompatible things together. Peanut butter and jelly. Jazz and hip-hop. Type safety and pixel art.

Glick80 proves you can have your functional cake and eat it too—even if that cake is only 16 colors and fits in 64KB.

So next time someone tells you functional programming isn't practical for game dev, show them a type-safe, purely functional game running at 60 FPS on a fantasy console. Then watch their brain segfault.

Happy hacking! 🎮✨

---

*Want to make your own retro games with modern functional programming?*  
**→ [Get started with glick80](https://github.com/escherize/glick80)**

*Questions? Ideas? Find me on [Twitter](https://x.com/escherize) or check out my [other projects](/about).*
