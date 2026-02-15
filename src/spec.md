# Specification

## Summary
**Goal:** Refine the PreMeditationPage layout/styling by improving in-session Volume/Time label placement and padding, and moving the setup-phase meditation guide to the bottom of the page.

**Planned changes:**
- In PreMeditationPage when phase is `"active"`, reposition the Volume and Time/Seek labels to render top-left outside their respective slider containers, and increase label font size using a Tailwind px-based text utility.
- In PreMeditationPage when phase is `"active"`, update the Volume and Time/Seek container padding to Tailwind `px-6 py-5` and remove the `premed-slider-container` class from those containers.
- Remove/retire `premed-slider-container` usage for the in-session Volume/Time containers and ensure no remaining references are required for those two controls (optionally remove the unused CSS block if safe).
- In PreMeditationPage when phase is `"setup"`, move the pre-session meditation guide container to be the last section on the page (below all other setup controls) without breaking guide interactions.

**User-visible outcome:** During an active session, Volume and Time/Seek labels appear above their sliders with clearer styling and adjusted padding; during setup, the meditation guide appears at the bottom of the setup page while continuing to function normally.
