# Game repair progress and handoff

Last updated: 2026-10-10 (America/New_York)

## Goal
Make music and the roaming/chasing dinosaur work on mobile as they do on PC. Place the dinosaur near Center Point Way so encountering it is a surprise. Preserve working desktop behavior.

## Current checkpoint
- The user reports music and the dinosaur work on PC but the recent updates are missing or not working on mobile.
- Earlier chat attempts reported that play.html was an older copy missing music and the dinosaur. This is a prior finding, NOT yet reverified against the current repository.
- Multiple chats were interrupted; one showed an "invalid body" error. Do not assume proposed changes were committed.
- This checkpoint adds documentation only. No game fixes or deployment checks have been performed in this checkpoint.
- GitHub access and default branch main were verified. Root AGENTS.md and PROGRESS.md were absent before this log was created.

## Resume here
1. Read this file, inspect current main and recent commits, and check any applicable repository instructions.
2. Find the desktop and mobile entry points, including play.html, and compare their actual music and dinosaur code. Determine which URL/redirect mobile loads.
3. Save the smallest complete fix to bring the mobile entry point up to date. Record the commit and checks below.
4. Inspect audio startup on user gestures, music toggle behavior, and resume after backgrounding. Fix as needed; real iPhone audio remains a device check.
5. Inspect dinosaur spawn and roaming/chase logic. Move its home/spawn near Center Point Way; verify using actual map coordinates.
6. Investigate caching only from evidence (headers, service worker, redirects, asset URLs). Do not claim caching is the cause without checking.
7. Verify the deployed game separately from the repository. Ask the user for an iPhone check after the saved changes are published.

## Working method
- Use small tool payloads and bounded output; do not dump large HTML or embedded assets into the chat.
- Save completed, coherent changes in small commits. Update this log after each checkpoint and before switching tasks.
- Record what changed, why, affected files, commit identifiers, checks performed, failures, and the precise next action.
- Distinguish proposed, edited, committed, deployed, and device-verified status.
- If a write returns an ambiguous error, read GitHub before retrying so work is not duplicated or overwritten.
- Never mark a task complete based only on a planned action or a successful file write.

## Environment note
On 2026-10-10 the local command runner failed before executing with sandbox provisioning error helper_sandbox_lock_failed. GitHub connector reads work, so use the connector if the local runner remains unavailable. This error does not establish a game defect.

## Checkpoint history
### 2026-10-10: persistent handoff initialized
- Added this log at the user's request so interrupted chats can resume reliably.
- Game repair status: pending repository inspection.
- Next action: inspect entry points and current commits; verify the prior play.html mismatch.

## Agreed recovery strategy — 2026-10-10, 13:08 America/New_York
This section takes precedence over the earlier resume order and connector fallback advice.

### Evidence and uncertainty
- The user's screenshot shows "This conversation is too long to continue" while a GitHub Update File approval is displayed.
- The Update File tool requires complete replacement file contents. A large HTML payload is a suspected contributor, not a proven cause: the failed request payload was not available for inspection.
- This conversation failure is distinct from the game's mobile behavior. Do not claim to have diagnosed the mobile bug from that screenshot.
- Current PROGRESS.md was read in this session. No game files were changed or deployment/device checks performed.
- The local command runner executed successfully in this session; the earlier provisioning failure may no longer apply. No local repo checkout was found by the bounded search. Git clone, authentication, and push availability remain unverified.

### Required next steps
1. Establish a file-based Git workflow in the working environment. Check repository access and applicable instructions, obtain a checkout, and verify the authenticated remote/write route as far as possible without an unnecessary test commit. Do not expose credentials.
2. FIRST CHECKPOINT: establish that the large HTML can be edited and transported as a file through Git without placing its full contents in conversation messages or a giant GitHub Update File request. No giant-file update retry.
3. Inspect actual desktop/mobile entry points and deployment routing using bounded excerpts and local analysis. Verify whether play.html is stale and determine the mobile URL before deciding on a fix.
4. Make the smallest evidence-based correction for music and dinosaur behavior; retain the requested Center Point Way spawn. Check code and relevant mobile behavior, noting any limits of emulation.
5. Save coherent changes and update this log with files, diagnosis, checks, commit identifiers, and precise next action. Push via the verified file-based route.
6. Verify deployment independently, then request an actual iPhone test from the user.

