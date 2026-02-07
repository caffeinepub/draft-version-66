import { MeditationType } from '../backend';

/**
 * Validates and coerces a string to a supported MeditationType.
 * Falls back to mindfulness if invalid.
 */
export function validateMeditationType(type: string | undefined): MeditationType {
  if (!type) return MeditationType.mindfulness;
  
  const normalized = type.toLowerCase();
  
  switch (normalized) {
    case 'mindfulness':
      return MeditationType.mindfulness;
    case 'metta':
      return MeditationType.metta;
    case 'visualization':
      return MeditationType.visualization;
    case 'ifs':
      return MeditationType.ifs;
    default:
      return MeditationType.mindfulness;
  }
}
