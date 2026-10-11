# Gburg Village — current development status

Updated: 2026-10-11. This is a lightweight handoff, not a detailed activity log.

## Source of truth
- Feature priorities and scope: [V4_PLAN.md](V4_PLAN.md).
- Copilot behavior and safety rules: [.github/copilot-instructions.md](.github/copilot-instructions.md).
- Full original Work-era troubleshooting, implementation and deployment history: [archived progress log](docs/archive/PROGRESS-through-2026-10-11.md). It is preserved verbatim.
- Git commits and current files are authoritative for what actually exists. Check those before acting on the summary below.

## Latest verified playable game
- V4 feature preview: https://jellyman86.github.io/Gburg-Village/v4/
  - Published and live-browser verified on 2026-10-11. Feature commit: `a3a8ddb`.
  - Latest artwork/recreation deployment: `210c70b`, Pages deployment succeeded; live roster (14), eight portraits, Jeff's soccer power, new walking sheets and sword icon verified.
  - Current content update: courts, discoveries and revised powers passed the full local suite; publication verification pending.
  - Isolated V3-based game; FFVI-inspired Party/Stats/Items/Equip/Abilities menu, safe world pause, complete ten-character roster plus playable Jaime, Chris, Jeff and Ari (14 humans; stable IDs unchanged).
  - Level/HP/XP and deterministic core stats, shared hamburger inventory, discoverable Japanese sword (+4 strength), weapon/accessory slots, and one selectable power per character.
  - Eight supplied portraits processed to transparent 128x128 derivatives. Originals in `art inbox/` remain untouched and untracked; other portraits are clearly labeled placeholders.
  - Artwork/recreation update: Jeff and Ari pass a moving soccer ball on the bench-lined lawn left of the playground. Jeff's native ability throws a baseball; Ari keeps Soccer volley. Chris fires a directional water beam and Jaime makes an upright skate tornado; effects use original Canvas art. Jaime/Chris retain supplied walking sprites and skating/swimming activities. Barney/Rosie are found on the northeast recreation street, with a nearby encounter landmark.
  - Intro: Adam/Kate play tennis on the tennis court; Coco/Peachy play basketball on the basketball court. Sword: one-time pickup in the Dino house's central hallway; no starter sword. Equip and Sword slash unlock after collection, with no duplicate pickup on scene revisit.
  - Display update: old-version banner removed; Help now houses replay/return-to-plaza/route guidance. Fullscreen uses the native API where available; Expand fills the browser viewport otherwise. Exit view stays reachable. V4-only Home Screen metadata and iPhone Safari installation guidance are included.
- V3 — Meteor Night: https://jellyman86.github.io/Gburg-Village/v3/
- V2: https://jellyman86.github.io/Gburg-Village/v2/
- Original: https://jellyman86.github.io/Gburg-Village/
- As of the last recorded V3 deployment, the meteor intro and northern roundabout map were published; V1 and V2 remained intact.
- Automated V3 desktop and mobile-*viewport* checks had passed. Physical iPhone/Safari verification must not be inferred from those tests.
- V4 checks passed at desktop 1280x900, phone 390x844 and landscape 844x390, including actual emulated touch events. Small-phone 320x568 menu bounds were also checked.
- Display checks passed native fullscreen, unsupported/denied API fallback, browser/button exit restoration, menus/help/replay/reset, and standalone metadata in all three layouts. Phone-portrait canvas height increased from 633px to 777px in fullscreen emulation. Safari browser bars cannot be removed by the Expand fallback; Home Screen launch is the iPhone standalone path and still requires physical-device verification.
- Verified full intro playback, roster switching, pause/focus/input resets, healing limits, equipment conservation, ability ownership/cooldowns, all six scenes, original power hits, actual north portal roundtrip, collisions and unicorn riding. No browser exceptions or failed asset requests in the full local suite.
- Artwork checks passed in all three layouts: nine processed atlas/icon contracts, transparency/padding/foot anchors, flood-fill reachability from the recreation entrance to both soccer players and the landmark, bench/pool collision, animated passes/dogs/swimmer/skater, menu pause, active teammate replacement, off-scene suspension and sword equipment gating. Desktop/phone screenshots visually confirmed the field placement.
- Content checks passed in all three layouts: exact court positions throughout the shot, short names, flood-fill from actual house/recreation entries to the sword/dogs, E/mouse/touch pickup, single-copy inventory and revisit protection, equip/ability gating, baseball/soccer collisions, exactly 220px maximum water-beam range, no backward/radial/through-wall beam hits, upright tornado/line-of-sight and live keyboard/touch power hits. Screenshots visually checked courts, sword, dogs and effects. Full regression suite passed with no browser errors or failed asset requests.
- Live V4 loaded its portraits, switched to Jaime and used an equipped Flip. V1-V3 source/configuration is unchanged; all three older public routes serve identical HTML after normalizing Windows line endings.

## Current focus: V4 gameplay features
- The user prefers ChatGPT image-generation chats for sprites, 128×128 portraits and backgrounds; GitHub Copilot handles implementation and publishing.
- Tiled is **deferred**. Do not build a Tiled integration unless specifically requested again.
- Milestone 0 and Milestone 1 menu slice are complete; starter inventory/equipment/ability selection from Milestone 2 is implemented.
- Next systems: versioned local saves, XP/progression and rescue quests. No combat-damage behavior has been introduced; dinosaur tag remains harmless.
- Future backlog also includes dog companion, more friends/dinos, outfits, weight room, music, map and collision polish. See V4_PLAN.md.

## Immediate next action for Copilot
1. Inspect current refs/worktree and read `v4/README.md`; preserve the user's existing `V4_PLAN.md` edits and inbox originals.
2. Add versioned local save/progression without resetting established data accidentally.
3. Continue integrating newly supplied art using `v4/tools/process-art.ps1`; current walking/swimming/dog/sword recipes are verified. Add rescue/recruited dog behavior separately.
4. Continue publishing tested V4-only feature increments while preserving all earlier versions and public routes.

## Known limitations / caution
- Some pathing/collision accuracy and map image resolution need eventual improvement; not a blocker for starting RPG features.
- V4 stats/inventory/equipment/abilities/discoveries currently last only for the play session; reloading starts fresh, including the sword pickup. This limitation is stated in the menu and help.
- XP rewards, leveling, combat damage, accessory items and rescue/unlock quests are not implemented yet. Sword modifiers currently affect displayed RPG stats only.
- Portrait generation continues externally. All supplied human walking sheets are now integrated; unused emotion/action poses stay in the untouched originals for later features. Dogs currently animate as ambient characters, not recruited/following/bite companions.
- No physical iPhone/Safari verification has been performed.

## Minimal future updates
Maintain only: current version URL, completed milestone(s), blocking bugs, active next task. Use Git history for routine commits rather than logging each attempt.