### Guardrails
- Keep large HTML and embedded asset data out of chat and tool output; report only bounded excerpts, sizes, hashes, diffs where safe, and concise results.
- Do not repeat the giant-file Update File approach. Small documentation-only updates such as this log are permitted.
- If the file-based editing/upload route is blocked, stop before any large write and explain the exact blocker. Do not silently fall back to the previous failing approach.
- Keep operations small and save checkpoints. Never promise that the app cannot crash.
- Distinguish proposed, locally edited, committed, pushed, deployed, and iPhone-verified work. A log entry alone does not establish the status of game changes.

### 2026-10-10, 13:09 America/New_York: baby step 1 — Git access check
- User requested small steps with each attempt logged.
- Git is installed and the local command runner works.
- About to test read-only remote access for this repository with interactive prompts disabled. No game changes or test commits will be made.
- If remote access fails, record the exact failure before choosing the next route. Do not fall back to a giant connector write.

- Result: read-only Git access SUCCEEDED; remote HEAD matched the checkpoint commit 6409d32.
- Baby step 2: clone the repository to local disk, inspect repository instructions and file sizes, then test push negotiation with --dry-run. Large file contents will not be printed. A dry run does not prove that a subsequent real push will be accepted.

### 2026-10-10: baby steps 1–2 results — stopped at write-route blocker
- Read-only Git access and shallow clone succeeded. Local checkout: /workspace/scratch/1ab4fb53ebd3/Gburg-Village (transient; re-clone if missing).
- Git push negotiation failed: command GIT_TERMINAL_PROMPT=0 git push --dry-run origin HEAD:main returned exit 128, "fatal: could not read Username for 'https://github.com': terminal prompts disabled". Read success does NOT establish authenticated write access.
- No game files were edited, no build was run, and no Git push succeeded.
- Inspected index.html and tools/build_portable.py only. The existing Python builder embeds assets and current source into play.html on disk, which is a promising way to rebuild without printing the bundle. index.html loads src/characters.js, src/map.js, and src/game.js.
- No AGENTS.md appeared in the bounded tracked-file search. Mobile entry point, source/bundle parity, and deployment behavior remain unverified.
- STOPPED per agreed guardrail: file-based Git write access is blocked by unavailable authentication. Small progress-log updates through the connector still work; no giant Update File request was attempted.
- Next action: establish an authorized authenticated file-based push route, or agree on an alternative that transports the generated bundle without a giant connector request. Do not request that the user paste credentials into chat. Resume game diagnosis only after resolving the workflow checkpoint.

### 2026-10-10, 13:12 America/New_York: baby step 3 — alternate upload strategy
- Checking existing authentication found no gh CLI, no configured Git credential helper or URL rewrite, and no GitHub token variable among environment variable names. No secret values were printed.
- Direct authenticated Git push remains unavailable. Do not attempt credential guessing or a large connector write.
- Confirmed local play.html size: 5,402,535 bytes. Existing portable builder is a small Python script; no netlify.toml or root _redirects file exists in the checkout.
- Next investigation: whether a small deployment build configuration can run the existing builder on the hosting service, avoiding upload of the generated HTML entirely. This is an alternative under investigation, not an implemented fix. Small connector writes are already verified through this log.

### Baby step 3 result — local build route validated
- Ran tools/build_portable.py in a temporary copy of index.html, style.css, src, assets, and tools. Build exited 0 and embedded 5 assets. The temporary copy was then removed; repository game files were not changed.
- Generated bundle: 5,410,884 bytes. It contains the exact current src/game.js; the committed 5,402,535-byte play.html does not. This confirms source/bundle mismatch, but not which bundle the user's phone loads.
- Official Netlify docs confirm netlify.toml can specify a build command: https://docs.netlify.com/build/configure-builds/file-based-configuration/ . Candidate command: python3 tools/build_portable.py. This would generate the large file at build time without transmitting its contents through chat.
- This is a deployment-build alternative, NOT a restored Git push route. It depends on the actual site using Netlify Git-based builds. No deployment config was added and no game deployment was changed.
- Next: get/verify the exact game URL used on the iPhone and establish whether its host builds this GitHub repository. Then inspect source/bundle feature differences and determine whether the small build configuration is appropriate before applying it.

