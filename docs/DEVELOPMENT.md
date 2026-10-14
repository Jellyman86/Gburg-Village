# Development guide

How the repository is organized, how to verify changes, and the agreed roadmap for making routine changes fast.

## Versions and the freeze policy

| Folder | Status | URL |
|---|---|---|
| repo root (`index.html`, `src/`, `assets/`) | V1 â€” **frozen** | https://jellyman86.github.io/Gburg-Village/ |
| `v2/` â€¦ `v7/` | **frozen** archives | `â€¦/Gburg-Village/vN/` |
| `v8/` | **living version** â€” all new work goes here | https://jellyman86.github.io/Gburg-Village/v8/ |

- Frozen folders must stay byte-identical to the `archive/v1-v7` git tag. `npm run check:archive` fails if anything under them changed or was added. Never edit, rename, delete or copy-forward files there.
- The living version may still *reference* frozen art (`../v4/assets/...`) until the asset consolidation step below replaces those references with `v8/assets/` copies.
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
| `npm run test:full` | Logic changes to movement, scenes, combat, menu, input | ~5â€“8 min |
| `npm run predeploy` | Before merging to `main` (archive check + full suite) | ~5â€“8 min |
| `npm run test:hosted` | After GitHub Pages deploys, to confirm the live site | ~5â€“8 min |
| `npm run browser -- --suites=hawaii --layouts=390x844` | Narrow a browser run while iterating | varies |
| `npm run contracts` / `npm run syntax` | Fast pure-Node checks, no browser | <1 s |
| `npm run check:archive` | Confirm V1â€“V7 are untouched | <1 s |
| `npm run art:check` | Confirm imported area art matches recorded hashes (needs inbox) | ~5 s |
| `npm run serve` | Read-only local preview at http://127.0.0.1:5180/v8/ | â€” |

Environment knobs honored by the suites: `V8_TEST_SUITES`, `V8_TEST_LAYOUTS`, `V8_TEST_ORIGIN`, `V8_ARTIFACT_DIR` (writes screenshots to an existing directory).

## Branch, merge and deploy

1. Branch from `main` (`git switch -c feature-name`).
2. Work in `v8/` (or root tooling/docs). Run `npm run test:quick` while iterating.
3. `npm run predeploy` before merging. Fast-forward merge into `main` and push; GitHub Pages deploys `main` automatically.
4. When the Pages run succeeds, `npm run test:hosted`. Record the commit and URL in PROGRESS.md in one or two lines.
5. Delete the merged branch.

Verification claims must say what was actually tested. Chromium touch emulation is not a physical iPhone.

## Art workflow (today)

1. Export from ChatGPT into `art inbox/` using a clear name (`Jeff Sprites.png`, `Scene - Paris.png`, `Kate Portrait.png`).
2. Sprite sheets: 64Ã—64 cells, 4 columns of walk frames, rows down/left/right/up, foot anchor (32,60), transparent background. Portraits: 128Ã—128 transparent PNG. Scene backgrounds: one image per room; note its pixel size.
3. Scenes: add a definition modeled on [v8/src/hawaii.js](../v8/src/hawaii.js), register it in [v8/index.html](../v8/index.html) with `V8_AREAS.install`, run `node v8/tools/process-areas.cjs` to validate/optimize/hash, then `npm run test:quick`.
4. Characters and other sprites currently require editing the path in the relevant data file ([characters.js](../v8/src/characters.js), [action-art.js](../v8/src/action-art.js), [rpg.js](../v8/src/rpg.js), dinosaur list in `game.js`) and bumping its `?v=` cache-buster. The roadmap below removes this step.

## Roadmap (agreed 2026-10-14)

1. âœ… **Freeze policy, Node/npm, task runner, tiered tests, archive check, docs reset** (this step).
2. **Asset manifest + consolidation.** Copy every frozen-folder asset V8 uses into `v8/assets/` once; declare all art in one manifest (id â†’ path, frame size, rows, foot anchor, hash); replace ad-hoc `?v=` with manifest hashes. Result: no cross-version references.
3. **Generalized importer** (`tools/import-art.cjs sprite|portrait|scene <id>`): validates grid/size/alpha, writes optimized output, updates the manifest, emits a contact-sheet preview. Plus `docs/ART-SPEC.md` to paste into ChatGPT.
4. **Unified scene geometry + `?debug=paths` overlay**: migrate Kentlands scenes to the `areas.js` definition format; draw walkable/blocked/exit shapes in-game and click to copy polygon points.
5. **Format-only pass** on `v8/` (Prettier), then extract asset loading and music from `game.js` into `assets.js` / `music.js`.
6. **Music manifest**: convert MIDI â†’ OGG/M4A, declare tracks in `music.json`, hook into the existing scene/flight/cinematic mode selector; optional per-character themes and a Menu music picker.

Not planned: Tiled or a tilemap pipeline, a framework, or a rewrite.
