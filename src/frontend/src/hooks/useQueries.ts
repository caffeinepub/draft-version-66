import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ProgressStats, JournalEntry, MeditationType, MoodState, EnergyState, Book, ImportData } from '../backend';
import { BOOK_RECOMMENDATIONS } from '../lib/bookData';
import {
  getGuestJournalEntries,
  setGuestJournalEntries,
  getGuestProgressData,
  updateGuestProgress,
} from '../utils/meditationStorage';

// Stub types for methods not yet implemented in backend
interface MeditationTypeInfo {
  name: string;
  description: string;
  guide: string;
}

interface LocalProgressData {
  totalMinutes: number;
  currentStreak: number;
  monthlyMinutes: number;
  lastSessionDate?: string;
  sessions: Array<{ minutes: number; timestamp: string }>;
}

// Unified export data structure
interface UnifiedExportData {
  version: string;
  exportDate: string;
  journalEntries: Array<{
    id: string;
    meditationType: string;
    duration: string;
    mood: string[];
    energy: string;
    reflection: string;
    timestamp: string;
    isFavorite: boolean;
  }>;
  sessions: Array<{
    minutes: number;
    timestamp: string;
  }>;
  progressStats: {
    totalMinutes: number;
    currentStreak: number;
    monthlyMinutes: number;
    lastSessionDate?: string;
  };
}

// Mock data for meditation types since backend doesn't have this yet
const mockMeditationTypes: MeditationTypeInfo[] = [
  {
    name: 'Mindfulness',
    description: 'Focus and present-moment awareness',
    guide: 'Focus on your breath and observe thoughts without judgment.',
  },
  {
    name: 'Metta',
    description: 'Loving-kindness and compassion meditation',
    guide: 'Cultivate feelings of love and compassion for yourself and others.',
  },
  {
    name: 'Visualization',
    description: 'Guided imagery and mental visualization',
    guide: 'Create vivid mental images to promote relaxation and healing.',
  },
  {
    name: 'IFS',
    description: 'Internal Family Systems meditation',
    guide: 'Connect with different parts of yourself with compassion.',
  },
];

