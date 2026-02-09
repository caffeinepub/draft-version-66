# Specification

## Summary
**Goal:** Fix backend deletion of saved rituals for authenticated (online) users so the existing frontend call `actor.deleteRitual(ritual)` successfully removes the intended ritual(s).

**Planned changes:**
- Update the Motoko `deleteRitual` logic to match rituals for deletion using exactly: `meditationType`, `duration`, `ambientSound`, and `ambientSoundVolume`, ignoring `timestamp`.
- Ensure `ritualsStore` is persistently updated by replacing the caller’s stored rituals list with the filtered result after deletion.
- Preserve current error behavior when no matching ritual is found (e.g., trap like `RitualNotFound`) and leave stored rituals unchanged in that case.

**User-visible outcome:** Authenticated users can delete saved rituals online from the UI (without any frontend changes), and the rituals list updates correctly after deletion.
