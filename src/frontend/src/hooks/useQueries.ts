import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ProgressStats, JournalEntry, MeditationType, MoodState, EnergyState, Book, ImportData, Ritual, JournalEntryInput } from '../backend';
import { formatRankDisplay } from '../utils/progressRanks';
import {
  getGuestJournalEntries,
  setGuestJournalEntries,
  getGuestProgressData,
  updateGuestProgress,
  getGuestRituals,
  setGuestRituals,
  updateGuestJournalEntry,
  deleteGuestJournalEntry,
} from '../utils/meditationStorage';
import { getCloudSyncErrorMessage, isCloudSyncReady } from '../utils/cloudSync';
import { serializeExportData, deserializeImportData, parseImportFile, type ExportFileFormat } from '../utils/exportImport';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

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

// Local fallback quotes for when backend is unavailable or returns empty
const FALLBACK_QUOTES = [
  "The science of enlightenment is not only about understanding the mind; it's about liberating it.",
  "Hardcore teachings of the Buddha remind us to embrace both the joys and challenges of meditation.",
  "Music has the power to soothe the mind and elevate the spirit in meditation.",
  "Journal entries are a reflection of our inner growth and evolving mindfulness.",
  "Progress is not measured by perfection, but by the persistence to continue the journey.",
  "Balance in meditation brings harmony to both the mind and body.",
  "Achievement in meditation is found in the stillness of the present moment.",
  "Growth is a natural outcome of consistent practice and self-reflection.",
  "Calmness is not the absence of turmoil, but the mastery of one's reaction to it.",
  "Mindfulness transforms everyday moments into opportunities for awareness and growth.",
];

