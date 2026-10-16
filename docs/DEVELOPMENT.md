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
| `npm run studio` | Gburg Studio (World collision editor, Sprite Workshop) + game preview on localhost (see Gburg Studio) | — |
| `npm run geometry:check` | Validate `scene-geometry.json` against the live scenes (runs inside `test:quick`) | <1 s |
| `npm run sprites:build` / `sprites:check` | After editing `v8/data/sprites.json` (roster, walk quirks, pose clips): validate against the art manifest and regenerate `sprites-data.js` | <1 s |
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

Places: `village`, `world`, `jet`, `hawaii`, `nyc`, `paris`, `egypt`, `italy`, `philippines`, `japan` (exploration; places without a playlist fall back to Village/Hawaii) and `montage`, `battle`, `cafe`, `omen` (cutscenes). Track ids come from the file name (`Uptown_Girl_SNES_Game.m4a` → `uptown-girl`); edit `title` in the JSON if you want a different display name. Dropping a new file in `Music/` and running `import` adds it; it becomes selectable immediately and assignable in the JSON.

In the game, music is always on (it starts with the first tap or key, as browsers require). The ♫ **bubble** on the stage flips between **Default** (place playlists) and **Theme** (the active hero's theme where allowed); recruitment cutscenes always play the new friend's theme and then return to the player's choice, and the invasion montage has its own `montage` place (an original synthesized dramatic theme, `Original · Montage theme`, unless you assign a track). **Menu → Options** shows what's playing and offers the same mode (plus Off), a music-only volume slider, a pick per place (character theme / rotate playlist / a specific track / an original theme) and an override for each hero's theme. Those choices are saved on the device; the JSON stays the shipped default (place music). The slider follows a perceptual curve (gain = 0.8 × position^2.5), default 50 %. MP3 playback is routed through the same Web Audio gain node as the original themes because iOS ignores `HTMLMediaElement.volume`.

Loudness: `import` normalizes every track to −16 LUFS / −1.5 dBTP with FFmpeg `loudnorm` (pass `--no-normalize` to skip), so MIDI renders that differ by 20 dB land at the same level. If one still sticks out, add `"gain": 0.8` (0.1–2) to its entry in `music.json`. To cut dead air off the start of a track (for example a silent intro), run `node tools/music.cjs import --trim roses=1.58`; the seconds are remembered as `"trimStart"` so re-imports keep the trim. The original in `Music/` is never modified.

Audio notes: `.m4a` (AAC) does not decode in the open-source Chromium the tests use and OGG does not play on iPhone, so everything ships as MP3 (128 kbps; ~3 MB per track). `Music/` is git-ignored like the art inbox — keep your originals there.

## Gburg Studio

```powershell
npm run studio        # http://127.0.0.1:5181/v8/studio/   (game preview at http://127.0.0.1:5181/v8/)
# or double-click 'Start Studio.cmd' in the repo folder — it starts the server and opens the page
```

Gburg Studio is the visual tool for everything that is data in `v8/data/`. It is one local server ([tools/studio-server.cjs](../tools/studio-server.cjs)) plus one plain page per tab under `v8/studio/`, sharing [studio-common.js](../v8/studio/studio-common.js) (server connection, tab bar) and `studio.css`. No build step, no framework.

- **Server:** every editable document is registered in the server with its data file, a validator and a build step. `GET /api/studio` lists them; `GET/POST /api/doc/<name>` reads and saves one. Saves need the page's session token and the revision you loaded (a stale revision is refused with 409), are validated before anything is written, land atomically, and then regenerate the matching `v8/src/<name>-data.js`. Registered today: `geometry` (`scene-geometry.json`) and `sprites` (`sprites.json`). `GET /api/inbox` lists the ChatGPT inbox and `POST /api/asset` writes one PNG into `v8/assets/` and registers it in `art.json` (same token rules; replacing an asset keeps its file name and refuses a size change unless asked). Everything else is read-only static files.
- **Tabs:** **World** and **Sprites** are live (below). **Cinematics** (the V6 cutscene director, whose overrides V8 already reads from `scene-edits.json`) is planned and shows as an inactive tab until then.
- The pages are also published read-only (https://jellyman86.github.io/Gburg-Village/v8/studio/) as viewers; saving needs the local server.

### World tab (collision editor)

The World tab loads the game's own scene definitions and draws them over the real backgrounds: walkable shapes (green), blocked shapes (red), markers/exits (gold diamonds with their trigger radius), road strips (cyan arrows), bounds and spawn. Pick a scene from the dropdown, then:

- **Select / move** — click a shape, drag it, drag the white handles to resize (corners/edges, ellipse radii, polygon points, marker radius). Alt+click a polygon edge adds a point; Delete removes the selection; arrows nudge; Ctrl+Z / Ctrl+Y undo/redo. The right panel shows exact numbers you can type.
- **Drawing tools** — walkable/blocked rectangle, polygon (click points, Enter or click the first point to close), ellipse, marker (a new interaction spot with your own text), road strip (select an exit first; crossing the strip in its arrow direction triggers the exit).
- **Walk test** layer — samples the real `V8_AREAS.blocked` function and tints blocked ground red, so you see exactly what the game will do, including the "no walkable shapes = everything inside bounds" rule.
- **Save (Ctrl+S)** writes `v8/data/scene-geometry.json` and regenerates `v8/src/scene-geometry-data.js`; reload the game preview to walk it. Commit and push to publish. **Revert scene to code defaults** drops a scene's override.

How it fits the game: [v8/src/scene-geometry.js](../v8/src/scene-geometry.js) applies the override document right after scenes are installed (`V8_GEOMETRY.apply(SCENES)` in `index.html`). A scene without an entry keeps the geometry defined in `map.js` / `scenes.js` / `hawaii.js`; the first time you save a scene, its whole collision set is data-driven from then on. Landmarks merge by id, so exits, pickups and story markers keep their behaviour while you move them. `npm run geometry:check` (inside `test:quick`) validates the data against the live scenes, and the geometry contract test proves extract → apply round-trips every scene with identical collision results. No Tiled involved.

### Sprites tab (Sprite Workshop)

http://127.0.0.1:5181/v8/studio/sprites/ — import or replace a **walk sheet**, a **pose clip** or a **portrait** with no code edit. It runs the importer's own detection ([v8/studio/sheet-tools.js](../v8/studio/sheet-tools.js), shared with `tools/import-art.cjs`) in the browser.

1. **Target:** pick a character (or *New character…* and type an id), then Walk sheet / Pose (type the pose name) / Portrait. The right panel shows the current asset, and the character's speeds and walk-row quirks or the clip's frames/fps/loop from `sprites.json`.
2. **Source:** choose a file from the inbox list (provenance is recorded in `art.json`) or drop any image on the canvas. The detected drawings are numbered `band.cell` like the CLI preview; *Background* forces white keying on or off and *Min gap* splits drawings that touch.
3. **Layout:** a preset (`walk6` matches the ART-SPEC brief; `walk4`/`walk8` for other arrangements; one row for poses) fills the row specs. Edit a spec, or press **pick** on a row and click cells on the sheet (Shift+click extends the range); `!` mirrors a row; dx/dy nudge the drawings inside their cells. Cells used by each row are tinted in the row's colour.
4. **Result:** the composed sheet on the 64-px grid with the foot line, the current asset ghosted underneath (toggle), and an **In motion** preview that uses the game's `characterWalkPose` — so `walkRowOffset` and `mirrorLeft` look exactly as in play. Portraits preview at 128×128.
5. **Save (Ctrl+S)** writes the PNG into `v8/assets/`, updates `art.json`/`art.js`, then saves `sprites.json`: a walk sheet + portrait pair adds the character to the roster (with the panel's speeds), a pose adds or updates its clip, and editing the panel alone (speeds, fps, loop) saves just the data. Replacing an existing asset keeps its size (a hand-made 3-frame pose sheet stays 192 px wide); tick *Allow size change* to override. Reload the game preview to see it.

A character added this way plays immediately with average stats and no special power ([rpg.js](../v8/src/rpg.js) falls back to a default profile); recruitment scenes, a story location and a power are authored content and stay in code. Without the local server the page is a read-only previewer.

## Sprite data (`sprites.json`)

[v8/data/sprites.json](../v8/data/sprites.json) is the single source of truth for the playable roster and every sprite clip; [v8/src/characters.js](../v8/src/characters.js) builds the `CHARACTERS` and `V5_ACTION_ART` globals from the generated `src/sprites-data.js`, so **adding or replacing a sprite never needs a code edit**. Roster order in the game is the key order in the file.

```json
"characters": { "jaime": { "name": "Jaime", "walk": "character.jaime.walk", "portrait": "portrait.jaime",
                           "speed": 155, "runSpeed": 245, "walkFPS": 8, "runFPS": 12, "walkRowOffset": 4 } },
"poses":      { "jaime": { "skate": { "art": "character.jaime.skate", "frames": 3, "fps": 8 },
                           "hurt":  { "art": "character.jaime.hurt",  "frames": 3, "fps": 6, "loop": false } } }
```

Walk sheets follow one contract (64 px cells, 4 frames, rows down/left/right/up, foot at 32,60); `walkRowOffset: 4` means the walking frames sit four rows below the idle rows (every sheet made by the importer), `mirrorLeft: true` draws left-facing from the right-facing rows (Gary). Pose clips default to 64×64 frames, foot (32,60), looping; set `frameWidth`/`frameHeight`/`foot` for wide clips (Vito's wrestling, Gary's blaster) and `loop: false` for one-shots. `coco.emotions` is her two-row talk/surprised sheet. `windowHead` is the dinosaur that peers through the window in the opening.

```powershell
npm run sprites:build   # after editing sprites.json: validate against art.json (ids exist, frames fit the sheet) and regenerate src/sprites-data.js
npm run sprites:check   # part of test:quick; the sprite contract test also proves the generated globals honour the walk contract
```

`node tools/import-art.cjs sprite <id>` and `portrait <id>` register the character automatically once both assets exist; `sprite <id> --pose <pose>` registers the pose clip with the detected frame count at 6 fps (edit the JSON to tune). The studio server also accepts this document (`/api/doc/sprites`), which is what the upcoming Sprites tab will save through.

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
1. `node tools/import-art.cjs sprite <id>` and `node tools/import-art.cjs portrait <id>` (creates `character.<id>.walk` and `portrait.<id>`). Once both exist the character is registered in [sprites.json](../v8/data/sprites.json) with default speeds and appears in the roster — no code edit. Action poses: `sprite <id> --pose surprised --layout "0:0-2"` registers `poses.<id>.surprised`; tune `fps`/`loop` in the JSON and run `npm run sprites:build`.

**Add a new scene**
1. `node tools/import-art.cjs scene <id>` (creates `scene.<id>`; add `--width 724` to downscale an interior).
2. Add a definition modeled on [v8/src/hawaii.js](../v8/src/hawaii.js) with `art: 'scene.<id>'` (spawn, walkable polygons/rectangles, obstacles, exits, interactions, enemies) and register it in [v8/index.html](../v8/index.html) with `V8_AREAS.install`. New World-map destinations (New York, Paris, Egypt, Italy, Philippines, Japan) live in [v8/src/destinations.js](../v8/src/destinations.js); a destination also needs a site in [world-travel.js](../v8/src/world-travel.js) (marker tile, arrival) and a landable island in `v8/data/world-grid.json`. Help → Developer jump teleports to any site's world-map marker for testing. Kentlands interiors use the `interior()` helper in [scenes.js](../v8/src/scenes.js).
3. `npm run test:quick` validates geometry/connectivity and that the authored size matches the image. Then open `npm run studio`, pick the scene and adjust the shapes over the actual artwork with the walk-test layer on; Save writes the data override.

Game contracts: sprite cells 64×64 (128 for large dinosaurs), transparent background, foot anchor at y=60, walk sheets 4 frames per row in down/left/right/up order with walking rows four below idle rows. Portraits 128×128 transparent PNG. Scenes any size, stored as WebP.

## Roadmap (agreed 2026-10-14)

1. ✅ **Freeze policy, Node/npm, task runner, tiered tests, archive check, docs reset** (this step).
2. ✅ **Asset manifest + consolidation.** 137 files V8 loaded from V1–V7 now live in `v8/assets/`; all 141 images are declared in `v8/data/art.json` and resolved through `V8_ART.url(id)` with hash-based cache-busting. No cross-version references remain.
3. ✅ **Generalized importer** — `tools/import-art.cjs sprite|portrait|scene|image|cells|check`: detects drawings on ChatGPT's transparent exports, maps them into the game grid via layout presets (`walk6`, `walk4`, `walk8`) or an explicit row spec, writes assets + manifest entries with inbox provenance, and saves numbered previews. `docs/ART-SPEC.md` is the paste-ready ChatGPT brief. Replaces `v8/tools/process-areas.cjs`.
4. ✅ **Visual collision editor** — `npm run studio` (`v8/studio/`, `tools/studio-server.cjs`): edit walkable/blocked shapes, markers, roads, spawn and bounds over the real backgrounds with a live walk-test; saves `v8/data/scene-geometry.json`, applied by `v8/src/scene-geometry.js`. Scenes migrate to data the first time they are saved; untouched ones keep their code geometry.
5. **Format-only pass** on `v8/` (Prettier), then extract asset loading from `game.js` into `assets.js` (music is already in `music.js`).
6. ✅ **Music manifest** — MP3 tracks + `data/music.json` (hero themes, place playlists), `tools/music.cjs import|build|check`, `src/music.js` director (one `<audio>` element, synth originals retained), Menu → Options with pickers. Music moved out of `game.js`.

### Gburg Studio expansion (agreed 2026-10-16)

Direction: one server and one tab bar, separate small pages per tab, every tab saving a validated `v8/data/*.json` document (the scene-geometry pattern). Not a single-page app, not a pixel editor (Pixelorama stays for real repainting), not Tiled.

7. ✅ **Studio shell + sprite data** — generic document server (`/api/doc/<name>`), tab bar, `studio-common.js`; `v8/data/sprites.json` + `tools/sprites.cjs build|check` replace the hand-written `characters.js`/`action-art.js` tables (generated globals proven identical; contract test in `test:quick`); the importer registers characters and poses in the JSON itself.
8. ✅ **Sprites tab (Sprite Workshop)** — `v8/studio/sprites/`: the importer's detection as a shared browser module (`v8/studio/sheet-tools.js`, byte-identical CLI output), inbox or dropped files, numbered cells, presets or pick-by-click row mapping with mirror and nudge, 64-grid preview with foot line and onion skin, in-motion preview through `characterWalkPose`, Save = PNG + `art.json` + `sprites.json` via `POST /api/asset` and `/api/doc/sprites`. `rpg.js` tolerates roster members without a tuned profile.
9. **Preview links** — dev URL params (`?scene=&hero=&x=&y=`) and "Open in game here" from every tab; optional localhost asset-reload ping.
10. **Cinematics tab** — the V6 director (`v6/studio/`, frozen) re-created under `v8/studio/cinema/` against V8's `cinema.js` preview API, saving `scene-edits.json` through the document server.
11. **World tab growth** — `enemies` and interaction `points` in the geometry override; later a `scenes.json` registry so a new destination is import + shapes + exits with no code.
12. **Costume variants (experimental)** — palette recolor variants saved as `character.<id>.walk.<variant>`; evaluate a head-transplant helper only after the Workshop has been used on real imports. Paper-doll layering is not planned.

Not planned: Tiled or a tilemap pipeline, a framework, or a rewrite.