### 2026-10-10, 14:25 America/New_York: baby step 4 — actual deployed URL checked
- User supplied https://gburgvill.netlify.app/ . Downloaded responses locally with bounded summary output; no large source/bundle output.
- Root / returns 200 with a 2,412-byte index.html matching the checkout; it loads src/game.js directly, with no mobile redirect in this HTML.
- Live src/game.js is 10,762 bytes, SHA256 312c1f7307f3dfee2b607f40b207ad3dd97a33409699db56485649b89b447aec. It contains none of AudioContext, dinoHome, drawDino, or music.
- Live play.html is 5,402,678 bytes, SHA256 846a78658d4f18fb191cab1cb73c8247cde25c3c933f2fb2de299e9febc9c7e4; those same feature markers are absent.
- Repeated requests with a unique diagnostic query and Cache-Control: no-cache returned the same old feature-free code. Responses identify Netlify and public,max-age=0,must-revalidate.
- Fresh GitHub read confirms current src/game.js blob ad90a8f07fbc7782a2858354495a947da1b27610 DOES contain AudioContext, dinoHome, drawDino, and music (19,101 characters).
- Live /PROGRESS.md returns 404. GitHub combined status for checkpoint dd253b57aca54229ce41b0c85e78c16a4a90f9c6 has no statuses. These facts do not prove how Netlify is connected.
- DIAGNOSIS: the supplied live site serves older source lacking both requested features. Stale play.html alone is not the explanation for this root URL. Current GitHub source has not reached this deployed response; no physical iPhone test yet.
- No game changes or Netlify configuration changes were made. Do not add speculative caching fixes or assume iOS audio is the primary issue before deploying current source.
- Next baby step: inspect Netlify's deployment source/latest deploy for gburgvill to determine whether GitHub continuous deployment is configured, failing, or absent (e.g. manual upload). User can provide a screenshot of its Deploys page. Once established, deploy current source and arrange portable rebuild as appropriate, then verify live features and ask for iPhone testing.

### 2026-10-10, 14:33 America/New_York: corrected target — GitHub Pages mobile audio
- User clarified the intended URL is https://jellyman86.github.io/Gburg-Village/ and reports the game works there but mobile has no sound. Netlify deployment repair is not the active goal.
- Live Pages root (2,412 bytes) and src/game.js (19,111 UTF-8 bytes) both match the local current source exactly. Live source includes music, dinosaur, AudioContext resume, unlock buffer, and touchend/click/pointerdown gesture handlers. Therefore missing deployed audio code is NOT the issue at this target.
- Read current music implementation: it synthesizes music via Web Audio, starts after gestures, and displays Music On / Off / Tap for music based on state.
- The user's earlier screenshot visibly shows the iPhone silent-mode bell icon. This may be relevant but does not prove the current phone setting or cause.
- WebKit documents that default Web Audio can obey iOS Silent Mode: https://bugs.webkit.org/show_bug.cgi?id=252746 and https://bugs.webkit.org/show_bug.cgi?id=237322 . Working hypothesis: silent mode is muting synthesized music even if the button says On.
- Next smallest diagnostic: ask user to turn Silent Mode off, raise media volume, then tap the game music button. If still silent, obtain the exact button label and whether opened in Safari or an in-app browser before changing code.
- No game code changed. No giant payload sent. Await physical iPhone diagnostic result; do not claim an audio fix yet.

### 2026-10-10, 14:46 America/New_York: squirrel encounter authorized
- User requested the suggested squirrel encounter: a brief animated dash, funny family reaction, then departure. Also asked about using a cheaper model for later sprite-sheet additions.
- Plan: add a small pixel squirrel drawn in canvas, spawn only on a clear nearby route visible to the player, briefly pause/sniff, then dash away. Space encounters apart and avoid interrupting Rex chases. No additional asset downloads are needed.
- Working in src/game.js only for gameplay; current root GitHub Pages loads this file directly. Small source updates through the connector are allowed; the 5.4 MB portable bundle will not be transmitted through chat. Portable bundle parity remains a separate unresolved limitation.
- Next: implement locally, check movement/timing/collision and source syntax, save source through a bounded connector update, then verify deployment and record status.

