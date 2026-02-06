# Specification

## Summary
**Goal:** Remove the duplicate volume input on the Pre‑Meditation setup so only one volume control remains in the specified container.

**Planned changes:**
- In the Pre‑Meditation page, remove the extra/duplicate volume input element within the container identified by XPath `/html[1]/body[1]/div[1]/div[1]/main[1]/div[1]/div[2]/div[3]`.
- Ensure the remaining volume control continues to update the ambient audio volume as it did previously, without altering other controls in that container.

**User-visible outcome:** The Pre‑Meditation setup container shows a single volume control (no duplicate), and adjusting it changes the ambient audio volume normally.
