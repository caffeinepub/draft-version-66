# Specification

## Summary
**Goal:** Refine the meditation UI by strengthening the animated dashboard lotus background, improving pre-meditation layout clarity with boxed sections, and correcting active-session controls (play/pause shape and time scrubber behavior).

**Planned changes:**
- Increase the visibility/intensity of the /dashboard canvas-rendered lotus and particle background by ~20% while keeping it animated and non-interactive (pointer-events disabled).
- On /pre-meditation (setup phase), group ambient sound picker, duration selector, and Begin/Save Ritual buttons into a single clearly visible card-style container.
- On /pre-meditation (setup phase), place the meditation guide into its own separate card-style container and add a bottom-centered “More details” button that navigates to the relevant /knowledge category and deep-links/scrolls to the selected technique’s content.
- On /pre-meditation (active phase), change the play/pause control to a circular button while keeping its icon and behavior the same.
- Fix the active meditation time scrubber to behave like a standard media scrubber: left decreases remaining time, right increases remaining time, with immediate and consistent updates (thumb position + mm:ss) while paused or playing.

**User-visible outcome:** The dashboard background animation appears stronger, the pre-meditation setup is organized into clear boxed sections with a “More details” link into the correct knowledge content, and the active session has a round play/pause button plus a correctly behaving, responsive time scrubber.
