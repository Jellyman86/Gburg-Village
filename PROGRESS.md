# Gburg Village — current status

Updated: 2026-10-14. One screen only. Git history is the detailed log; older handoff prose is in [docs/archive](docs/archive/).

## Living version
- **`v8/` is the only version under development.** Play: https://jellyman86.github.io/Gburg-Village/v8/ · [V8 guide](v8/README.md)
- V1 (repo root), `v2/` … `v7/` are **frozen archives**. They stay byte-identical to the `archive/v1-v7` tag; `npm run check:archive` enforces it. Their URLs keep working.
- Future releases are git tags and notes, **not new `vN/` folders**. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## What works (V8, verified 2026-10-14)
Opening story and 15 recruitable playable characters, FFVI-style party menu (roster, stats, items, equip, abilities), real-time dinosaur combat with healing and dog companions, Kentlands scenes, overworld Earth with jet flight, New York and four-zone Hawaii, original synthesized music/SFX, desktop keyboard + iPhone touch layouts. Progress is session-only (no saves yet).

## Active work
- **Tooling step 1 (this branch):** freeze policy, `package.json` + task runner, tiered tests, archive check, docs reset. Node.js LTS now installed locally.
- Next planned steps (see roadmap in DEVELOPMENT.md): asset manifest + one-time art consolidation into `v8/assets/`, generalized art importer, unified scene geometry + `?debug=paths` overlay, formatting pass and `game.js` extractions, music manifest for the user's MIDI tracks.

## Known limitations
- No persistence; refreshing restarts as Coco.
- Touch verification is Chromium emulation, not a physical iPhone. Audio has not been human-listened in CI.
- Collision polygons are hand-traced against AI-generated backgrounds; expect occasional pathing fixes.
- Hawaii shop interiors, new quests, saves and XP/leveling are not implemented.

## How to verify a change
```powershell
npm run test:quick     # ~30 s: syntax, contracts, desktop world/hawaii suite
npm run predeploy      # archive check + every suite on desktop/portrait/landscape
npm run test:hosted    # same suites against the published site after Pages deploys
```
