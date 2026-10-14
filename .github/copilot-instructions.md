# Copilot instructions — Gburg Village

Read `PROGRESS.md` (one screen) and `docs/DEVELOPMENT.md` before coding. Git history and current files are authoritative; do not rely on prior chat summaries. `V4_PLAN.md` is the original vision/milestone document — useful for intent, stale for state.

Project: family/neighborhood top-down HTML Canvas adventure (vanilla JS, no build step), Final Fantasy IV–VI-style presentation, Zelda-style real-time exploration/combat. Every human character should eventually be playable. The user generates sprites, portraits and backgrounds in ChatGPT; Copilot does all integration and code.

## Where work happens
- **`v8/` is the only living version.** All features, fixes, art integration and tests go there (or in root `tools/`, `docs/`, `package.json`).
- **Repo root (V1), `v2/` … `v7/` are frozen.** Never edit, rename, delete, or add files under them. `npm run check:archive` must pass. Their URLs must keep working.
- Do **not** create a new `vN/` folder for a feature. Releases are git tags + a line in PROGRESS.md.
- `art inbox/` is git-ignored user art. Read from it; never commit originals or modify them.

## Workflow
1. Branch from `main`. Keep edits small and reviewable; avoid giant rewrites, mass asset copies and large code/base64 dumps in chat.
2. Run `npm run test:quick` while iterating; `npm run predeploy` before merging. Use `npm run browser -- --suites=… --layouts=…` to narrow.
3. Fast-forward merge to `main`, push (GitHub Pages deploys `main`), then `npm run test:hosted`. The user has pre-authorized deploying tested V8 changes without asking each time. Pause and ask only if a change could affect frozen versions or shared site configuration.
4. Record outcome in PROGRESS.md in 1–3 lines. Report: what changed, URL/status, actual verification evidence, next action. Chromium touch emulation is **not** physical iPhone verification; say so.

## Conventions
- Menus and controls must work on desktop keyboard/mouse and iPhone touch; keep real-time gameplay outside menus.
- Character sheets: 64×64 cells, 4 walk frames, rows down/left/right/up, foot (32,60). Portraits: 128×128 transparent PNG. Use obvious placeholders and stable IDs when art is missing.
- **All art goes through the manifest.** Files live in `v8/assets/`, are declared in `v8/data/art.json`, and are referenced in code only via `V8_ART.url('<category>.<name>[.<variant>]')`. Never hard-code image paths or `?v=` cache-busters. Import inbox art with `node tools/import-art.cjs sprite|portrait|scene <id>` (see `docs/DEVELOPMENT.md`); for hand-placed files run `npm run art:build`. Commit the regenerated `v8/src/art.js`.
- **Music goes through `v8/data/music.json`** (hero themes, place playlists) and `v8/src/music.js`; import tracks with `node tools/music.cjs import`, then `npm run music:build`. Ship MP3 only. Keep the original synthesized themes available.
- Scenes are data-driven (`v8/src/areas.js` definitions + `v8/tools/process-areas.cjs`). Prefer adding data over adding code paths. No Tiled or tilemap pipeline unless the user explicitly asks.
- Pathing/collision fixes: prefer `npm run studio` (writes `v8/data/scene-geometry.json`, applied by `v8/src/scene-geometry.js`) over editing shape numbers in `scenes.js`/`hawaii.js`. A scene with an override is fully data-driven; keep `npm run geometry:check` green. No new frameworks.
- Follow the roadmap order in `docs/DEVELOPMENT.md` unless the user redirects.
