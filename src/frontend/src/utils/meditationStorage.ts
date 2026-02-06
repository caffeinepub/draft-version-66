import type { JournalEntry, MeditationSession, ProgressStats } from '../backend';

const GUEST_JOURNAL_KEY = 'guestJournalEntries';
const GUEST_PROGRESS_KEY = 'guest-meditationProgress';
const GUEST_RITUALS_KEY = 'guestRituals';

// Guest journal entry type (stored as strings)
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

// Guest progress data type
interface GuestProgressData {
  totalMinutes: number;
  currentStreak: number;
  monthlyMinutes: number;
  lastSessionDate?: string;
  sessions: Array<{ minutes: number; timestamp: string }>;
}

// Guest ritual type
interface GuestRitual {
  meditationType: string;
  duration: number;
  ambientSound: string;
  ambientSoundVolume: number;
  timestamp: string;
}

export function getGuestJournalEntries(): GuestJournalEntry[] {
  try {
    const stored = localStorage.getItem(GUEST_JOURNAL_KEY);
    if (!stored) return [];
    const entries = JSON.parse(stored);
    
    // Validate entries have required fields
    return entries.filter((entry: any) => {
      return entry.id !== undefined && 
             entry.mood && 
             Array.isArray(entry.mood) &&
             entry.mood.every((m: any) => typeof m === 'string');
    });
  } catch (error) {
    console.error('Error loading guest journal entries:', error);
    return [];
  }
}

export function saveGuestJournalEntries(entries: GuestJournalEntry[]): void {
  try {
    localStorage.setItem(GUEST_JOURNAL_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving guest journal entries:', error);
  }
}

export function setGuestJournalEntries(entries: GuestJournalEntry[]): void {
  saveGuestJournalEntries(entries);
}

export function addGuestJournalEntry(entry: GuestJournalEntry): void {
  const entries = getGuestJournalEntries();
  entries.push(entry);
  saveGuestJournalEntries(entries);
}

export function updateGuestJournalEntry(entryId: string, updates: Partial<GuestJournalEntry>): void {
  const entries = getGuestJournalEntries();
  const index = entries.findIndex((e) => e.id === entryId);
  if (index !== -1) {
    entries[index] = { ...entries[index], ...updates };
    saveGuestJournalEntries(entries);
  }
}

export function deleteGuestJournalEntry(entryId: string): void {
  const entries = getGuestJournalEntries();
  const filtered = entries.filter((e) => e.id !== entryId);
  saveGuestJournalEntries(entries);
}

export function getGuestProgressData(): GuestProgressData {
  try {
    const stored = localStorage.getItem(GUEST_PROGRESS_KEY);
    if (!stored) {
      return {
        totalMinutes: 0,
        currentStreak: 0,
        monthlyMinutes: 0,
        sessions: [],
      };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading guest progress data:', error);
    return {
      totalMinutes: 0,
      currentStreak: 0,
      monthlyMinutes: 0,
      sessions: [],
    };
  }
}

export function getGuestProgressStats(): ProgressStats {
  const data = getGuestProgressData();
  return {
    totalMinutes: BigInt(data.totalMinutes || 0),
    currentStreak: BigInt(data.currentStreak || 0),
    monthlyMinutes: BigInt(data.monthlyMinutes || 0),
    rank: 'Beginner',
  };
}

export function saveGuestProgressData(data: GuestProgressData): void {
  try {
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving guest progress data:', error);
  }
}

export function updateGuestProgress(minutes: number): GuestProgressData {
  const data = getGuestProgressData();
  const now = new Date().toISOString();
  
  data.totalMinutes += minutes;
  data.monthlyMinutes += minutes;
  data.sessions.push({ minutes, timestamp: now });
  
  // Update streak logic
  const today = new Date().toDateString();
  const lastDate = data.lastSessionDate ? new Date(data.lastSessionDate).toDateString() : null;
  
  if (lastDate === today) {
    // Same day, no change to streak
  } else if (lastDate) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate === yesterday.toDateString()) {
      data.currentStreak += 1;
    } else {
      data.currentStreak = 1;
    }
  } else {
    data.currentStreak = 1;
  }
  
  data.lastSessionDate = now;
  saveGuestProgressData(data);
  return data;
}

export function getGuestSessionRecords(): MeditationSession[] {
  const data = getGuestProgressData();
  return data.sessions.map((s) => ({
    minutes: BigInt(s.minutes || 0),
    timestamp: BigInt(new Date(s.timestamp).getTime() * 1_000_000),
  }));
}

export function saveGuestSessionRecords(sessions: MeditationSession[]): void {
  const data = getGuestProgressData();
  data.sessions = sessions.map((s) => ({
    minutes: Number(s.minutes),
    timestamp: new Date(Number(s.timestamp) / 1_000_000).toISOString(),
  }));
  saveGuestProgressData(data);
}

export function addGuestSessionRecord(session: MeditationSession): void {
  const data = getGuestProgressData();
  data.sessions.push({
    minutes: Number(session.minutes),
    timestamp: new Date(Number(session.timestamp) / 1_000_000).toISOString(),
  });
  saveGuestProgressData(data);
}

export function getGuestRituals(): GuestRitual[] {
  try {
    const stored = localStorage.getItem(GUEST_RITUALS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading guest rituals:', error);
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

export function clearGuestData(): void {
  try {
    localStorage.removeItem(GUEST_JOURNAL_KEY);
    localStorage.removeItem(GUEST_PROGRESS_KEY);
    localStorage.removeItem(GUEST_RITUALS_KEY);
  } catch (error) {
    console.error('Error clearing guest data:', error);
  }
}
