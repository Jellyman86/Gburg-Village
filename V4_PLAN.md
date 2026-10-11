# Gburg Village — V4 development plan

Status: planning only. V4 has not been implemented or deployed.
Owner goal: family-friendly top-down action/adventure around a fictionalized Kentlands neighborhood, with family sprites, meteor, dinosaurs, friend rescues, real-time movement/combat, and hand-editable levels.
Last planning update: 2026-10-11.

## Existing system (inspect before implementation)
- Live V3 is under `v3/`; older versions at repo root and `v2/` are preserved.
- V3 uses HTML Canvas and JavaScript; `v3/src/game.js` handles renderer, player, collisions, dinosaurs and interactions.
- `v3/src/map.js` defines plaza bounds, image, rectangular obstacles, landmarks.
- `v3/src/scenes.js` defines other scenes with scaled normalized walkable rectangles, landmarks/portals and some ellipse geometry for the north meteor roundabout.
- V3 art is distributed across `v3/assets/`, `v2/assets/`, and root `assets/` (verify references before any migration).
- Read `PROGRESS.md` and applicable existing instructions for current checkpoints; this plan does not supersede the verified deployed state.

## Roles
- ChatGPT/image generation: character sprite sheets, backgrounds, props, visual concepts and cutscene artwork.
- Tiled Map Editor: human editing of map geometry, collisions, walkable areas, interactive objects, portal/spawn locations, eventually tiles.
- GitHub Copilot in VS Code: bounded code edits, loader/validation tools, bug fixes, testing.
- GitHub: version control and safe review; GitHub Pages is the deployed website.

## Target folder organization (proposed, not mandatory to migrate immediately)
```
v4/
  index.html
  style.css
  assets/
    backgrounds/
    sprites/
    props/
    ui/
  maps/
    tiled/          # editable Tiled .tmj source files
    exported/       # machine-readable, validated JSON or generated scene data
  src/
    game.js
    scenes.js
    tiled-loader.js
  tools/
    validate-maps.* # choose an existing project runtime if practical
```
Keep original source art and its provenance separately if useful; do not duplicate multi-MB images needlessly. Reuse existing shared images via relative paths initially.

## Implementation milestones
### 0. Safe V4 sandbox
- Create a dedicated `work/v4-tiled` branch from current main; ensure it is fresh.
- Add `v4/` as a COPY of the necessary V3 files, with functioning relative image/script paths; leave root/`v2/`/`v3/` untouched.
- Verify V4 baseline on desktop and mobile viewport before changing geometry.
- Avoid premature broad refactoring or mass asset relocation.

### 1. First vertical slice: Market Square collisions only
- Use the actual plaza `1536 x 1024` pixel coordinate system, not screen/view coordinates.
- Build `v4/maps/tiled/plaza.tmj` with a background image layer referring to the *existing* scene image and a named object layer `Collision` of rectangles corresponding to the current `TOWN.obstacles`.
- Preserve every initial rectangle's x/y/width/height and the original world bounds. In Tiled, object layer visibility is for editing only; do not render collision shapes to the player by default.
- Define whether the game loads TMJ directly at runtime or converts it to a compact generated JSON file. Prefer a small adapter and validated JSON rather than embedding image bytes or manually copying coordinates each edit.
- Implement deterministic import of `Collision` rectangle objects into the existing blocked() logic without changing the core gameplay.
- Clear error/fallback when map JSON fails to load; no silent unwalkable map.
- Add a developer-only debug overlay (toggle) displaying collision rectangles, and a simple reproducible movement/collision test.
- Demonstrate: user drags one collision rectangle in Tiled, saves, refreshes V4 and observes the new boundary. No AI code edits required for subsequent rectangle tweaks.

### 2. Expand geometry carefully
- Support `Walkable` rectangles for scenes currently using allowlisted paths; clarify intersection/union semantics first.
- Handle V3's north roundabout walkable/blocked ellipses without dropping or silently converting them to inaccurate rectangles. Either preserve existing JS ellipses as fallback or implement tested ellipse/polygon support.
- Convert scenes incrementally (one at a time), validating spawn locations and portal access after each.

### 3. Objects and gameplay
- Add named object groups/properties for `Spawn`, `Portal`, `DinosaurSpawn`, `NPC`, `Trigger` and `Pickup`, with stable IDs, required property checks, and coordinates.
- Never replace existing working portal transitions without route tests; reject missing destination scenes/spawns.
- Keep game logic (AI, battles, rescue quests, powers, save state) in JS; maps supply data rather than executable code.

### 4. Optional true tilemap support
- Add reusable tilesets and tile layers to new areas only when justified; hand-painted/AI-produced PNG/WebP scenes may continue as image layers.
- Avoid generating huge single-file HTML bundles or uploading base64 assets through chat.

## Definition of done (first slice)
1. V1/V2/V3 bytes unchanged, existing published routes still accessible.
2. V4 playable with intact family sprites, dinosaurs, powers, intro and scene routing.
3. Market Square Tiled JSON loads correctly, using exact world coordinates.
4. Changed Tiled collision rectangles affect V4 after save and refresh (or documented, one-command conversion).
5. Tests for wall blocking, doorway access, off-map bounds, errors, keyboard and touch.
6. Updated progress log records commits, tests, deployment state, and limitations.
7. Explicit approval before publishing V4 or changing GitHub Pages routing.

## Efficient collaboration
- Do not paste full HTML, large JS files, base64, images, or ZIP contents into chat. Summarize small diffs and link files.
- Make small coherent commits and pause on blockers rather than overwriting successful work.
- Work on one milestone at a time; request confirmation before expanding scope.
- Tiled source is authoritative for migrated geometry; avoid parallel hard-coded edits that drift.
