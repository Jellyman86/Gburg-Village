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
