import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { JournalEntry, JournalEntryInput, MeditationSession, ProgressStats, UserProfile, Book, Ritual } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import { serializeExportData, deserializeImportData, downloadJSON, readJSONFile } from '../utils/exportImport';
import {
  getGuestJournalEntries,
  setGuestJournalEntries,
  updateGuestJournalEntry,
  deleteGuestJournalEntry,
  getGuestProgressData,
  updateGuestProgress,
  getGuestRituals,
  setGuestRituals,
  addGuestRitual,
  deleteGuestRitual,
} from '../utils/meditationStorage';

// Books query
export function useBooks() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getBooks();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Daily quotes query
export function useDailyQuotes() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['dailyQuotes'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDailyQuotes();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Meditation types query (returns available meditation types)
export function useMeditationTypes() {
  return useQuery<string[]>({
    queryKey: ['meditationTypes'],
    queryFn: async () => {
      return ['mindfulness', 'metta', 'visualization', 'ifs'];
    },
  });
}

// User profile queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

// Journal entries queries
export function useJournalEntries() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<JournalEntry[]>({
    queryKey: ['journalEntries'],
    queryFn: async () => {
      if (!isAuthenticated) {
        // Guest mode: return local storage entries
        const guestEntries = getGuestJournalEntries();
        return guestEntries.map((entry) => ({
          id: BigInt(entry.id),
          user: Principal.anonymous(),
          meditationType: entry.meditationType as any,
          duration: BigInt(entry.duration),
          mood: entry.mood as any[],
          energy: entry.energy as any,
          reflection: entry.reflection,
          timestamp: BigInt(entry.timestamp),
          isFavorite: entry.isFavorite,
        }));
      }

      if (!actor) throw new Error('Actor not available');
      return actor.getCallerJournalEntries();
    },
    enabled: !isAuthenticated || (!!actor && !actorFetching),
  });
}

