# Gburg Studio - first visual director

This is a focused editor for existing V5 cutscenes, not a replacement game
engine or pixel editor. Pixelorama remains the tool for drawing and cleaning
sprites. The importer, new animation authoring and movement-path editor are
future increments.

## Open the local editor

From the repository's PowerShell terminal:

```powershell
.\v5\tools\Start-Studio.ps1
```

Open http://127.0.0.1:5175/v5/studio/ and keep the terminal running.
The launcher uses Node.js if available, otherwise the installed VS Code
executable in Node mode. It does not install packages. Choose a different port
with `-Port 5176` if the default is already occupied.

The local game is http://127.0.0.1:5175/v5/. Stop the server with Ctrl+C.
The server binds only to loopback, rejects foreign origins/hosts, and permits
writes only to the V5 scene-settings file. It never writes sprites, older
versions, source uploads, Git refs or deployment settings.

## First exercise: Chris's flying dinosaur

1. Choose **montage**, then **2. swim-panic**.
2. Scrub the timeline to see the flying dinosaur pass.
3. Choose **Below speaker** for the speech bubble, or drag the bubble to a
   custom position.
4. Switch between desktop, phone portrait and phone landscape.
5. Press **Save to game**. Refresh the local game to use the saved settings.

No default choreography or bubble placement is changed just by opening Studio.
Saving is local only. Commit/publish the settings after testing when ready.
The public game does not update automatically when you press Save.

## Controls and persistence

- Choose any of the eighteen existing story cinematics without replaying the
  chapter or unlocking characters.
- Play/pause, scrub, step one 30fps timeline frame, or loop the current shot.
  Frame stepping is timeline time; individual sprite clips retain their
  authored playback rates.
- Drag human actors or change X/Y offsets. An offset moves that actor's whole
  existing path within the current shot; it does not create a new path. The
  preview camera holds still while dragging, then resumes automatic framing.
- Edit dialogue, its speaker, duration and automatic/above/below/custom bubble
  placement. Custom positions are normalized to the stage and clamped into
  bounds on each layout.
- Optionally set a fixed camera center and zoom.
- Undo/Redo and Reset shot restore your draft. Space plays/pauses; Left/Right
  step frames; Ctrl+Z/Ctrl+Shift+Z undo/redo outside editable fields.
- **Save to game** writes [scene-edits.json](../data/scene-edits.json), using a
  revision check to prevent overwriting another tab's or on-disk changes.
  A conflict preserves your draft: Export it before Reload saved.
- **Export JSON** downloads the complete settings document. **Import JSON**
  validates it and loads a draft; Import does not save or publish.
- **Reload saved** discards the draft after confirmation if unsaved.
  Leaving/reloading the editor warns about unsaved changes.
- After exporting new prepared sprites from Pixelorama, save any scene edits,
  then reload the studio to see the updated images. No artwork processing
  runs automatically.

On GitHub Pages, the same editor supports preview/import/export but cannot
write your local checkout. Import the exported JSON into the local editor,
then Save to game. There is no success-shaped "save" on static hosting.

## Scope and safeguards

The iframe loads the actual [cinematic director](../src/cinema.js),
[catalog](../src/cinema-catalog.js), artwork and scene definitions, but does
not load the game, recruitment state, story awards or audio systems.
Preview-only seeking APIs are absent from the normal game page.

Preview staging uses a representative Coco entry position and a sample reunion
lineup, not a running save state. Actual scenes can include the player's
current position, selected hero, joined-NPC filtering and ambient companions.
Test the real game when changing entry-dependent staging or return positions.
The layout presets reproduce normal-page stage sizes for desktop 1280x900,
portrait 390x844 and landscape 844x390; they scale visually to fit the editor
without changing the iframe's layout dimensions. They are not physical-device
verification or a fullscreen/Safari simulation.

This first slice is a **silent visual preview**. It keeps the original sound
cues and music in production but does not preview, edit or reschedule them.
The main meteor opening movie, dinosaur/effect manipulation, animation choice,
new scenes, sprite importing and full keyframe/path editing are not included.
The banquet ending card can be previewed at the final timestamp; its Continue
button is disabled in the editor and cannot award anything.

The versioned JSON overrides duration, dialogue, speaker, bubble, human offsets
and fixed camera only. It cannot change story gates, rewards or scene IDs.
Gary's battle waves cannot be shortened below the authored seven seconds;
gameplay return shots cannot receive actor offsets. Existing gameplay return
collision checks remain active. Invalid settings fail explicitly instead of
silently falling back to old/default scenes.

## Verification

[Scene-edit checks](../tests/scene-edits.cjs) verify empty overrides preserve
authored data, bounds/schema validation and Gary's protected beats.
[Studio checks](../tests/studio.cjs) use a temporary settings file, not the
real checkout's draft, to test all 71 authored shots, deterministic seeking,
actual dragging/undo/redo, phone bounds, save/reload, import/export, static
hosting limitations and saved settings being consumed by normal gameplay.
