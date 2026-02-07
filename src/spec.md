# Specification

## Summary
**Goal:** Refine the Pre‑Meditation page UI by repositioning the “More Details” button within the Meditation Guide card and improving the “Begin Meditation” button’s height only in the small-screen stacked layout.

**Planned changes:**
- Move the existing “More Details” button from the Meditation Guide header area to the bottom of the same guide container card (after the guide stepper/content) without changing its label or navigation behavior (/knowledge with `{ category: selectedType, scrollToContent: true }`).
- Adjust only the “Begin Meditation” button styling so that when the action buttons switch to a single-column stack on small screens, its height increases (e.g., via responsive padding/min-height) to visually match “Save as Ritual,” while leaving desktop/tablet (side-by-side) styling and all behavior unchanged.

**User-visible outcome:** On the Pre‑Meditation setup screen, “More Details” appears beneath the guide content instead of beside the “Meditation Guide” title, and on small screens the “Begin Meditation” button no longer looks thinner than “Save as Ritual” when the buttons stack.
