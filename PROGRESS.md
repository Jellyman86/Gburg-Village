# Gburg Village — current status

Updated: 2026-10-16. One screen only. Git history is the detailed log; older handoff prose is in [docs/archive](docs/archive/).

## Living version
- **`v8/` is the only version under development.** Play: https://jellyman86.github.io/Gburg-Village/v8/ · [V8 guide](v8/README.md)
- V1 (repo root), `v2/` … `v7/` are **frozen archives**. They stay byte-identical to the `archive/v1-v7` tag; `npm run check:archive` enforces it. Their URLs keep working.
- Future releases are git tags and notes, **not new `vN/` folders**. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## What works (V8, verified 2026-10-14)
Opening story and 15 recruitable playable characters, FFVI-style party menu (roster, stats, items, equip, abilities), real-time dinosaur combat with healing and dog companions, Kentlands scenes, overworld Earth with jet flight, New York, Paris, Egypt, Italy, the Philippines, Japan and four-zone Hawaii, original synthesized music/SFX, desktop keyboard + iPhone touch layouts. Progress is session-only (no saves yet).

## Active work
- **Tooling step 1 is live:** `285ca82` — freeze policy, `package.json` + task runner, tiered tests, archive check, docs reset. Node.js 24 LTS installed locally.
- **Step 2 — art manifest is live:** `ee3aa66`. V8 is self-contained. 137 images V8 loaded from V1–V7 were copied once into `v8/assets/`; all 141 images are declared in `v8/data/art.json` and resolved in code through `V8_ART.url(id)` with hash cache-busting. `npm run art:check` runs inside `test:quick`. The inherited V6 danger/combat checks now live in `v8/tests/` instead of being string-patched at run time. Also fixed a load-sensitive race in the world test (dialog `close` event vs. keyboard input). Hosted suite passes all layouts (295 s); all V1–V8 URLs respond 200.
- **Step 3 — art importer is live:** `76c8d49`. `node tools/import-art.cjs sprite|portrait|scene|image|cells|check` turns raw ChatGPT exports into game assets in one command: detects drawings on the transparent background, maps them into the 64-px grid via layout presets or a row spec, writes the asset + manifest entry with inbox provenance, saves numbered previews to `test-artifacts/import/`. Verified on `Jeff Sprites.png` (matches the hand-made sheet), `Kate Portrait.png` and `Scene - Five guys HQ.png`. `docs/ART-SPEC.md` is the ChatGPT brief. Replaces `v8/tools/process-areas.cjs`; Hawaii areas now reference `art:` ids and the manifest validates their size.
- **Step 6 — music is live:** `5c442e0`. 14 of your SNES-style tracks converted to MP3 (`tools/music.cjs import`), declared in `v8/data/music.json` with 8 hero themes and *Levels* for the jet; `v8/src/music.js` plays hero themes on switch, place playlists (rotate/pick), keeps the original synthesized themes as selectable "Original" tracks, and remembers per-track position. Menu → **Options** has music on/off, hero-themes toggle, volume, per-place and per-hero pickers (device-local). Music code moved out of `game.js`. FFmpeg installed locally for conversions.
- **Music follow-ups are live:** `2f7fc21` — all 15 heroes themed (21 tracks); Options has Off / On / Themed; perceptual volume curve (quiet low end, default 50 %).
- **Music tidy-up is live:** `dfdc810`. music is always on (no stage button); MP3s route through the Web Audio gain so the slider works on iPhone (Safari ignores element volume); combat/power pop-up toasts removed (damage, defeat, power name, dinosaur approaching).
- **Step 4 — collision editor is live:** `b071547`. `npm run studio` opens Gburg Studio: scene geometry drawn over the real backgrounds, select/move/resize/add/delete shapes, markers and road strips, live walk-test mask, undo/redo, Save → `v8/data/scene-geometry.json` applied by the game at load (landmarks merge by id). Geometry contract round-trips all 15 scenes with identical collision; studio browser suite covers drawing, undo, export and read-only mode.
- **Polish round (branch `polish-round`):** exits trigger when crossing either edge of a road strip and arrival guards release after a 24 px step, so turning straight around works; joystick can no longer get stuck (new touch takes over, no iOS text selection/callout on the stage); all tracks loudness-normalized to −16 LUFS (Waka Waka was −39, Black or White −19); ♫ stage bubble toggles Theme/Default; recruitment cutscenes play the recruit's theme; montage plays *Star Wars Theme*; optional per-track `gain`; shipped default mode is now Default (place music). landing glides to the nearest clear ground within two tiles instead of refusing on coastlines; Hawaii is a 5×5 island so there is room to set down; the jet view uses the supplied `skybox v1` (imported as `world.skybox`, pans with heading).

- **New destinations (branch `new-destinations`):** New York (4 zones: Fountain Plaza, Brooklyn Bridge, Park Pond, Broadway), Paris (4 zones), Egypt, Italy, the Philippines and Japan are playable, all from your ChatGPT scenes (imported via `import-art.cjs scene`; 153 manifest assets). Area shapes live in `v8/src/destinations.js` (first-pass traces — fine-tune them in Gburg Studio, which lists every scene). Italy, the Philippines and Japan (Cherry Blossom Plaza: shrine, harbor docks, east bridge, south torii steps) were carved into the world grid; a contract test lands the jet from 169 offsets around every playable site (0 failures, including the Philippines archipelago). Help → **Developer jump** parks the jet beside any destination on the world map. The old procedural New York was replaced. New places have no playlists yet (they fall back to Village/Hawaii music) — add them in `music.json` `places`.

- **Music + studio update:** Kate's theme is Taylor Swift's *Love Story*; Roses has its 1.6 s silent intro trimmed (`--trim` option, remembered as `trimStart`); the invasion montage now plays an original 50-second synthesized dramatic theme instead of Star Wars (the track stays in the library); Studio edits for Italy, New York East, Paris East and the Philippines are committed; `gain` in `music.json` is now preserved by `music:build`. Pterodactyl lifts are on in all new destinations (not the world map). If a phone doesn't show a new feature, it is running a cached page: reload the tab, or remove and re-add the Home Screen icon.

- **Studio expansion, steps 7 (branch `studio-shell-sprites`):** Gburg Studio is now a shell — one server with a generic validated document API (`/api/doc/geometry|sprites`), a World / Sprites / Cinematics tab bar and shared `studio-common.js`; the World tab is unchanged in behaviour. The roster and all 51 pose clips moved from `characters.js`/`action-art.js` into `v8/data/sprites.json` (`npm run sprites:build|check`, contract test in `test:quick`; generated `CHARACTERS`/`V5_ACTION_ART` verified identical to the old objects, roster order included). `import-art.cjs sprite|portrait` registers new characters and poses in the JSON, so adding a character needs no code edit. Plan for steps 8–12 (Sprite Workshop, preview links, Cinematics tab, World growth, costume variants) is in `docs/DEVELOPMENT.md`.

## Known limitations
- No persistence; refreshing restarts as Coco.
- Touch verification is Chromium emulation, not a physical iPhone. Audio has not been human-listened in CI.
- Collision polygons are hand-traced against AI-generated backgrounds; expect occasional pathing fixes (the new destinations were traced by script from the art, never walked by a human yet).
- Hawaii shop interiors, new quests, saves and XP/leveling are not implemented.

## How to verify a change
```powershell
npm run test:quick     # ~30 s: syntax, art manifest, contracts, desktop world/hawaii suite
npm run predeploy      # archive check + every suite on desktop/portrait/landscape
npm run test:hosted    # same suites against the published site after Pages deploys
```
