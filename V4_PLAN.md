# Gburg Village — V4 feature-first development plan

Updated: 2026-10-11. Planning document only; this edit does NOT create or publish V4.

## Vision
A humorous family/neighborhood 2D HTML/JavaScript adventure inspired by Final Fantasy IV–VI presentation and Zelda-style REAL-TIME exploration/combat. A meteor unleashes dinosaurs; the player explores, rescues friends and recruits them as playable characters. All characters created for the game should ultimately be playable, not permanently NPC-only.

## Current system and guardrails
- V3 is the current working reference, located in `v3/`. Prior versions: root (V1), `v2/`. Do not modify them for V4.
- V3 uses HTML Canvas and JavaScript. `v3/src/game.js` coordinates rendering, player, collision, interaction, powers, dinosaurs; `v3/src/map.js` defines plaza geometry, and `v3/src/scenes.js` defines multiple scenes, images, walkable regions, portals and special north-roundabout ellipses.
- Read `PROGRESS.md` and the live repo before touching code. Other development may have advanced since these notes.
- Create isolated `work/v4-features` branch (or compatible fresh feature branch) and `v4/` sandbox using verified V3 code. Reuse shared art without unnecessary duplication. No publication without explicit approval.
- Small coherent commits, automated desktop/mobile checks, and bounded chat responses. Never paste huge HTML or base64 art in chat or through giant connector requests.

## Tool responsibilities
- ChatGPT image-generation chats: character sprites, consistent 128x128 menu portraits, dinosaur/companion art, map backgrounds, item art.
- GitHub Copilot in VS Code: ALL implementation, integration, collision fixes, rendering, UI, tests, persistence, audio.
- GitHub: single version-controlled source of truth.
- Tiled: OPTIONAL future visual editing/polish utility. DO NOT introduce Tiled, a Tiled loader, Tiled file formats or conversion work in the current phase without a new user request. Copilot can fix collision/pathing directly in code in the meantime.

## Priorities
### Milestone 0 — Isolated V4 foundation
1. Verify latest working V3 and its assets; create isolated V4 copy/entry point without affecting old versions.
2. Establish lightweight boundaries between UI, character data, equipment/inventory, audio and map logic; avoid broad rewrites of `game.js` just for architecture.
3. Verify existing intro, character movement, powers, dinosaur logic, scene transitions and phone controls still work.

### Milestone 1 — Playable Final Fantasy-style menu (TOP PRIORITY)
- Pause game movement and offer an accessible keyboard/mouse/touch menu, appropriately scaled for iPhone.
- Full playable-character roster, not a four-character cap; selection switches active controllable character safely.
- Each character: name, unique ID, portrait, level, HP/max HP, XP/next level, strength, quickness, dexterity and defense.
- Accept standardized 128x128 transparent portrait PNGs as they arrive; use clearly labeled placeholders now. Do not fabricate or overwrite completed assets.
- Menu sections: Party/Roster, Stats, Items, Equip, Abilities (relic-like). Show data consistently across views.
- Deterministic initial stat defaults; model data separately from rendering.

### Milestone 2 — Real item and progression foundation
- Inventory with counts and equipped items per character; slots for weapon/accessory.
- Select ONE equipped special ability per character in the relic-like ability menu; preserve current power definitions and existing active abilities.
- Japanese sword as a placeholder equipable weapon; user will later provide a photo for accurate art. Hamburger from Five Guys as consumable HP restoration; no need to implement restaurant shop interactions in first pass.
- XP gain/level progression with sensible configurable values; do not invent a huge balance system. Show impact of stat modifiers.
- Save character/inventory/equipment/progression locally with versioned localStorage and safe migration/fallback; do not reset progress accidentally.

### Milestone 3 — Quests and characters
- Rescue friends and unlock them as playable choices; do not enforce an arbitrary party size limit on the roster.
- Dog companion follows the active character and occasionally bites dinosaurs; future upgraded sprites to be provided.
- Jaime on scary T-Rex; Jeff Bigs playing soccer with Ari; Chris Tappis swimming at the lap pool; Mark and Steph playing Rock Band at their house.
- Outfit changing at Big Finds; optional gym strength progression at Lakelands clubhouse.
- Keep event logic modular and preserve existing content.

### Milestone 4 — Content and polish
- Improve lower-resolution map backgrounds, dinosaur art, pathing/collision reliability, and oversized dinosaur-house interior/stair transitions.
- Dynamic original/licensed combat music on dinosaur approach, transition back to exploration; cinematic intro expansion including Mark and Steph's Rock Band scene (avoid distributing copyrighted music without rights).
- Tiled can be revisited IF user explicitly wants manual geometry editing. It is not a current prerequisite.

## Parallel development rules
- Art generation and Copilot programming may run independently.
- Multiple code tasks must use separate feature branches or clearly disjoint files; avoid simultaneous edits to `game.js` or to main.
- First deliver one working menu vertical slice before expanding into every gameplay system.
- After testing, share changed files/commits and request explicit approval before merging/publishing.

## Immediate Copilot request
Build Milestone 0 and the first vertical slice of Milestone 1 ONLY: isolated V4 based on latest V3; accessible FFVI-style party menu with placeholder portraits, roster, stats and navigation. No Tiled, no map rewrite, no publication. Leave hooks for equipment, items and abilities, then incrementally implement those features in following commits.
