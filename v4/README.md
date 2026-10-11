# V4 · Meteor Night

Isolated feature preview based on V3. V1–V3 are unchanged; V4 reuses their art URLs instead of copying map/sprite assets.

## Controls and features
- Open **Menu**, press **M**, or press **Escape** to pause the world. Escape / Return closes the menu; held movement is cleared.
- Begin as **Coco**, waking in her Dino house bedroom. Find Connor next door through the supplied upstairs hallway, then explore to find everyone. Talk with **E** / **Talk**; after their joining dialogue, friends walk into the hero and disappear into the party.
- Party and Stats show all 14 humans, including missing friends with location hints. Only recruited friends appear in the toolbar and become playable. Select a rescued roster member, then **Play as** to switch without teleporting; there is no party-size cap. Borrowing a friend's ability also requires rescuing them.
- An objective hint points to the next missing friend, but recruitment is not forced into that order. Friends are spread through existing locations; the Rock Band house entrance is on the **right/east recreation street**.
- Zone diamonds have visible destination labels. **Walk/run over a diamond or click/tap it** to travel; clicking a visible zone diamond does not require standing next to it. **E / Go** still works. Arrival diamonds are ignored by automatic travel until you move away, preventing bounce-back loops; movement is cleared during loading. The touch camera leaves extra space below the map so bottom exits stay above the joystick/buttons. Indoors are dinosaur-free.
- Lakelands Courts & Pool connects directly to **Main Street Home at the southeast/right diamond** and **Main Street shops at the southwest/left diamond**. Home's courts exit returns to the matching east street; the Rock Band door returns beside its east-street entrance.
- Keyboard: Tab / Shift+Tab moves focus, Enter activates buttons, arrow keys / Home / End navigate the section tabs. All actions also support mouse/touch.
- Items: shared inventory starts with three Five Guys hamburgers (50 HP restoration, capped at max HP). Full-HP targets cannot waste items.
- Equip: discover the Japanese sword in the Dino house's central hallway using **E**, the touch **Take** button or a nearby click. Collection grants one shared weapon per session, not a starter item. Weapon/accessory slots and Strength +4 remain; unequipping returns the sword to inventory.
- Abilities: one relic-style equipped power per character. Original characters retain their original powers; Jeff throws a baseball, Ari keeps Soccer volley, Chris fires a directional water beam and Jaime spins upright in a skate tornado. New effects use original Canvas art. Projectiles/beam stop at scenery and tornado hits cannot pass through walls. Sword slash uses the uploaded action art and requires the discovered sword equipped; removing the weapon clears that ability. Cooldowns belong to the caster, not the selected relic.
- Intro: Adam and Kate play tennis on the tennis court; Coco and Peachy play basketball on the basketball court.
- The next intro shot uses the supplied Rock Band room: Connor, Coco, Peachy, Jason (Jay), Vito, Brie, Adam, Kate, **Mark and Stephanie** sing, play instruments and dance. Detailed original pixel guitar/bass/microphone sprites replace the old flat props. The performance lasts six seconds and cuts directly to Coco's mirror scene.
- The first four walkers are lower to clear the benches. The final four seconds now show Coco lying in her supplied bedroom: **"That flash sure was scary!"** The full opening is 36 seconds; skipping starts the same playable chapter. Replaying does not reset recruitment.
- That shot has a quiet original SNES-inspired rock riff synthesized with Web Audio (square-wave lead, triangle bass and percussion), not a licensed song or game recording. Sound remains optional; mute/skip/replay cancel queued notes, and the riff stops before Coco's room. Reduced-motion mode removes dance bounce/sway/walk cycles.
- Supplied T-rex, raptor, triceratops and pterodactyl atlases replace procedural dinosaurs. An outdoor pterodactyl can lift you into a zoomed-out map view, release you to drop at the **exact original spot**, and give you a small harmless bounce. The bird flies independently up and away after releasing you, then disappears for ten gameplay seconds. Pickup cooldown is **20 seconds** initially and after landing (twice the old interval); timers survive portals. A successful attack within 150 world pixels of the bird, or an active projectile/effect approaching that close, scares it away for another ten-second absence after departure. No grabs indoors or while riding a unicorn. Menus pause flight/escape/absence timers, and switching/powers/portals wait for landing.
- Short, quiet original chiptune sound effects accompany doors, powers, pickups, recruitment and landings; no continuous footsteps. **Help > Sound effects** mutes these independently of music and cancels queued effects.
- The Dino house uses half its old world scale so furniture is less oversized relative to characters. Bedrooms connect through the supplied hallway and stairs. Chairs are passable; tables/beds and pool water stay solid. The gate between the courts and pool is traversable, with a wider deck route.
- Existing portals, unicorn, joystick, music and harmless dinosaur tag remain. Equipment affects the RPG stat display, not combat damage yet.
- The old-version navigation banner is removed. **Help** in the toolbar keeps route guidance, Replay intro and Back to plaza accessible.
- **Fullscreen** uses the browser Fullscreen API where supported. **Expand** is the fallback: it hides the game header/footer and fills the available browser viewport, but cannot hide browser address bars. Exit view remains available next to Menu; menus and Help still work in either mode.
- On iPhone, open V4 in Safari, choose **Share > Add to Home Screen**, enable **Open as Web App** if offered, then launch the icon for a standalone view without browser chrome. V4-only standalone metadata is included; this does not add offline support. Safe-area padding protects notch/home-indicator controls. Physical iPhone behavior still needs device verification.

