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