export function useMeditationTypes() {
  const { actor, isFetching } = useActor();

  return useQuery<MeditationTypeInfo[]>({
    queryKey: ['meditationTypes'],
    queryFn: async () => {
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
      if (!actor) {
        return FALLBACK_QUOTES;
      }
      try {
        const quotes = await actor.getDailyQuotes();
        const validQuotes = quotes.filter(q => q && q.trim().length > 0);
        if (validQuotes.length === 0) {
          return FALLBACK_QUOTES;
        }
        return validQuotes;
      } catch (error) {
        console.error('Error fetching daily quotes:', error);
        return FALLBACK_QUOTES;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

// Hook for recording meditation sessions - branches by auth state
export function useRecordSession() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      minutes,
      monthlyMinutes,
      currentStreak,
    }: {
      minutes: number;
      monthlyMinutes: number;
      currentStreak: number;
    }) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        const session = {
          minutes: BigInt(minutes),
          timestamp: BigInt(Date.now() * 1_000_000),
        };

        try {
          const result = await actor.recordMeditationSession(
            session,
            BigInt(monthlyMinutes),
            BigInt(currentStreak)
          );
          return result;
        } catch (error: any) {
          console.error('Error recording session:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const updatedProgress = updateGuestProgress(minutes);
        return {
          totalMinutes: BigInt(updatedProgress.totalMinutes),
          currentStreak: BigInt(updatedProgress.currentStreak),
          monthlyMinutes: BigInt(updatedProgress.monthlyMinutes),
          rank: formatRankDisplay(updatedProgress.totalMinutes),
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      queryClient.invalidateQueries({ queryKey: ['sessionRecords'] });
    },
  });
}

// Hook for creating journal entry
export function useCreateJournalEntry() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      meditationType: MeditationType;
      duration: bigint;
      mood: MoodState[];
      energy: EnergyState;
      reflection: string;
      isFavorite: boolean;
      timestamp: bigint;
    }) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        try {
          const result = await actor.createJournalEntry({
            meditationType: entry.meditationType,
            duration: entry.duration,
            mood: entry.mood,
            energy: entry.energy,
            reflection: entry.reflection,
            isFavorite: entry.isFavorite,
            timestamp: entry.timestamp,
          });
          return result;
        } catch (error: any) {
          console.error('Error creating journal entry:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const entries = getGuestJournalEntries();
        const newEntry = {
          id: Date.now().toString(),
          meditationType: entry.meditationType,
          duration: entry.duration.toString(),
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: entry.timestamp.toString(),
          isFavorite: entry.isFavorite,
        };
        setGuestJournalEntries([...entries, newEntry]);
        return newEntry;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

// Hook for updating journal entry
export function useUpdateJournalEntry() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, entry }: { entryId: bigint; entry: JournalEntryInput }) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        try {
          const result = await actor.updateJournalEntry(entryId, entry);
          return result;
        } catch (error: any) {
          console.error('Error updating journal entry:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        updateGuestJournalEntry(entryId.toString(), {
          reflection: entry.reflection,
          isFavorite: entry.isFavorite,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

// Hook for deleting journal entry
export function useDeleteJournalEntry() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        try {
          await actor.deleteJournalEntry(entryId);
        } catch (error: any) {
          console.error('Error deleting journal entry:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        deleteGuestJournalEntry(entryId.toString());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

// Hook for toggling favorite
export function useToggleFavorite() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: bigint) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        try {
          await actor.toggleFavoriteEntry(entryId);
        } catch (error: any) {
          console.error('Error toggling favorite:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const entries = getGuestJournalEntries();
        const entry = entries.find(e => e.id === entryId.toString());
        if (entry) {
          updateGuestJournalEntry(entryId.toString(), {
            isFavorite: !entry.isFavorite,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
    },
  });
}

// Hook for fetching journal entries - branches by auth state
export function useJournalEntries() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<JournalEntry[]>({
    queryKey: ['journalEntries', identity?.getPrincipal().toString() || 'guest'],
    queryFn: async () => {
      if (isAuthenticated) {
        if (!actor) {
          throw new Error('Actor not available');
        }
        if (!identity) {
          throw new Error('Identity not available');
        }

        try {
          const entries = await actor.getCallerJournalEntries();
          return entries;
        } catch (error: any) {
          console.error('Error fetching journal entries:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const guestEntries = getGuestJournalEntries();
        return guestEntries.map(entry => ({
          id: BigInt(entry.id),
          user: Principal.anonymous(),
          meditationType: entry.meditationType as MeditationType,
          duration: BigInt(entry.duration),
          mood: entry.mood as MoodState[],
          energy: entry.energy as EnergyState,
          reflection: entry.reflection,
          timestamp: BigInt(entry.timestamp),
          isFavorite: entry.isFavorite,
        }));
      }
    },
    enabled: (isAuthenticated ? !!actor && !!identity && !actorFetching : true),
    retry: false,
  });
}

// Hook for fetching progress stats - branches by auth state
export function useProgressStats() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<ProgressStats>({
    queryKey: ['progressStats', identity?.getPrincipal().toString() || 'guest'],
    queryFn: async () => {
      if (isAuthenticated) {
        if (!actor) {
          throw new Error('Actor not available');
        }
        if (!identity) {
          throw new Error('Identity not available');
        }

        try {
          const stats = await actor.getCallerProgressStats();
          return stats;
        } catch (error: any) {
          console.error('Error fetching progress stats:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const progressData = getGuestProgressData();
        return {
          totalMinutes: BigInt(progressData.totalMinutes),
          currentStreak: BigInt(progressData.currentStreak),
          monthlyMinutes: BigInt(progressData.monthlyMinutes),
          rank: formatRankDisplay(progressData.totalMinutes),
        };
      }
    },
    enabled: (isAuthenticated ? !!actor && !!identity && !actorFetching : true),
    retry: false,
  });
}

// Hook for fetching session records - branches by auth state
export function useSessionRecords() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery({
    queryKey: ['sessionRecords', identity?.getPrincipal().toString() || 'guest'],
    queryFn: async () => {
      if (isAuthenticated) {
        if (!actor) {
          throw new Error('Actor not available');
        }
        if (!identity) {
          throw new Error('Identity not available');
        }

        try {
          return await actor.getCallerSessionRecords();
        } catch (error: any) {
          console.error('Error fetching session records:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const progressData = getGuestProgressData();
        return progressData.sessions.map(s => ({
          minutes: BigInt(s.minutes),
          timestamp: BigInt(s.timestamp),
        }));
      }
    },
    enabled: (isAuthenticated ? !!actor && !!identity && !actorFetching : true),
    retry: false,
  });
}

// Hook for fetching books
export function useBooks() {
  const { actor, isFetching } = useActor();

  return useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBooks();
    },
    enabled: !!actor && !isFetching,
  });
}

// Hook for importing data
export function useImportData() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, overwrite }: { file: File; overwrite: boolean }) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      const fileContent = await file.text();
      const fileData = parseImportFile(fileContent);

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        const importData = deserializeImportData(fileData, identity!.getPrincipal().toString());

        try {
          await actor.importData(importData, overwrite);

          // Import rituals if present
          if (fileData.rituals && fileData.rituals.length > 0) {
            for (const ritual of fileData.rituals) {
              try {
                await actor.saveRitual({
                  meditationType: ritual.meditationType as MeditationType,
                  duration: BigInt(ritual.duration),
                  ambientSound: ritual.ambientSound,
                  ambientSoundVolume: BigInt(ritual.ambientSoundVolume),
                  timestamp: BigInt(ritual.timestamp),
                });
              } catch (error) {
                console.warn('Failed to import ritual:', error);
              }
            }
          }
        } catch (error: any) {
          console.error('Error importing data:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const entries = fileData.journalEntries.map(entry => ({
          id: entry.id,
          meditationType: entry.meditationType,
          duration: entry.duration,
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: entry.timestamp,
          isFavorite: entry.isFavorite,
        }));

        if (overwrite) {
          setGuestJournalEntries(entries);
        } else {
          const existing = getGuestJournalEntries();
          setGuestJournalEntries([...existing, ...entries]);
        }

        const progressData = {
          totalMinutes: parseInt(fileData.progressStats.totalMinutes),
          currentStreak: parseInt(fileData.progressStats.currentStreak),
          monthlyMinutes: parseInt(fileData.progressStats.monthlyMinutes),
          sessions: fileData.sessionRecords.map(s => ({
            minutes: parseInt(s.minutes),
            timestamp: s.timestamp,
          })),
        };

        if (overwrite) {
          localStorage.setItem('guest-meditationProgress', JSON.stringify(progressData));
        }

        // Import rituals if present
        if (fileData.rituals && fileData.rituals.length > 0) {
          const rituals = fileData.rituals.map(r => ({
            meditationType: r.meditationType,
            duration: parseInt(r.duration),
            ambientSound: r.ambientSound,
            ambientSoundVolume: parseInt(r.ambientSoundVolume),
            timestamp: r.timestamp,
          }));

          if (overwrite) {
            setGuestRituals(rituals);
          } else {
            const existing = getGuestRituals();
            setGuestRituals([...existing, ...rituals]);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] });
      queryClient.invalidateQueries({ queryKey: ['progressStats'] });
      queryClient.invalidateQueries({ queryKey: ['sessionRecords'] });
      queryClient.invalidateQueries({ queryKey: ['rituals'] });
    },
  });
}

