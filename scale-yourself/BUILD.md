# How this report was built

**Scale Yourself** — Justin Rhinesmith · Boon · window Jul 2025 – Jul 2026 · generated 2026-07-20.

This report was generated on my own machine with a privacy-first pipeline. The goal was a
report that is both honest and *provably* free of sensitive information — no private code,
docs, messages, PR/commit/ticket text, branch names, internal codenames, or local paths.

## The pipeline

```
raw sources ──► single-purpose extractors ──► aggregate parts ──► data.json ──► validator ──► report
   (local)         (read raw, emit counts)      (counts only)    (the only         (fails    (reads only
                                                                  report input)     on leak)   data.json)
```

1. **Extractors** (one per source) read raw local data but emit **only** numeric aggregates
   and bucketed labels — never free text.
2. **`data.json`** is the single input to the report. It contains only numbers, month
   strings (`YYYY-MM`), and a fixed set of human-reviewed labels.
3. **A strict schema validator** (`schema.py`) refuses to pass anything that isn't a number,
   a month, or a label present in `labels.allowlist.json`. Arbitrary strings of any length
   fail by construction — this is the safety gate, not just discipline.
4. The report HTML/JS reads `data.json` (inlined as `data.js`) and nothing else. It makes
   **no network calls** at render time; Chart.js is vendored locally.

## Data sources

| Source | What it produced | Safety handling |
|---|---|---|
| **GitHub** (`gh` CLI) | PRs opened/merged, reviews given, PRs by area, median PR size — per month | Field-selected counts only (additions/deletions/changedFiles); no titles/bodies/branches. Private repo names → functional buckets. |
| **Claude Code transcripts** | Sessions, messages, tool calls, model mix, skills & subagents | Streamed line-by-line; structured fields only; tool/skill names allowlisted; **recent 90-day snapshot** (transcripts rotate). |
| **Prompt history** (`history.jsonl`) | Prompts per month & per workspace — full year | Only `timestamp` + `project` read; prompt text never touched; paths → buckets. |
| **Authored tooling** (git repos) | Plugins/skills I originated, by category & month; team-adoption counts | Attribution by git first-commit author; only counts + allowlisted plugin names emitted. |
| **Linear** | Issues completed per month | Read-only; only `completedAt` pulled; no titles/projects. |
| **Personal public repos** | Curiosity/side-project signals | Public repos only; one-liners hand-written & allowlisted (not auto-pulled). |

## Honesty notes

- **Attribution is conservative.** Tooling credit is by git first-commit author, so I claim
  only what I originated (18 of 27 plugins; 1 of 23 skills). My teammates' work is theirs.
- **The May prompt spike is mostly experimentation, not typing.** ~74% of May's prompts come
  from experimenting with [Gastown](https://github.com/gastownhall/gastown), an open-source
  multi-agent workspace manager (agents looping on their own) — not a tool I built, and not
  hand-typing. My interactive prompting that month stayed steady (~4k). The workspace breakdown
  makes this explicit and the chart highlights it.
- **Agent session telemetry is a 90-day snapshot**, labeled as such; local transcripts only
  retain the recent window. Prompt cadence and GitHub cover the full year.
- **PR and prompt counts are heavily agent-assisted** — that's the point of the report, not a
  claim of hand-written volume. To keep the volume honest, the report also shows **median PR
  size** (lines and files changed), so high PR counts can't be mistaken for one-line churn.
- **The report names its own blind spots.** A "What this report can't show" panel states plainly
  that these are leverage/activity signals, and that outcomes, quality, real adoption depth, and
  judgment belong in a conversation — not a self-generated dashboard.

## Intentionally excluded

- **No message, code, prompt, PR, or ticket text** — not a single free-text field reaches the
  report.
- **No work-hour or time-of-day analysis** — cadence is measured by month only, deliberately.
- **A Slite "docs authored" metric was attempted and dropped** — no API path gave a safe,
  self-attributable count without reading sensitive doc titles, so it was excluded rather
  than shipped inaccurately.
- **Raw extraction artifacts** (repo/workspace bucket maps, scratch data) stay local and are
  not part of this package.

## Package contents

- `index.html`, `style.css`, `app.js`, `charts.js` — the report
- `data.js` — the validated aggregates (generated from `data.json`, no hand edits)
- `data.json` — the same aggregates, for inspection
- `labels.allowlist.json` — every human-readable label permitted in the data (audit aid)
- `vendor/chart.umd.min.js` — Chart.js, vendored for offline rendering
- `BUILD.md` — this file

Open `index.html` in any browser. No server or network required.
