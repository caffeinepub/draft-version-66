import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ProgressStats, JournalEntry, MeditationType, MoodState, EnergyState, Book, ImportData, Ritual } from '../backend';
import { BOOK_RECOMMENDATIONS } from '../lib/bookData';
import { formatRankDisplay } from '../utils/progressRanks';
import {
  getGuestJournalEntries,
  setGuestJournalEntries,
  getGuestProgressData,
  updateGuestProgress,
  getGuestRituals,
  setGuestRituals,
} from '../utils/meditationStorage';
import { waitForCloudSyncReady, getCloudSyncErrorMessage, CloudSyncError, CLOUD_SYNC_ERRORS } from '../utils/cloudSync';
import { toast } from 'sonner';
import { useRef, useEffect } from 'react';

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

// Local ritual type for guest storage
interface LocalRitual {
  meditationType: string;
  duration: number;
  ambientSound: string;
  ambientSoundVolume: number;
  timestamp: string;
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
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Use refs to provide live values to waitForCloudSyncReady
  const actorRef = useRef(actor);
  const isFetchingRef = useRef(isFetching);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return useMutation({
    mutationFn: async (minutes: number) => {
      if (isAuthenticated) {
        // Authenticated: wait for cloud sync to be ready before proceeding
        await waitForCloudSyncReady(
          () => actorRef.current,
          () => isAuthenticatedRef.current || false,
          () => isFetchingRef.current,
          8000,
          150
        );
        
        // Fetch backend sessions, calculate stats, and persist
        const backendSessions = await actorRef.current!.getCallerSessionRecords();
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Calculate streak from backend sessions
        let currentStreak = 1;
        if (backendSessions.length > 0) {
          const sortedSessions = [...backendSessions].sort((a, b) => 
            Number(b.timestamp) - Number(a.timestamp)
          );
          const lastSession = sortedSessions[0];
          const lastDate = new Date(Number(lastSession.timestamp) / 1000000);
          const lastDateStr = lastDate.toISOString().split('T')[0];
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastDateStr === today) {
            // Already meditated today, maintain streak
            const backendStats = await actorRef.current!.getCallerProgressStats();
            currentStreak = Number(backendStats.currentStreak);
          } else if (lastDateStr === yesterdayStr) {
            // Meditated yesterday, increment streak
            const backendStats = await actorRef.current!.getCallerProgressStats();
            currentStreak = Number(backendStats.currentStreak) + 1;
          }
        }

        // Calculate total minutes from backend
        const backendStats = await actorRef.current!.getCallerProgressStats();
        const totalMinutes = Number(backendStats.totalMinutes) + minutes;

        // Calculate monthly minutes from backend sessions
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthlyMinutes = [...backendSessions, { minutes: BigInt(minutes), timestamp: BigInt(Date.now() * 1000000) }]
          .filter((session) => new Date(Number(session.timestamp) / 1000000) >= thirtyDaysAgo)
          .reduce((sum, session) => sum + Number(session.minutes), 0);

        await actorRef.current!.recordMeditationSession(
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
      // Invalidate and refetch both progress and journal queries to refresh UI immediately
      queryClient.invalidateQueries({ queryKey: ['progressStats', principalId || 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
      queryClient.refetchQueries({ queryKey: ['progressStats', principalId || 'guest'] });
      queryClient.refetchQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message, {
        className: 'border-2 border-destructive/50 bg-destructive/10',
      });
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
      if (isAuthenticated) {
        // Authenticated: fetch from backend
        if (!actor) throw new Error('Actor not available');
        const backendStats = await actor.getCallerProgressStats();
        return {
          totalMinutes: Number(backendStats.totalMinutes),
          currentStreak: Number(backendStats.currentStreak),
          monthlyMinutes: Number(backendStats.monthlyMinutes),
          sessions: [],
        };
      } else {
        // Guest: read from localStorage
        return getGuestProgressData();
      }
    },
    enabled: isAuthenticated ? (!!actor && !isFetching && !isInitializing) : !isInitializing,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
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
      if (isAuthenticated) {
        // Authenticated: fetch from backend
        if (!actor) throw new Error('Actor not available');
        return await actor.getCallerJournalEntries();
      } else {
        // Guest: read from localStorage
        const entries = getGuestJournalEntries();
        return entries.map(deserializeJournalEntryUnified);
      }
    },
    enabled: isAuthenticated ? (!!actor && !isFetching && !isInitializing) : !isInitializing,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useSaveJournalEntry() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Use refs to provide live values to waitForCloudSyncReady
  const actorRef = useRef(actor);
  const isFetchingRef = useRef(isFetching);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return useMutation({
    mutationFn: async (entry: Omit<JournalEntry, 'id' | 'user' | 'timestamp'>) => {
      if (isAuthenticated) {
        // Authenticated: wait for cloud sync to be ready before proceeding
        await waitForCloudSyncReady(
          () => actorRef.current,
          () => isAuthenticatedRef.current || false,
          () => isFetchingRef.current,
          8000,
          150
        );
        
        // Fetch current entries, add new one with unique ID, and import back
        const currentEntries = await actorRef.current!.getCallerJournalEntries();
        
        // Generate unique ID by finding max ID and adding 1
        const maxId = currentEntries.length > 0 
          ? Math.max(...currentEntries.map(e => Number(e.id)))
          : -1;
        
        const newEntry: JournalEntry = {
          id: BigInt(maxId + 1),
          user: identity!.getPrincipal(),
          meditationType: entry.meditationType,
          duration: entry.duration,
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: BigInt(Date.now() * 1000000),
          isFavorite: entry.isFavorite,
        };
        
        const allEntries = [...currentEntries, newEntry];
        const sessions = await actorRef.current!.getCallerSessionRecords();
        const stats = await actorRef.current!.getCallerProgressStats();
        
        // Fetch current user profile to avoid overwriting it
        const currentProfile = await actorRef.current!.getCallerUserProfile();
        
        const importPayload: ImportData = {
          journalEntries: allEntries,
          sessionRecords: sessions,
          progressStats: stats,
        };
        
        // Only include userProfile if it exists (Candid-compatible optional)
        if (currentProfile) {
          importPayload.userProfile = currentProfile;
        }
        
        await actorRef.current!.importData(importPayload, true);
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
      queryClient.refetchQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message, {
        className: 'border-2 border-destructive/50 bg-destructive/10',
      });
    },
  });
}

export function useUpdateJournalEntry() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Use refs to provide live values to waitForCloudSyncReady
  const actorRef = useRef(actor);
  const isFetchingRef = useRef(isFetching);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return useMutation({
    mutationFn: async ({ id, entry }: { id: bigint; entry: JournalEntry }) => {
      if (isAuthenticated) {
        // Authenticated: wait for cloud sync to be ready before proceeding
        await waitForCloudSyncReady(
          () => actorRef.current,
          () => isAuthenticatedRef.current || false,
          () => isFetchingRef.current,
          8000,
          150
        );
        
        // Fetch all entries, update the one, and import back
        const currentEntries = await actorRef.current!.getCallerJournalEntries();
        const updatedEntries = currentEntries.map(e => 
          e.id === id ? entry : e
        );
        
        const sessions = await actorRef.current!.getCallerSessionRecords();
        const stats = await actorRef.current!.getCallerProgressStats();
        
        // Fetch current user profile to avoid overwriting it
        const currentProfile = await actorRef.current!.getCallerUserProfile();
        
        const importPayload: ImportData = {
          journalEntries: updatedEntries,
          sessionRecords: sessions,
          progressStats: stats,
        };
        
        // Only include userProfile if it exists (Candid-compatible optional)
        if (currentProfile) {
          importPayload.userProfile = currentProfile;
        }
        
        await actorRef.current!.importData(importPayload, true);
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
      queryClient.refetchQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message, {
        className: 'border-2 border-destructive/50 bg-destructive/10',
      });
    },
  });
}

export function useDeleteJournalEntry() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Use refs to provide live values to waitForCloudSyncReady
  const actorRef = useRef(actor);
  const isFetchingRef = useRef(isFetching);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (isAuthenticated) {
        // Authenticated: wait for cloud sync to be ready before proceeding
        await waitForCloudSyncReady(
          () => actorRef.current,
          () => isAuthenticatedRef.current || false,
          () => isFetchingRef.current,
          8000,
          150
        );
        
        // Fetch all entries, filter out the one, and import back
        const currentEntries = await actorRef.current!.getCallerJournalEntries();
        const filteredEntries = currentEntries.filter(e => e.id !== id);
        
        const sessions = await actorRef.current!.getCallerSessionRecords();
        const stats = await actorRef.current!.getCallerProgressStats();
        
        // Fetch current user profile to avoid overwriting it
        const currentProfile = await actorRef.current!.getCallerUserProfile();
        
        const importPayload: ImportData = {
          journalEntries: filteredEntries,
          sessionRecords: sessions,
          progressStats: stats,
        };
        
        // Only include userProfile if it exists (Candid-compatible optional)
        if (currentProfile) {
          importPayload.userProfile = currentProfile;
        }
        
        await actorRef.current!.importData(importPayload, true);
      } else {
        // Guest: delete from localStorage
        const entries = getGuestJournalEntries();
        const filtered = entries.filter((e: any) => e.id !== id.toString());
        setGuestJournalEntries(filtered);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
      queryClient.refetchQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message, {
        className: 'border-2 border-destructive/50 bg-destructive/10',
      });
    },
  });
}

