---
layout: ../../layouts/BlogPost.astro
title: "Explicit, Typed, and Predictable: Architecture for Humans and Agents"
pubDate: 2026-04-14T00:00:00Z
description: "The same properties that make code maintainable for humans - explicit data flow, strong types, predictable patterns - also make it dramatically easier for AI agents to understand and modify."
author: "Bryan"
tags: ["architecture", "ai", "developer-experience", "typescript", "tooling", "opinion"]
---

I've spent the last year pointing AI agents at a 500K+ line Clojure codebase. The parts they nail and the parts they botch have taught me something I didn't expect - the same architectural choices that make code good for humans make it good for agents. Not similar choices. The *same* choices.

Three properties matter more than anything else: **explicit**, **typed**, and **predictable**.

These aren't new ideas. They're the boring advice your senior engineer gave you ten years ago. But now there's a second audience for your code - one that reads your entire codebase in seconds but has zero institutional memory. And that audience rewards these properties even more aggressively than humans do.

We're already in an era where large chunks of code are written by agents and reviewed by humans (or other agents). The codebases that thrive are the ones where you can drop in cold - no tribal knowledge, no "you just have to know" - and understand what's happening. The architectural choices that enable that aren't complicated. They're just disciplined.

Here's what I've learned actually works, and why.

---

## Principle 1: Explicit

**Explicit means no magic.** Data flows are visible. Dependencies are declared, not injected from the ether. Configuration is passed, not discovered. Side effects are surfaced, not hidden behind innocent-looking function names.

Here's what implicit code looks like:

```typescript
import { db } from './globals'
import { getCurrentUser } from './auth'

async function getOrders() {
  const user = getCurrentUser() // Where does this come from? Thread-local? Closure? Global?
  const orders = await db.query(
    `SELECT * FROM orders WHERE user_id = ?`, [user.id]
  )
  return orders.map(enrichOrder) // Does enrichOrder hit the DB again? Who knows.
}
```

Reading this function, you have questions. Where does `getCurrentUser` pull from? Is `db` a singleton? What does `enrichOrder` do - is it pure, or does it have side effects? To answer any of these, you have to leave this file and go spelunking.

Now compare:

```typescript
async function getOrders(db: Database, userId: string): Promise<Order[]> {
  return db.query(
    `SELECT * FROM orders WHERE user_id = ?`, [userId]
  )
}
```

Every dependency is a parameter. The return type tells you what you get. There's nothing hidden. You can read the function signature and know exactly what it needs, what it returns, and that it doesn't do anything sneaky on the side.

**Why it helps humans:** Code review is faster because the surface area is visible. New team members don't need to learn where the magic globals live. Testing is trivial - just pass in a mock database and a user ID.

**Why it helps agents:** When an AI agent builds a mental model of your codebase, it traces data flow through function signatures. With explicit parameters, the agent knows exactly what inputs are available when it needs to call or modify `getOrders`. With the implicit version, the agent has to grep for `getCurrentUser`, discover it reads from a request context, trace that back to middleware setup - burning context window on detective work instead of actual implementation.

This is why **dependency injection containers** are often worse than just passing arguments. Spring's `@Autowired`, NestJS's module system - they optimize for *writing less code at the call site* at the cost of making dependencies invisible. Every `@Inject()` decorator is a place where an agent (or a new hire) has to stop and ask "where does this come from?" Prefer explicit wiring. It's more typing. It's worth it.

The rule is simple: if you can't understand what a function does by reading its signature, it's not explicit enough.

---

## Principle 2: Typed

**Typed means the shape of your data is machine-readable and enforced.** Not just "use TypeScript" - it's about encoding domain knowledge into types so that invalid states are unrepresentable.

Here's the difference between weak and strong typing in practice:

```typescript
// Weakly typed: anything goes
async function processPayment(data: any) {
  if (data.amount && data.currency && data.method) {
    await charge(data.amount, data.currency, data.method)
  }
}
```

What's `data`? What shape does `method` have? What currencies are valid? Can `amount` be negative? You're reading prose, not code - defensive checks that tell you the author wasn't sure what they'd receive.

Now with proper types:

```typescript
import { z } from 'zod'

const PaymentRequest = z.object({
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP']),
  method: z.discriminatedUnion('type', [
    z.object({ type: z.literal('card'), cardToken: z.string() }),
    z.object({
      type: z.literal('bank'),
      routingNumber: z.string(),
      accountNumber: z.string(),
    }),
  ]),
})
type PaymentRequest = z.infer<typeof PaymentRequest>

async function processPayment(req: PaymentRequest) {
  switch (req.method.type) {
    case 'card':
      return chargeCard(req.amount, req.currency, req.method.cardToken)
    case 'bank':
      return chargeBankTransfer(
        req.amount, req.currency,
        req.method.routingNumber, req.method.accountNumber
      )
  }
}
```

The type IS the documentation. You never need to ask "what shape does this data have?" Negative amounts? Caught by `z.number().positive()`. Unsupported currency? Caught by the enum. New payment method added but not handled? The compiler tells you the switch isn't exhaustive.

