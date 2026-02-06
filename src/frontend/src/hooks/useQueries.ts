import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { ProgressStats, JournalEntry, MeditationType, MoodState, EnergyState, Book, ImportData, Ritual } from '../backend';
import { formatRankDisplay } from '../utils/progressRanks';
import {
  getGuestJournalEntries,
  setGuestJournalEntries,
  getGuestProgressData,
  updateGuestProgress,
  getGuestRituals,
  setGuestRituals,
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
        // Guest mode: update local storage
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

// Hook for saving journal entry
export function useSaveJournalEntry() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      meditationType: MeditationType;
      duration: number;
      mood: MoodState[];
      energy: EnergyState;
      reflection: string;
      isFavorite: boolean;
    }) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        // For authenticated users, journal entries are saved via backend during import
        // This is a placeholder - the backend doesn't have a direct saveJournalEntry method
        // Entries are created during meditation completion and stored automatically
        return;
      } else {
        // Guest mode: save to local storage
        const entries = getGuestJournalEntries();
        const newEntry = {
          id: Date.now().toString(),
          meditationType: entry.meditationType,
          duration: entry.duration.toString(),
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: Date.now().toString() + '000000',
          isFavorite: entry.isFavorite,
        };
        setGuestJournalEntries([...entries, newEntry]);
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
        // Guest mode: convert local storage entries to JournalEntry format
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
        // Guest mode: return local storage progress
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
        // Guest mode: return local storage sessions
        const progressData = getGuestProgressData();
        return progressData.sessions.map(s => ({
          minutes: BigInt(s.minutes),
          timestamp: BigInt(new Date(s.timestamp).getTime() * 1_000_000),
        }));
      }
    },
    enabled: (isAuthenticated ? !!actor && !!identity && !actorFetching : true),
    retry: false,
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
        if (!identity) throw new Error('Identity not available');

        try {
          const exportData = await actor.getCurrentUserExportData();
          
          // Fetch rituals separately
          let rituals: Ritual[] = [];
          try {
            rituals = await actor.listCallerRituals();
          } catch (e) {
            console.warn('Could not fetch rituals for export:', e);
          }

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

          toast.success('Data exported successfully');
        } catch (error: any) {
          console.error('Error exporting data:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        // Guest mode: export local storage
        const guestEntries = getGuestJournalEntries();
        const progressData = getGuestProgressData();
        const rituals = getGuestRituals();

        const fileData: ExportFileFormat = {
          version: '1.0',
          exportDate: new Date().toISOString(),
          journalEntries: guestEntries.map(entry => ({
            id: entry.id,
            user: 'guest',
            meditationType: entry.meditationType,
            duration: entry.duration,
            mood: entry.mood,
            energy: entry.energy,
            reflection: entry.reflection,
            timestamp: entry.timestamp,
            isFavorite: entry.isFavorite,
          })),
          sessionRecords: progressData.sessions.map(s => ({
            minutes: s.minutes.toString(),
            timestamp: (new Date(s.timestamp).getTime() * 1_000_000).toString(),
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

        toast.success('Data exported successfully');
      }
    },
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

      // Read and parse file
      const fileContent = await file.text();
      const fileData = parseImportFile(fileContent);

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');
        if (!identity) throw new Error('Identity not available');

        try {
          // Deserialize and validate
          const importData = deserializeImportData(fileData, identity.getPrincipal().toString());

          // Import to backend
          await actor.importData(importData, overwrite);

          // Import rituals separately if present
          if (fileData.rituals && fileData.rituals.length > 0) {
            try {
              // If overwrite, delete existing rituals first
              if (overwrite) {
                const existingRituals = await actor.listCallerRituals();
                for (const ritual of existingRituals) {
                  try {
                    await actor.deleteRitual(ritual);
                  } catch (e) {
                    console.warn('Could not delete ritual during import:', e);
                  }
                }
              }

              // Save imported rituals
              for (const ritualData of fileData.rituals) {
                const ritual: Ritual = {
                  meditationType: ritualData.meditationType as any,
                  duration: BigInt(ritualData.duration),
                  ambientSound: ritualData.ambientSound,
                  ambientSoundVolume: BigInt(ritualData.ambientSoundVolume),
                  timestamp: BigInt(ritualData.timestamp),
                };

                try {
                  await actor.saveRitual(ritual);
                } catch (e: any) {
                  // Skip duplicates silently
                  if (!e.message?.includes('DuplicateSoundscape')) {
                    console.warn('Could not save ritual during import:', e);
                  }
                }
              }
            } catch (e) {
              console.warn('Could not import rituals:', e);
            }
          }

          toast.success('Data imported successfully');
        } catch (error: any) {
          console.error('Error importing data:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        // Guest mode: import to local storage
        if (overwrite) {
          setGuestJournalEntries([]);
          setGuestRituals([]);
        }

        // Import journal entries - keep as guest format
        const existingEntries = overwrite ? [] : getGuestJournalEntries();
        const newEntries = fileData.journalEntries.map(entry => ({
          id: entry.id,
          meditationType: entry.meditationType,
          duration: entry.duration,
          mood: entry.mood,
          energy: entry.energy,
          reflection: entry.reflection,
          timestamp: entry.timestamp,
          isFavorite: entry.isFavorite,
        }));
        setGuestJournalEntries([...existingEntries, ...newEntries]);

        // Import progress data
        const progressData: LocalProgressData = {
          totalMinutes: Number(fileData.progressStats.totalMinutes),
          currentStreak: Number(fileData.progressStats.currentStreak),
          monthlyMinutes: Number(fileData.progressStats.monthlyMinutes),
          sessions: fileData.sessionRecords.map(s => ({
            minutes: Number(s.minutes),
            timestamp: new Date(Number(s.timestamp) / 1_000_000).toISOString(),
          })),
        };
        localStorage.setItem('guest-progress', JSON.stringify(progressData));

        // Import rituals
        if (fileData.rituals) {
          const existingRituals = overwrite ? [] : getGuestRituals();
          const newRituals = fileData.rituals.map(r => ({
            meditationType: r.meditationType,
            duration: Number(r.duration),
            ambientSound: r.ambientSound,
            ambientSoundVolume: Number(r.ambientSoundVolume),
            timestamp: r.timestamp,
          }));
          setGuestRituals([...existingRituals, ...newRituals]);
        }

        toast.success('Data imported successfully');
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

// Hook for fetching rituals - branches by auth state
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
          const rituals = await actor.listCallerRituals();
          return rituals;
        } catch (error: any) {
          console.error('Error fetching rituals:', error);
          throw new Error(getCloudSyncErrorMessage(error));
        }
      } else {
        // Guest mode: return local storage rituals
        const localRituals = getGuestRituals();
        return localRituals.map(r => ({
          meditationType: r.meditationType as any,
          duration: BigInt(r.duration),
          ambientSound: r.ambientSound,
          ambientSoundVolume: BigInt(r.ambientSoundVolume),
          timestamp: BigInt(new Date(r.timestamp).getTime() * 1_000_000),
        }));
      }
    },
    enabled: (isAuthenticated ? !!actor && !!identity && !actorFetching : true),
    retry: false,
  });
}