**Preview limitation:** Recruitment, companions, HP, XP, equipment, inventory and discoveries are session-only. Reload starts fresh as Coco. Saves are deliberately deferred for this increment; XP rewards, leveling, combat damage and dog bites are not implemented.

## Artwork
Original uploads remain untouched in `../art inbox/` (the folder currently has a space, not a hyphen).

`assets/portraits/*.png` are transparent 128×128 nearest-neighbor derivatives:

| Character | Original |
| --- | --- |
| Jason | `Jason Portait.png` |
| Connor | `Connor Portrait.png` |
| Coco | `Coco Portrait.png` |
| Peachy | `Peachy Portrait.png` |
| Jaime | `Jaime Portrait.png` |
| Chris | `Chris Portrait.png` |
| Jeff | `Jeff Portrait.png` |
| Ari | `Ari Portrait.png` |
| Adam | `Adam Portrait.png` |
| Kate | `Kate Portrait.png` |
| Brie | `Brie Portrait.png` |
| Vito | `Vito Portrait.png` |
| Mark | `Mark Portrait.png` |
| Stephanie | `Steph Portrait.png` |

All 14 current humans now have supplied portraits; the placeholder fallback remains for future characters. [process-art.ps1](tools/process-art.ps1) preserves every original and reproducibly crops verified poses using measured alpha gaps. Run `powershell -File v4\tools\process-art.ps1` from the repository root (`-Inspect` reports alpha row bands).

- `assets/characters/{ari,jeff,jaime,chris}.png`: normalized transparent 256×512 atlases, 64px cells, idle directions down/left/right/up then walking directions, baseline y=60 with safe padding. Three supplied phases repeat as 0/1/2/1, not fabricated poses. Jaime uses the upload named `Jamie Sprites.png`.
- `assets/characters/chris-swim.png`: swimming poses for ambient lap-pool animation.
- `assets/companions/{barney,rosie}.png`: the two dogs' supplied idle/walk poses, scaled below human size.
- `assets/items/sword.png` and `sword-slash.png`: isolated blade icon and three supplied slash phases.
- `assets/scenes/rockband.png`: 960x540 nearest-neighbor derivative of `Scene - Rockband Area.png`. Existing character atlases gain cinematic-only sway/bounce, singing mouths, instrument overlays and notes; normal gameplay sprites are unchanged.
- `assets/scenes/{coco-room,connor-room,upstairs}.png`: 600x450 derivatives of the supplied bedroom and `Scene - Dino House Upstairs Hallway.png` originals, used by the connected playable interiors. The established mirror/window shot and meteor alignment are unchanged.
- `assets/dinosaurs/{trex,raptor,triceratops,pterodactyl}.png`: transparent 512x1024 directional atlases, 128px cells, foot baseline y=124. Three supplied phases repeat as 0/1/2/1.
- `assets/items/band-instruments.png`: an original 256x64 pixel atlas of guitar, bass, microphone and sticks; no third-party instrument assets.
- Other emotion/action poses stay intact in the original sheets for later features; they are not all separate playable actions yet.

