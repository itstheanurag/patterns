# System Design Patterns

Personal learning repo for **system design / distributed systems** patterns.
Classic OOP (Gang of Four) patterns live separately under [`oop/`](./oop/).

## How to study

1. Start with [`must-know.md`](./must-know.md) — ~25 high-leverage topics.
2. Open the linked note under `patterns/<category>/`.
3. Fill sections in order: **Problem → When to use → Trade-offs → Interview points**.
4. Check off progress in [`PROGRESS.md`](./PROGRESS.md).
5. Add demos only after the mental model is clear.

## New pattern

```bash
cp templates/pattern.md patterns/<category>/<kebab-name>.md
# edit frontmatter + title, then add a line in PROGRESS.md
```

## Layout

```text
templates/pattern.md     # copy this for every note
must-know.md             # curated shortlist (links only)
PROGRESS.md              # checklists by category
patterns/                # one markdown file per pattern
  api/
  caching/
  concurrency/
  ...
implementations/         # optional TypeScript demos per pattern
  backoff/               # retry with backoff — npm run demo:backoff
oop/                     # optional GoF / classic design patterns
```

## Status legend

| Field    | Values                                      |
| -------- | ------------------------------------------- |
| priority | `must-know` · `important` · `deep-dive`     |
| status   | `not-started` · `learning` · `solid` · `taught` |

## Goal

Solid notes on **~25 must-know** patterns first, then expand each category.
Completeness is not the goal — clarity and trade-offs are.
