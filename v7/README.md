# Gburg Village V7 - Beyond the Meteor

An isolated continuation of V6: the same family story, fifteen-character
roster, equipment, HP, dog companions and dinosaur combat, now connected to a
miniature tiled Earth and a first New York district. V1-V6 and source artwork
are not changed.

## Where to go

After finding Connor, Mom and Dad and finishing the opening neighborhood
montage, go to North Market. Follow the vertical street around the meteor
roundabout, then keep going **north of the meteor**. The upper road exit
automatically enters the overworld; its gold marker also works up close.

You arrive on foot near Gaithersburg. Walk west a short distance to the
parked private jet and its small airstrip. Board with **E / Space**, the
touch **Board** action, or the visible **Board jet** button.

## Overworld and jet controls

- On foot: WASD/arrows or the touch joystick. Run speeds up walking.
- Water and mountains block walking; forests can be explored.
- Boarding switches from overhead walking to a tilted, horizon-facing
  perspective flight view inspired by classic console RPG overworlds.
- Fly with WASD/arrows or the joystick; hold Shift / Run to boost.
- Flight crosses ocean, forests and mountains. Earth wraps horizontally;
  north/south polar boundaries stop travel beyond the map.
- **E / Space / Land** lands on open grass, sand or snow only. Water,
  mountains, forests and obstructed footprints reject landing with a message.
- The jet waits where you landed, including while visiting a city.
- World travel is peaceful: no dinosaur encounters, pterodactyl grabs or
  airborne weapon attacks. Normal V6 combat remains in the neighborhood.
- **Q / Map** opens a paused overview with your position and seven
  destinations. Selecting a name provides information/directions, not teleportation.
- Party menu, dialogs, world overview and hidden pages pause travel.
- The same party, HP, inventory, equipment and story progress survive
  world/city/neighborhood transitions. This release does **not** add saving:
  refreshing still starts a new adventure.

Gold destinations are playable: **Gaithersburg** returns to the north street,
and **New York** enters its first city blocks. Paris, Egypt, Japan, Russia and
Hawaii are marked as future chapters and do not pretend to have playable
interiors.

## New York first slice

Land near the supplied skyline icon, walk to its gold marker and enter.
The first district uses tiled pavement/asphalt and reusable building blocks
extracted from the supplied city sheets. Walk around solid buildings, visit
the pocket park, inspect the future subway and waterfront marker, and return
through the southern road to Earth. There are no NYC quests, building
interiors, subway travel or new recruits yet.

## Art and implementation

The originals remain in `art inbox/`. V7 stores only processed new artwork in
[assets/world](assets/world/):

- Seven 32px world terrain samples and a 128x96 terrain grid, classified from
  the approved Earth reference with small authored town/landing clearings.
- Full-world overview derived from the approved reference.
- An eight-frame jet sheet extracted from the supplied poses. The source's
  baked checkerboard is cleared outside the plane; the original is untouched.
- Transparent NYC skyline icon.
- Four city ground samples, four building blocks and a pocket-park patch
  extracted from the supplied NYC/Gburg sheets.

The image generator's sheets are not perfectly aligned, seamless production
tilesets. This release uses selected normalized pieces rather than assuming
every source cell is a valid tile. Coastlines use simple pixel edges; the world
is deliberately simplified, with exaggerated landing clearings and a walking
connection between Gaithersburg and New York. This is a first playable
overworld, not a geographically exact atlas.

The generated Earth is cached once; the flight view projects a rotated local
ground buffer into horizontal strips. The renderer uses existing HTML Canvas,
not Tiled, a new map editor, WebGL or a replacement neighborhood pipeline.
Flight uses the supplied top-down jet poses; banking is rendered with rotation.

Existing art is shared from earlier versions, including the user's cleaned
V6 dinosaur/Jeff sheets. V7 has its own copied runtime, scene-edit snapshot and
`gburg-v7-preferences` storage key. Internal V4/V5/V6 API names are retained
for compatibility. V6 Studio and its local Save behavior remain unchanged;
there is no new V7 authoring UI in this release.

## Local preview and validation

Run `.\v7\tools\Start-Game.ps1`, then open
http://127.0.0.1:5177/v7/. The local server is read-only; it does not save,
commit or publish.

- `.\v7\tools\process-world-art.ps1 -ValidateOnly`: dimensions, nonempty
  frames, transparent sprites and source hash preservation.
- `.\v7\tools\process-world-art.ps1`: create missing derivatives, preserving
  existing outputs. `-Rebuild` explicitly regenerates **V7 world derivatives
  and its terrain grid only**, never older versions or originals.
- `node v7\tests\world.cjs`: terrain schema, safe entrances, boarding,
  flight/boost/wrap/polar limits, landing rejection, plane retention, shared
  roster/art and connected NYC walking routes.
- `node v7\tests\run.cjs`: actual north road, overhead movement, overview,
  jet flight/landing, NYC round trip and adapted V6 danger/story suites.
  Use `V7_TEST_SUITES=world,danger,combat` and
  `V7_TEST_LAYOUTS=1280x900,390x844,844x390` to select coverage.

Browser checks need Playwright and Chromium, optionally supplied through
`PLAYWRIGHT_CORE` and `BROWSER_PATH`. `V7_ARTIFACT_DIR` writes screenshots
outside the repository. `V7_TEST_ORIGIN` can target the published site.
Tests inject fixtures only into intercepted responses, not shipped game APIs
or scene settings. Touch movement uses actual Chromium touch events.
Desktop/touch emulation is not physical iPhone verification.
