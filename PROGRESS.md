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
  - Latest content deployment: `faf7fa9`, Pages deployment succeeded. Live browser verified corrected courts, short names, reachable one-time sword pickup/equip, northeast dog encounter and all four requested powers. V1–V3 public HTML remains unchanged.
  - Latest Rock Band/portrait deployment: `fa49c52`, Pages succeeded; live desktop/touch browser checks passed for the scene, all 14 portraits and audio lifecycle, and V1–V3 public HTML is unchanged. The six-second performance replaces the walking lineup immediately before Coco's mirror shot, with Connor, Coco, Peachy, Jason (Jay), Vito, Brie, Adam and Kate. Original quiet Web Audio rock music is confined to that shot. Full intro is now 32 seconds.
  - Latest rescue-chapter deployment: **`200834e`**, [Pages run 38176459688](https://github.com/Jellyman86/Gburg-Village/actions/runs/38176459688) succeeded. Live unmodified desktop keyboard and emulated phone joystick/taps verified Coco-only start, the supplied hallway/bedroom/stair route, Connor and Peachy joining/disappearing, recruited-character switching, natural outdoor pterodactyl approach/overview/exact harmless return/cooldown, and SFX mute. Separate live intro checks passed the ten-person cast, instrument/dance poses, bench-clear walkers, four-second Coco-in-bed ending, all 14 portraits and audio lifecycle. The opening is now **36 seconds**. No browser exceptions or failed assets; V1–V3 public HTML still matches local originals.
  - Isolated V3-based game; FFVI-inspired Party/Stats/Items/Equip/Abilities menu, safe world pause, complete ten-character roster plus playable Jaime, Chris, Jeff and Ari (14 humans; stable IDs unchanged).
  - Level/HP/XP and deterministic core stats, shared hamburger inventory, discoverable Japanese sword (+4 strength), weapon/accessory slots, and one selectable power per character.
  - All 14 humans have supplied transparent 128x128 portrait derivatives, including Adam, Kate, Brie, Vito, Mark and Stephanie. Rock Band has a V4-only 960x540 derivative; new bedrooms/hallway have 600x450 derivatives and are playable. Originals in `art inbox/` remain untouched and untracked; the established mirror/window shot is unchanged.
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
- Rock Band checks passed in all three layouts: exact eight-person cast, animated singing/instruments/dancing, mirror-scene cut, all 14 portrait dimensions/transparency, gameplay pause and reduced motion. Real Web Audio scheduling verified scene-only rock music, mute/unmute, skip, replay and silent playback; offline rendering measured quiet RMS (~0.0062), low peak and silent tail before the cut. Desktop/phone screenshots visually verified the scene. Full gameplay/display/recreation/content suite still passed without browser errors or failed requests. No physical iPhone/audio listening verification is claimed.
- Live V4 loaded its portraits, switched to Jaime and used an equipped Flip. V1-V3 source/configuration is unchanged; all three older public routes serve identical HTML after normalizing Windows line endings.

## Current focus: V4 gameplay features
- The user prefers ChatGPT image-generation chats for sprites, 128×128 portraits and backgrounds; GitHub Copilot handles implementation and publishing.
- Tiled is **deferred**. Do not build a Tiled integration unless specifically requested again.
- Milestone 0 and Milestone 1 menu slice are complete; starter inventory/equipment/ability selection from Milestone 2 is implemented.
- Coco rescue chapter is published and live verified from `v4-rescue-chapter` (`200834e`). All 18 gameplay/display/recreation/content/intro/chapter suites passed at 1280x900, 390x844 and 844x390 with no browser exceptions or failed asset requests. Final artwork-aligned gate routes and all 13 recruitment flows passed an additional targeted run in all three layouts; touch power fixtures passed six repeat runs.
- New supplied Coco/Connor bedrooms connect through `Scene - Dino House Upstairs Hallway.png` and stairs to the half-scale Dino house. Chairs are passable, tables/beds stay solid, and the court-side pool gate/deck route is widened with water kept blocked.
- Mark and Stephanie join the ten-person Rock Band intro, with original pixel instrument sprites; first walkers clear the benches and a four-second Coco-in-bed ending extends the opening to 36 seconds. Original quiet rock music remains confined to its six-second shot.
- Four supplied dinosaur atlases replace procedural art. Barney/Rosie follow collision-checked breadcrumbs with distinct 90/140px lags, pause with menus and retain following across character/area changes. Outdoor pterodactyl flights offer an overview, exact no-damage return and small bounce.
- Flight polish is locally verified on `v4-pterodactyl-retreat`: pickup interval doubled from 10 to 20 gameplay seconds initially/after landing; bird releases the hero, flies independently upward/away and disappears for ten seconds after departure. Successful attacks or active effects within 150 world pixels scare it away with the same absence; hidden/escape/cooldown persist across portals and pause with menus. Related content/chapter checks passed in all three layouts with no browser exceptions or failed assets, including real keyboard/touch scares, approaching projectiles and exact timing/radius boundaries. Publication/live checks are next.
- A visible next-friend objective and missing-member location hints are included. Saves were explicitly deferred by the user; no autosave, XP rewards, leveling or combat damage is introduced.
- Restrained original Web Audio effects have a separate Help mute that cancels scheduled voices. Intro/chapter checks cover actual audio scheduling and cleanup; no physical-device listening is claimed.
- Future backlog includes versioned saves, progression, dog bites, outfits, weight room and more content. No Tiled integration. See V4_PLAN.md.

## Immediate next action for Copilot
1. Inspect current refs/worktree and read `v4/README.md`; preserve the user's existing `V4_PLAN.md` edits and inbox originals.
2. Collect physical iPhone/Safari and audio feedback; desktop touch emulation is not physical-device verification.
3. Continue scoped art/content/collision updates against the connected rescue chapter, keeping the regression suite green and V1–V3 unchanged.
4. Saves/progression are future increments, not part of the current update. Keep inbox originals intact and use `v4/tools/process-art.ps1` for derivatives.

## Known limitations / caution
- Some pathing/collision accuracy and map image resolution need eventual improvement; not a blocker for starting RPG features.
- V4 recruitment/companions/stats/inventory/equipment/abilities/discoveries last only for the play session; reloading starts fresh as Coco. This limitation is stated in the menu and help. Saves are intentionally deferred for this update.
- XP rewards, leveling, combat damage and accessory items are not implemented. Sword modifiers affect displayed RPG stats only; dog bites are still future work.
- Portrait generation continues externally. Supplied human and dinosaur walking sheets are integrated; unused emotion/action poses stay in the untouched originals for later features.
- No physical iPhone/Safari verification has been performed.

## Minimal future updates
Maintain only: current version URL, completed milestone(s), blocking bugs, active next task. Use Git history for routine commits rather than logging each attempt.
