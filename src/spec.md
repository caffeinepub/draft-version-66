# Specification

## Summary
**Goal:** Improve the Pre‑Meditation page UX by adding swipe navigation to the Meditation Guides, limiting reflection mood selection to 2, and fixing ritual toast notification styling.

**Planned changes:**
- Add horizontal swipe gestures to the Meditation Guides stepper container on the Pre‑Meditation page: swipe left advances one step, swipe right goes back one step, with a minimum swipe threshold and no wraparound at the ends.
- Keep swipe navigation fully synchronized with the existing Prev/Next buttons and dot navigation so they all reflect the same current step.
- Update the post-session reflection flow to allow selecting at most 2 mood/state items, while keeping energy level selection single-choice exactly as it is today.
- Update the on-screen mood selection instruction text to clearly state the “up to 2” limit (English).
- Adjust the ritual saved/deleted toast notifications to use an opaque, theme-consistent background and a visible theme-matching border in both light and dark modes.

**User-visible outcome:** Users can swipe through meditation guide steps on touch devices, can select up to two moods (energy stays single-select) during reflection, and see clearly styled (non-transparent) ritual save/delete notifications in both themes.
