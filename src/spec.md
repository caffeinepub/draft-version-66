# Specification

## Summary
**Goal:** Restore the app’s original light/dark OKLCH-based global theme variables so the intended color palette renders correctly across the UI.

**Planned changes:**
- Update `frontend/src/index.css` `:root` (light) and `.dark` (dark) blocks to exactly match the user-provided OKLCH variable values for the standard theme tokens (background/foreground, card/popover, primary/secondary, muted/accent, destructive, border/input/ring, radius).
- Add any missing custom theme tokens globally in both light/dark (where provided): `--accent-cyan`, `--accent-cyan-tinted`, `--accent-lavender`, `--primary-dark`, `--description-gray`, `--selected-element-light`, `--guide-text`.
- Ensure all variables remain compatible with Tailwind usage via `oklch(var(--token))` by defining tokens as space-separated OKLCH channels (not nested `oklch(...)` strings).

**User-visible outcome:** The app is no longer mostly black-and-white; restored backgrounds, borders, and text colors display correctly in both light and dark modes across all routes.
