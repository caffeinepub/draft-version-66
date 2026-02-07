# Specification

## Summary
**Goal:** Improve the in-session meditation experience by adding a clear way to return to setup and replacing the current timer visual with a calm, progress-driven wave fill indicator.

**Planned changes:**
- Add a visible, accessible back button on the active meditation (in-session) view that navigates to `/pre-meditation` via TanStack Router.
- Replace the existing ring-style timer visualization on the active meditation view with an animated wave fill indicator that fills from bottom to top based on session progress (empty at start, full at completion).
- When duration/remaining time is adjusted, animate the fill level to the new target using an ease-in-out transition while keeping the wave motion smoothly looping.

**User-visible outcome:** During an active meditation session, users can tap a back button to return to the pre-meditation setup screen, and they see a calm wave that rises as time progresses (including smooth transitions if time is adjusted).
