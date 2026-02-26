import type { ImportData, JournalEntry, MeditationSession, ProgressStats, UserProfile, Ritual, MeditationType, MoodState, EnergyState } from '../backend';
import { Principal } from '@dfinity/principal';
import { MeditationType as MeditationTypeEnum, MoodState as MoodStateEnum, EnergyState as EnergyStateEnum } from '../backend';

/**
 * On-disk JSON format for export/import with safe bigint handling
 */
export interface ExportFileFormat {
  version: string;
  exportDate: string;
  journalEntries: Array<{
    id: string;
    user: string;
    meditationType: string;
    duration: string;
    mood: string[];
    energy: string;
    reflection: string;
    timestamp: string;
    isFavorite: boolean;
  }>;
  sessionRecords: Array<{
    minutes: string;
    timestamp: string;
  }>;
  progressStats: {
    totalMinutes: string;
    currentStreak: string;
    monthlyMinutes: string;
    rank: string;
  };
  userProfile?: {
    name: string;
    email?: string;
    avatar?: string;
  };
  rituals?: Array<{
    meditationType: string;
    duration: string;
    ambientSound: string;
    ambientSoundVolume: string;
    timestamp: string;
  }>;
}

/**
 * Serialize backend data to safe on-disk JSON format
 */
export function serializeExportData(
  journalEntries: JournalEntry[],
  sessionRecords: MeditationSession[],
  progressStats: ProgressStats,
  userProfile?: UserProfile | null,
  rituals?: Ritual[]
): ExportFileFormat {
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    journalEntries: journalEntries.map((entry) => ({
      id: entry.id.toString(),
      user: entry.user.toString(),
      meditationType: entry.meditationType,
      duration: entry.duration.toString(),
      mood: entry.mood,
      energy: entry.energy,
      reflection: entry.reflection,
      timestamp: entry.timestamp.toString(),
      isFavorite: entry.isFavorite,
    })),
    sessionRecords: sessionRecords.map((session) => ({
      minutes: session.minutes.toString(),
      timestamp: session.timestamp.toString(),
    })),
    progressStats: {
      totalMinutes: progressStats.totalMinutes.toString(),
      currentStreak: progressStats.currentStreak.toString(),
      monthlyMinutes: progressStats.monthlyMinutes.toString(),
      rank: progressStats.rank,
    },
    userProfile: userProfile
      ? {
          name: userProfile.name,
          email: userProfile.email,
          avatar: undefined, // ExternalBlob not serializable
        }
      : undefined,
    rituals: rituals?.map((ritual) => ({
      meditationType: ritual.meditationType,
      duration: ritual.duration.toString(),
      ambientSound: ritual.ambientSound,
      ambientSoundVolume: ritual.ambientSoundVolume.toString(),
      timestamp: ritual.timestamp.toString(),
    })),
  };
}

/**
 * Validate and normalize a meditation type string
 */
function validateMeditationType(value: string): MeditationType {
  const normalized = value.toLowerCase();
  if (normalized === 'mindfulness') return MeditationTypeEnum.mindfulness;
  if (normalized === 'metta') return MeditationTypeEnum.metta;
  if (normalized === 'visualization') return MeditationTypeEnum.visualization;
  if (normalized === 'ifs') return MeditationTypeEnum.ifs;
  return MeditationTypeEnum.mindfulness; // fallback
}

/**
 * Validate and normalize a mood state string
 */
function validateMoodState(value: string): MoodState | null {
  const normalized = value.toLowerCase();
  if (normalized === 'calm') return MoodStateEnum.calm;
  if (normalized === 'anxious') return MoodStateEnum.anxious;
  if (normalized === 'neutral') return MoodStateEnum.neutral;
  if (normalized === 'happy') return MoodStateEnum.happy;
  if (normalized === 'sad') return MoodStateEnum.sad;
  return null;
}

/**
 * Validate and normalize an energy state string
 */
function validateEnergyState(value: string): EnergyState {
  const normalized = value.toLowerCase();
  if (normalized === 'tired') return EnergyStateEnum.tired;
  if (normalized === 'energized') return EnergyStateEnum.energized;
  if (normalized === 'balanced') return EnergyStateEnum.balanced;
  if (normalized === 'restless') return EnergyStateEnum.restless;
  return EnergyStateEnum.balanced; // fallback
}

/**
 * Safe bigint conversion with overflow protection
 */
function safeBigInt(value: string | number): bigint {
  try {
    return BigInt(value);
  } catch {
    return BigInt(0);
  }
}

/**
 * Deserialize on-disk JSON to backend-compatible ImportData
 * Throws descriptive errors for invalid JSON or structure
 */
export function deserializeImportData(fileContent: string): ImportData {
  let parsed: any;
  
  // Step 1: Parse JSON
  try {
    parsed = JSON.parse(fileContent);
  } catch (err) {
    throw new Error('INVALID_JSON');
  }

  // Step 2: Validate structure - support both versioned and legacy formats
  const isVersioned = parsed.version && parsed.journalEntries && parsed.sessionRecords && parsed.progressStats;
  const isLegacy = parsed.journalEntries && parsed.sessionRecords && parsed.progressStats;
  
  if (!isVersioned && !isLegacy) {
    throw new Error('INVALID_STRUCTURE');
  }

  // Step 3: Parse journal entries with validation
  const journalEntries: JournalEntry[] = (parsed.journalEntries || []).map((entry: any) => {
    // Validate and normalize mood array
    const validMoods = (entry.mood || [])
      .map((m: string) => validateMoodState(m))
      .filter((m: MoodState | null) => m !== null) as MoodState[];
    
    // Ensure at least one valid mood
    if (validMoods.length === 0) {
      validMoods.push(MoodStateEnum.neutral);
    }

    return {
      id: safeBigInt(entry.id || 0),
      user: Principal.anonymous(), // Will be replaced by backend with caller
      meditationType: validateMeditationType(entry.meditationType || 'mindfulness'),
      duration: safeBigInt(entry.duration || 0),
      mood: validMoods,
      energy: validateEnergyState(entry.energy || 'balanced'),
      reflection: String(entry.reflection || ''),
      timestamp: safeBigInt(entry.timestamp || Date.now() * 1_000_000),
      isFavorite: Boolean(entry.isFavorite),
    };
  });

  // Step 4: Parse session records
  const sessionRecords: MeditationSession[] = (parsed.sessionRecords || []).map((session: any) => ({
    minutes: safeBigInt(session.minutes || 0),
    timestamp: safeBigInt(session.timestamp || Date.now() * 1_000_000),
  }));

  // Step 5: Parse progress stats
  const progressStats: ProgressStats = {
    totalMinutes: safeBigInt(parsed.progressStats?.totalMinutes || 0),
    currentStreak: safeBigInt(parsed.progressStats?.currentStreak || 0),
    monthlyMinutes: safeBigInt(parsed.progressStats?.monthlyMinutes || 0),
    rank: String(parsed.progressStats?.rank || 'Beginner'),
  };

  // Step 6: Parse user profile (optional)
  const userProfile: UserProfile | undefined = parsed.userProfile
    ? {
        name: String(parsed.userProfile.name || ''),
        email: parsed.userProfile.email ? String(parsed.userProfile.email) : undefined,
        avatar: undefined, // ExternalBlob not supported in import
      }
    : undefined;

  return {
    journalEntries,
    sessionRecords,
    progressStats,
    userProfile,
  };
}

/**
 * Download serialized data as JSON file
 */
export function downloadJSON(data: ExportFileFormat, filename: string = 'meditation-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read and parse a JSON file
 */
export async function readJSONFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
