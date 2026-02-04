# Specification

## Summary
**Goal:** Revert the app’s UI theming back to Draft 94 by undoing Draft 95 theme-token changes so colors, backgrounds, and text are consistent across the application.

**Planned changes:**
- Restore Draft 94 theme token values for light and dark modes (background/foreground, card/popover, border/input/ring, primary/secondary/muted/accent/destructive) to eliminate mismatched surfaces and inconsistent text colors.
- Ensure there is a single authoritative global CSS theme token source used by Tailwind, and remove/stop importing any duplicate or unused token definitions that could conflict at runtime.
- Audit core pages and major surfaces to remove hardcoded color overrides and ensure they use shared theme utilities/tokens (e.g., bg-background, text-foreground, bg-card, text-muted-foreground) for consistent rendering across pages.

**User-visible outcome:** In both light and dark mode, pages and components (Landing, Dashboard, Pre-meditation, Progress, Journal, Books) display consistent backgrounds and readable, matching text colors without mixed or drifting theme states.
