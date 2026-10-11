# Copilot instructions — Gburg Village

Read `V4_PLAN.md` and `PROGRESS.md` before coding; inspect latest repo state, don't rely solely on prior chat summaries.

Project: family/neighborhood top-down HTML Canvas adventure, Final Fantasy IV–VI-inspired presentation, Zelda-style REAL-TIME exploration/combat. Every created human character should be playable eventually. The user generates pixel art/portraits separately; Copilot handles the coding and integration.

## Current priority: FEATURES, not Tiled
- Build V4 RPG menu, roster, stats, equipment, items, relic-style equipped abilities and save foundation before optional map-editing tooling.
- **Do not implement Tiled** or a new tilemap pipeline unless the user explicitly requests it in the future. Pathing/collision bugs can be fixed directly in existing JS, with tests.
- Use 128x128 transparent portrait PNGs when supplied; meanwhile use obvious placeholders and stable character IDs.
- Menus should work on desktop, keyboard and iPhone touch; preserve real-time gameplay outside the menu.

## Safety
- V1 root, `v2/`, and `v3/` are preserved working versions. Do not edit, delete, rename or publish them while implementing V4.
- Keep V4 code isolated in `v4/` and use appropriate Git branching to protect concurrent work. Verify current refs before editing.
- User authorizes automatic deployment of tested working V4 changes without repeated approval. Never break/overwrite V1–V3, their URLs, or shared deployment configuration. If a deployment risks old versions or major site settings, pause and ask.
- Avoid giant monolithic rewrites, mass asset copies, and large code/base64 dumps in chat. Choose your own sensible development/commit strategy; test meaningful changes.
- Track actual outcomes/limitations in progress log; don't claim physical iPhone verification from desktop emulation.

## First coding task
Milestone 0 + first slice of Milestone 1 in `V4_PLAN.md`: set up playable isolated V4 and build an FFVI-style Party/Stats menu supporting the FULL playable roster, levels, HP, XP, strength, quickness, dexterity, defense, portrait placeholder slots, safe movement pause and responsive controls. Use separate character data and menu state/UI where practical. Do not implement the whole equipment/quest system in one enormous patch.

## Follow-up increments (after first slice tested)
1. Inventory / equipment slots; Japanese sword placeholder and hamburger healing item.
2. Relic-style selection of one equipped ability per character while retaining existing powers.
3. Persistence, progression and friend rescue/unlock logic.
4. New characters, locations, audio and polish once assets arrive.

## Existing implementation pointers
- `v3/src/game.js` core Canvas loop/movement.
- `v3/src/map.js` plaza map data; `v3/src/scenes.js` scene images, routes, collisions.
- Existing asset paths may reference `v2/`, root or V3. Preserve relative URLs and existing gameplay mechanics during V4 duplication.
- Test intro, dinosaurs, powers, portals, keyboard and touch after changes.

Report concise changes, deployment URL/status, verification evidence and next action. Do not dump source files into chat.
