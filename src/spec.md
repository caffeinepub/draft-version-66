# Specification

## Summary
**Goal:** Polish the meditation flow by ensuring ambient audio stops on exit, simplifying the pre-meditation setup layout, restoring the guide “More details” deep-link to Knowledge, and fixing timer centering/formatting.

**Planned changes:**
- Stop and fully reset the single global ambient audio instance when leaving an active meditation session via any back navigation (pause, reset time to 0, and release source if applicable) to prevent lingering/duplicate playback.
- Update the PreMeditationPage setup UI to a single-column layout while keeping all existing elements stacked vertically in the current order.
- Re-add a “More details” button inside the PreMeditationPage guide container that navigates to `/knowledge` with the selected category passed via search param and deep-links to the Knowledge content section.
- Fix the active meditation timer display so the time text is centered within the circular indicator and the displayed time is formatted with two decimal places using `.toFixed(2)`.

**User-visible outcome:** Leaving a meditation session fully stops ambient sound, the pre-meditation setup screen shows a single vertical column, “More details” opens the matching Knowledge category and scrolls to content, and the timer is centered and consistently formatted.
