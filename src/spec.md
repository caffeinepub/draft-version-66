# Specification

## Summary
**Goal:** Fix the Journal filters layout so controls never overflow on small screens while keeping the same filters, styling theme, and behavior.

**Planned changes:**
- Update the selected Journal filters container in `frontend/src/components/JournalFiltersDropdown.tsx` to always use a vertical (column) layout at all breakpoints (remove any `sm:flex-row` behavior on that container).
- Inside that container, place the Mood and Energy dropdown triggers into a shared row that is two columns by default, and switches to a stacked layout only below 540px (Mood above Energy).
- Keep Date From and Date To inputs in a single two-column row at all widths (never stack vertically), ensuring they stay within the container on small screens.
- Adjust sizing/wrapping rules within the selected container to prevent horizontal overflow (notably for the Search input, Favorites label, and Clear button) on narrow screens, without changing control order or functionality.

**User-visible outcome:** On all screen sizes, Journal filters stack cleanly without horizontal scrolling; Mood/Energy responsively switch below 540px while the date range always stays side-by-side, and the Search/Clear controls remain fully visible on small screens.
