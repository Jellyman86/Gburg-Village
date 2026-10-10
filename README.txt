FAMILY WALK - MARKET SQUARE
Version 0.3 | Jason, Connor, Coco and Peachy

START HERE
Extract this entire ZIP first. Open index.html in Chrome, Edge, Firefox or
Safari. No install, build step, account, server or internet is needed on a
desktop. play.html is a standalone copy with all runtime artwork embedded.

CONTROLS
WASD / arrows: walk. Hold Shift: run. E / Space: look at a nearby landmark.
Click the gold diamond when nearby to inspect it. Escape: close a dialog.
Click a character portrait or press 1-4 to change the playable character.
The other family members wait at the meeting spot. Switching preserves your
current position; this version does not include a following party.

PHONE / TABLET
Drag the left joystick to move. Hold Run with your other thumb to run.
Tap Look near a landmark; tap portraits to switch characters. Portrait and
landscape layouts are supported; landscape shows more of the neighborhood.
To play conveniently on a phone, serve this folder on static web hosting
and open its HTTPS URL. You can alternatively host only play.html. This
ZIP does not itself create a hosted URL. Mobile file-preview apps may show
HTML as text instead of running it, so use an actual browser web page.
Touch controls were tested with Chromium mobile emulation, not physical
phones or Safari. See TEST_RESULTS.txt for the checks that actually ran.

FOLDER GUIDE
index.html                         Editable game entry point
play.html                          Self-contained portable game
style.css                          Desktop, phone and tablet layout
src/characters.js                  Character registry and movement speeds
src/map.js                         Authoritative map, collision, landmarks
src/game.js                        Input, camera, collision and rendering
assets/characters/jason/           Jason's reusable sprite assets
assets/characters/connor/          Connor's sprites with his green cap
assets/characters/coco/            Coco's floral dress and curls
assets/characters/peachy/          Peachy's highlighted hair and cream top
assets/maps/kentlands/             Map artwork and exported map metadata
tools/                            Asset export and portable-game build
tests/                            Repeatable browser tests and QA captures
preview.png / mobile-preview.png   Actual game screenshots

EACH CHARACTER FOLDER
sheets/walk_4dir.png  256x256 RGBA atlas: 4 columns, 4 rows.
frames/              16 individual transparent 64x64 PNGs.
strips/              Four 256x64 directional animation strips.
character.json       Frame rectangles, directions, speed of animation,
                     and the foot anchor (32,60).
sprite_preview.png   Nearest-neighbor enlargement for inspection.
source/              Original higher-resolution generated artwork.

ANIMATION CONTRACT
Row order: down, left, right, up. Columns: frames 0,1,2,3. Idle: frame1.
Walk: 8fps. Run: 12fps. Feet share y60; all hair and hats fit inside each
frame with transparent padding. Use nearest-neighbor filtering.
Jason's existing detailed artwork is preserved. Children have shorter
silhouettes inside the same 64x64 frame size to share a common game scale.
64x64 exports are the runtime assets; source images preserve more detail
for future art revisions. Do not treat raw source images as aligned atlases.

GROWING THE PROJECT
Add a character folder and register its sheet in src/characters.js. Keep
the same frame dimensions and origin to reuse the movement renderer.
Edit a canonical sheet, then run tools/export_frames.py to refresh the
individual PNGs, strips and previews. The game reads the canonical sheets.

Add another location under assets/maps/<map-id>/. This first location uses
one illustrated background, with collision rectangles and six landmark
zones in src/map.js. map.json is an export of that tested configuration.
For a larger town, the next step is a second small map and an exit between
them. A future tilemap can replace the backdrop without reorganizing the
character folders. This is an interpretation of your photos, not a measured
street map. Building interiors and NPC dialogue are not implemented yet.

BUILD / TEST
Python 3 is needed only for developer scripts, not to play.
pip install pillow playwright
python tools/build_portable.py
python tests/test_family.py
python package.py
The tests use installed Chrome. Set CHROME_PATH to its executable if it is
not in the Windows default location used in tests/test_family.py.
After changing game code or art, rebuild play.html and rerun tests before
packaging. package.py checks the test report and asset contract, generates
a SHA-256 manifest, and creates ../FF_Village_Project.zip.
