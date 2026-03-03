# Specification

## Summary
**Goal:** Adjust the pre-meditation page layout and extract the reflection phase into a standalone component.

**Planned changes:**
- Move the MindfulnessGuide section to the bottom of the pre-meditation setup phase, below all other controls.
- Center the MindfulnessGuide title and make it dynamically display the selected meditation type (e.g., "Mindfulness Meditation Guide").
- Move the "More Details" button to the bottom center of the MindfulnessGuide container.
- Group the Duration slider, Ambient Sound Picker, and Begin/Save Ritual buttons into a single unified styled container.
- Extract the reflection phase JSX from PreMeditationPage into a standalone `ReflectionPhase` component, accepting all required state and callbacks as props.
- Replace the inline reflection phase block in PreMeditationPage with `<ReflectionPhase ... />`.

**User-visible outcome:** The pre-meditation setup page has a cleaner layout with controls grouped together and the guide at the bottom. The reflection phase is rendered via a dedicated component, maintaining all existing save and navigation functionality.
