// Guest-only localStorage utility for meditation data
// This file should ONLY be used when the user is NOT authenticated

interface GuestJournalEntry {
  id: string;
  meditationType: string;
  duration: string;
  mood: string[];
  energy: string;
  reflection: string;
  timestamp: string;
  isFavorite: boolean;
}

interface GuestProgressData {
  totalMinutes: number;
  currentStreak: number;
  monthlyMinutes: number;
  lastSessionDate?: string;
  sessions: Array<{ minutes: number; timestamp: string }>;
}

interface GuestRitual {
  meditationType: string;
  duration: number;
  ambientSound: string;
  ambientSoundVolume: number;
  timestamp: string;
}

const GUEST_JOURNAL_KEY = 'guest-journalEntries';
const GUEST_PROGRESS_KEY = 'guest-meditationProgress';
const GUEST_RITUALS_KEY = 'guest-rituals';

// Legacy keys for migration
const LEGACY_JOURNAL_KEY = 'journalEntries';
const LEGACY_PROGRESS_KEY = 'meditationProgress';

// Migrate legacy data to guest-prefixed keys (one-time migration)
function migrateLegacyData() {
  if (!localStorage.getItem(GUEST_JOURNAL_KEY) && localStorage.getItem(LEGACY_JOURNAL_KEY)) {
    const legacyJournal = localStorage.getItem(LEGACY_JOURNAL_KEY);
    if (legacyJournal) {
      localStorage.setItem(GUEST_JOURNAL_KEY, legacyJournal);
    }
  }

  if (!localStorage.getItem(GUEST_PROGRESS_KEY) && localStorage.getItem(LEGACY_PROGRESS_KEY)) {
    const legacyProgress = localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (legacyProgress) {
      localStorage.setItem(GUEST_PROGRESS_KEY, legacyProgress);
    }
  }
}

// Initialize migration on module load
migrateLegacyData();

export function getGuestJournalEntries(): GuestJournalEntry[] {
  try {
    const data = localStorage.getItem(GUEST_JOURNAL_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading guest journal entries:', error);
    return [];
  }
}

export function setGuestJournalEntries(entries: GuestJournalEntry[]): void {
  try {
    localStorage.setItem(GUEST_JOURNAL_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving guest journal entries:', error);
  }
}

export function updateGuestJournalEntry(
  entryId: string,
  updates: { reflection?: string; isFavorite?: boolean }
): void {
  try {
    const entries = getGuestJournalEntries();
    const updatedEntries = entries.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          ...(updates.reflection !== undefined && { reflection: updates.reflection }),
          ...(updates.isFavorite !== undefined && { isFavorite: updates.isFavorite }),
        };
      }
      return entry;
    });
    setGuestJournalEntries(updatedEntries);
  } catch (error) {
    console.error('Error updating guest journal entry:', error);
  }
}

export function deleteGuestJournalEntry(entryId: string): void {
  try {
    const entries = getGuestJournalEntries();
    const filtered = entries.filter(entry => entry.id !== entryId);
    setGuestJournalEntries(filtered);
  } catch (error) {
    console.error('Error deleting guest journal entry:', error);
  }
}

export function getGuestProgressData(): GuestProgressData {
  try {
    const data = localStorage.getItem(GUEST_PROGRESS_KEY);
    return data ? JSON.parse(data) : {
      totalMinutes: 0,
      currentStreak: 0,
      monthlyMinutes: 0,
      sessions: [],
    };
  } catch (error) {
    console.error('Error reading guest progress data:', error);
    return {
      totalMinutes: 0,
      currentStreak: 0,
      monthlyMinutes: 0,
      sessions: [],
    };
  }
}

export function setGuestProgressData(progress: GuestProgressData): void {
  try {
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving guest progress data:', error);
  }
}

export function clearGuestData(): void {
  try {
    localStorage.removeItem(GUEST_JOURNAL_KEY);
    localStorage.removeItem(GUEST_PROGRESS_KEY);
  } catch (error) {
    console.error('Error clearing guest data:', error);
  }
}

// Helper to update guest progress after a session
export function updateGuestProgress(minutes: number): GuestProgressData {
  const progress = getGuestProgressData();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  progress.sessions.push({
    minutes,
    timestamp: now.toISOString(),
  });

  progress.totalMinutes += minutes;

  if (progress.lastSessionDate) {
    const lastDate = new Date(progress.lastSessionDate);
    const lastDateStr = lastDate.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDateStr === today) {
      // Same day, no change to streak
    } else if (lastDateStr === yesterdayStr) {
      progress.currentStreak += 1;
    } else {
      progress.currentStreak = 1;
    }
  } else {
    progress.currentStreak = 1;
  }

  progress.lastSessionDate = now.toISOString();

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  progress.monthlyMinutes = progress.sessions
    .filter((session) => new Date(session.timestamp) >= thirtyDaysAgo)
    .reduce((sum, session) => sum + session.minutes, 0);

  setGuestProgressData(progress);
  return progress;
}

// Guest ritual storage utilities
export function getGuestRituals(): GuestRitual[] {
  try {
    const data = localStorage.getItem(GUEST_RITUALS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading guest rituals:', error);
    return [];
  }
}

export function setGuestRituals(rituals: GuestRitual[]): void {
  try {
    localStorage.setItem(GUEST_RITUALS_KEY, JSON.stringify(rituals));
  } catch (error) {
    console.error('Error saving guest rituals:', error);
  }
}

export function clearGuestRituals(): void {
  try {
    localStorage.removeItem(GUEST_RITUALS_KEY);
  } catch (error) {
    console.error('Error clearing guest rituals:', error);
  }
}
