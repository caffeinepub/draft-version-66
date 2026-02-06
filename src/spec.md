# Specification

## Summary
**Goal:** Make the Pre-Meditation “More details” button deep-link to the Knowledge page with the matching category selected for the current pre-meditation type.

**Planned changes:**
- Update the selected “More details” button in `frontend/src/pages/PreMeditationPage.tsx` to navigate to `/knowledge` with a `category` search param that corresponds to the current pre-meditation type (while preserving `scrollToContent`).
- Update the Knowledge page to read an optional `category` search param, initialize the selected category from it when valid (matching a `TECHNIQUE_CONTENT` id), and fall back to existing default behavior when missing/invalid.
- Preserve existing Knowledge deep-link scrolling behavior (`scrollToContent`) and ensure clearing search params after scrolling does not unintentionally reset the selected category.

**User-visible outcome:** Clicking “More details” from a given pre-meditation guide opens the Knowledge page on the corresponding category (e.g., Metta, IFS, Visualization, Mindfulness) and still scrolls to the content section when requested.
