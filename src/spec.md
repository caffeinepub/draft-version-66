# Specification

## Summary
**Goal:** Align ritual tag visuals with dashboard assets and ensure the Dashboard “Take Quiz” Begin flow launches the existing 5-question recommendation quiz and routes to pre-meditation with the recommended type.

**Planned changes:**
- In the saved rituals carousel (rituals modal), replace the current meditation-type emoji in the tag pill with the corresponding dashboard PNG icon for mindfulness, ifs, metta, and visualization, rendered as an image with appropriate alt text and sizing.
- Update the Dashboard Begin flow so selecting the dashboard carousel item with id `quiz` and pressing Begin opens the existing 5-question recommendation quiz dialog (with a Cancel action that closes the dialog and stays on the dashboard).
- On quiz completion, navigate to `/pre-meditation?type=<recommendedType>` and ensure the PreMeditation page configures the session from the `type` search param, falling back to a valid type if an unexpected value is returned.

**User-visible outcome:** Users see consistent PNG icons for ritual tags in the saved rituals carousel, can launch the 5-question recommendation quiz from the Dashboard “Take Quiz” item, and are taken to pre-meditation configured for the recommended meditation type via the URL parameter.
