# Specification

## Summary
**Goal:** Fix several UI issues in the ActiveMeditationPage and back button layout across the app.

**Planned changes:**
- Apply `rounded-full` to the play/pause button in ActiveMeditationPage so it renders as a perfect circle, without changing any other styling
- Remove vertical padding from the outer wrapper containers of the volume control and time/seek control inputs to eliminate the double-padding effect
- Ensure the back button in ActiveMeditationPage is always visible on all screen sizes by removing any responsive hiding classes
- Fix the back button layout so it sits below the header bar (session indicator) in the document flow on larger screens, using layout/flow changes rather than z-index

**User-visible outcome:** The play/pause button is perfectly circular, control sections no longer have double vertical padding, and the back button is always visible and correctly positioned below the header on all screen sizes.
