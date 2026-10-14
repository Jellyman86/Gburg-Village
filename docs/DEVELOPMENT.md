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
| `node tools/import-art.cjs …` | Import sprites/portraits/scenes from the art inbox (see Art workflow) | ~5 s |
| `npm run art:provenance` | Confirm imported files still match their inbox originals (skips if no inbox) | <1 s |
| `node tools/music.cjs import` / `npm run music:build` | Convert tracks from `Music/`; sync `music.json` → `music-data.js` (see Music workflow) | ~10 s |
| `npm run serve` | Read-only local preview at http://127.0.0.1:5180/v8/ | — |

Environment knobs honored by the suites: `V8_TEST_SUITES`, `V8_TEST_LAYOUTS`, `V8_TEST_ORIGIN`, `V8_ARTIFACT_DIR` (writes screenshots to an existing directory).

## Music workflow

Tracks are MP3 files in `v8/assets/music/`, declared in [v8/data/music.json](../v8/data/music.json) and played by [v8/src/music.js](../v8/src/music.js). The original synthesized themes stay built in as `synth:<place>` tracks ("Original · Village theme" etc.) and play wherever nothing else is assigned.

```powershell
node tools/music.cjs import          # convert new/changed files from Music/ (m4a, wav, …) to v8/assets/music/*.mp3 via FFmpeg
node tools/music.cjs build           # after editing music.json: validate, sync hashes, regenerate v8/src/music-data.js
node tools/music.cjs check           # part of test:quick
```

`music.json` is the single source of truth and is meant to be hand-edited:

```json
"characters": { "coco": "golden", "stephanie": "uptown-girl" },     // theme that plays while that hero is active
"characterPlaces": ["village", "world", "nyc"],                     // places where hero themes play by default
"places": { "jet": ["avicii-levels"], "hawaii": [], "village": [] }  // ordered playlists; several tracks rotate, one loops, none = original theme
```

Places: `village`, `world`, `jet`, `hawaii`, `nyc` (exploration) and `battle`, `cafe`, `omen` (cutscenes). Track ids come from the file name (`Uptown_Girl_SNES_Game.m4a` → `uptown-girl`); edit `title` in the JSON if you want a different display name. Dropping a new file in `Music/` and running `import` adds it; it becomes selectable immediately and assignable in the JSON.

In the game, **Menu → Options** shows what's playing and offers a three-way music mode — **Off**, **On** (place playlists only) or **Themed** (the active hero's theme where allowed) — plus volume, a pick per place (character theme / rotate playlist / a specific track / an original theme) and an override for each hero's theme. Those choices are saved on the device; the JSON stays the shipped default. The volume slider follows a perceptual curve (gain = 0.8 × position^2.5) so the low end is genuinely quiet next to the sound effects; the default position is 50 %.

Audio notes: `.m4a` (AAC) does not decode in the open-source Chromium the tests use and OGG does not play on iPhone, so everything ships as MP3 (128 kbps; ~3 MB per track). `Music/` is git-ignored like the art inbox — keep your originals there.

## Branch, merge and deploy

1. Branch from `main` (`git switch -c feature-name`).
2. Work in `v8/` (or root tooling/docs). Run `npm run test:quick` while iterating.
3. `npm run predeploy` before merging. Fast-forward merge into `main` and push; GitHub Pages deploys `main` automatically.
4. When the Pages run succeeds, `npm run test:hosted`. Record the commit and URL in PROGRESS.md in one or two lines.
5. Delete the merged branch.

Verification claims must say what was actually tested. Chromium touch emulation is not a physical iPhone.

## Art workflow (today)

All art is addressed by a stable **art id** (`character.jeff.walk`, `portrait.kate`, `dinosaur.compy`, `scene.north-market`, `world.plane`, …). Code never hard-codes a file path; it calls `V8_ART.url('character.jeff.walk')`, which returns `assets/characters/jeff.png?v=<hash>` from the generated [v8/src/art.js](../v8/src/art.js). The hash changes whenever the file changes, so cache-busting is automatic.

**Import from the ChatGPT inbox (preferred)**

ChatGPT exports are large and loosely arranged (e.g. a 724×2172 sheet with rows of six drawings, 1254×1254 portraits). [tools/import-art.cjs](../tools/import-art.cjs) detects the drawings on the transparent background, scales them into the game grid, writes the asset and the manifest entry (with inbox file + hash), and saves previews under `test-artifacts/import/`. [docs/ART-SPEC.md](ART-SPEC.md) is the brief to paste into ChatGPT so exports arrive in the expected arrangement and file names.