// Hook for exporting data
export function useExportData() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async () => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        try {
          const exportData = await actor.getCurrentUserExportData();
          const rituals = await actor.listCallerRituals();

          const fileData = serializeExportData(
            exportData.journalEntries,
            exportData.sessionRecords,
            exportData.progressStats,
            exportData.userProfile,
            rituals
          );

          const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `meditation-data-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (error: any) {
          console.error('Error exporting data:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const entries = getGuestJournalEntries();
        const progressData = getGuestProgressData();
        const rituals = getGuestRituals();

        const fileData: ExportFileFormat = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          journalEntries: entries.map(entry => ({
            ...entry,
            user: 'guest',
          })),
          sessionRecords: progressData.sessions.map(s => ({
            minutes: s.minutes.toString(),
            timestamp: s.timestamp,
          })),
          progressStats: {
            totalMinutes: progressData.totalMinutes.toString(),
            currentStreak: progressData.currentStreak.toString(),
            monthlyMinutes: progressData.monthlyMinutes.toString(),
            rank: formatRankDisplay(progressData.totalMinutes),
          },
          rituals: rituals.map(r => ({
            meditationType: r.meditationType,
            duration: r.duration.toString(),
            ambientSound: r.ambientSound,
            ambientSoundVolume: r.ambientSoundVolume.toString(),
            timestamp: r.timestamp,
          })),
        };

        const blob = new Blob([JSON.stringify(fileData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meditation-data-guest-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    },
  });
}

// Hook for saving ritual
export function useSaveRitual() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ritual: Ritual) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        try {
          await actor.saveRitual(ritual);
        } catch (error: any) {
          console.error('Error saving ritual:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const rituals = getGuestRituals();
        const newRitual = {
          meditationType: ritual.meditationType,
          duration: Number(ritual.duration),
          ambientSound: ritual.ambientSound,
          ambientSoundVolume: Number(ritual.ambientSoundVolume),
          timestamp: new Date().toISOString(),
        };

        if (rituals.length >= 5) {
          throw new Error('You can only save up to 5 ritual soundscapes. Please delete one before saving a new one.');
        }

        setGuestRituals([...rituals, newRitual]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals'] });
    },
  });
}

// Hook for listing rituals
export function useRituals() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  return useQuery<Ritual[]>({
    queryKey: ['rituals', identity?.getPrincipal().toString() || 'guest'],
    queryFn: async () => {
      if (isAuthenticated) {
        if (!actor) {
          throw new Error('Actor not available');
        }
        if (!identity) {
          throw new Error('Identity not available');
        }

        try {
          return await actor.listCallerRituals();
        } catch (error: any) {
          console.error('Error fetching rituals:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const rituals = getGuestRituals();
        return rituals.map(r => ({
          meditationType: r.meditationType as MeditationType,
          duration: BigInt(r.duration),
          ambientSound: r.ambientSound,
          ambientSoundVolume: BigInt(r.ambientSoundVolume),
          timestamp: BigInt(new Date(r.timestamp).getTime() * 1000000),
        }));
      }
    },
    enabled: (isAuthenticated ? !!actor && !!identity && !actorFetching : true),
    retry: false,
  });
}

// Hook for deleting ritual
export function useDeleteRitual() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ritual: Ritual) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');

        try {
          await actor.deleteRitual(ritual);
        } catch (error: any) {
          console.error('Error deleting ritual:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        const rituals = getGuestRituals();
        const filtered = rituals.filter(
          r =>
            !(
              r.meditationType === ritual.meditationType &&
              r.duration === Number(ritual.duration) &&
              r.ambientSound === ritual.ambientSound &&
              r.ambientSoundVolume === Number(ritual.ambientSoundVolume)
            )
        );
        setGuestRituals(filtered);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals'] });
    },
  });
}
