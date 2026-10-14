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
- **W / Up** flies forward into the main view; **S / Down** reverses.
  **A / D / Left / Right** turns the jet and camera, including while stationary.
  Touch joystick up/down controls forward/reverse; left/right turns.
  These controls are camera-relative, not fixed compass directions.
- Hold **Shift / Run** to boost. Engine flames animate only while boost is
  held, cycling only the three actual flame poses (not the blank pose in
  their source row); normal flight and the parked plane use the no-flame pose.
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

- Cleaned 32px bases, fitted coast/grass-desert/grass-snow transitions, and
  transparent forest/mountain variants extracted from `World Map Tileset V4.png`.
  Source tile frames are excluded, ground is made opaque, and detached sprite
  fragments are removed. Original artwork is never overwritten.
- The existing 128x96 collision grid remains classified from the approved
  Earth reference with the same town clearings and local walking connection.
  Neighbor-aware visual selection does not modify that geography.
- Overview and flight minimap use the actual rendered terrain; the minimap
  includes a heading indicator. The original concept overview derivative is retained.
- An eight-frame jet sheet extracted from the supplied poses. The source's
  baked checkerboard is cleared outside the plane; the original is untouched.
- Transparent NYC skyline icon.
- Four city ground samples, four building blocks and a pocket-park patch
  extracted from the supplied NYC/Gburg sheets.

The image generator's sheets are not perfectly aligned, seamless production
tilesets. This release uses selected normalized pieces rather than assuming
every source cell is a valid tile. Shoreline endpoints are fitted in processed
copies; neighbor-selected edges, convex corners and inner corners replace the
old straight beige strips. Grass is the shared underlayer for forests and
mountain ridges, with deterministic feature variants instead of solid texture
squares. Small inner corners are procedurally constructed; not every supplied
transition is used. The world hero is larger (0.8 instead of 0.45 sprite scale).
The existing coarse grid still limits coastline shapes and includes classified
inland water patches; this is not an exact FFVI recreation or a replacement
geography/collision system. Art boundaries soften the same logical cell edges.

Chris's recruitment shots now show only the surface swimmer. His translucent
underwater hiding pose remains in the opening swim-panic montage.

Vito's recruitment alone uses the approved clean-shaven copies of the original
wrestle/throw/recover sheets in `assets/characters/`. Only facial pixels were
retouched; mouth interiors, alpha, frame sizes, timing, costume and dinosaur
are unchanged. The montage and playable Vito still use their original art.

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
- `.\v7\tools\process-terrain-art.ps1`: create missing coordinated terrain
  derivatives without touching the old importer outputs or grid.
  `-ValidateOnly` checks dimensions, all ground/transition pixels are opaque,
  binary-alpha nonempty feature frames, and unchanged source hashes.
  `-Rebuild` explicitly regenerates only the four new terrain atlases.
- `node v7\tests\world.cjs`: terrain schema, safe entrances, boarding,
  camera-relative forward/reverse/turn/boost/wrap/polar limits, boost-only
  flame frames, visual neighbor selection without geography mutation,
  landing rejection, plane retention, shared roster/art and connected NYC routes.
- `node v7\tests\run.cjs`: actual north road, overhead movement, overview,
  jet flight/landing, NYC round trip and adapted V6 danger/story suites.
  The `scenes` suite checks Chris recruitment/montage actor counts and Vito's
  recruitment-only sprite draws, unchanged montage and natural one-time reward.
  Use `V7_TEST_SUITES=world,scenes,danger,combat` and
  `V7_TEST_LAYOUTS=1280x900,390x844,844x390` to select coverage.

Browser checks need Playwright and Chromium, optionally supplied through
`PLAYWRIGHT_CORE` and `BROWSER_PATH`. `V7_ARTIFACT_DIR` writes screenshots
outside the repository. `V7_TEST_ORIGIN` can target the published site.
Tests inject fixtures only into intercepted responses, not shipped game APIs
or scene settings. Touch movement uses actual Chromium touch events.
Desktop/touch emulation is not physical iPhone verification.
