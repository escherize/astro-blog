---
layout: ../../layouts/BlogPost.astro
title: "10 Custom Subagents for Taming a Giant Codebase"
pubDate: 2026-03-23T00:00:00Z
description: "I built domain-expert subagents for Claude Code that keep context clean and answers sharp when working on Metabase's 500K+ line backend. Here's how."
author: "Bryan"
tags: ["claude-code", "ai", "developer-experience", "metabase", "tooling"]
---

# 10 Custom Subagents for Taming a Giant Codebase

Metabase's backend is big. We're talking 500K+ lines of Clojure spread across a query processor, permissions system, 18+ database drivers, notification pipeline, serialization layer, search engine, and more. Each subsystem has its own idioms, gotchas, and "you just have to know" moments.

I've been using [Claude Code](https://code.claude.com) for backend work on Metabase for a while now. It's good. Really good. But there's a tension: every time Claude needs to understand a subsystem, it explores. It greps. It reads files. And all of that exploration eats your context window. Ask about the query processor, then ask about permissions, and by the time you're actually implementing something, half your context is search results you don't need anymore.

Custom subagents fix this.

---

## What Are Subagents?

Subagents are a [Claude Code feature](https://code.claude.com/docs/en/sub-agents) that lets you define specialized AI assistants as markdown files. Drop a `.md` file in `~/.claude/agents/` and you've got a new expert on your team.

Each subagent gets:
- Its own **context window** (your main conversation stays clean)
- A **custom system prompt** packed with domain knowledge
- **Persistent memory** that accumulates across sessions
- Configurable **tool access** and **model selection**

When you say "ask the mbql expert about this," Claude spawns a subagent that already knows where to look, how the subsystem works, and what the common pitfalls are. It does its thing, and only the answer comes back to your main conversation.

It's like having a team of specialists you can page, except they live in `~/.claude/agents/` and they never take PTO.

---

## Why I Made 10 of Them

Metabase's backend has natural domain boundaries. The query processor is a 68-stage middleware pipeline that compiles MBQL to SQL across 18 database dialects. The permissions system is a multi-granularity graph with sandboxing, SSO, and embedding security. The notification system renders charts to images inside a JVM. These are different worlds.

A single generalist Claude session can navigate any of them, but it pays a context tax every time it switches domains. Subagents eliminate that tax by front-loading domain knowledge into the system prompt.

I used Claude to write the "job descriptions" for each agent. I described the domain and what an expert would know, and Claude helped me flesh out the codebase locations, investigation patterns, caveats, and testing strategies. Each agent ended up being ~150 lines of dense, useful context.

---

## What's Inside an Agent File?

Each agent is a markdown file with YAML frontmatter:

```yaml
---
name: mbql-expert
description: "Use this agent when working on Metabase's
  query processor, MBQL query language, SQL compilation..."
model: opus
memory: user
---
```

The `description` tells Claude *when* to delegate. The `model` picks which Claude model the subagent uses. And `memory: user` gives the agent a persistent directory at `~/.claude/agent-memory/mbql-expert/` where it records learnings across sessions.

The body of the file is the system prompt: the actual domain knowledge. Here's a trimmed look at what the mbql-expert knows:

```markdown
You are a senior backend engineer with deep expertise
in Metabase's query processor (QP), MBQL query language,
and the entire query compilation pipeline.

## Your Domain Knowledge

### The Query Processor Pipeline
You understand the QP's ring-style middleware pipeline
with its four phases:
- **Around middleware** (3 layers)
- **Preprocessing** (44 layers): source card resolution,
  parameter substitution, join resolution, temporal bucketing...
- **Execution** (8 layers): caching, permissions, result metadata
- **Postprocessing** (13 layers): formatting, timezone conversion...

### Key Codebase Locations
- `src/metabase/query_processor/`: QP core
- `src/metabase/driver/sql/`: SQL driver base
- `modules/drivers/`: database-specific drivers

### Important Caveats
- Middleware ordering matters. Adding middleware in the wrong
  position causes subtle bugs.
- A fix at the `:sql` level affects ALL SQL databases.
- BigQuery is not standard SQL. Oracle has no BOOLEAN type.

### REPL-Driven Development
Use `clj-nrepl-eval` to evaluate middleware transformations
step by step...
```

Every agent follows the same pattern: domain knowledge, codebase locations, investigation approach, caveats, testing strategies. It's a "here's everything you need to be useful in this corner of the codebase" document.

---

## The 10 Agents

| Agent | Domain |
|-------|--------|
| **mbql-expert** | Query processor, MBQL language, SQL compilation, middleware pipeline, HoneySQL, streaming execution |
| **permissions-expert** | Access control, sandboxing, SSO (SAML/OIDC/LDAP), connection impersonation, embedding security |
| **platform-expert** | App database, HTTP server, API framework, settings system, migrations, Quartz scheduling |
| **enterprise-expert** | Serialization, SCIM provisioning, multi-tenancy, database routing, dependency tracking |
| **content-expert** | Collections, dashboards, cards, models, metrics, revisions, parameter mappings |
| **notifications-expert** | Dashboard subscriptions, alerts, email/Slack rendering, chart image generation |
| **drivers-and-sync** | Database drivers, metadata sync, fingerprinting, type mapping, connection management |
| **search-expert** | Search indexing, scoring/ranking, X-ray auto-analysis, semantic search |
| **ai-expert** | Metabot v3, LLM tool calling, context engineering, SQL generation |
| **transforms-expert** | Data actions, CSV uploads, transform pipeline, workspace management, model persistence |

---

## My Favorite: mbql-expert

The query processor is the heart of Metabase and the hardest thing to navigate. It's a 68-stage middleware pipeline where a query enters as MBQL, gets rewritten 44 times during preprocessing, compiled to SQL via HoneySQL, executed, and then post-processed through 13 more stages. Oh, and some middleware runs *twice* because later stages can introduce structure that earlier stages need to process again.

The mbql-expert already knows all of this. When I say "trace why this nested query with joins produces wrong results on Redshift," it doesn't start by grepping. It reasons about which middleware stages touch join aliases, checks Redshift-specific driver overrides, and examines the HoneySQL output. That's the difference between a generalist exploring and a specialist investigating.

---

## How I Actually Use Them

The nice thing is you don't need special syntax. Just reference the agent naturally:

> "Bounce this off the enterprise expert: will this serialization change break round-trip import/export?"

> "Ask the permissions expert how sandboxing interacts with joined tables."

> "Have the mbql expert review this HoneySQL compilation change."

Claude reads the intent, matches it to the agent's description, and delegates. You can also `@`-mention agents directly if you want to be explicit.

One pattern I love: **launching multiple agents in parallel**. When reviewing a change that touches the query processor and permissions, I'll ask Claude to have both experts weigh in simultaneously. Each expert investigates in its own context, and the results come back without cross-contaminating each other's exploration.

---

## Make Your Own

The pattern works for any large codebase with distinct subsystems. Here's how to get started:

1. **Identify the domains.** What are the natural boundaries in your codebase? The parts where "you just have to know" things that aren't obvious from the code alone.

2. **Write a markdown file.** Frontmatter with `name`, `description`, and optionally `model` and `memory`. Body with domain knowledge, key file paths, investigation patterns, and caveats.

3. **Drop it in `~/.claude/agents/`** for personal agents, or `.claude/agents/` to share with your team via version control.

4. **Use it.** Just mention the agent by name in conversation. Or use the `/agents` command to manage them interactively.

You can even have Claude help you write the agents. Describe the domain and what an expert would know, then iterate on the system prompt together. That's how I built these.

---

## Links

- [The agents (all 10 markdown files)](https://gist.github.com/escherize/1cdd92a89cb52a1ce4be1a0cce0467b5)
- [Claude Code subagent docs](https://code.claude.com/docs/en/sub-agents)
