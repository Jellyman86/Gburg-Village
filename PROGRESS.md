# Gburg Village — current status

Updated: 2026-10-14. One screen only. Git history is the detailed log; older handoff prose is in [docs/archive](docs/archive/).

## Living version
- **`v8/` is the only version under development.** Play: https://jellyman86.github.io/Gburg-Village/v8/ · [V8 guide](v8/README.md)
- V1 (repo root), `v2/` … `v7/` are **frozen archives**. They stay byte-identical to the `archive/v1-v7` tag; `npm run check:archive` enforces it. Their URLs keep working.
- Future releases are git tags and notes, **not new `vN/` folders**. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## What works (V8, verified 2026-10-14)
Opening story and 15 recruitable playable characters, FFVI-style party menu (roster, stats, items, equip, abilities), real-time dinosaur combat with healing and dog companions, Kentlands scenes, overworld Earth with jet flight, New York and four-zone Hawaii, original synthesized music/SFX, desktop keyboard + iPhone touch layouts. Progress is session-only (no saves yet).

## Active work
- **Tooling step 1 is live:** `285ca82` — freeze policy, `package.json` + task runner, tiered tests, archive check, docs reset. Node.js 24 LTS installed locally.
- **Step 2 — art manifest is live:** `ee3aa66`. V8 is self-contained. 137 images V8 loaded from V1–V7 were copied once into `v8/assets/`; all 141 images are declared in `v8/data/art.json` and resolved in code through `V8_ART.url(id)` with hash cache-busting. `npm run art:check` runs inside `test:quick`. The inherited V6 danger/combat checks now live in `v8/tests/` instead of being string-patched at run time. Also fixed a load-sensitive race in the world test (dialog `close` event vs. keyboard input). Hosted suite passes all layouts (295 s); all V1–V8 URLs respond 200.
- **Step 3 — art importer is live:** `76c8d49`. `node tools/import-art.cjs sprite|portrait|scene|image|cells|check` turns raw ChatGPT exports into game assets in one command: detects drawings on the transparent background, maps them into the 64-px grid via layout presets or a row spec, writes the asset + manifest entry with inbox provenance, saves numbered previews to `test-artifacts/import/`. Verified on `Jeff Sprites.png` (matches the hand-made sheet), `Kate Portrait.png` and `Scene - Five guys HQ.png`. `docs/ART-SPEC.md` is the ChatGPT brief. Replaces `v8/tools/process-areas.cjs`; Hawaii areas now reference `art:` ids and the manifest validates their size.
- **Step 6 — music is live:** `5c442e0`. 14 of your SNES-style tracks converted to MP3 (`tools/music.cjs import`), declared in `v8/data/music.json` with 8 hero themes and *Levels* for the jet; `v8/src/music.js` plays hero themes on switch, place playlists (rotate/pick), keeps the original synthesized themes as selectable "Original" tracks, and remembers per-track position. Menu → **Options** has music on/off, hero-themes toggle, volume, per-place and per-hero pickers (device-local). Music code moved out of `game.js`. FFmpeg installed locally for conversions.
- **Music follow-ups are live:** `2f7fc21` — all 15 heroes themed (21 tracks); Options has Off / On / Themed; perceptual volume curve (quiet low end, default 50 %).
- **Music tidy-up (this branch):** music is always on (no stage button); MP3s route through the Web Audio gain so the slider works on iPhone (Safari ignores element volume); combat/power pop-up toasts removed (damage, defeat, power name, dinosaur approaching).
- **Step 4 — collision editor (branch `studio`):** `npm run studio` opens Gburg Studio: scene geometry drawn over the real backgrounds, select/move/resize/add/delete shapes, markers and road strips, live walk-test mask, undo/redo, Save → `v8/data/scene-geometry.json` applied by the game at load (landmarks merge by id). Geometry contract round-trips all 15 scenes with identical collision; studio browser suite covers drawing, undo, export and read-only mode.
- Next: formatting pass and `game.js` extractions (step 5).

## Known limitations
- No persistence; refreshing restarts as Coco.
- Touch verification is Chromium emulation, not a physical iPhone. Audio has not been human-listened in CI.
- Collision polygons are hand-traced against AI-generated backgrounds; expect occasional pathing fixes.
- Hawaii shop interiors, new quests, saves and XP/leveling are not implemented.

## How to verify a change
```powershell
npm run test:quick     # ~30 s: syntax, art manifest, contracts, desktop world/hawaii suite
npm run predeploy      # archive check + every suite on desktop/portrait/landscape
npm run test:hosted    # same suites against the published site after Pages deploys
```
