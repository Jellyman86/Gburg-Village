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
  by the tail; Brie keeps doing yoga. The original fourteen humans become playable.
  Brie and Kate wait near home.
- Five Guys HQ is a walkable interior off Market Square. Gary talks there but
  does not join yet. The central table and counters remain solid; aisles are open.
- Gather the original fourteen near the Market Square meeting point. Gary
  then leaves HQ and heads to North Market for four waves of five dinosaurs:
  flips, a rooftop leap, blasts and twenty individual smoke disappearances.
  After sitting, drinking water and saying "God bless the USA.", he becomes the
  fifteenth playable hero with his Patriot blaster. The meteor mystery continues.
- After Gary joins, a **new diamond on the existing Market Square map**, between
  the grass patches north of the family meeting spot and left of Five Guys,
  offers an optional celebration. It does not replace the string-lights marker.
  All fifteen celebrate against the supplied starry Kentlands Under the Lights
  backdrop. Falling meteors interrupt the party; Gary hears radio chatter.
  Paris, Egypt, Japan, Russia, Hawaii and New York follow in a quick montage.
  Back at the banquet, Coco says "I guess we are just getting started!" before
  the fade and "To be Continued" card. **Continue Playing as Gary** returns to
  the original plaza position. The card waits for click/tap or focused Enter/Space;
  Escape cannot dismiss it. The finale is one-shot and cannot unlock early.
- Village music continues through normal recruitment without restarting.
  Already recruited neighboring NPCs stay absent from subsequent rescue scenes.
  Chris hides faintly underwater during the invasion montage, but swims normally
  when found; neither pool scene uses his surprised pose.

Coco remains the narrative protagonist when another unlocked hero is selected.
Cinematics pause movement, combat, travel and character switching. They use the
existing gameplay canvas, supplied action poses and small character-anchored
speech bubbles, not a separate portrait/framed cinematic window. Objectives
and nonessential controls hide without changing the viewport size. Rewards
are one-shot; Gary requires all twenty dinosaur defeats.

## Controls

WASD / arrows move; Shift runs; E / Space interacts; X uses the equipped power.
M / Escape opens the RPG menu outside a cinematic. Touch uses the joystick,
Run and interaction buttons.

**Only the main meteor intro can be skipped.** Later story scenes play
automatically; Enter, Space and Escape do not advance or bypass them.
Hidden tabs pause story timers. Reduced-motion mode removes camera shake,
flips and decorative bouncing.
The optional finale also disables meteor travel, dancing displacement,
flashes and shaking with reduced motion; its wide sky shot preserves the stars.
Intro replay never resets recruitment or repeats completed chapter events.

Expand and Home Screen mode retain the V4 desktop/phone behavior. Physical
iPhone/Safari testing is still needed; desktop touch emulation is not proof of
physical-device compatibility.

Help contains separate music/SFX controls. All audio is original local Web
Audio synthesis. The pterodactyl pickup screech sounds only when it successfully
grabs you, not during approach, rejected grabs, release or escape.

## Implementation and limits

- [Story placement](src/story.js), [story events](src/story-events.js) and the
  [cinematic director](src/cinema.js) and [Gary finale](src/gary-finale.js) are
  separate from the core game loop.
- [Banquet finale](src/banquet-finale.js) owns the 48-second celebration,
  six-city montage and cinematic-only backdrop metadata. New scenes are not
  gameplay maps. [Banquet artwork processing](tools/process-banquet-art.ps1)
  preserves aspect ratios and source hashes while exporting seven backgrounds
  and the transparent six-frame meteor atlas.
- Existing `V4_*` implementation globals are retained internally for the reused
  RPG/menu/companion modules. They run only on this separate page.
- The supplied three-state dinosaur head is masked behind bedroom/kitchen
  window frames, not drawn as a blocky substitute. Uploaded reactions, yoga,
  Gary actions and the cinematic-only Vito/dinosaur sheet are processed into
  transparent derivatives by [the artwork tool](tools/process-story-art.ps1).
  [Action metadata](src/action-art.js) records real frame counts: single-pose
  uploads stay single poses. No fake character arms/legs are added.
  Vito's regular walking sprite/portrait remains unchanged. Small tablet,
  coffee, ball, energy-beam and smoke effects remain original Canvas art.
