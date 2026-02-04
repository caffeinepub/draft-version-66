# Specification

## Summary
**Goal:** Remove the apparent top empty/blank space above the Progress bowl visualization by adjusting only the Progress bowl `<canvas>` rendering/layout.

**Planned changes:**
- Update `frontend/src/components/ProgressBowl.tsx` canvas element behavior (CSS and/or drawing vertical origin) to vertically position the bowl higher within the canvas and eliminate unused top blank area.
- Ensure the bowl remains fully visible (not clipped) and the existing animation continues working in both light and dark themes.

**User-visible outcome:** On the Progress page, the bowl visualization sits higher without noticeable blank space above it, while remaining fully visible and animated.
