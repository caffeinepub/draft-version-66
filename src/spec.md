# Specification

## Summary
**Goal:** Simplify the pre-meditation setup, standardize navigation controls across key pages, and improve the active and post-meditation UX.

**Planned changes:**
- Remove the meditation type carousel from the Pre-Meditation setup flow while keeping setup usable.
- Re-introduce the step-by-step meditation guide (MeditationGuideStepper) in Pre-Meditation, with a clearly placed “More details” control that opens expanded, dismissible guide content (without bringing back the carousel).
- Replace page-specific back buttons and theme toggles on PreMeditationPage (setup/active/reflection), Journal (“journey”), and Progress with the shared StandardPageNav used on Book/Knowledge pages (no duplicate controls; back goes to `/dashboard`).
- Update the active meditation timer UI to use the circular MeditationTimerRing instead of the current square timer, preserving pause/resume and countdown accuracy.
- Change post-meditation reflection to a sequential, step-based flow: mood selection (required) → energy selection (required) → optional note + favorite toggle + save, using existing save behavior and navigation to `/dashboard` on success.

**User-visible outcome:** Users can start meditations without a type carousel, see a step guide with expandable details, navigate consistently with the same back/theme controls as Book/Knowledge, use a circular in-session timer, and complete reflections through a clearer step-by-step prompt sequence before saving.