**Why it helps humans:** New team members read the type definition and immediately know what's valid. Invalid states are caught before runtime. The type serves as a contract - change the shape and the compiler shows you every place that needs updating.

**Why it helps agents:** Types are the single most valuable signal an AI agent gets from a codebase. When an agent needs to call `processPayment`, the type tells it exactly what to construct. No guessing, no hallucinating field names. Discriminated unions are particularly powerful - the agent can pattern match exhaustively and the compiler catches mistakes. This is why agents produce dramatically better code in TypeScript than in plain JavaScript. It's not that TypeScript is a better language (that's a separate debate) - it's that the type information eliminates an entire category of agent errors.

**Tools that embody this:**

- **[Zod](https://zod.dev/)** - Runtime validation that generates TypeScript types. Single source of truth for validation and types. Write the schema once, get both.
- **[Prisma](https://www.prisma.io/)** - Your database schema generates TypeScript types. No more `any` leaking from your ORM. Every query is type-checked against your actual schema.
- **[tRPC](https://trpc.io/)** - End-to-end type safety from API server to client. The server's return type IS the client's input type. Zero code generation, zero schema drift. Change a field name on the server and the client won't compile.
- **Gleam, Rust, OCaml** - Languages where the type system is the primary design tool, not an afterthought bolted on.

---

## Principle 3: Predictable

**Predictable means following conventions consistently.** Same problem, same solution, every time. No clever one-offs. No "well, in THIS module we do it differently." Predictable codebases are boring codebases, and boring is a compliment.

Here's what unpredictable looks like - three different error-handling patterns in one codebase:

```typescript
// File 1: callback-style
fetchUser(id, (err, user) => {
  if (err) handleError(err)
  // ...
})

// File 2: try/catch with thrown errors
try {
  const user = await getUser(id)
} catch (e) {
  // hope 'e' is what we think it is
}

// File 3: Result type
const result = getUserSafe(id)
if (!result.ok) return err(result.error)
```

Three files, three patterns. A human navigating this codebase has to context-switch every time they open a different module. "How do we handle errors here? Oh, this file uses callbacks. This one throws. This one returns Results."

Pick one and use it everywhere:

```typescript
import { Result, ok, err } from './result'

// Every fallible operation returns Result<T, E>
function getUser(id: string): Result<User, NotFoundError>
function getOrders(userId: string): Result<Order[], DatabaseError>
function processPayment(req: PaymentRequest): Result<Receipt, PaymentError>

// Callers always handle errors the same way
const user = getUser(id)
if (!user.ok) return err(user.error)
```

One pattern. Every file. No exceptions (pun intended).

**Why it helps humans:** When every module follows the same patterns, you can navigate unfamiliar code fast. You already know how errors are handled. You already know where the business logic lives. Onboarding time drops because the codebase teaches itself. A new developer reads one module and understands the shape of all of them.

**Why it helps agents:** AI agents are pattern-matching machines. Literally. When your codebase uses consistent patterns, the agent learns the pattern from a few examples and applies it correctly everywhere. When you have three different error-handling styles, the agent has to figure out which one applies to the file it's editing - and it *will* guess wrong some percentage of the time, mixing styles within a single module. Inconsistency in your codebase produces nondeterministic agent output.

**Tools that enforce predictability:**

- **Convention-heavy frameworks** (Rails, Phoenix, Remix) - They get criticized for "magic" but the magic is *consistent*. Every Rails app puts models in `app/models/`. Every controller looks the same. An agent (or a new hire) can navigate any Rails app because the conventions are universal.
- **Rust's ownership model** - The borrow checker is annoying until you realize it eliminates an entire class of "surprise" bugs. Predictability enforced by the compiler.
- **CLAUDE.md / AGENTS.md** - If your language or framework doesn't enforce conventions, write them down. A conventions file in your repo root is both human documentation and agent instruction set. Same file, two audiences. I wrote about this in my [subagents post](/posts/post-5/) - the reason those domain-expert agents work is that each one front-loads the conventions and patterns of its subsystem. Without predictable patterns to describe, the prompts would be useless.

---

## Effect: The Framework That Proves the Thesis

If you want to see all three principles in a single framework, look at **[Effect](https://effect.website/)**. It's the most opinionated TypeScript library I've encountered, and its core type tells you why:

```typescript
Effect<Success, Error, Requirements>
```

That's it. Every effectful operation in your program returns this type, and it tells you three things:

- **`Success`** - what you get when it works (typed)
- **`Error`** - what can go wrong, tracked in the type system (explicit errors - no surprise throws)
- **`Requirements`** - what services/dependencies this effect needs to run (explicit dependencies)

Here's a concrete example - a user lookup service:

```typescript
import { Effect, Context, Layer } from 'effect'

// Define the dependency as a typed service
class UserRepo extends Context.Tag('UserRepo')<
  UserRepo,
  { findById: (id: string) => Effect.Effect<User, NotFoundError> }
>() {}

// Business logic - dependencies and errors are in the type signature
const getUser = (id: string): Effect.Effect<User, NotFoundError, UserRepo> =>
  Effect.gen(function* () {
    const repo = yield* UserRepo
    const user = yield* repo.findById(id)
    return user
  })

// Provide the real implementation at the edge
const LiveUserRepo = Layer.succeed(UserRepo, {
  findById: (id) =>
    Effect.tryPromise({
      try: () => db.users.findUniqueOrThrow({ where: { id } }),
      catch: () => new NotFoundError({ id }),
    }),
})
```

Look at what `getUser` communicates just through its return type: it produces a `User`, might fail with `NotFoundError`, and requires a `UserRepo` to run. **Explicit** - every dependency is declared. **Typed** - errors are in the type signature. **Predictable** - every Effect program uses the same `Effect.gen` pattern for control flow.

The tradeoff is real. Effect has a steep learning curve. Its API surface is large. It's essentially its own paradigm within TypeScript - you're not just adding a library, you're changing how you write programs. But if you buy in, you get all three principles enforced by default, not by discipline. The framework won't let you hide dependencies or swallow errors because the type system tracks them.

Not every project needs Effect. But if you're building something where correctness matters and you want a framework that *structurally prevents* the anti-patterns I described above, it's the strongest option in the TypeScript ecosystem.

---

## The Agent Multiplier

These three principles have always been good engineering. But AI agents create a multiplier effect - the payoff for following them is now dramatically larger.

**Agents have no tribal knowledge.** A human teammate eventually learns that "oh, in the payments module we handle errors differently." They build up context over months. An agent starts from zero every session. Every time. Explicit, typed, predictable codebases don't require tribal knowledge because the code communicates everything directly.

**Agents read more code than any human.** When a human works on a feature, they read maybe 10-20 files. An agent exploring a feature might scan 100+. Inconsistencies that a human wouldn't notice (because they're only looking at one module) are actively harmful to agents because agents pattern-match across the entire codebase. One inconsistent file can poison the agent's model of how your codebase works.

**Agents generate code by analogy.** When an agent writes new code, it's essentially asking "what does similar code in this codebase look like?" If similar code looks different in different places, the agent's output becomes nondeterministic. Sometimes it'll match file A's style, sometimes file B's. Predictable codebases produce predictable agent output.

**CLAUDE.md is the bridge.** There's an emerging convention of putting agent instructions in a `CLAUDE.md` file in your repository root. Here's the thing that proves the thesis: these files serve double duty. They're onboarding docs for humans AND system prompts for agents. The fact that the same document works for both audiences isn't a coincidence - it's because the information that helps humans navigate a codebase (conventions, patterns, "here's how we do X") is exactly the information that helps agents. Same content, two audiences.

I wrote about this connection in my [previous post on subagents](/posts/post-5/). The reason those domain-expert subagents work is that each one front-loads the conventions and patterns of its subsystem. Without predictable patterns to describe, the agent prompts would just be a pile of file paths. The architecture enables the tooling.

---

## The Opinionated Stack

If I were starting a new project today and optimizing for both human maintainability and agent effectiveness, here's what I'd reach for:

| Layer | Pick | Why |
|-------|------|-----|
| Language | TypeScript | Types as a first-class design tool. Agents produce dramatically better TS than JS. |
| Validation | Zod | Single source of truth for runtime validation and static types. |
| ORM | Prisma or Drizzle | Schema-driven types. No `any` leaking from your data layer. |
| API | tRPC | End-to-end type safety. Server change = client compile error. |
| Error handling | Effect or neverthrow | Typed errors. Explicit. No surprise throws. |
| Conventions | CLAUDE.md | Documented patterns for humans and agents alike. |

The through-line: every tool in this stack makes the implicit explicit, enforces types at boundaries, and creates predictable patterns by default. None of them are the "easiest" option. Zod is more code than `JSON.parse`. Prisma is more setup than raw SQL strings. tRPC is more structure than `fetch`. The investment is upfront. The payoff is downstream - in maintainability, in onboarding speed, in agent effectiveness.

You could swap individual tools. Drizzle instead of Prisma. Remix instead of Next. Gleam instead of TypeScript. The specific tools matter less than the properties they enforce. Pick tools that make it *hard* to be implicit, untyped, or unpredictable, and you'll end up with a codebase that's good for everyone who touches it - human or otherwise.

---

## Conclusion

We spent decades arguing about code quality for human reasons - readability, maintainability, team velocity. Now there's a second, equally powerful reason: AI agents are joining your team, and they reward the same properties even more aggressively.

The good news is you don't need a new playbook. Explicit, typed, predictable. It's the same advice it's always been. It just matters more now because the consequences of ignoring it are amplified. A human can muddle through a messy codebase with enough patience and Slack messages to the right people. An agent can't. It has no patience. It has no Slack. It has your code and your types and your conventions, and that's it.

The best code you can write for an AI agent is the same code your future self would thank you for. That's not a coincidence - it's the whole point.
