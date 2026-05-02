---
layout: ../../layouts/BlogPost.astro
title: "Bringing SQLGlot to Metabase: Swappable SQL Parsing via GraalVM"
pubDate: 2026-02-14T00:00:00Z
description: "How I integrated Python's SQLGlot parser into Metabase using GraalVM Polyglot, creating a swappable SQL parsing architecture that gives us the best of both worlds."
author: "Bryan"
image:
  url: "https://docs.astro.build/assets/rose.webp"
  alt: "Abstract shape on a dark background."
tags: ["metabase", "clojure", "python", "sqlglot", "graalvm", "sql-parsing"]
---

# Bringing SQLGlot to Metabase

I recently merged a [fairly large PR](https://github.com/metabase/metabase/pull/68911) into Metabase that fundamentally changes how we parse SQL. The goal: bring [SQLGlot](https://github.com/tobymao/sqlglot), a powerful Python SQL parser with excellent dialect support, into our JVM-based Clojure application. Here's the story of how I did it, the architectural decisions involved, and the tricky bits I ran into along the way.

---

## The Architecture Shift

Metabase has historically used [Macaw](https://github.com/metabase/macaw), our wrapper around [JSqlParser](https://github.com/JSQLParser/JSqlParser), for SQL analysis. It works well, but JSqlParser's dialect support has limitations. SQLGlot, on the other hand, supports 25+ SQL dialects out of the box.

The challenge: SQLGlot is Python. Metabase is Clojure on the JVM.

Here's what the architecture looked like before:

```
Before (master):
  [metabase] -> [macaw]
```

And here's what it looks like now:

```
After:
  [metabase] -> [sql-tools] -> [macaw]  (moved, behavior unchanged)
                            -> [sql-parsing] -> [python/sqlglot]  (new)
```

The key insight is the **swappable backend design**. We created a new `sql-tools` module that provides a unified API, with implementations that can delegate to either Macaw or SQLGlot. SQLGlot is now the default, but you can switch back instantly:

```bash
MB_SQL_TOOLS_PARSER_BACKEND=macaw
```

This made the PR low-risk: if anything goes wrong in production, it's a one-liner to roll back.

---

## The 1,500-Line Python Afternoon

The most satisfying part of this project was writing `sql_tools.py`. One afternoon, I sat down to reimplement Macaw's `field-references` function using SQLGlot. The goal was to produce *exactly* the same output format so tests would pass against both backends.

What started as "let me see if this is even possible" turned into a ~1,500 line Python file that implements:

- **`referenced_tables`**: extract all tables referenced in a query
- **`referenced_fields`**: extract all column references with their source tables
- **`field_references`**: Macaw-compatible field extraction (the tricky one)
- **`validate_query`**: validate SQL against a schema
- **`replace_names`**: replace schema/table/column names in SQL
- **`simple_query`**: detect if a query is "simple" (no LIMIT, OFFSET, CTEs)

The core of it is a `FieldReferenceWalker` class that traverses SQLGlot's AST:

```python
class FieldReferenceWalker:
    """
    Walks SQLGlot AST to extract field references matching Macaw's output format.

    Key concepts:
    - sources: Nested list of source tables/subqueries
    - withs: Set of CTE definitions, progressively built
    """
    def _get_column(self, sources, column_expr, return_table_matches):
        column_name = column_expr.name
        table_ref = column_expr.table

        if table_ref:
            source = self._find_source({"table": table_ref}, sources)
            valid_sources = [[source]] if source else [[]]
        else:
            valid_sources = sources
        # ... resolve through source chains
```

Once `field_references` worked, the other functions fell into place quickly. The pattern was established: walk the AST, extract what you need, serialize to JSON, return to Clojure.

---

## GraalVM: Making Python Play Nice with the JVM

Running Python from Clojure sounds exotic, but GraalVM's Polyglot API makes it surprisingly practical. We already use it for static visualizations (SVG rendering), so the infrastructure was proven.

The tricky part is resource management. Python contexts:
- Aren't thread-safe
- Take seconds to initialize
- Use significant memory
- Can leak memory over time
- Sometimes hang

We built a context pool with a **poisoning mechanism** for hung contexts:

```clojure
(defn poison!
  "Mark a PooledContext as poisoned. When closed, it will be disposed
   from the pool rather than released back. Use this when GraalVM hangs
   to prevent returning a broken context to the pool."
  [ctx]
  (when (instance? PooledContext ctx)
    (reset! (:poisoned? ctx) true)))
```

Combined with timeout handling:

```clojure
(defmacro ^:private with-python-timeout
  [ctx timeout-ms & body]
  `(let [result# (with-timeout* ~timeout-ms (^:once fn* [] ~@body))]
     (if (= result# ::timeout)
       (do
         (python.pool/interrupt! ~ctx 1000)
         (python.pool/poison! ~ctx)
         (throw (TimeoutException. ...)))
       result#)))
```

If SQLGlot takes too long, we interrupt the context, poison it so it gets disposed rather than returned to the pool, and throw an exception. The next request gets a fresh context.

---

## The Leniency Problem

Here's where things got interesting. SQLGlot is *more lenient* than JSqlParser. Consider this SQL:

```sql
SELECT 1 LIMIT
```

JSqlParser (Macaw) says: "Syntax error."

SQLGlot says: "Oh, you probably meant `SELECT 1 AS LIMIT`" and happily parses it.

This isn't a bug in SQLGlot. It's a design choice for error recovery. But it created headaches for our test suite, which had queries in a "gray area" that one parser understood and the other didn't.

We had to update test queries to be unambiguously invalid from both parsers' perspectives. The deeper issue is philosophical: for some use cases (like table-level permissions), we want *strict* parsing. Ambiguous queries should fail, not be silently reinterpreted.

This led to discussions about adding "coercion detection": comparing the original SQL to SQLGlot's regenerated version.

```python
def detect_coercion(sql, dialect):
    """Detect if sqlglot added/removed tokens."""
    ast = sqlglot.parse_one(sql, dialect=dialect)
    regenerated = ast.sql(dialect=dialect)

    orig_tokens = get_tokens(sql)
    regen_tokens = get_tokens(regenerated)

    return orig_tokens != regen_tokens
```

If the token streams differ, something was inferred or corrected, and we might want to treat that as an error.

---

## A Unified API

One nice side effect: the API got cleaner. The old pattern scattered AST access across call sites:

```clojure
;; Before: verbose, leaky abstraction
(-> query
    macaw/parsed-query
    macaw/ast
    (macaw/field-references driver schema))
```

Now it's a single function call:

```clojure
;; After: clean and simple
(sql-tools/referenced-fields driver query)
```

The `sql-tools` module handles backend selection, error handling, and timeout management internally. Callers don't need to know if they're talking to Python or Java.

---

## Testing Both Backends

To ensure compatibility, we run tests against both backends:

```clojure
(defmacro test-parser-backends
  "Run body against both parser backends."
  [& body]
  `(doseq [backend# (parser-backends-to-test)]
     (t/testing (colorize/magenta (name backend#))
       (binding [sql-tools.settings/*parser-backend-override* backend#]
         ~@body))))
```

This catches divergences early. If Macaw and SQLGlot produce different results for the same query, we find out in CI rather than production.

---

## What's Next

SQLGlot opens up possibilities:
- Better dialect support for data warehouse customers
- More sophisticated query analysis
- Eventually, query transformation and optimization

The swappable backend architecture means we can experiment freely. If we find edge cases where SQLGlot misbehaves, Macaw is always there as a fallback.

Sometimes the best way to improve a system is to make it easier to swap out the pieces.

---

*The full PR is at [github.com/metabase/metabase/pull/68911](https://github.com/metabase/metabase/pull/68911) if you want to see all the details.*