```powershell
node tools/import-art.cjs sprite jeff                    # "Jeff Sprites.png" → characters/jeff.png (walk6 layout)
node tools/import-art.cjs sprite jeff --pose surprised --layout "0:0-2"
node tools/import-art.cjs portrait kate                  # "Kate Portrait.png" → portraits/kate.png (128×128)
node tools/import-art.cjs scene paris                    # "Scene - Paris.png" → scenes/paris.webp
node tools/import-art.cjs cells --from "Compy Sprites.png"   # just detect and preview numbered cells
node tools/import-art.cjs check                          # imported files still match their inbox originals
```

Replacing an existing asset keeps its file name and refuses size changes unless `--allow-resize` is given (frame grids and collision data depend on size). Open `test-artifacts/import/<id>-sheet.png` to eyeball the result, then `npm run test:quick`. `npm run art:import -- …` works too, but names containing spaces must go through `node tools/import-art.cjs` directly because npm splits them.

**Replace a file by hand**
1. Copy the finished image over the existing file in `v8/assets/…` (same pixel size).
2. `npm run art:build` — updates the hash and dimensions and regenerates `src/art.js`.
3. `npm run test:quick`, look at the game, commit.

**Add a new character**
1. `node tools/import-art.cjs sprite <id>` and `node tools/import-art.cjs portrait <id>` (creates `character.<id>.walk` and `portrait.<id>`).
2. Add the id to the roster list in [characters.js](../v8/src/characters.js). Action poses go in [action-art.js](../v8/src/action-art.js) as `character.<id>.<pose>` entries.

**Add a new scene**
1. `node tools/import-art.cjs scene <id>` (creates `scene.<id>`; add `--width 724` to downscale an interior).
2. Add a definition modeled on [v8/src/hawaii.js](../v8/src/hawaii.js) with `art: 'scene.<id>'` (spawn, walkable polygons/rectangles, obstacles, exits, interactions, enemies) and register it in [v8/index.html](../v8/index.html) with `V8_AREAS.install`. Kentlands interiors use the `interior()` helper in [scenes.js](../v8/src/scenes.js).
3. `npm run test:quick` validates geometry/connectivity and that the authored size matches the image; trace paths against the artwork and inspect screenshots.

Game contracts: sprite cells 64×64 (128 for large dinosaurs), transparent background, foot anchor at y=60, walk sheets 4 frames per row in down/left/right/up order with walking rows four below idle rows. Portraits 128×128 transparent PNG. Scenes any size, stored as WebP.

## Roadmap (agreed 2026-10-14)

1. ✅ **Freeze policy, Node/npm, task runner, tiered tests, archive check, docs reset** (this step).
2. ✅ **Asset manifest + consolidation.** 137 files V8 loaded from V1–V7 now live in `v8/assets/`; all 141 images are declared in `v8/data/art.json` and resolved through `V8_ART.url(id)` with hash-based cache-busting. No cross-version references remain.
3. ✅ **Generalized importer** — `tools/import-art.cjs sprite|portrait|scene|image|cells|check`: detects drawings on ChatGPT's transparent exports, maps them into the game grid via layout presets (`walk6`, `walk4`, `walk8`) or an explicit row spec, writes assets + manifest entries with inbox provenance, and saves numbered previews. `docs/ART-SPEC.md` is the paste-ready ChatGPT brief. Replaces `v8/tools/process-areas.cjs`.
4. **Unified scene geometry + visual collision editor**: a small in-browser tool (`npm run studio`) that overlays walkable/blocked/exit shapes on the real background, lets you drag/resize/add shapes and copies the definition back out; migrate Kentlands scenes to the `areas.js` definition format.
5. **Format-only pass** on `v8/` (Prettier), then extract asset loading from `game.js` into `assets.js` (music is already in `music.js`).
6. ✅ **Music manifest** — MP3 tracks + `data/music.json` (hero themes, place playlists), `tools/music.cjs import|build|check`, `src/music.js` director (one `<audio>` element, synth originals retained), Menu → Options with pickers. Music moved out of `game.js`.

Not planned: Tiled or a tilemap pipeline, a framework, or a rewrite.
