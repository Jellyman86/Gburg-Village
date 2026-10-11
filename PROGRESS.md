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
  - Isolated V3-based game; FFVI-inspired Party/Stats/Items/Equip/Abilities menu, safe world pause, complete ten-character roster plus playable Jaime and Chris Tappis.
  - Level/HP/XP and deterministic core stats, shared hamburger inventory, placeholder sword (+4 strength), weapon/accessory slots, and one selectable original power per character.
  - Six supplied portraits processed to transparent 128x128 derivatives. Originals in `art inbox/` remain untouched and untracked; other portraits are clearly labeled placeholders.
- V3 — Meteor Night: https://jellyman86.github.io/Gburg-Village/v3/
- V2: https://jellyman86.github.io/Gburg-Village/v2/
- Original: https://jellyman86.github.io/Gburg-Village/
- As of the last recorded V3 deployment, the meteor intro and northern roundabout map were published; V1 and V2 remained intact.
- Automated V3 desktop and mobile-*viewport* checks had passed. Physical iPhone/Safari verification must not be inferred from those tests.
- V4 checks passed at desktop 1280x900, phone 390x844 and landscape 844x390, including actual emulated touch events. Small-phone 320x568 menu bounds were also checked.
- Verified full intro playback, roster switching, pause/focus/input resets, healing limits, equipment conservation, ability ownership/cooldowns, all six scenes, original power hits, actual north portal roundtrip, collisions and unicorn riding. No browser exceptions or failed asset requests in the full local suite.
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
3. Validate the nonstandard `Jamie Sprites.png` / `Chris Sprites.png` frame grids, directions and foot anchors before replacing the clearly labeled Vito/Adam walking stand-ins.
4. Continue publishing tested V4-only feature increments while preserving all earlier versions and public routes.

## Known limitations / caution
- Some pathing/collision accuracy and map image resolution need eventual improvement; not a blocker for starting RPG features.
- V4 stats/inventory/equipment/abilities currently last only for the play session; reloading starts fresh. This limitation is stated in the menu and help.
- XP rewards, leveling, combat damage, accessory items and rescue/unlock quests are not implemented yet. Sword modifiers currently affect displayed RPG stats only.
- Portrait generation continues externally. Jaime/Chris walking art awaits atlas verification; originals were inspected, not modified.
- No physical iPhone/Safari verification has been performed.

## Minimal future updates
Maintain only: current version URL, completed milestone(s), blocking bugs, active next task. Use Git history for routine commits rather than logging each attempt.
