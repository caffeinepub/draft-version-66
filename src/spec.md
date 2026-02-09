# Specification

## Summary
**Goal:** Fix authenticated ritual deletion so the confirm “Delete” action sends a valid payload, waits for a successful backend response, and reliably removes the ritual from both canister state and the UI.

**Planned changes:**
- Update the modal confirm delete handler (SavedRitualsCarousel / DashboardPage onDelete path) so it triggers exactly one authenticated delete request and only closes the dialog after a successful delete.
- Normalize/complete the authenticated delete payload to match backend expectations (include meditationType, duration, ambientSound, ambientSoundVolume with correct candid-compatible types) while keeping guest/offline localStorage deletion unchanged.
- Correct backend `deleteRitual` to accept the ritual payload, delete only the caller’s matching ritual(s), and persist the updated rituals list back into `ritualsStore` so deletion remains reflected on subsequent reads.
- After successful authenticated deletion, invalidate/refetch the frontend rituals data (e.g., React Query `['rituals']`) so the carousel updates immediately without a full reload.

**User-visible outcome:** When signed in, users can delete a saved ritual via the trash icon and confirm dialog without “Invalid data format” errors; on success the ritual disappears immediately, and on failure it remains visible with no false success.
