import type { ImportData, JournalEntry, MeditationSession, ProgressStats, UserProfile, Ritual } from '../backend';

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
    journalEntries: journalEntries.map(entry => ({
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
    sessionRecords: sessionRecords.map(session => ({
      minutes: session.minutes.toString(),
      timestamp: session.timestamp.toString(),
    })),
    progressStats: {
      totalMinutes: progressStats.totalMinutes.toString(),
      currentStreak: progressStats.currentStreak.toString(),
      monthlyMinutes: progressStats.monthlyMinutes.toString(),
      rank: progressStats.rank,
    },
    userProfile: userProfile ? {
      name: userProfile.name,
      email: userProfile.email,
      avatar: undefined, // Skip avatar for now
    } : undefined,
    rituals: rituals?.map(ritual => ({
      meditationType: ritual.meditationType,
      duration: ritual.duration.toString(),
      ambientSound: ritual.ambientSound,
      ambientSoundVolume: ritual.ambientSoundVolume.toString(),
      timestamp: ritual.timestamp.toString(),
    })),
  };
}

/**
 * Deserialize on-disk JSON to backend ImportData format with validation
 */
export function deserializeImportData(fileData: ExportFileFormat, callerPrincipal: string): ImportData {
  // Validate version
  if (!fileData.version || fileData.version !== '1.0') {
    throw new Error('Unsupported export file version');
  }

  // Validate required fields
  if (!Array.isArray(fileData.journalEntries)) {
    throw new Error('Invalid export file: missing journalEntries');
  }
  if (!Array.isArray(fileData.sessionRecords)) {
    throw new Error('Invalid export file: missing sessionRecords');
  }
  if (!fileData.progressStats) {
    throw new Error('Invalid export file: missing progressStats');
  }

  // Safe bigint conversion helper
  const safeBigInt = (value: string | number, fieldName: string): bigint => {
    try {
      return BigInt(value);
    } catch (e) {
      throw new Error(`Invalid numeric value for ${fieldName}: ${value}`);
    }
  };

  // Convert journal entries
  const journalEntries: JournalEntry[] = fileData.journalEntries.map((entry, index) => {
    if (!entry.meditationType || !entry.duration || !entry.timestamp) {
      throw new Error(`Invalid journal entry at index ${index}: missing required fields`);
    }
    return {
      id: safeBigInt(entry.id || '0', `journalEntry[${index}].id`),
      user: callerPrincipal as any, // Will be overridden by backend
      meditationType: entry.meditationType as any,
      duration: safeBigInt(entry.duration, `journalEntry[${index}].duration`),
      mood: (entry.mood || []) as any[],
      energy: entry.energy as any,
      reflection: entry.reflection || '',
      timestamp: safeBigInt(entry.timestamp, `journalEntry[${index}].timestamp`),
      isFavorite: entry.isFavorite || false,
    };
  });

  // Convert session records
  const sessionRecords: MeditationSession[] = fileData.sessionRecords.map((session, index) => {
    if (!session.minutes || !session.timestamp) {
      throw new Error(`Invalid session record at index ${index}: missing required fields`);
    }
    return {
      minutes: safeBigInt(session.minutes, `sessionRecord[${index}].minutes`),
      timestamp: safeBigInt(session.timestamp, `sessionRecord[${index}].timestamp`),
    };
  });

  // Convert progress stats
  const progressStats: ProgressStats = {
    totalMinutes: safeBigInt(fileData.progressStats.totalMinutes, 'progressStats.totalMinutes'),
    currentStreak: safeBigInt(fileData.progressStats.currentStreak, 'progressStats.currentStreak'),
    monthlyMinutes: safeBigInt(fileData.progressStats.monthlyMinutes, 'progressStats.monthlyMinutes'),
    rank: fileData.progressStats.rank || 'Beginner',
  };

  // Convert user profile if present
  const userProfile: UserProfile | undefined = fileData.userProfile ? {
    name: fileData.userProfile.name || '',
    email: fileData.userProfile.email,
    avatar: undefined, // Skip avatar for now
  } : undefined;

  return {
    journalEntries,
    sessionRecords,
    progressStats,
    userProfile,
  };
}

/**
 * Parse and validate import file
 */
export function parseImportFile(fileContent: string): ExportFileFormat {
  try {
    const parsed = JSON.parse(fileContent);
    
    // Basic structure validation
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid file format: expected JSON object');
    }

    return parsed as ExportFileFormat;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error('Invalid JSON file');
    }
    throw e;
  }
}
