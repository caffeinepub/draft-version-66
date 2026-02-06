# Specification

## Summary
**Goal:** Improve app UX consistency by fixing toast visibility, enhancing Journal filtering and labels, preventing guest Journal crashes from legacy localStorage, and aligning meditation navigation and timer UI.

**Planned changes:**
- Update app-wide toast styling via Toaster configuration and/or global CSS so success/error toasts have an opaque background and visible border in light/dark themes (without modifying `frontend/src/components/ui/*`).
- Adjust export/import success toast copy to be generic (e.g., “Data has been exported successfully” / “Data has been imported successfully”) and not mention “journal”.
- Add Journal filters for Favorites, Date, and Time, and ensure they combine correctly with existing search/mood/energy filters when rendering the entry list.
- Show mood tags in the Journal entry list with both the icon and a visible text label (keeping tooltips if present), with responsive wrapping on mobile.
- Prevent guest-mode Journal crashes from legacy/invalid localStorage by clearing relevant guest journaling/progress keys on the detected mismatch and forcing a full page reload (without deleting authenticated users’ cloud/backed data).
- Make Pre-meditation and active Meditation session headers consistent with the standard navigation header (icon-style back control + hamburger menu; consistent guest vs signed-in appearance) and remove any conflicting “Back to dashboard” variant.
- Make the meditation timer container circular while preserving the existing wavy fill/progression behavior and timer readability/accuracy.
- Move the “More details” section into the step guide container on the Pre-meditation page.

**User-visible outcome:** Toast notifications are clearly readable, Journal entries can be filtered by favorites/date/time and mood tags are understandable at a glance, guest users no longer hit a crash from old saved data, and the pre-meditation/meditation UI has consistent navigation with a circular timer that keeps the same wave-fill behavior.
