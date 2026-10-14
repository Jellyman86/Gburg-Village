# Gburg Village — V4 feature-first development plan

Updated: 2026-10-11. Planning document only; this edit does NOT create or publish V4.

## Vision
A humorous family/neighborhood 2D HTML/JavaScript adventure inspired by Final Fantasy IV–VI presentation and Zelda-style REAL-TIME exploration/combat. A meteor unleashes dinosaurs; the player explores, rescues friends and recruits them as playable characters. All characters created for the game should ultimately be playable, not permanently NPC-only.

## Current system and guardrails
- V3 is the current working reference, located in `v3/`. Prior versions: root (V1), `v2/`. Do not modify them for V4.
- V3 uses HTML Canvas and JavaScript. `v3/src/game.js` coordinates rendering, player, collision, interaction, powers, dinosaurs; `v3/src/map.js` defines plaza geometry, and `v3/src/scenes.js` defines multiple scenes, images, walkable regions, portals and special north-roundabout ellipses.
- Read `PROGRESS.md` and the live repo before touching code. Other development may have advanced since these notes.
- Develop V4 separately from V1–V3, ideally in `v4/` with a suitable Git branch. Reuse shared art without unnecessary duplication. The user authorizes Copilot to publish tested, working V4 updates automatically; preserve existing routes, shared site configuration and all earlier versions.
- Let Copilot choose its Git and commit strategy. Test important desktop/mobile behavior and keep chat output bounded; don't paste huge HTML or base64 art into conversation.

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
- Dog companion that you find follows the active character and occasionally bites dinosaurs; future upgraded sprites to be provided.
- Jaime is rollar blading on the streets, he is fast; Jeff Bigs playing soccer with Ari; Chris Tappis swimming at the lap pool; Mark and Steph playing Rock Band at their house.
- Outfit changing at Big Finds; optional gym strength progression at Lakelands clubhouse.
- Keep event logic modular and preserve existing content.

### Milestone 4 — Content and polish
- Improve lower-resolution map backgrounds, dinosaur art, pathing/collision reliability, and oversized dinosaur-house interior/stair transitions.
- Dynamic original/licensed combat music on dinosaur approach, transition back to exploration; cinematic intro expansion including Mark and Steph's Rock Band scene (avoid distributing copyrighted music without rights).
- Tiled can be revisited IF user explicitly wants manual geometry editing. It is not a current prerequisite.

## Parallel development rules
- Art generation and Copilot programming may run independently.
- For simultaneous code tasks, coordinate branches/files so agents don't overwrite concurrent changes; avoid conflicting edits to `game.js`.
- First deliver one working menu vertical slice before expanding into every gameplay system.
- Copilot may merge/deploy functioning V4 iterations without asking for publication approval each time, provided V1–V3 and their URLs remain intact. Summarize what changed and provide the playable V4 link.

## Immediate Copilot request
Build Milestone 0 and the first vertical slice of Milestone 1: isolated V4 based on latest V3; accessible FFVI-style party menu with placeholder portraits, roster, stats and navigation. No Tiled or map rewrite. Copilot can publish tested V4 versions automatically while preserving V1–V3. Leave hooks for equipment, items and abilities, then add those features incrementally.
