# Gburg Village — current development status

Updated: 2026-10-11. This is a lightweight handoff, not a detailed activity log.

## Source of truth
- Feature priorities and scope: [V4_PLAN.md](V4_PLAN.md).
- Copilot behavior and safety rules: [.github/copilot-instructions.md](.github/copilot-instructions.md).
- Full original Work-era troubleshooting, implementation and deployment history: [archived progress log](docs/archive/PROGRESS-through-2026-10-11.md). It is preserved verbatim.
- Git commits and current files are authoritative for what actually exists. Check those before acting on the summary below.

## Latest verified playable game
- V3 — Meteor Night: https://jellyman86.github.io/Gburg-Village/v3/
- V2: https://jellyman86.github.io/Gburg-Village/v2/
- Original: https://jellyman86.github.io/Gburg-Village/
- As of the last recorded V3 deployment, the meteor intro and northern roundabout map were published; V1 and V2 remained intact.
- Automated V3 desktop and mobile-*viewport* checks had passed. Physical iPhone/Safari verification must not be inferred from those tests.

## Current focus: V4 gameplay features
- The user prefers ChatGPT image-generation chats for sprites, 128×128 portraits and backgrounds; GitHub Copilot handles implementation and publishing.
- Tiled is **deferred**. Do not build a Tiled integration unless specifically requested again.
- Main request: FFVI-style menu with full roster (all created characters playable), portraits/placeholders, HP, level/XP, strength, quickness, dexterity and defense, accessible on iPhone and desktop.
- Next systems: inventory, equippable sword, HP-restoring Five Guys hamburger, relic-style selectable ability, save/progression, rescue quests.
- Future backlog also includes dog companion, more friends/dinos, outfits, weight room, music, map and collision polish. See V4_PLAN.md.

## Immediate next action for Copilot
1. Inspect current Git state; determine whether work on V4 has already started. Do not overwrite concurrent changes.
2. Continue the first uncompleted V4_PLAN.md milestone, starting with an isolated V4 game and playable menu; reuse working V3 gameplay.
3. Test relevant functionality and automatically publish working **V4-only** updates, as authorized in Copilot instructions. Preserve all V1–V3 content and public routes.
4. Report brief status and playable URL. Update this file only for major checkpoints, blocked work, or changes in immediate priorities.

## Known limitations / caution
- Some pathing/collision accuracy and map image resolution need eventual improvement; not a blocker for starting RPG features.
- Portrait image generation is underway externally and may not yet be committed.
- This handoff does NOT assert V4 is built or deployed. Confirm with Git before making that claim.

## Minimal future updates
Maintain only: current version URL, completed milestone(s), blocking bugs, active next task. Use Git history for routine commits rather than logging each attempt.