export function useCreateJournalEntry() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: JournalEntryInput) => {
      if (!isAuthenticated) {
        // Guest mode: save to local storage
        const guestEntries = getGuestJournalEntries();
        const newId = Date.now().toString();
        const newEntry = {
          id: newId,
          meditationType: entry.meditationType,
          duration: entry.duration.toString(),
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: entry.timestamp.toString(),
          isFavorite: entry.isFavorite,
        };
        guestEntries.push(newEntry);
        setGuestJournalEntries(guestEntries);
        return;
      }

      if (!actor) throw new Error('Actor not available');
      return actor.createJournalEntry(entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useUpdateJournalEntry() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, entry }: { entryId: bigint; entry: JournalEntryInput }) => {
      if (!isAuthenticated) {
        // Guest mode: update local storage
        updateGuestJournalEntry(entryId.toString(), { reflection: entry.reflection });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      return actor.updateJournalEntry(entryId, entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useDeleteJournalEntry() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!isAuthenticated) {
        // Guest mode: delete from local storage
        deleteGuestJournalEntry(entryId.toString());
        return;
      }

      if (!actor) throw new Error('Actor not available');
      return actor.deleteJournalEntry(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useToggleFavorite() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      if (!isAuthenticated) {
        // Guest mode: toggle in local storage
        const entries = getGuestJournalEntries();
        const entry = entries.find((e) => e.id === entryId.toString());
        if (entry) {
          updateGuestJournalEntry(entryId.toString(), { isFavorite: !entry.isFavorite });
        }
        return;
      }

      if (!actor) throw new Error('Actor not available');
      return actor.toggleFavoriteEntry(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

// Progress queries
export function useProgressStats() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<ProgressStats>({
    queryKey: ['progressStats'],
    queryFn: async () => {
      if (!isAuthenticated) {
        // Guest mode: return local storage progress
        const guestProgress = getGuestProgressData();
        return {
          totalMinutes: BigInt(guestProgress.totalMinutes),
          currentStreak: BigInt(guestProgress.currentStreak),
          monthlyMinutes: BigInt(guestProgress.monthlyMinutes),
          rank: guestProgress.totalMinutes >= 1000 ? 'Master' :
                guestProgress.totalMinutes >= 500 ? 'Expert' :
                guestProgress.totalMinutes >= 200 ? 'Advanced' :
                guestProgress.totalMinutes >= 50 ? 'Intermediate' : 'Beginner',
        };
      }

      if (!actor) throw new Error('Actor not available');
      return actor.getCallerProgressStats();
    },
    enabled: !isAuthenticated || (!!actor && !actorFetching),
  });
}

export function useSessionRecords() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<MeditationSession[]>({
    queryKey: ['sessionRecords'],
    queryFn: async () => {
      if (!isAuthenticated) {
        // Guest mode: return local storage sessions
        const guestProgress = getGuestProgressData();
        return guestProgress.sessions.map((session) => ({
          minutes: BigInt(session.minutes),
          timestamp: BigInt(new Date(session.timestamp).getTime() * 1_000_000),
        }));
      }

      if (!actor) throw new Error('Actor not available');
      return actor.getCallerSessionRecords();
    },
    enabled: !isAuthenticated || (!!actor && !actorFetching),
  });
}

export function useRecordSession() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ session, monthlyStats, currentStreak }: { session: MeditationSession; monthlyStats: bigint; currentStreak: bigint }) => {
      if (!isAuthenticated) {
        // Guest mode: update local storage
        updateGuestProgress(Number(session.minutes));
        return;
      }

      if (!actor) throw new Error('Actor not available');
      return actor.recordMeditationSession(session, monthlyStats, currentStreak);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      queryClient.invalidateQueries({ queryKey: ['sessionRecords'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

// Export/Import mutations
export function useExportData() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        // Guest mode: export local storage data
        const guestEntries = getGuestJournalEntries();
        const guestProgress = getGuestProgressData();

        const journalEntries: JournalEntry[] = guestEntries.map((entry) => ({
          id: BigInt(entry.id),
          user: Principal.anonymous(),
          meditationType: entry.meditationType as any,
          duration: BigInt(entry.duration),
          mood: entry.mood as any[],
          energy: entry.energy as any,
          reflection: entry.reflection,
          timestamp: BigInt(entry.timestamp),
          isFavorite: entry.isFavorite,
        }));

        const sessionRecords: MeditationSession[] = guestProgress.sessions.map((session) => ({
          minutes: BigInt(session.minutes),
          timestamp: BigInt(new Date(session.timestamp).getTime() * 1_000_000),
        }));

        const progressStats: ProgressStats = {
          totalMinutes: BigInt(guestProgress.totalMinutes),
          currentStreak: BigInt(guestProgress.currentStreak),
          monthlyMinutes: BigInt(guestProgress.monthlyMinutes),
          rank: guestProgress.totalMinutes >= 1000 ? 'Master' :
                guestProgress.totalMinutes >= 500 ? 'Expert' :
                guestProgress.totalMinutes >= 200 ? 'Advanced' :
                guestProgress.totalMinutes >= 50 ? 'Intermediate' : 'Beginner',
        };

        const exportData = serializeExportData(journalEntries, sessionRecords, progressStats, null);
        downloadJSON(exportData);
        return;
      }

      if (!actor) throw new Error('Actor not available');
      const data = await actor.getCurrentUserExportData();
      const exportData = serializeExportData(
        data.journalEntries,
        data.sessionRecords,
        data.progressStats,
        data.userProfile
      );
      downloadJSON(exportData);
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useImportData() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, overwrite }: { file: File; overwrite: boolean }) => {
      const fileContent = await readJSONFile(file);
      const importData = deserializeImportData(fileContent);

      if (!isAuthenticated) {
        // Guest mode: overwrite local storage data
        const guestEntries = importData.journalEntries.map((entry) => ({
          id: entry.id.toString(),
          meditationType: entry.meditationType,
          duration: entry.duration.toString(),
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: entry.timestamp.toString(),
          isFavorite: entry.isFavorite,
        }));

        const guestProgress = {
          totalMinutes: Number(importData.progressStats.totalMinutes),
          currentStreak: Number(importData.progressStats.currentStreak),
          monthlyMinutes: Number(importData.progressStats.monthlyMinutes),
          sessions: importData.sessionRecords.map((session) => ({
            minutes: Number(session.minutes),
            timestamp: new Date(Number(session.timestamp) / 1_000_000).toISOString(),
          })),
        };

        // Overwrite (replace) local storage data
        setGuestJournalEntries(guestEntries);
        localStorage.setItem('guest-meditationProgress', JSON.stringify(guestProgress));
        return;
      }

      if (!actor) throw new Error('Actor not available');
      await actor.importData(importData);
    },
    onSuccess: () => {
      // Invalidate and actively refetch all relevant queries for immediate refresh
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      queryClient.invalidateQueries({ queryKey: ['sessionRecords'] });
      
      // Actively refetch to ensure immediate UI update
      queryClient.refetchQueries({ queryKey: ['journalEntries'] });
      queryClient.refetchQueries({ queryKey: ['progressStats'] });
      queryClient.refetchQueries({ queryKey: ['sessionRecords'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

// Rituals queries
export function useRituals() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return useQuery<Ritual[]>({
    queryKey: ['rituals'],
    queryFn: async () => {
      if (!isAuthenticated) {
        // Guest mode: return local storage rituals
        const guestRituals = getGuestRituals();
        return guestRituals.map((ritual) => ({
          meditationType: ritual.meditationType as any,
          duration: BigInt(ritual.duration),
          ambientSound: ritual.ambientSound,
          ambientSoundVolume: BigInt(ritual.ambientSoundVolume),
          timestamp: BigInt(new Date(ritual.timestamp).getTime() * 1_000_000),
        }));
      }

      if (!actor) throw new Error('Actor not available');
      return actor.listCallerRituals();
    },
    enabled: !isAuthenticated || (!!actor && !actorFetching),
  });
}

export function useSaveRitual() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ritual: Ritual) => {
      if (!isAuthenticated) {
        // Guest mode: save to local storage with duplicate/limit checks
        addGuestRitual({
          meditationType: ritual.meditationType,
          duration: Number(ritual.duration),
          ambientSound: ritual.ambientSound,
          ambientSoundVolume: Number(ritual.ambientSoundVolume),
        });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      return actor.saveRitual(ritual);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}

export function useDeleteRitual() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ritual: any) => {
      if (!isAuthenticated) {
        // Guest mode: delete from local storage
        deleteGuestRitual({
          meditationType: ritual.meditationType,
          duration: typeof ritual.duration === 'number' ? ritual.duration : Number(ritual.duration),
          ambientSound: ritual.ambientSound,
          ambientSoundVolume: typeof ritual.ambientSoundVolume === 'number' ? ritual.ambientSoundVolume : Number(ritual.ambientSoundVolume),
        });
        return;
      }

      if (!actor) throw new Error('Actor not available');
      
      // Normalize ritual payload to match backend Ritual type
      const normalizedRitual: Ritual = {
        meditationType: ritual.meditationType,
        duration: typeof ritual.duration === 'bigint' ? ritual.duration : BigInt(ritual.duration),
        ambientSound: ritual.ambientSound,
        ambientSoundVolume: typeof ritual.ambientSoundVolume === 'bigint' ? ritual.ambientSoundVolume : BigInt(ritual.ambientSoundVolume),
        timestamp: typeof ritual.timestamp === 'bigint' 
          ? ritual.timestamp 
          : typeof ritual.timestamp === 'string'
            ? BigInt(new Date(ritual.timestamp).getTime() * 1_000_000)
            : BigInt(ritual.timestamp),
      };

      return actor.deleteRitual(normalizedRitual);
    },
    onSuccess: () => {
      // Invalidate and refetch rituals query for immediate UI update
      queryClient.invalidateQueries({ queryKey: ['rituals'] });
      queryClient.refetchQueries({ queryKey: ['rituals'] });
    },
    onError: (error: any) => {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    },
  });
}