export function useMeditationTypes() {
  const { actor, isFetching } = useActor();

  return useQuery<MeditationTypeInfo[]>({
    queryKey: ['meditationTypes'],
    queryFn: async () => {
      // Backend doesn't have this method yet, return mock data
      return mockMeditationTypes;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDailyQuotes() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<string[]>({
    queryKey: ['dailyQuotes', identity?.getPrincipal().toString() || 'guest'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getDailyQuotes();
      } catch (error) {
        console.error('Error fetching daily quotes:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for recording meditation sessions - branches by auth state
export function useRecordSession() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async (minutes: number) => {
      if (isAuthenticated && actor) {
        // Authenticated: calculate stats and persist to backend
        const guestProgress = getGuestProgressData();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Calculate streak
        let currentStreak = 1;
        if (guestProgress.lastSessionDate) {
          const lastDate = new Date(guestProgress.lastSessionDate);
          const lastDateStr = lastDate.toISOString().split('T')[0];
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastDateStr === today) {
            currentStreak = guestProgress.currentStreak;
          } else if (lastDateStr === yesterdayStr) {
            currentStreak = guestProgress.currentStreak + 1;
          }
        }

        const totalMinutes = guestProgress.totalMinutes + minutes;

        // Calculate monthly minutes
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyMinutes = [...guestProgress.sessions, { minutes, timestamp: now.toISOString() }]
          .filter((session) => new Date(session.timestamp) >= thirtyDaysAgo)
          .reduce((sum, session) => sum + session.minutes, 0);

        await actor.recordMeditationSession(
          {
            minutes: BigInt(minutes),
            timestamp: BigInt(Date.now() * 1000000),
          },
          BigInt(monthlyMinutes),
          BigInt(currentStreak)
        );
      } else {
        // Guest: update localStorage only
        updateGuestProgress(minutes);
      }
    },
    onSuccess: () => {
      // Invalidate progress stats to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['progressStats', principalId || 'guest'] });
    },
  });
}

// Hook to fetch progress stats - branches by auth state
export function useProgressStats() {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useQuery<LocalProgressData>({
    queryKey: ['progressStats', principalId || 'guest'],
    queryFn: async () => {
      if (isAuthenticated && actor) {
        // Authenticated: fetch from backend
        try {
          const backendStats = await actor.getCallerProgressStats();
          return {
            totalMinutes: Number(backendStats.totalMinutes),
            currentStreak: Number(backendStats.currentStreak),
            monthlyMinutes: Number(backendStats.monthlyMinutes),
            sessions: [],
          };
        } catch (error) {
          console.error('Error fetching backend progress stats:', error);
          return {
            totalMinutes: 0,
            currentStreak: 0,
            monthlyMinutes: 0,
            sessions: [],
          };
        }
      } else {
        // Guest: read from localStorage
        return getGuestProgressData();
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

// Helper to serialize JournalEntry for unified export format
function serializeJournalEntryUnified(entry: JournalEntry): any {
  return {
    id: entry.id.toString(),
    meditationType: entry.meditationType,
    duration: entry.duration.toString(),
    mood: entry.mood,
    energy: entry.energy,
    reflection: entry.reflection,
    timestamp: entry.timestamp.toString(),
    isFavorite: entry.isFavorite,
  };
}

// Helper to deserialize JournalEntry from unified format
function deserializeJournalEntryUnified(data: any): JournalEntry {
  return {
    id: BigInt(data.id),
    user: { toText: () => 'guest' } as any,
    meditationType: data.meditationType,
    duration: BigInt(data.duration),
    mood: data.mood,
    energy: data.energy || 'balanced',
    reflection: data.reflection,
    timestamp: BigInt(data.timestamp),
    isFavorite: data.isFavorite,
  };
}

// Journal entry hooks - branches by auth state
export function useJournalEntries() {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useQuery<JournalEntry[]>({
    queryKey: ['journalEntries', principalId || 'guest'],
    queryFn: async () => {
      if (isAuthenticated && actor) {
        // Authenticated: fetch from backend
        try {
          return await actor.getCallerJournalEntries();
        } catch (error) {
          console.error('Error fetching backend journal entries:', error);
          return [];
        }
      } else {
        // Guest: read from localStorage
        const entries = getGuestJournalEntries();
        return entries.map(deserializeJournalEntryUnified);
      }
    },
    enabled: !!actor && !isFetching && !isInitializing,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useSaveJournalEntry() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async (entry: Omit<JournalEntry, 'id' | 'user' | 'timestamp'>) => {
      if (isAuthenticated && actor) {
        // Authenticated: save to backend (backend will handle ID generation)
        // For now, we'll use a workaround since backend doesn't have a direct save method
        // We'll need to add this to the backend in the future
        console.warn('Backend journal save not yet implemented, using guest storage');
        const entries = getGuestJournalEntries();
        const newEntry = {
          id: entries.length.toString(),
          meditationType: entry.meditationType,
          duration: entry.duration.toString(),
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: Date.now().toString() + '000000',
          isFavorite: entry.isFavorite,
        };
        entries.push(newEntry);
        setGuestJournalEntries(entries);
      } else {
        // Guest: save to localStorage
        const entries = getGuestJournalEntries();
        const newEntry = {
          id: entries.length.toString(),
          meditationType: entry.meditationType,
          duration: entry.duration.toString(),
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: Date.now().toString() + '000000',
          isFavorite: entry.isFavorite,
        };
        entries.push(newEntry);
        setGuestJournalEntries(entries);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
  });
}

export function useUpdateJournalEntry() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async ({ id, entry }: { id: bigint; entry: JournalEntry }) => {
      if (isAuthenticated && actor) {
        // Authenticated: update in backend (not yet implemented)
        console.warn('Backend journal update not yet implemented, using guest storage');
        const entries = getGuestJournalEntries();
        const index = entries.findIndex((e: any) => e.id === id.toString());
        if (index !== -1) {
          entries[index] = serializeJournalEntryUnified(entry);
          setGuestJournalEntries(entries);
        }
      } else {
        // Guest: update in localStorage
        const entries = getGuestJournalEntries();
        const index = entries.findIndex((e: any) => e.id === id.toString());
        if (index !== -1) {
          entries[index] = serializeJournalEntryUnified(entry);
          setGuestJournalEntries(entries);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
  });
}

export function useDeleteJournalEntry() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (isAuthenticated && actor) {
        // Authenticated: delete from backend (not yet implemented)
        console.warn('Backend journal delete not yet implemented, using guest storage');
        const entries = getGuestJournalEntries();
        const filtered = entries.filter((e: any) => e.id !== id.toString());
        setGuestJournalEntries(filtered);
      } else {
        // Guest: delete from localStorage
        const entries = getGuestJournalEntries();
        const filtered = entries.filter((e: any) => e.id !== id.toString());
        setGuestJournalEntries(filtered);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
  });
}

export function useToggleFavoriteJournal() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (isAuthenticated && actor) {
        // Authenticated: toggle in backend (not yet implemented)
        console.warn('Backend journal toggle favorite not yet implemented, using guest storage');
        const entries = getGuestJournalEntries();
        const index = entries.findIndex((e: any) => e.id === id.toString());
        if (index !== -1) {
          entries[index].isFavorite = !entries[index].isFavorite;
          setGuestJournalEntries(entries);
        }
      } else {
        // Guest: toggle in localStorage
        const entries = getGuestJournalEntries();
        const index = entries.findIndex((e: any) => e.id === id.toString());
        if (index !== -1) {
          entries[index].isFavorite = !entries[index].isFavorite;
          setGuestJournalEntries(entries);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
  });
}

// Export/Import meditation data with unified structure
export function useExportMeditationData() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async () => {
      let exportData: UnifiedExportData;

      if (isAuthenticated && actor) {
        // Authenticated: export from backend
        try {
          const backendData = await actor.getCurrentUserExportData();
          exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            journalEntries: backendData.journalEntries.map(serializeJournalEntryUnified),
            sessions: backendData.sessionRecords.map((s) => ({
              minutes: Number(s.minutes),
              timestamp: new Date(Number(s.timestamp) / 1000000).toISOString(),
            })),
            progressStats: {
              totalMinutes: Number(backendData.progressStats.totalMinutes),
              currentStreak: Number(backendData.progressStats.currentStreak),
              monthlyMinutes: Number(backendData.progressStats.monthlyMinutes),
            },
          };
        } catch (error) {
          console.error('Error exporting from backend:', error);
          throw new Error('Failed to export data from backend');
        }
      } else {
        // Guest: export from localStorage
        const journalData = getGuestJournalEntries();
        const progressData = getGuestProgressData();

        exportData = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          journalEntries: journalData,
          sessions: progressData.sessions || [],
          progressStats: {
            totalMinutes: progressData.totalMinutes || 0,
            currentStreak: progressData.currentStreak || 0,
            monthlyMinutes: progressData.monthlyMinutes || 0,
            lastSessionDate: progressData.lastSessionDate,
          },
        };
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inner-bloom-meditation-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  });
}

export function useImportMeditationData() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const data = JSON.parse(text) as UnifiedExportData;

      // Validate data structure
      if (!data.journalEntries || !data.progressStats) {
        throw new Error('Invalid data format');
      }

      if (isAuthenticated && actor) {
        // Authenticated: import to backend ONLY (do NOT write to localStorage)
        try {
          const importData: ImportData = {
            journalEntries: data.journalEntries.map((entry) => ({
              id: BigInt(entry.id || '0'),
              user: identity.getPrincipal(),
              meditationType: entry.meditationType as MeditationType,
              duration: BigInt(entry.duration || '0'),
              mood: entry.mood as MoodState[],
              energy: (entry.energy as EnergyState) || 'balanced',
              reflection: entry.reflection || '',
              timestamp: BigInt(entry.timestamp || String(Date.now() * 1000000)),
              isFavorite: entry.isFavorite || false,
            })),
            sessionRecords: (data.sessions || []).map((session) => ({
              minutes: BigInt(session.minutes || 0),
              timestamp: BigInt(new Date(session.timestamp).getTime() * 1000000),
            })),
            progressStats: {
              totalMinutes: BigInt(data.progressStats.totalMinutes || 0),
              currentStreak: BigInt(data.progressStats.currentStreak || 0),
              monthlyMinutes: BigInt(data.progressStats.monthlyMinutes || 0),
              rank: 'Seedling – just beginning to open',
            },
            userProfile: undefined,
          };

          // Call backend import with overwrite=true
          await actor.importData(importData, true);
        } catch (error) {
          console.error('Backend import error:', error);
          throw new Error('Failed to import data to backend. Please try again.');
        }
      } else {
        // Guest: import to localStorage ONLY
        if (data.journalEntries) {
          setGuestJournalEntries(data.journalEntries);
        }

        const progressData: LocalProgressData = {
          totalMinutes: data.progressStats.totalMinutes || 0,
          currentStreak: data.progressStats.currentStreak || 0,
          monthlyMinutes: data.progressStats.monthlyMinutes || 0,
          lastSessionDate: data.progressStats.lastSessionDate || new Date().toISOString(),
          sessions: data.sessions || [],
        };
        
        // Use the storage utility
        const { setGuestProgressData } = await import('../utils/meditationStorage');
        setGuestProgressData(progressData);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data immediately
      queryClient.invalidateQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats', principalId || 'guest'] });
    },
  });
}

// Books hook - now uses frontend data, converting amazonLink to goodreadsLink for type compatibility
export function useBooks() {
  return useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: async () => {
      // Convert BookWithAmazon to Book type by mapping amazonLink to goodreadsLink
      return BOOK_RECOMMENDATIONS.map(book => ({
        title: book.title,
        author: book.author,
        description: book.description,
        goodreadsLink: book.amazonLink, // Map amazonLink to goodreadsLink for type compatibility
        tags: book.tags,
        icon: book.icon,
      }));
    },
    staleTime: Infinity, // Static data, never stale
  });
}
