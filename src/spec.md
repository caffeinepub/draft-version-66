# Specification

## Summary
**Goal:** Polish the active meditation timer screen for small-screen responsiveness and ensure the circular timer shadow is not clipped.

**Planned changes:**
- On viewports narrower than 390px, reduce the rendered width of the volume and seek/time range sliders by ~10–20% so they fit without horizontal overflow.
- Remove any `overflow: hidden` styling on the active meditation timer screen that clips the circular SVG timer’s fill/shadow, while avoiding any new persistent page scrolling (especially horizontal).

**User-visible outcome:** On small phones, the volume and seek sliders fit within the screen, and the circular timer’s shadow renders fully during the fill animation without a hard cutoff.