### Squirrel implementation checkpoint
- Saved src/game.js in commit 44c3abe4e76f9c258b084824c56080edc0d1daed. Update was about 22 KB, sent programmatically from local disk; no full code or embedded assets printed into chat. No large portable HTML update attempted.
- Adds pixel squirrel with curled tail and animated feet; nearby clear-route selection, brief sniff pause, selected-character reaction, and 45–80-second cooldown. First eligible encounter after 8 seconds while moving. Encounters wait during Rex chases; game/dialog timing remains governed by existing update loop.
- Added read-only squirrel state to window.GAME.state for diagnostics.
- Verification: node --check passed. VM exercised first encounter, Coco reaction, sniff pause, despawn, cooldown and movement/chase guards. Checked 1,170 eligible routes across actual map obstacles; sampled routes remained clear and within the viewport.
- Limit: no physical iPhone or visual browser test yet. Standalone play.html remains older; active target is root GitHub Pages loading src/game.js. Checking Pages deployment next.
- User asked whether a cheaper model can add sprite sheets later. Suggested next scope is integration from an exact sprite contract (dimensions, frame order, transparency, feet anchor, and existing examples); no sprite sheet assets were requested or created in this step.

- Deployment check attempt: direct HTTPS request to GitHub Pages was blocked by this session's network restriction (URLError: Operation not permitted). Source is committed in GitHub, but Pages deployment and physical iPhone behavior are not verified. Next action: reload root Pages on the phone, walk for 8+ seconds on the plaza, and observe squirrel dash/reaction; retry live-source verification when allowed.


### 2026-10-10: Stephanie and Mark sprite creation checkpoint
- User corrected the task: do NOT replace or edit Connor. Create new Stephanie and Mark sprite packs.
- Read PROGRESS.md and src/characters.js before creation. Existing contract: 64x64 frames, four frames per row, rows down/left/right/up, foot anchor (32,60), walk 8 FPS / run 12 FPS.
- Started separate transparent pixel-art 4x4 walking-sheet generations, matching the existing game style.
- This is asset creation only. No existing sprite, character settings, gameplay, or play.html changed. Generation, exact frame sizing, alpha, foot alignment and animation validation are not complete at this checkpoint. No new characters integrated or deployed.
- Next: inspect generated sheets; normalize and validate each frame against the contract before any game integration. Keep large HTML and embedded asset data out of chat.

### Stephanie and Mark artwork results
- Generated and displayed separate 16-pose source sheets. Visually checked front/left/right/back rows.
- Verified both PNGs are RGBA with alpha spanning 0 to 255. Mark source is 1312x1199; Stephanie source is 1254x1254. They are source artwork, NOT drop-in 256x256 game sheets. Some poses are too similar; walk-cycle cleanup remains necessary.
- Outputs in this session: generated_images/exec-b8794f2f-18e3-40e3-9a06-3c2e4c4b0158.png (Mark); generated_images/exec-23f59f0c-da08-4486-8283-2e0746c9cca9.png (Stephanie). Generated images are retained by the conversation; scratch paths are transient.
- No assets integrated, no game movement test performed, no gameplay deployment claimed. Next implementation step: prepare consistent 64x64 frames at (32,60), verify alternating feet and loop continuity, then integrate only if requested. Connor remains unchanged.

### 2026-10-10: Stephanie and Mark normalization and preview complete
- User authorized finishing frame alignment and animation preview before creating more people.
- Prepared two 256x256 transparent atlases with sixteen 64x64 frames each, rows down/left/right/up, baseline at y=60 and foot origin (32,60). Used one scale per character; removed disconnected exterior alpha speckles. Preserved original source art.
- Corrected repeated leading feet in down/up rows by opposing only lower-leg regions for frames 2/3; preserved upper-body artwork. Retained source side-view poses.
- Checks passed: atlas/frame dimensions, binary alpha, no edge clipping, all foot baselines exactly 60, four distinct frames per direction. Visually inspected both normalized atlases and four consecutive preview frames for all eight loops. Rendered 32-frame GIF at 8 FPS with translating sprites and foot-origin markers; loop directions and foot placement checked. Preview panel motion intentionally restarts.
- Deliverable: Stephanie_Mark_Sprite_Pack.zip (2,809,130 bytes), saved file identity libfile_9dd756d683d4819183775feeba8fc66b. Contains sheets, frames, strips, character configs, original sources, walking_preview.gif, README, validation.json and reproducible preparation script. Session local path: /workspace/scratch/db84f21c5f3d/output/Stephanie_Mark_Sprite_Pack.zip.
- Asset preparation is complete. NOT integrated into live gameplay, NOT deployed and NOT iPhone-tested. Existing game files and Connor unchanged. Next: more character artwork or explicitly requested game integration with character UI/spawn settings and browser/mobile validation.