// Hook for saving a ritual
export function useSaveRitual() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ritual: Ritual) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');
        if (!identity) throw new Error('Identity not available');

        try {
          await actor.saveRitual(ritual);
          toast.success('Ritual saved successfully');
        } catch (error: any) {
          console.error('Error saving ritual:', error);
          const errorMessage = getCloudSyncErrorMessage(error);
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        // Guest mode: save to local storage
        const localRituals = getGuestRituals();

        // Check for duplicates
        const isDuplicate = localRituals.some(
          r =>
            r.meditationType === ritual.meditationType &&
            r.duration === Number(ritual.duration) &&
            r.ambientSound === ritual.ambientSound &&
            r.ambientSoundVolume === Number(ritual.ambientSoundVolume)
        );

        if (isDuplicate) {
          const errorMessage = 'This ritual already exists in your collection.';
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        if (localRituals.length >= 5) {
          const errorMessage = 'You can only save up to 5 rituals. Please delete one before saving a new one.';
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        const newRitual: LocalRitual = {
          meditationType: ritual.meditationType,
          duration: Number(ritual.duration),
          ambientSound: ritual.ambientSound,
          ambientSoundVolume: Number(ritual.ambientSoundVolume),
          timestamp: new Date().toISOString(),
        };

        setGuestRituals([...localRituals, newRitual]);
        toast.success('Ritual saved successfully');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals'] });
    },
  });
}

// Hook for deleting a ritual
export function useDeleteRitual() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ritual: Ritual) => {
      const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

      if (isAuthenticated) {
        if (!actor) throw new Error('Actor not available');
        if (!identity) throw new Error('Identity not available');

        try {
          await actor.deleteRitual(ritual);
          toast.success('Ritual deleted successfully');
        } catch (error: any) {
          console.error('Error deleting ritual:', error);
          const errorMessage = getCloudSyncErrorMessage(error);
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }
      } else {
        // Guest mode: delete from local storage
        const localRituals = getGuestRituals();
        const filteredRituals = localRituals.filter(
          r =>
            !(
              r.meditationType === ritual.meditationType &&
              r.duration === Number(ritual.duration) &&
              r.ambientSound === ritual.ambientSound &&
              r.ambientSoundVolume === Number(ritual.ambientSoundVolume)
            )
        );

        if (filteredRituals.length === localRituals.length) {
          const errorMessage = 'Ritual not found.';
          toast.error(errorMessage);
          throw new Error(errorMessage);
        }

        setGuestRituals(filteredRituals);
        toast.success('Ritual deleted successfully');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rituals'] });
    },
  });
}

// Hook for fetching books
export function useBooks() {
  const { actor, isFetching } = useActor();

  return useQuery<Book[]>({
    queryKey: ['books'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.getBooks();
      } catch (error) {
        console.error('Error fetching books:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}
