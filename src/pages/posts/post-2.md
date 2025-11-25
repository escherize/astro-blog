---
title: "Introducing go-silo: Markdown for File Structures & Contents"
author: "Bryan"
description: "Why I built go-silo, how it works, and how it treats file-structure-+-content as Markdown-first."
image:
  url: "https://docs.astro.build/assets/arc.webp"
  alt: "Minimalistic file-tree graphic on a muted background."
pubDate: 2025-11-24
tags: ["go", "golang", "file-structure", "markdown", "tools"]
---

Today I want to showcase my tool **go-silo** — a Go library that treats _file structures and their contents_ as Markdown, making them easy to read, easy to write, and easy to pack/unpack.
Check it out on GitHub: <https://github.com/escherize/go-silo>

---

## Why It’s So Cool

When managing data that consists of both directories and files (for example configuration, content, or structured assets) you often want:

- a **human-readable** representation of both folder hierarchy and file contents
- a **writeable** format so you can edit structure + content in one place
- a **pack/unpack** tool so you can transform this human format into actual file systems and back
- management of file sets without ad-hoc scripts

go-silo delivers this: you define your structure + content in Markdown, then use the tool to **export** into folders & files, or **import** folders/files back into a Markdown form.
Key highlights:

- **Unified representation**: nested directories + file contents captured in one document
- **Bidirectional**: you can pack (Markdown → file system) or unpack (file system → Markdown)
- **Minimal dependencies**: leverages Go, standard library, simple semantics
- **Ideal for “content as code” workflows, templating, scaffolding, migrations**

In short: it treats your file tree as first-class Markdown, making manual edits and versioning straightforward.

---

## Example Usage / Code Snippet

Here’s a small sample file named `python_helper.silo` that illustrates how you might define files in Markdown for go-silo to pack/unpack:

`$ cat python_helper.silo`

```markdown
> main.py
from src.helpers.utils import add

print(add(2, 3))

> src/helpers/utils.py
def add(a, b):
    return a + b
```

In this example:

- Lines starting with `>` indicate **file paths** relative to your current working directory
- The subsequent block (everything before `newline,newline,>`) is the **content** of that file
- go-silo can take that `.silo` Markdown document and create the corresponding folder structure:
  - `main.py` at project root
  - `src/helpers/utils.py` under nested directories
- When unpacking, it can read a directory tree and serialize it back into the same Markdown style

- 😠 "But Escherize, I really need to put `newline,newline,>` in my file!"
    - Good news, `>` is just a convention, ANY group of characters or emojis can be used. ☺️ I like using 🥖. This ensures you can always come up with a "magic sequence" that doesn't collide with your files.

```markdown
🥖 main.py
from src.helpers.utils import add

print(add(2, 3))

🥖 src/helpers/utils.py
def add(a, b):
    return a + b
```

---

## How It Works Under the Hood

At its core, go-silo defines a small DSL of Markdown syntax like:

When you run `go-silo pack`, it reads that Markdown, creates the folder `docs/` and files `intro.md`, `api.md`, etc., populating contents.
When you run `go-silo unpack`, it reads the folder tree and serializes it **back** into a Markdown representation.

Internally it uses:

- a parser for the custom Markdown tree format
- Go’s `os`, `io`, `filepath` packages to walk directories
- optional binary encoding or linking for non-text files
- a structural model: directories contain files, files contain content

Because the representation is Markdown, it's version-control friendly, easy to edit, diff, review, and revert.

---

## Structure & Patterns in a Go Sense

While go-silo doesn’t use macros like Lisp, it offers a structured pattern for file-system management:

- **Declarative structure**: you write “> file/path.ext” blocks instead of manual `mkdir` and `echo` commands.
- **Content blocks**: file contents are embedded in Markdown code-fences, so edits happen alongside structure.
- **Bidirectional tooling**: rather than manual shell scripts for each tree change, you let go-silo manage the transition between the representation and real files.

This pattern gives you a **single source of truth** for a file-tree + contents, avoiding scattered scaffolding.

---

## Why Consider It (and When Not)

go-silo is especially useful when you:

- share setups, or scaffolding where file trees + folders matter
- want versioning of both structure and contents in a readable format
- want to sketch, slurp up, rebuild or extract file trees programmatically

---

## Final Thoughts

go-silo is a lean but powerful idea: treat folder trees + file contents as Markdown first, and automate the bridge to/from actual file systems.

If you’d like to give it a try, head over to the GitHub repo:
👉 <https://github.com/escherize/go-silo>

I’d love your feedback: how you’d use it, what file trees you manage, and how you version structure + content in your workflows. <a href="/about">Hit me up</a>.
