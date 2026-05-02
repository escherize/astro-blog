---
layout: ../../layouts/BlogPost.astro
title: "Mage at Metabase: A Unified Task Runner Built for a Growing Engineering Org"
author: "Bryan"
description: "How we built a shell-script wrapper around Babashka tasks (Mage) to streamline dev workflows at Metabase."
image:
  url: "https://docs.astro.build/assets/arc.webp"
  alt: "Terminal window and gears icon on a dark background."
pubDate: 2024-11-24T00:00:00Z
tags: ["metabase", "tooling", "babashka", "taskrunner", "developer-experience"]
---

At Metabase (110+ employees), I wrote a tool called **Mage** (see [Metabase docs: MAGE Development Automation](https://www.metabase.com/docs/latest/developers-guide/mage))
Mage is a **shell-script wrapper + Babashka tasks set** that provides a unified, discoverable, ergonomic task runner for our entire engineering team.

---

## Why It’s So Useful

In a mid-sized engineering org you face recurring problems:

- Many scripts scattered ("lint.sh", "docker-up.sh", "ci_build.sh"), inconsistent usage.
- Onboarding new devs: what tasks exist? what command should I run?
- Devs frustrated by "which script do I run now?" or "what flags again?"
- Duplicate tooling in CI, local setup, and docs.

`Mage` solves this by:

- Providing a **single CLI entrypoint** (`./bin/mage`) for all tasks.
- Auto-installing and bootstrapping dependencies as needed (e.g., Babashka).
- Offering built-in **tab-completion**, aliasing, and help (`-h`) for discoverability.
- Standardizing task names, flags, outputs, and behavior across dev/CI.

From the docs:

> "Run `./bin/mage` to list your tasks. All of them support `-h` to learn more and show examples."
> And: "Run `./bin/mage setup-autocomplete` and follow the instructions …"

At scale, this stops feeling like a script and starts feeling like productivity infrastructure.

---

## How It Works (Architecture)

The entry point is `./bin/mage`, a small shell script that auto-installs Babashka if missing and dispatches to the task system. Tasks themselves live in [bb.edn](https://github.com/metabase/metabase/blob/master/bb.edn#L104) and respect `-h` for help automatically. Running `./bin/mage` with no arguments lists everything available.

Shell completion (bash/zsh) gets wired up via `./bin/mage setup-autocomplete`, so `mage <tab>` is enough to find anything.

---

## Developer Experience Gains

Key benefits we’ve observed:

- **Uniform experience**: Whether you’re on Mac, Windows (WSL), Linux, tasks invoke the same `mage` entrypoint.
- **Discoverability**: New engineers type `mage <tab>` and instantly see available commands.
- **Reduced mental overhead**: No need to memorize disparate scripts or flag sets.
- **CI/Local alignment**: Same tasks power local dev workflows and CI jobs, so fewer "works on my machine" scenarios.
- **Low barrier to contribution**: Because Babashka uses Clojure for scripting, adding a new task is simple and composable.

---

## When This Pattern Works, and When Not

This set up is extremely effective when:

- You have many repetitive dev/CI tasks (linting, building, testing, deploying).
- You need consistency across a growing engineering org.
- You want a lightweight tooling stack (shell + Babashka) without heavy frameworks.

However, it may be overkill when:

- Your project is very small (1-2 engineers) and tasks are minimal.
- You already have a rich ecosystem of task runners with dev buy-in.
- Scripts are highly ad-hoc and rarely standardized.

---

## Final Thoughts

Mage at Metabase is a developer workflow tool built with intention: auto-bootstrap, unified CLI, tab-completion, and consistent UX across local and CI. If you're responsible for tooling in a growing team, the question of "what's the one entrypoint everyone uses?" has to get answered eventually. Mage is one answer.

The `tasks.clj`, alias setup, and CI integration are all open source if you want to crib from them.


