# botera Curriculum (auto-imported)

This directory is the **source of truth** for the learning platform. Every
lesson here is imported automatically into the CMS — there is **no manual
upload step**. Add or edit a markdown file, redeploy, and it appears on the
site.

## How it works

1. Lessons live at `content/curriculum/<track-slug>/<NNN>-<lesson-slug>.md`.
2. Each file has a YAML front-matter header (see the template below) and a
   markdown body.
3. `scripts/import-content.mjs` reads every lesson and **upserts** it into the
   SQLite `tutorials` table. It is:
   - **Idempotent** — a content hash means unchanged lessons are skipped.
   - **Non-destructive** — it only touches lessons it created itself (tracked
     in the `imported_content` table), so hand-written admin tutorials are
     never modified or deleted.
4. The importer runs automatically on container start (before `node server.js`)
   and can be run manually:
   ```bash
   npm run content:import           # sync
   npm run content:import -- --prune  # also remove lessons whose file was deleted
   # inside the container:
   docker compose exec web node scripts/import-content.mjs
   ```

The taxonomy (tracks, levels, target certifications) is described in
`curriculum.json`.

## Lesson front-matter template

```markdown
---
title: "Track Name — Lesson Title"
slug: "track-lesson-slug"          # stable, unique, kebab-case
track: "linux-fundamentals"        # matches a track slug in curriculum.json
trackName: "Linux Fundamentals"
module: "First Steps"
order: 101                          # ordering within the track
level: "Beginner"                   # Beginner | Intermediate | Advanced | Senior | Expert
difficulty: "Beginner"             # same vocabulary; drives the difficulty badge
distribution: "Ubuntu"             # Ubuntu | Debian | ... | Windows | Cross-platform | General Linux
category: "Linux Fundamentals"     # CMS category (created on demand)
tags: [linux, cli, beginner]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 60
status: "published"                 # published | draft
summary: "One-paragraph summary shown on cards and in search/SEO."
seoTitle: "≤70 chars"
seoDescription: "≤200 chars"
---

# Lesson body in markdown...
```

## Required lesson structure (quality bar)

Every lesson **must** contain these sections (enforced by
`tests/unit/curriculum-content.test.ts`, so shallow filler fails CI):

- An intro that states what the lesson covers and why it matters.
- `## Learning objectives`
- Concept explanation with **practical examples**.
- `## Hands-on lab` — step-by-step commands the learner runs.
- `## Exercises` — tasks to do unaided.
- `## Troubleshooting` — a break/fix drill.
- `## Assessment` — questions/tasks **and an explicit passing requirement**.
- `## Solutions & validation` — answers and how to verify success.

Keep commands correct, safe, and idiomatic. Mark anything destructive clearly;
the renderer also flags dangerous commands automatically.