- Gary's epic battle score is original Web Audio synthesis and respects the
  existing music preference, mute controls and hidden-tab pause.
  The ending adds original happy cafe and dramatic organ-style scores plus
  meteor/radio effects, not recordings or melodies copied from commercial games.
  Optional hamburger/martini sprite uploads were not found; the supplied banquet
  backdrop's tableware is retained instead.
- Story flags, stats, equipment and recruitment are **session-only**. Refreshing
  starts over. Saves, XP rewards/leveling, combat damage and later chapters remain
  future increments.
- Existing road topology, sword, dogs, powers, unicorn and flight behavior are
  retained. No Tiled pipeline or shared deployment configuration was added.
- The recreation east street uses wider, overlapping road/sidewalk regions
  around its bends, making the dog encounter and Rock Band approach easier.
  Park/playground/court approaches and open gates are wider; benches are purely
  decorative. Pool water, buildings, closed fences and HQ furniture retain
  collision. The Rock Band door/return positions and outdoor route graph remain.
- Wardrobe and new outfit generation are deferred.

## Coco emotion artwork

[Coco's first emotion sheet](assets/characters/coco-emotions.png) contains six
transparent 64x64 frames: talking on row 0 and surprised on row 1, three frames
per row. These are front-facing authored edits of her supplied walking sprite,
not newly generated likenesses. Her original hair, clothing, legs and foot
anchor are retained. The user-approved frames play when Coco speaks while
standing still and reacts to the dinosaur in V5 cinematics. Moving characters
retain their supplied walking frames. These first emotion poses deliberately
face the camera so the small facial expressions are visible; other directional
poses retain their walking artwork; other supplied character reactions are
listed separately in the action manifest. Reduced-motion mode
uses a static pose instead of cycling the expression frames.

[The drawing script](tools/draw-coco-emotions.ps1) reproduces the PNG and checks
unique frames, transparent outer margins and unchanged lower-body alignment.
An optional `-PreviewPath` exports an enlarged contact sheet separately; labels
never appear in the transparent sprite atlas.

## Verification

[Browser runner](tests/run.cjs) exercises desktop 1280x900, portrait 390x844 and
landscape 844x390, including real keyboard and CDP touch controls.
[Opening checks](tests/opening-checks.js) use unmodified gameplay and naturally
timed keyboard and emulated-touch cutscenes. [Chapter checks](tests/chapter-checks.js) use
response-only test hooks for collision-respecting routes and exact flight
boundaries, never production position/time setters. Core regression fixtures
start after the opening; real chapter tests do not bypass story prerequisites.
[Story-state checks](tests/story-state.cjs) cover callback idempotence, ordered
prerequisites, grouped recruitment, HQ-only Gary and his twenty-defeat unlock.
They also check optional banquet prerequisites, acknowledgement, one-shot Gary
return, exact authored duration, reduced-motion effects and sky framing.
Chapter checks cover uninterrupted recruitment music, underwater versus swimming
Chris, paired-NPC absence, all fifteen banquet actors, six cities and meteor
frames, cafe/organ playback, mute/hidden-tab behavior, bounded ending controls
and exact return to the original plaza position.
[Scene-path checks](tests/scene-paths.cjs) verify all twenty reciprocal routes,
arrival connectivity, gate widths, decorative benches and protected obstacles.
[Gary choreography checks](tests/gary-finale.cjs) verify four five-enemy waves,
twenty separate smoke disappearances, rooftop/flip/hit actions and the ending.
[Audio-state checks](tests/sfx-state.cjs) verify the pickup screech's pitch
sweeps, mute/visibility suppression and cancellation of pending cinematic audio.
[Emotion checks](tests/emotion-checks.js) trace the actual PNG frames drawn in
the gameplay canvas, checking all six poses, fixed foot anchors, original
walking, absent story skip controls and static reduced-motion playback.

Run the existing browser harness with `PLAYWRIGHT_CORE` and `BROWSER_PATH`
pointing to your installed Playwright package and Chromium. Optional
`V4_ARTIFACT_DIR` is the inherited screenshot-output variable. Set optional
`V5_TEST_SUITES` to comma-separated `core,display,recreation,content,intro,
navigation,opening,chapter,emotions` selectors and `V5_TEST_LAYOUTS` to
comma-separated `1280x900,390x844,844x390` for targeted runs.

```text
node v5\tests\story-state.cjs
node v5\tests\sfx-state.cjs
node v5\tests\scene-paths.cjs
node v5\tests\gary-finale.cjs
node v5\tests\run.cjs
```