### 2026-10-10: Adam and Kate sprite creation started
- User requested new Kate and Adam sprite packs in the existing pixel style.
- Separate transparent 4x4 walking-sheet generations started. Next: normalize to existing 64x64 frame / (32,60) foot contract, inspect all direction cycles and movement preview, save reusable pack. No live gameplay or existing characters changed.

### Adam and Kate sprite pack completed
- Created separate source sheets with built-in image generation.
- Normalized to 256x256 RGBA atlases, sixteen 64x64 frames per person, down/left/right/up row order, foot origin (32,60), nearest rendering. Corrected front/back lower-leg phase to alternate feet while preserving upper-body details; retained original side poses.
- Checks passed: exact sheet/frame dimensions, transparent binary alpha, no frame edge clipping, every frame ends at foot baseline y=60, four distinct frames per row. Inspected both atlases and four consecutive preview frames for all eight direction loops. Rendered 32-frame moving GIF at nominal 8 FPS; movement segments restart within panels.
- Saved Adam_Kate_Sprite_Pack.zip, 3,933,967 bytes, file identity libfile_bde399600eb48191b2e9550554c22fc2. Contains source art, frames, strips, sheets, character.json files, GIF, README, validation results and preparation script. Session path: /workspace/scratch/db84f21c5f3d/output/Adam_Kate_Sprite_Pack.zip.
- Asset preparation complete; new characters NOT integrated into gameplay, NOT deployed and NOT iPhone-tested. Existing game assets, Connor and play.html unchanged.

### 2026-10-10: Brie and Vito sprite creation started
- User requested new Brie and Vito sprite packs.
- Started separate transparent 4x4 sheet generations, matching existing Jason style. Next: 64x64 frame normalization, foot alignment and movement-preview checks, save reusable pack. No gameplay integration requested; existing characters unchanged.

### Brie and Vito sprite pack completed
- Generated separate source sheets for Brie and Vito. Sources retained.
- Prepared 256x256 RGBA atlases with sixteen 64x64 frames each, rows down/left/right/up, foot origin (32,60). Corrected front/back lower-leg phase without mirroring upper-body artwork; original side poses retained.
- Checks passed: frame/sheet dimensions, binary transparency, no edge clipping, every foot baseline y=60, four distinct frames per direction. Visually reviewed both atlases and four consecutive movement-preview frames for all eight loops. GIF has 32 frames at nominal 8 FPS, translating sprites and foot-origin markers; panel movement restarts intentionally.
- Saved Brie_Vito_Sprite_Pack.zip; file identity libfile_305e7a06d8788191bc17b8c30405c19c. Contains sources, frames, strips, atlases, configs, GIF, README, validation and preparation script. Session path: /workspace/scratch/db84f21c5f3d/output/Brie_Vito_Sprite_Pack.zip.
- Asset preparation complete. No new character is integrated/deployed or physical-iPhone verified. Existing characters and play.html unchanged.

### Sprite pack revision — in progress
- User requested a revision to the latest sprite pack. The previous pack is superseded pending asset preparation and preview checks.
- Next: finish revision, validate frame alignment and animation, update the existing deliverable. No game integration or deployment in this step.

### Sprite pack revision completed
- Updated the existing latest sprite pack deliverable and its preview. Earlier version is superseded.
- Rechecked 64x64 frames, 256x256 atlases, transparency, foot baseline, no edge clipping and direction animation previews. Other character assets verified byte-identical across 24 files.
- No game integration or deployment. Next: additional requested sprite work or authorized game integration. Public log retains task status only.

### Source row crop correction
- Equal quarter-height source slicing clipped content in the final row. Source artwork was intact. Updated preparation to detect empty row separators for the revised atlas; source edges are now [0,317,612,908,1254].
- Added source-boundary assertions, rebuilt atlas/frames/strips and preview, visually reviewed all four consecutive animation frames. Dimensions, transparency, foot-baseline and no-clipping checks pass. Other character assets remain byte-identical across 24 files.
- Updated the existing sprite pack version. No gameplay integration or deployment. User asks about later integration and superpowers; full feature list may be supplied next, with powers implemented incrementally after normal movement is verified.