## Recreation activity
The bench-lined lawn left of the playground is reachable from the north path. Jeff and Ari pass a soccer ball until recruited; Chris swims and Jaime skates until found. Their gold encounter markers stay at accessible places, including Chris's dry poolside meeting point. Recruited humans no longer leave duplicate ambient copies behind.

Find Barney and Rosie on the northeast street with **E** / **Look**. They follow collision-checked breadcrumbs at different comfortable lags (90/140 world pixels), catch up when you stop, and pause with the menu. They follow the active hero rather than a specific character. On entering another area they emerge behind you once there is enough space, rather than appearing in an overlapping pile. They do not bite dinosaurs yet.

### Where to find friends
| Friends | Location |
| --- | --- |
| Connor | Bedroom next door to Coco, upstairs in the Dino house |
| Peachy / Jason | Dino house front door / kitchen hallway |
| Jeff / Ari | Soccer lawn left of the playground |
| Chris / Jaime | Lap-pool deck / west recreation street |
| Mark / Stephanie | Rock Band house, entered from the right/east recreation street |
| Adam | Neighborhood path |
| Brie | Plaza restaurant path |
| Vito | Main Street, near the courts route |
| Kate | South street below the meteor roundabout |

## Verification
Run `node v4/tests/run.cjs` from the repository root using the existing Playwright test environment (`playwright`, Chromium). `BROWSER_PATH` optionally selects an installed Chromium; `PLAYWRIGHT_CORE` optionally points at a `playwright-core` installation. The runner serves the repository temporarily and closes the browser/server when done.

The repeatable checks are in [tests/checks.js](tests/checks.js); the file returns an async test function accepting a Playwright `page`. Test-only placement hooks are injected into HTTP responses by Playwright routing, never added to the shipped game.

Checks cover deterministic stats, roster switching, pause/input resets, keyboard navigation, equipment conservation, healing boundaries, equipped ability ownership/cooldown, all six scenes and original powers, intro playback, portals, unicorn and mobile touch/layout. [Display checks](tests/display-checks.js) additionally cover native fullscreen, browser/button exits, unsupported/denied API fallbacks, increased canvas height, menu/help/replay/reset access, and V4-scoped Home Screen metadata. Desktop touch emulation is not physical iPhone verification.

[Recreation checks](tests/recreation-checks.js) validate every processed atlas shape, transparent padding and foot baseline, flood-fill reachability from the actual entrance, bench/pool collisions, moving soccer passes, ambient animation, pause, active teammate replacement, soccer powers and sword gating.

[Content checks](tests/content-checks.js) verify exact intro court positions, short display names, reachable one-time sword pickup and equip gating, northeast dog encounters, directional/collision behavior of the new powers, and live keyboard/touch activation. Optional `V4_ARTIFACT_DIR` saves screenshots of the courts, sword, dogs and power effects.

[Intro checks](tests/intro-checks.js) verify all fourteen portrait contracts, the exact ten-person cast, instrument/dance poses and direct room transition, bench-clear walking, Coco lying in bed, gameplay pause, reduced motion, real Web Audio scheduling and mute/skip/replay cleanup. Offline audio rendering checks the original riff's six-second waveform, RMS/peak limits and silent tail before the cut; these are not physical-device listening tests.

[Chapter checks](tests/chapter-checks.js) begin with the real Coco-only state, verify every selection/equipment/ability rescue lock, and walk collision-respecting routes through all ten connected scenes to recruit all thirteen missing humans. They cover joining animations/disappearance, house scale/chairs/tables, the open pool gate and solid water, sword access, following-dog spacing/corners/menu/switch/portal behavior, natural flight approach and indoor/riding guards, overview/pause/exact safe return/bounce/20-second pickup cooldown, independent fly-away/ten-second disappearance, the exact 150px scare boundary and real keyboard/touch/projectile scares, and actual sound scheduling/mute cleanup. The same flow runs on desktop and emulated portrait/landscape touch.

[Navigation checks](tests/navigation-checks.js) verify all 20 reciprocal zone transitions, every exit's collision reachability from every arrival, all indoor scenes without dinosaurs, actual keyboard/touch run-over travel and click/tap travel beyond the old interaction radius, arrival movement without bounce-back, right-side Rock Band placement and direct Home/shops returns. Run through the same test runner on desktop, phone portrait and landscape.
