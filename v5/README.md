# Gburg Village V5 - Coco's Adventure

Play: https://jellyman86.github.io/Gburg-Village/v5/

V5 is an isolated chapter preview. V4 remains at its existing URL; V1-V3
and uploaded artwork originals are preserved. V5 reuses the prepared V4 art
through relative URLs rather than copying a second asset library.

## Chapter One

- After the meteor opening, Coco investigates her bedroom window.
- Explore normally through her room, the upstairs hallway and Connor's room.
  His tablet scene unlocks him and changes the objective to finding the parents.
- Head downstairs. The kitchen scene recruits Jason and Peachy together.
- A 24-second invasion montage introduces the soccer field, pool, Vito's
  wrestling teaser and neighborhood panic without resolving those rescues.
- Each missing friend has a distinct discovery scene. Vito throws his dinosaur
  by the tail; Brie keeps doing yoga. All fourteen humans become playable.
- Rescued friends wait in Market Square. Bringing the entire party there closes
  the chapter and hints at Five Guys as a future headquarters and the meteor
  mystery. Those future systems are not implemented yet.

Coco remains the narrative protagonist when another unlocked hero is selected.
Cinematics pause movement, combat, travel and character switching. Their
completion and skip paths share the same one-shot story rewards.

## Controls

WASD / arrows move; Shift runs; E / Space interacts; X uses the equipped power.
M / Escape opens the RPG menu outside a cinematic. Touch uses the joystick,
Run and interaction buttons.

During a cinematic, **Next / Enter / Space** advances a shot and **Skip scene /
Escape** completes the current event safely. Skipping the parents' scene still
starts the montage; skip that separately if desired. Hidden tabs pause story
timers. Reduced-motion mode removes camera shake and decorative bouncing.
Intro replay never resets recruitment or repeats completed chapter events.

Expand and Home Screen mode retain the V4 desktop/phone behavior. Physical
iPhone/Safari testing is still needed; desktop touch emulation is not proof of
physical-device compatibility.

Help contains separate music/SFX controls. All audio is original local Web
Audio synthesis. The pterodactyl pickup screech sounds only when it successfully
grabs you, not during approach, rejected grabs, release or escape.

## Implementation and limits

- [Story placement](src/story.js), [story events](src/story-events.js) and the
  [cinematic director](src/cinema.js) are separate from the core game loop.
- Existing `V4_*` implementation globals are retained internally for the reused
  RPG/menu/companion modules. They run only on this separate page.
- Window dinosaurs and cinematic props are presentation overlays, not indoor
  combat actors. Supplied sprites, portraits and backgrounds are reused; small
  tablet, coffee, ball, dust and action overlays are original Canvas art.
- Story flags, stats, equipment and recruitment are **session-only**. Refreshing
  starts over. Saves, XP rewards/leveling, combat damage and the endgame remain
  future increments.
- Existing road topology, sword, dogs, powers, unicorn and flight behavior are
  retained. No Tiled pipeline or shared deployment configuration was added.

## Emotion artwork prototype

[Coco's first emotion sheet](assets/characters/coco-emotions.png) contains six
transparent 64x64 frames: talking on row 0 and surprised on row 1, three frames
per row. These are front-facing authored edits of her supplied walking sprite,
not newly generated likenesses. Her original hair, clothing, legs and foot
anchor are retained. The prototype is awaiting style approval and is **not yet
used in gameplay or cinematics**.

[The drawing script](tools/draw-coco-emotions.ps1) reproduces the PNG and checks
unique frames, transparent outer margins and unchanged lower-body alignment.
An optional `-PreviewPath` exports an enlarged contact sheet separately; labels
never appear in the transparent sprite atlas.

## Verification

[Browser runner](tests/run.cjs) exercises desktop 1280x900, portrait 390x844 and
landscape 844x390, including real keyboard and CDP touch controls.
[Opening checks](tests/opening-checks.js) use unmodified gameplay and naturally
timed desktop cutscenes. [Chapter checks](tests/chapter-checks.js) use
response-only test hooks for collision-respecting routes and exact flight
boundaries, never production position/time setters. Core regression fixtures
start after the opening; real chapter tests do not bypass story prerequisites.
[Story-state checks](tests/story-state.cjs) cover callback idempotence, ordered
prerequisites, grouped recruitment and all fourteen playable characters.
[Audio-state checks](tests/sfx-state.cjs) verify the pickup screech's pitch
sweeps, mute/visibility suppression and cancellation of pending cinematic audio.

Run the existing browser harness with `PLAYWRIGHT_CORE` and `BROWSER_PATH`
pointing to your installed Playwright package and Chromium. Optional
`V4_ARTIFACT_DIR` is the inherited screenshot-output variable.

```text
node v5\tests\story-state.cjs
node v5\tests\sfx-state.cjs
node v5\tests\run.cjs
```