### 2026-10-10: Six-character game integration — local checkpoint
- User authorized adding all six prepared characters to Family Walk. Added runtime atlases/configs and registered Stephanie, Mark, Adam, Kate, Brie and Vito.
- Added clear plaza positions, a horizontally scrolling character picker, keyboard shortcuts 1–9/0, and a shared squirrel interaction fallback. Original character assets retained.
- Source syntax checks and all six atlas dimension/transparency/frame-margin/foot-baseline checks pass. Browser movement and layout verification pending; not yet published.

### 2026-10-10: Integration browser checks passed
- Verified all ten picker entries load, all actor positions clear collision bounds, and each new character switches with keys 5–9/0 and scrolls into view.
- Chromium checks passed at desktop 1280x900, phone portrait 390x844 and landscape 844x390: all six new characters move/animate in down/left/right/up directions, run faster with Shift, and return to idle on release. No page errors or horizontal page overflow. Reviewed portrait layout screenshot.
- Mobile touch checks passed: picker tap selects Brie, joystick moves her, simultaneous second touch holds Run, and releasing both returns to idle.
- Publication targets the modular index.html game; standalone play.html is not regenerated in this step. Physical iPhone/Safari verification remains pending. Next: publish the small changed source files and twelve character files together, then verify live assets.

### 2026-10-10: Publication and cache refresh
- Published integration commit ccdaa1a. GitHub Pages build and deployment succeeded. Live browser initially mixed the updated HTML with cached original character scripts.
- Added version queries to the changed script/style references so a refresh loads the new picker and movement code together. Live verification continues after this small follow-up.

### 2026-10-10: Live character integration verified
- Integration and cache-refresh deployments completed successfully. Verified live scripts/style and all six atlases byte-match the tested files.
- Live browser loaded all ten picker entries, finished asset loading, selected Vito successfully and rendered the full group. Original four character assets remain unchanged.
- Character integration complete for the hosted modular game. Movement/animation, desktop/phone layouts and touch controls passed the checks recorded above. Physical iPhone/Safari verification remains pending; standalone play.html remains the earlier version.
- Next authorized phase can add superpowers once the user supplies the ability list; no power behavior added here.

### 2026-10-10: Pre-power rollback checkpoint and first abilities
- Confirmed main commit bced9a1 contains the deployed ten-character game; saved a separate GitHub branch checkpoints/characters-before-powers-2026-10-10 at that exact commit before making gameplay changes.
- User requested starting with Connor's football throw and Coco's crying shockwaves. Implementing a shared tap action/X shortcut, per-character cooldowns, pixel effects and a brief harmless Rex reaction. Existing walking atlases retained.
- User also requested spreading out the six visitors while preserving the original four meeting-spot positions. Assigned separate walkable positions around shops, the green and plaza; collision/reachability checks pending.
- Local implementation checkpoint only; browser checks and deployment pending.

### 2026-10-10: First-power and spawn checks passed
- Added src/powers.js with a direction-based football arc, raised hand, tear streams and three expanding blue rings. Action button appears for Connor/Coco on desktop and touch layouts; X activates it. Cooldowns are 1.3s/2.8s and remain independent across character switching. Walking sprites and neon hat are unchanged.
- Football samples scenery collisions in small steps; both powers trigger one harmless 2s Rex pause per cast. Browser gameplay confirmed Coco can reach Rex with a wave, pause him and let him recover.
- Kept the original four meeting-spot actor homes and player start exactly unchanged. Visitors now stand near Java Nation, Market Square, the side path, the green, the west plaza and Five Guys. All six positions are clear, reachable from the family spot and over 190 map pixels apart.
- Node power checks passed: four throw directions, cooldowns, effect expiry, wall collision, wavefront timing/range and single-hit reactions. Desktop 1280x900, portrait 390x844 and landscape 844x390 browser checks passed: throws, Cry button, cooldown UI, held-key repeat guard, modal pause and movement regressions for all six newer characters. Real browser touch events verified joystick + Run and joystick + power tap without duplicate casts or stuck movement. Reviewed football/cry screenshots.
- Updated portable builder to handle version-query script/style URLs and inline the new powers module. Temporary build smoke check passed; existing play.html is not regenerated or uploaded. Physical iPhone/Safari checks still pending.
- Next: publish the tested modular game update, verify Pages deployment and the live action controls.
