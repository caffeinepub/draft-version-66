# Specification

## Summary
**Goal:** Improve ritual navigation usability and fix authenticated/guest data persistence issues so rituals, journal entries, and progress reliably save and display.

**Planned changes:**
- Add visible left/right ritual navigation arrow controls that work across screen sizes, and add a user-facing toggle to show/hide these arrows while keeping swipe navigation available.
- Fix ritual duplicate detection/toast so the “already exists” message only appears when a true duplicate exists in the active mode (guest localStorage vs authenticated backend), with strict separation between guest and authenticated storage/requests.
- Implement authenticated journal persistence end-to-end so post-session reflections reliably save to the backend and journal edit/delete/favorite actions persist and appear after refresh.
- Fix authenticated progress persistence so total minutes, streak, and monthly minutes update correctly after each session and reliably display on the Progress page and in exported data.

**User-visible outcome:** Users can navigate between saved rituals with optional arrow controls (and still swipe), save rituals without incorrect duplicate errors, and—when logged in—see journal reflections and progress stats persist correctly across refreshes (while guest behavior remains localStorage-based).
