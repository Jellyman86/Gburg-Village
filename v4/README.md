# V4 · Meteor Night

Isolated feature preview based on V3. V1–V3 are unchanged; V4 reuses their art URLs instead of copying map/sprite assets.

## Controls and features
- Open **Menu**, press **M**, or press **Escape** to pause the world. Escape / Return closes the menu; held movement is cleared.
- Party and Stats cover the complete existing ten-character roster plus Jaime and Chris Tappis. Select a roster member, then **Play as** to switch without teleporting.
- Keyboard: Tab / Shift+Tab moves focus, Enter activates buttons, arrow keys / Home / End navigate the section tabs. All actions also support mouse/touch.
- Items: shared inventory starts with three Five Guys hamburgers (50 HP restoration, capped at max HP). Full-HP targets cannot waste items.
- Equip: one shared placeholder Japanese sword, weapon/accessory slots, Strength +4 shown separately from base stats. Unequipping returns the item to inventory.
- Abilities: one relic-style equipped power per character, selected from the ten original powers. Original characters start with their existing powers; new characters can select a power. Cooldowns belong to the caster, not the selected relic.
- Existing intro, portals, unicorn, joystick, music and harmless dinosaur tag remain. Equipment affects the RPG stat display, not combat damage yet.

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

Other portraits are explicitly labeled placeholders. The uploaded `Jamie Sprites.png` and `Chris Sprites.png` are nonstandard multi-action atlases, not the game's 256×256 / 4-direction walking contract. They were visually inspected but have not been integrated or modified. Jaime temporarily uses Vito's walking atlas; Chris uses Adam's. The menu labels these stand-ins clearly. Validate frame grids/directions/foot anchors before replacing them.

## Verification
Run `node v4/tests/run.cjs` from the repository root using the existing Playwright test environment (`playwright`, Chromium). `BROWSER_PATH` optionally selects an installed Chromium; `PLAYWRIGHT_CORE` optionally points at a `playwright-core` installation. The runner serves the repository temporarily and closes the browser/server when done.

The repeatable checks are in [tests/checks.js](tests/checks.js); the file returns an async test function accepting a Playwright `page`. Test-only placement hooks are injected into HTTP responses by Playwright routing, never added to the shipped game.

Checks cover deterministic stats, roster switching, pause/input resets, keyboard navigation, equipment conservation, healing boundaries, equipped ability ownership/cooldown, all six scenes and original powers, intro playback, portals, unicorn and mobile touch/layout. Desktop touch emulation is not physical iPhone verification.
