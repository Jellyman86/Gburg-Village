# Development guide

How the repository is organized, how to verify changes, and the agreed roadmap for making routine changes fast.

## Versions and the freeze policy

| Folder | Status | URL |
|---|---|---|
| repo root (`index.html`, `src/`, `assets/`) | V1 — **frozen** | https://jellyman86.github.io/Gburg-Village/ |
| `v2/` … `v7/` | **frozen** archives | `…/Gburg-Village/vN/` |
| `v8/` | **living version** — all new work goes here | https://jellyman86.github.io/Gburg-Village/v8/ |

- Frozen folders must stay byte-identical to the `archive/v1-v7` git tag. `npm run check:archive` fails if anything under them changed or was added. Never edit, rename, delete or copy-forward files there.
- The living version is self-contained: every image it loads lives under `v8/assets/` and is declared in [v8/data/art.json](../v8/data/art.json). There are no `../v4/...` style references any more; `npm run art:check` (part of `test:quick`) enforces that every declared file exists with the recorded hash and dimensions, and that nothing sits in `v8/assets/` undeclared.
- New features and content do **not** get a new `vN/` folder. Ship them in `v8/`, tag releases (`git tag v8.1`), and summarize in [PROGRESS.md](../PROGRESS.md).
- `art inbox/` holds raw ChatGPT exports. It is git-ignored (hundreds of MB). Import art with the tools; never commit originals.

## Setup

Node.js 20+ (LTS). Then:

```powershell
npm install            # installs Playwright 1.63 (no browser download needed)
npm run env            # shows which Node/Playwright/Chromium the tasks will use
```

The task runner ([tools/tasks.cjs](../tools/tasks.cjs)) auto-detects a browser: Playwright's own Chromium if downloaded, otherwise the cached `ms-playwright` build, then system Chrome/Edge. Override with `BROWSER_PATH` or `PLAYWRIGHT_CORE` env vars. `npx playwright install chromium` is optional.

## Commands

| Command | Use it when | Time |
|---|---|---|
| `npm run test:quick` | Any routine change: art swap, text, data, small logic | ~30 s |
| `npm run test:full` | Logic changes to movement, scenes, combat, menu, input | ~5–8 min |
| `npm run predeploy` | Before merging to `main` (archive check + full suite) | ~5–8 min |
| `npm run test:hosted` | After GitHub Pages deploys, to confirm the live site | ~5–8 min |
| `npm run browser -- --suites=hawaii --layouts=390x844` | Narrow a browser run while iterating | varies |
| `npm run contracts` / `npm run syntax` | Fast pure-Node checks, no browser | <1 s |
| `npm run check:archive` | Confirm V1–V7 are untouched | <1 s |
| `npm run art:build` | After adding/replacing a file in `v8/assets/`: refresh hashes/sizes in `art.json`, regenerate `src/art.js` | <1 s |
| `npm run art:check` | Verify the manifest matches disk (runs inside `test:quick`) | <1 s |
| `npm run areas:check` | Confirm imported Hawaii backgrounds match their inbox originals (needs inbox) | ~5 s |
| `npm run serve` | Read-only local preview at http://127.0.0.1:5180/v8/ | — |

Environment knobs honored by the suites: `V8_TEST_SUITES`, `V8_TEST_LAYOUTS`, `V8_TEST_ORIGIN`, `V8_ARTIFACT_DIR` (writes screenshots to an existing directory).

## Branch, merge and deploy

1. Branch from `main` (`git switch -c feature-name`).
2. Work in `v8/` (or root tooling/docs). Run `npm run test:quick` while iterating.
3. `npm run predeploy` before merging. Fast-forward merge into `main` and push; GitHub Pages deploys `main` automatically.
4. When the Pages run succeeds, `npm run test:hosted`. Record the commit and URL in PROGRESS.md in one or two lines.
5. Delete the merged branch.

Verification claims must say what was actually tested. Chromium touch emulation is not a physical iPhone.

## Art workflow (today)

All art is addressed by a stable **art id** (`character.jeff.walk`, `portrait.kate`, `dinosaur.compy`, `scene.north-market`, `world.plane`, …). Code never hard-codes a file path; it calls `V8_ART.url('character.jeff.walk')`, which returns `assets/characters/jeff.png?v=<hash>` from the generated [v8/src/art.js](../v8/src/art.js). The hash changes whenever the file changes, so cache-busting is automatic.

**Replace an existing sprite, portrait or background**
1. Export from ChatGPT into `art inbox/`. Keep the same pixel dimensions as the current file (`art.json` records them).
2. Copy it over the existing file in `v8/assets/…` (for example `v8/assets/characters/jeff.png`).
3. `npm run art:build` — updates the hash and dimensions and regenerates `src/art.js`. If the size changed, the output says so; check the frame grid still matches the character definition.
4. `npm run test:quick`, look at the game, commit.

**Add a new character**
1. Drop `v8/assets/characters/<id>.png` (64×64 cells, 4 walk frames per row, rows down/left/right/up; later recruits put walking rows four below idle rows) and `v8/assets/portraits/<id>.png` (128×128).
2. Add `character.<id>.walk` and `portrait.<id>` entries to `art.json` with just the `file` field; `npm run art:build` fills the rest.
3. Add the id to the roster list in [characters.js](../v8/src/characters.js). Action poses go in [action-art.js](../v8/src/action-art.js) as `character.<id>.<pose>` entries.

**Add a new scene**
1. Drop the background in `v8/assets/scenes/`, declare it as `scene.<id>` in `art.json`, `npm run art:build`.
2. Add a definition modeled on [v8/src/hawaii.js](../v8/src/hawaii.js) (spawn, walkable polygons/rectangles, obstacles, exits, interactions, enemies) and register it in [v8/index.html](../v8/index.html) with `V8_AREAS.install`. Kentlands interiors use the `interior()` helper in [scenes.js](../v8/src/scenes.js).
3. `npm run test:quick` validates geometry/connectivity; trace paths against the artwork and inspect screenshots.

Sprite sheets: 64×64 cells, transparent background, foot anchor (32, 60). Portraits: 128×128 transparent PNG. Scenes: one image per room, any size; large PNGs are better stored as WebP (the roadmap importer will do this automatically).

## Roadmap (agreed 2026-10-14)

1. ✅ **Freeze policy, Node/npm, task runner, tiered tests, archive check, docs reset** (this step).
2. ✅ **Asset manifest + consolidation.** 137 files V8 loaded from V1–V7 now live in `v8/assets/`; all 141 images are declared in `v8/data/art.json` and resolved through `V8_ART.url(id)` with hash-based cache-busting. No cross-version references remain.
3. **Generalized importer** (`tools/import-art.cjs sprite|portrait|scene <id>`): reads from `art inbox/`, validates grid/size/alpha, converts large scenes to WebP, writes the asset and the manifest entry (with inbox provenance), emits a contact-sheet preview. Folds in `v8/tools/process-areas.cjs`. Plus `docs/ART-SPEC.md` to paste into ChatGPT.
4. **Unified scene geometry + `?debug=paths` overlay**: migrate Kentlands scenes to the `areas.js` definition format; draw walkable/blocked/exit shapes in-game and click to copy polygon points.
5. **Format-only pass** on `v8/` (Prettier), then extract asset loading and music from `game.js` into `assets.js` / `music.js`.
6. **Music manifest**: convert MIDI → OGG/M4A, declare tracks in `music.json`, hook into the existing scene/flight/cinematic mode selector; optional per-character themes and a Menu music picker.

Not planned: Tiled or a tilemap pipeline, a framework, or a rewrite.
