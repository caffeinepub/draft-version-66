# Specification

## Summary
**Goal:** Extract the meditation guide section from `PreMeditationPage` into a self-contained `MindfulnessGuide` component.

**Planned changes:**
- Create a new `MindfulnessGuide` component in `frontend/src/components/MindfulnessGuide.tsx` that renders the guide container, title, step content, and stepper UI
- Move the "More Details" button and its navigation logic (redirect to Knowledge page) inside `MindfulnessGuide`
- Move the Previous/Next step navigation state and handlers inside `MindfulnessGuide`
- Update `PreMeditationPage` to replace all guide-related markup and state with a single `<MindfulnessGuide meditationType={...} />` element

**User-visible outcome:** The meditation guide section looks and behaves exactly as before, but the code is now encapsulated in its own component.
