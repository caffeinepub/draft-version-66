# Specification

## Summary
**Goal:** Move the quiz score display on the Knowledge page from above the "Take Quiz" button to inline with the article/category title, formatted as "X/6" with a theme-colored medal icon.

**Planned changes:**
- Remove the existing quiz score badge/overlay displayed on top of the "Take Quiz" button.
- Render the score inline on the same row as the article/category title, positioned immediately to the right of the title text.
- Format the score as "X/6" (e.g., "4/6").
- Display a medal/award icon next to the score text, styled using the app's primary CSS theme color variable.
- Only show the score and icon when a quiz score exists for that category.
- Ensure the layout remains intact on mobile screen sizes.

**User-visible outcome:** Users see the quiz score (e.g., "4/6" with a themed medal icon) displayed right next to the category title on the Knowledge page, rather than as an overlay on the "Take Quiz" button.
