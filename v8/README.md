# V8 — Island Skies

Play: https://jellyman86.github.io/Gburg-Village/v8/

V8 is isolated from V1–V7 and self-contained: every image it loads lives in `v8/assets/` and is declared in `data/art.json` (see the [development guide](../docs/DEVELOPMENT.md)). Preferences and cinematic overrides are V8-local; the existing Music preference remains shared.

## What's new

- Florida's peninsula is authored in the logical Earth grid, so terrain rendering, overview, walking collision and jet landing use the same geography.
- Three scattered overworld pterodactyls are curious, not hostile. They follow nearby walkers or the jet for three seconds, peel away, and have a long cooldown. They do not damage, grab, move the hero, or participate in combat.
- Original synthesized flight music starts on boarding and changes back on landing. Hawaii has its own relaxed tropical, plucked-string theme. Mute, user-gesture audio unlock, cinematic priority and hidden-tab suspension are preserved.
- Hawaii is now a playable destination with four supplied backgrounds: Central Fountain Plaza, North Scenic Overlook, East Waikiki Beach, and West Tropical Market. Central's **south** entrance connects to Earth. Each branch has a return route.
- Nine wild dinosaurs use existing combat, powers, healing and companion systems. Party, HP, items and the parked jet survive the visit.

## Getting there

Follow the road north of the meteor to Earth. Board the jet with **E / Board**. **W / Up** flies forward, **S / Down** reverses, and **A/D / Left/Right** turns; the touch joystick matches. Hold **Shift / Run** for boost. **Q / Map** gives destination directions, not fast travel.

Land near Hawaii's gold marker on clear ground, then walk to it and press **E / Go**. Fountain Plaza's north path leads to the overlook, east bridge to the beach, and west bridge to the market. Walk through exit arrows or interact with their nearby markers. Step away from an arrival before crossing back; arrival guards prevent automatic bouncing.

## Lightweight future-area workflow

1. Import the background: `node tools/import-art.cjs scene <id>` picks the matching `Scene - ….png` from the art inbox, writes an optimized WebP to `assets/scenes/`, and declares `scene.<id>` in [data/art.json](data/art.json) with its inbox provenance.
2. Add a small definition modeled on [hawaii.js](src/hawaii.js): stable id, `art: 'scene.<id>'`, dimensions, spawn, walking polygons/rectangles, solid scenery, exits/arrivals, dinosaur spawns, region, music and `worldSite`. The manifest guarantees the authored size matches the image.
3. Register the definitions with [areas.js](src/areas.js) and add the world destination. Area definitions automatically supply enemy spawns and region/map metadata; no separate combat implementation is needed.
4. `npm run test:quick` runs connectivity and browser checks; inspect the actual screenshots. Paths still need to be traced against the artwork—AI-generated scenery is not automatically a reliable collision map.

Everything runs through the repository task runner (`npm install` once; see [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) for the art import, test and preview commands). The underlying scripts can also be run directly; `PLAYWRIGHT_CORE` and `BROWSER_PATH` may point to an already installed package/browser:

```powershell
node .\v8\tests\areas.cjs
node .\v8\tests\world.cjs
$env:V8_TEST_SUITES='world,hawaii'
node .\v8\tests\run.cjs
```

`V8_TEST_LAYOUTS` selects comma-separated layouts (`1280x900`, `390x844`, `844x390`). `V8_ARTIFACT_DIR` writes screenshots to an existing directory. `V8_TEST_ORIGIN` selects a hosted origin for the same checks. `scenes` and `danger` cover retained recruitment, combat, healing and companions; `combat` runs the broader inherited story/combat suite.

Local read-only preview: `node .\v8\tools\server.cjs`, then http://127.0.0.1:5180/v8/. Set `GBURG_V8_PORT` to choose another port.

## Music

Each hero has a theme that starts when you play as them; the jet plays *Levels*; Hawaii and the cutscenes keep their original themes until a playlist is assigned. Music is always on (after your first tap). **Options** offers the music mode — On (place playlists) or Themed (hero themes), with Off for silence — a music-only volume slider, a track per place (or rotate a playlist) and an override for any hero's theme, all saved on your device. Tracks are MP3 and the original synthesized themes remain selectable. Shipped defaults: [data/music.json](data/music.json).

## Collision editor

`npm run studio` opens Gburg Studio at http://127.0.0.1:5181/v8/studio/: every scene's walkable and blocked shapes, markers, road strips, spawn and bounds drawn over the real background, with a walk-test layer that shows exactly where the game blocks movement. Move, resize, add or delete shapes and Save; the game reads the result from [data/scene-geometry.json](data/scene-geometry.json) at load. The same page is published read-only as a viewer: https://jellyman86.github.io/Gburg-Village/v8/studio/.

## Limits and verification

The Hawaii images are separate illustrated rooms with transitions, not seamless tiles. Oceans, waterfalls, cliffs, planted beds, fountains, buildings and distant skyline are scenery, not walking routes. Shop interiors and new Hawaii quests/recruits are not included. Geography remains stylized and coarse; Florida is not a separate city scene. No Tiled pipeline is introduced.

Progress remains session-only; refreshing starts over. Music is MP3 tracks plus the original synthesized themes; see the Music section.

Local contracts validate safe arrivals, connected routes to every exit/interaction/enemy, solid scenery, logical Florida and timed harmless followers. Browser checks pass desktop and both touch layouts for travel, actual rendered Hawaii art, real combat, paused menus, parked-jet/party retention, flyer rendering and distinct nonempty/unclipped audio buffers. Retained recruitment checks pass on desktop; shared combat/healing/companion checks pass all three layouts. Touch testing is Chromium emulation, **not physical iPhone verification or a human audio-listening claim**.
