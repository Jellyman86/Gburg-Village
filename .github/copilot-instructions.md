# GitHub Copilot instructions — Gburg Village

Read `V4_PLAN.md` and `PROGRESS.md` before V4 work. User is building a family-friendly, top-down HTML Canvas pixel-art adventure and wants low-cost, incremental iteration and a Tiled editing workflow.

## Safety and scope
- Do not edit, delete, reorganize, or deploy root V1, `v2/`, or `v3/` files for V4 requests. Preserve their playable URLs.
- V4 is not yet built. Use a new `work/v4-tiled` branch and `v4/` sandbox after verifying a fresh base; do not overwrite other AI work.
- Do not modify GitHub Pages settings, fast-forward main, or publish V4 without explicit user approval.
- Inspect existing file paths and relevant instructions first; don't assume V3 geometry or URLs are immutable.
- Prefer a minimal patch over refactoring a large working game. Check diffs for unrequested changes.

## First requested job
Implement only milestone 0 and 1 of `V4_PLAN.md`: a playable isolated V4 and editable Market Square collision rectangles from Tiled `.tmj` JSON. Preserve all existing features; test each stage. The user wants to move collision rectangles in Tiled and see them reflected in V4 with no subsequent code edits.

## Technical guidance
- Runtime is browser HTML/JS/Canvas, not a game-engine project; preserve keyboard, touch and mobile support.
- V3 plaza: `v3/src/map.js`, `window.TOWN`, 1536x1024, `obstacles` rectangles and bounds.
- Other V3 scenes: `v3/src/scenes.js`, using walkable rectangles normalized to image dimensions, portals/arrival positions; north also includes ellipse geometry and meteor overlay.
- Existing scene images are reused. Match pixel/world dimensions exactly; never confuse 0–1000 normalized values with pixel positions.
- First slice imports only rectangle objects from a named `Collision` object layer; retain compatibility for all unmigrated scenes. Do not silently lose ellipses, walkable allowlists or landmarks.
- Use documented async preload if needed so collision data is ready before play. Show errors/fallback visibly when map loading fails.
- Keep map files small and readable; preserve relative URLs across GitHub Pages subpaths. Never embed image binary/base64 into code.

## Testing and handoff
- Verify a baseline V4 before collision changes.
- Confirm pixel-accurate collision imports, movement boundaries, existing intro/sprites/dinos/scene navigation, and touch/mobile viewport controls.
- Include a small debug collision overlay and a test for deliberately moving one object in Tiled and refreshing V4.
- Use small commits and update `PROGRESS.md` or a V4-specific checkpoint log with evidence (not claims of unperformed tests).
- Report concise summaries (changed files, commit SHAs, verified behavior, unresolved blockers, next step). Never dump large source files or asset data into chat.
- Request user approval before any publication.
