# Gburg Village V6 - Dino Days

Isolated V6 chapter with the V5 story, full playable roster, the user's saved
scene staging, and lighthearted real-time dinosaur combat. Earlier game
versions and original uploads are not modified.

## Play

- Move: WASD/arrows, or the touch joystick. Shift / hold Run to hurry.
- Interact: E/Space or the touch action button. Attack: X / the power button.
- Menu: M/Escape; party, stats, equipment, items and one equipped ability.
- **Skip scene** beside Fullscreen/Expand finishes the current story scene
  through its normal completion/recruitment path. It skips just that scene,
  not the whole chapter. Gary still accounts for twenty scripted dinosaurs;
  skipping the banquet acknowledges its ending and returns safely as Gary.
- The opening movie has its own adjacent Expand and Skip controls.
- **Help -> Damage numbers** turns floating damage off without changing combat.
- **Help -> Bus gag** disables the one-time dinosaur school-bus pass on Main
  Street. It is visual only and occurs at most once per playthrough.
- Both preferences persist locally. Gameplay/recruitment/defeats remain
  session-only; refreshing starts a new adventure.
- Fullscreen falls back to a viewport-filling layout when unavailable.
  iPhone Safari's Add to Home Screen can hide browser chrome.

## Combat

Each activation hits each dinosaur at most once. Forward melee attacks,
collision-checked projectiles, Gary's directional blaster and radial group
attacks retain their distinct styles. Chris now uses the supplied eight-frame
**Towel Whip**, rather than another water beam.

Strength adds a small damage bonus; equipped sword strength applies normally.
Successful hits show a white sprite flash, a brief HP bar, knockback and a
species-specific original synthesized hurt sound, respecting sound mute.

| Dinosaur | HP | Armor | Defeat |
|---|---:|---:|---|
| Compy | 20 | 0 | Retro smoke puff |
| Raptor | 48 | 0 | Retro smoke puff |
| Wild pterodactyl | 38 | 0 | Retro smoke puff |
| T-Rex | 110 | 2 | Reaction, collision-safe retreat and fade |
| Triceratops | 100 | 3 | Reaction, collision-safe retreat and fade |

Compies appear in the outdoor zones; a wild pterodactyl is separate from the
existing harmless lift/ride bird. Defeated dinosaurs stay defeated on map
revisits. Smoke, sparks and numbers use a bounded 32-effect pool. Reduced motion
holds damage numbers in place and reduces smoke motion/retreat shaking.

The party is not injured by dinosaur tag; no death, punishment, XP awards or new
progression system is introduced. The supplied hamburger icon uses the existing
inventory item: heals 50 HP, consumes one, and never exceeds maximum HP.

Story/movie dinosaurs remain controlled exclusively by their scripts.
Gameplay, knockback, defeat timers and bus animation pause during stories,
menus, dialogs and flight.

## Artwork and Studio

Existing cleaned sheets, portraits and backgrounds are shared from V4/V5;
only four new derivatives are stored in [assets](assets/). Original uploads
remain in the inbox. Run `.\v6\tools\process-combat-art.ps1 -ValidateOnly` to
check dimensions, transparency and every frame. Generation preserves existing
derivatives unless `-Rebuild` is explicit.

[V6 scene edits](data/scene-edits.json) are an exact snapshot of the user's
local V5 Studio edits at the start of this increment. Subsequent V5 and V6
authoring is independent.

Launch `.\v6\tools\Start-Studio.ps1`, then open
http://127.0.0.1:5176/v6/studio/ (game: http://127.0.0.1:5176/v6/).
Save writes **only V6** scene edits. It does not publish. Hosted Studio remains
preview/import/export only. See the [Studio guide](studio/README.md).
Prepared-sheet importing and backdrop replacement are not part of this release.

Internal V4/V5 module names are retained deliberately; pages run in separate
contexts. No map pipeline or shared deployment configuration is changed.

## Verification

- `node v6\tests\combat.cjs`: damage thresholds, armor/strength, all species,
  collision-safe knockback/retreat, single defeat, bounded effects, optional
  numbers, ability ownership/cooldowns/group hits/LOS and once-only bus.
- `V6_TEST_SUITES=combat node v6\tests\run.cjs`: real carried scene edits,
  keyboard/touch skips through fifteen recruits/Gary/banquet, gameplay/story
  isolation, spawns, actual art/flash drawing, defeat persistence, menu pause,
  remembered preferences and hamburger healing. Desktop and phone orientations.
- Target legacy suites with `V6_TEST_SUITES` and `V6_TEST_LAYOUTS`.
  `V6_TEST_ORIGINAL_STAGING=1` supplies empty edits **only in test responses**
  for baseline choreography assertions; it never overwrites shipped/user edits.
- `node v6\tests\studio.cjs`: all 71 shots and editor/save/import/export
  integration using an isolated temporary settings file.

Browser runners require Playwright and Chromium, optionally located with
`PLAYWRIGHT_CORE` and `BROWSER_PATH`. Verification uses desktop Chromium and
touch emulation; physical iPhone operation and actual audio listening have not
been verified.