export function useToggleFavoriteJournal() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Use refs to provide live values to waitForCloudSyncReady
  const actorRef = useRef(actor);
  const isFetchingRef = useRef(isFetching);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (isAuthenticated) {
        // Authenticated: wait for cloud sync to be ready before proceeding
        await waitForCloudSyncReady(
          () => actorRef.current,
          () => isAuthenticatedRef.current || false,
          () => isFetchingRef.current,
          8000,
          150
        );
        
        // Fetch all entries, toggle favorite, and import back
        const currentEntries = await actorRef.current!.getCallerJournalEntries();
        const updatedEntries = currentEntries.map(e => 
          e.id === id ? { ...e, isFavorite: !e.isFavorite } : e
        );
        
        const sessions = await actorRef.current!.getCallerSessionRecords();
        const stats = await actorRef.current!.getCallerProgressStats();
        
        // Fetch current user profile to avoid overwriting it
        const currentProfile = await actorRef.current!.getCallerUserProfile();
        
        const importPayload: ImportData = {
          journalEntries: updatedEntries,
          sessionRecords: sessions,
          progressStats: stats,
        };
        
        // Only include userProfile if it exists (Candid-compatible optional)
        if (currentProfile) {
          importPayload.userProfile = currentProfile;
        }
        
        await actorRef.current!.importData(importPayload, true);
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
      queryClient.refetchQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message, {
        className: 'border-2 border-destructive/50 bg-destructive/10',
      });
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
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Use refs to provide live values to waitForCloudSyncReady
  const actorRef = useRef(actor);
  const isFetchingRef = useRef(isFetching);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const data = JSON.parse(text) as UnifiedExportData;

      // Validate data structure
      if (!data.journalEntries || !data.progressStats) {
        throw new Error('Invalid data format');
      }

      if (isAuthenticated) {
        // Authenticated: wait for cloud sync to be ready before proceeding
        await waitForCloudSyncReady(
          () => actorRef.current,
          () => isAuthenticatedRef.current || false,
          () => isFetchingRef.current,
          8000,
          150
        );
        
        // Import to backend ONLY (do NOT write to localStorage)
        try {
          // Fetch current user profile to avoid overwriting it
          const currentProfile = await actorRef.current!.getCallerUserProfile();
          
          const importPayload: ImportData = {
            journalEntries: data.journalEntries.map((entry, index) => ({
              id: BigInt(index),
              user: identity!.getPrincipal(),
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
              rank: formatRankDisplay(data.progressStats.totalMinutes || 0),
            },
          };
          
          // Only include userProfile if it exists (Candid-compatible optional)
          if (currentProfile) {
            importPayload.userProfile = currentProfile;
          }

          // Call backend import with overwrite=true
          await actorRef.current!.importData(importPayload, true);
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
      // Invalidate and refetch queries to refresh data immediately, including rituals
      queryClient.invalidateQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats', principalId || 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['rituals', principalId || 'guest'] });
      
      queryClient.refetchQueries({ queryKey: ['journalEntries', principalId || 'guest'] });
      queryClient.refetchQueries({ queryKey: ['progressStats', principalId || 'guest'] });
      queryClient.refetchQueries({ queryKey: ['rituals', principalId || 'guest'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message, {
        className: 'border-2 border-destructive/50 bg-destructive/10',
      });
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

// RITUALS HOOKS - branches by auth state

// Helper to get meditation name from type
function getMeditationName(type: string): string {
  const typeMap: Record<string, string> = {
    mindfulness: 'Mindfulness',
    metta: 'Metta',
    visualization: 'Visualization',
    ifs: 'IFS',
  };
  return typeMap[type] || 'Mindfulness';
}

// Helper to get ambient sound name
function getAmbientSoundName(soundId: string): string {
  const soundMap: Record<string, string> = {
    temple: 'Temple',
    'singing-bowl': 'Singing Bowl',
    rain: 'Rain',
    ocean: 'Ocean',
    soothing: 'Soothing',
    birds: 'Birds',
    crickets: 'Crickets',
  };
  return soundMap[soundId] || 'Soothing';
}

// Helper to check if two rituals are exact matches
function areRitualsEqual(a: LocalRitual, b: LocalRitual): boolean {
  return (
    a.meditationType === b.meditationType &&
    a.duration === b.duration &&
    a.ambientSound === b.ambientSound &&
    a.ambientSoundVolume === b.ambientSoundVolume
  );
}

// Hook to list rituals - branches by auth state
export function useRituals() {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Array<LocalRitual & { displayName: string }>>({
    queryKey: ['rituals', principalId || 'guest'],
    queryFn: async () => {
      if (isAuthenticated) {
        // Authenticated: fetch from backend
        if (!actor) throw new Error('Actor not available');
        const backendRituals = await actor.listCallerRituals();
        return backendRituals.map((r) => {
          const meditationName = getMeditationName(r.meditationType);
          const duration = Number(r.duration);
          const soundName = getAmbientSoundName(r.ambientSound);
          return {
            meditationType: r.meditationType,
            duration: duration,
            ambientSound: r.ambientSound,
            ambientSoundVolume: Number(r.ambientSoundVolume),
            timestamp: new Date(Number(r.timestamp) / 1000000).toISOString(),
            displayName: `${meditationName} · ${duration} min · ${soundName}`,
          };
        });
      } else {
        // Guest: read from localStorage
        const guestRituals = getGuestRituals();
        return guestRituals.map((r) => {
          const meditationName = getMeditationName(r.meditationType);
          const soundName = getAmbientSoundName(r.ambientSound);
          return {
            ...r,
            displayName: `${meditationName} · ${r.duration} min · ${soundName}`,
          };
        });
      }
    },
    enabled: isAuthenticated ? (!!actor && !isFetching && !isInitializing) : !isInitializing,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

// Hook to save a ritual - branches by auth state with duplicate detection and 5-ritual limit
export function useSaveRitual() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Use refs to provide live values to waitForCloudSyncReady
  const actorRef = useRef(actor);
  const isFetchingRef = useRef(isFetching);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return useMutation({
    mutationFn: async (ritual: Omit<LocalRitual, 'timestamp'>) => {
      if (isAuthenticated) {
        // Authenticated: wait for cloud sync to be ready before proceeding with longer timeout
        await waitForCloudSyncReady(
          () => actorRef.current,
          () => isAuthenticatedRef.current || false,
          () => isFetchingRef.current,
          10000,
          200
        );
        
        // Backend handles both duplicate check and limit enforcement
        const backendRitual: Ritual = {
          meditationType: ritual.meditationType as MeditationType,
          duration: BigInt(ritual.duration),
          ambientSound: ritual.ambientSound,
          ambientSoundVolume: BigInt(ritual.ambientSoundVolume),
          timestamp: BigInt(Date.now() * 1000000),
        };
        
        try {
          await actorRef.current!.saveRitual(backendRitual);
        } catch (error: any) {
          // Map backend errors to frontend error identifiers
          const errorMsg = error.message || String(error);
          if (errorMsg.includes('DuplicateSoundscape')) {
            throw new Error('DUPLICATE_RITUAL');
          } else if (errorMsg.includes('RitualLimitExceeded')) {
            throw new Error('RITUAL_LIMIT_REACHED');
          } else {
            throw error;
          }
        }
      } else {
        // Guest: check for limit and duplicates in localStorage before saving
        const guestRituals = getGuestRituals();
        
        // Check limit first
        if (guestRituals.length >= 5) {
          throw new Error('RITUAL_LIMIT_REACHED');
        }
        
        const newRitual: LocalRitual = {
          ...ritual,
          timestamp: new Date().toISOString(),
        };
        
        // Check for duplicates
        const isDuplicate = guestRituals.some((existing) => areRitualsEqual(existing, newRitual));
        
        if (isDuplicate) {
          throw new Error('DUPLICATE_RITUAL');
        }
        
        guestRituals.push(newRitual);
        setGuestRituals(guestRituals);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals', principalId || 'guest'] });
      queryClient.refetchQueries({ queryKey: ['rituals', principalId || 'guest'] });
    },
    onError: (error: any) => {
      // Don't show toast for specific ritual errors (handled by component)
      if (error.message !== 'DUPLICATE_RITUAL' && error.message !== 'RITUAL_LIMIT_REACHED') {
        const message = getCloudSyncErrorMessage(error);
        toast.error(message, {
          className: 'border-2 border-destructive/50 bg-destructive/10',
        });
      }
    },
  });
}

// Hook to delete a ritual - branches by auth state
export function useDeleteRitual() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const principalId = identity?.getPrincipal().toString();
  const isAuthenticated = identity && !identity.getPrincipal().isAnonymous();

  // Use refs to provide live values to waitForCloudSyncReady
  const actorRef = useRef(actor);
  const isFetchingRef = useRef(isFetching);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);

  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  return useMutation({
    mutationFn: async (ritual: LocalRitual) => {
      if (isAuthenticated) {
        // Authenticated: wait for cloud sync to be ready before proceeding
        await waitForCloudSyncReady(
          () => actorRef.current,
          () => isAuthenticatedRef.current || false,
          () => isFetchingRef.current,
          8000,
          150
        );
        
        // Delete from backend
        const backendRitual: Ritual = {
          meditationType: ritual.meditationType as MeditationType,
          duration: BigInt(ritual.duration),
          ambientSound: ritual.ambientSound,
          ambientSoundVolume: BigInt(ritual.ambientSoundVolume),
          timestamp: BigInt(new Date(ritual.timestamp).getTime() * 1000000),
        };
        await actorRef.current!.deleteRitual(backendRitual);
      } else {
        // Guest: delete from localStorage
        const guestRituals = getGuestRituals();
        const filteredRituals = guestRituals.filter((existing) => !areRitualsEqual(existing, ritual));
        setGuestRituals(filteredRituals);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals', principalId || 'guest'] });
      queryClient.refetchQueries({ queryKey: ['rituals', principalId || 'guest'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message, {
        className: 'border-2 border-destructive/50 bg-destructive/10',
      });
    },
  });
}
