# V4 · Meteor Night

Isolated feature preview based on V3. V1–V3 are unchanged; V4 reuses their art URLs instead of copying map/sprite assets.

## Controls and features
- Open **Menu**, press **M**, or press **Escape** to pause the world. Escape / Return closes the menu; held movement is cleared.
- Party and Stats cover the complete existing ten-character roster plus Jaime, Chris Tappis, Jeff Bigs and Ari (14 playable humans). Select a roster member, then **Play as** to switch without teleporting.
- Keyboard: Tab / Shift+Tab moves focus, Enter activates buttons, arrow keys / Home / End navigate the section tabs. All actions also support mouse/touch.
- Items: shared inventory starts with three Five Guys hamburgers (50 HP restoration, capped at max HP). Full-HP targets cannot waste items.
- Equip: one shared Japanese sword using uploaded art, weapon/accessory slots, Strength +4 shown separately from base stats. Unequipping returns the item to inventory.
- Abilities: one relic-style equipped power per character. Original characters retain their original powers; Jeff/Ari shoot soccer balls, Jaime spins and Chris splashes. Sword slash uses the uploaded action art and requires the sword equipped; removing the weapon clears that ability. Cooldowns belong to the caster, not the selected relic.
- Existing intro, portals, unicorn, joystick, music and harmless dinosaur tag remain. Equipment affects the RPG stat display, not combat damage yet.
- The old-version navigation banner is removed. **Help** in the toolbar keeps route guidance, Replay intro and Back to plaza accessible.
- **Fullscreen** uses the browser Fullscreen API where supported. **Expand** is the fallback: it hides the game header/footer and fills the available browser viewport, but cannot hide browser address bars. Exit view remains available next to Menu; menus and Help still work in either mode.
- On iPhone, open V4 in Safari, choose **Share > Add to Home Screen**, enable **Open as Web App** if offered, then launch the icon for a standalone view without browser chrome. V4-only standalone metadata is included; this does not add offline support. Safe-area padding protects notch/home-indicator controls. Physical iPhone behavior still needs device verification.

**Preview limitation:** HP, XP, equipment and inventory are session-only. Reload starts a fresh preview; local persistence, XP rewards, combat damage and rescue/unlock quests are not implemented in this increment.

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
| Chris Tappis | `Chris Portrait.png` |
| Jeff Bigs | `Jeff Portrait.png` |
| Ari | `Ari Portrait.png` |

Other portraits are explicitly labeled placeholders. [process-art.ps1](tools/process-art.ps1) preserves every original and reproducibly crops verified poses using measured alpha gaps. Run `powershell -File v4\tools\process-art.ps1` from the repository root (`-Inspect` reports alpha row bands).

- `assets/characters/{ari,jeff,jaime,chris}.png`: normalized transparent 256×512 atlases, 64px cells, idle directions down/left/right/up then walking directions, baseline y=60 with safe padding. Three supplied phases repeat as 0/1/2/1, not fabricated poses. Jaime uses the upload named `Jamie Sprites.png`.
- `assets/characters/chris-swim.png`: swimming poses for ambient lap-pool animation.
- `assets/companions/{barney,rosie}.png`: the two dogs' supplied idle/walk poses, scaled below human size.
- `assets/items/sword.png` and `sword-slash.png`: isolated blade icon and three supplied slash phases.
- Other emotion/action poses stay intact in the original sheets for later features; they are not all separate playable actions yet.

## Recreation activity
The bench-lined lawn left of the playground in the existing shared recreation map is now reachable from the north path. Jeff and Ari pass a moving soccer ball; the soccer landmark explains their location. When controlling Jeff/Ari, their ambient copy is omitted; the other teammate passes to the player on the field and waits if the player leaves. Chris swims in the lap pool, Jaime skates along the west street, and Barney/Rosie sniff around the field. Dogs are ambient for now, not recruited/following/bite companions. Water and benches remain collision-blocked for the player. All activity freezes with menus/dialogs/intro and stops off-scene.

## Verification
Run `node v4/tests/run.cjs` from the repository root using the existing Playwright test environment (`playwright`, Chromium). `BROWSER_PATH` optionally selects an installed Chromium; `PLAYWRIGHT_CORE` optionally points at a `playwright-core` installation. The runner serves the repository temporarily and closes the browser/server when done.

The repeatable checks are in [tests/checks.js](tests/checks.js); the file returns an async test function accepting a Playwright `page`. Test-only placement hooks are injected into HTTP responses by Playwright routing, never added to the shipped game.

Checks cover deterministic stats, roster switching, pause/input resets, keyboard navigation, equipment conservation, healing boundaries, equipped ability ownership/cooldown, all six scenes and original powers, intro playback, portals, unicorn and mobile touch/layout. [Display checks](tests/display-checks.js) additionally cover native fullscreen, browser/button exits, unsupported/denied API fallbacks, increased canvas height, menu/help/replay/reset access, and V4-scoped Home Screen metadata. Desktop touch emulation is not physical iPhone verification.

[Recreation checks](tests/recreation-checks.js) validate every processed atlas shape, transparent padding and foot baseline, flood-fill reachability from the actual entrance, bench/pool collisions, moving soccer passes, ambient animation, pause, active teammate replacement, soccer powers and sword gating.
