# Specification

## Summary
**Goal:** Restore the Meditation page’s previous session-duration input UI and fix the timer centering regression on `/pre-meditation`.

**Planned changes:**
- Replace the unexpected timer control buttons on `/pre-meditation` with the prior time range input UI for setting session duration (range selector or equivalent start/end inputs).
- Remove any extra/unintended controls shown where the time range input is expected on the pre-meditation flow.
- Adjust layout/styles so the active meditation timer display (ring + time text) is horizontally centered across mobile and desktop breakpoints.
- Keep changes limited to the Meditation page while ensuring the existing session flow (start, pause/resume, completion -> reflection/save) continues to work.

**User-visible outcome:** On the Meditation page, users set duration via the expected time range inputs (not buttons), and the timer display appears properly centered on screen.
