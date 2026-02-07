export type CloudSyncErrorType = 'authorization' | 'readiness' | 'network' | 'other';

export interface CloudSyncError {
  type: CloudSyncErrorType;
  message: string;
  originalError?: any;
}

/**
 * Classifies a cloud sync error into one of the known error types.
 */
export function classifyCloudSyncError(error: any): CloudSyncErrorType {
  const errorMessage = error?.message || String(error);

  // Authorization errors
  if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Authentication required') ||
    errorMessage.includes('access denied')
  ) {
    return 'authorization';
  }

  // Readiness errors (actor not ready, canister not initialized, etc.)
  if (
    errorMessage.includes('Actor not available') ||
    errorMessage.includes('not ready') ||
    errorMessage.includes('not initialized') ||
    errorMessage.includes('canister is empty')
  ) {
    return 'readiness';
  }

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection')
  ) {
    return 'network';
  }

  // Default to 'other' for unclassified errors
  return 'other';
}

/**
 * Returns a user-friendly error message based on the error type and content.
 */
export function getCloudSyncErrorMessage(error: any): string {
  const errorType = classifyCloudSyncError(error);
  const errorMessage = error?.message || String(error);

  switch (errorType) {
    case 'authorization':
      return 'You need to be logged in to perform this action.';
    
    case 'readiness':
      return 'Cloud sync is not ready yet. Please try again in a moment.';
    
    case 'network':
      return 'Network error. Please check your connection and try again.';
    
    case 'other':
      // Check for specific backend error patterns
      if (errorMessage.includes('DuplicateSoundscape')) {
        return 'This ritual already exists in your collection.';
      }
      if (errorMessage.includes('RitualLimitExceeded')) {
        return 'You can only save up to 5 rituals. Please delete one before saving a new one.';
      }
      if (errorMessage.includes('RitualNotFound')) {
        return 'Ritual not found. It may have already been deleted.';
      }
      if (errorMessage.includes('INVALID_JSON')) {
        return 'Invalid file format. Please select a valid JSON export file.';
      }
      if (errorMessage.includes('INVALID_STRUCTURE')) {
        return 'Invalid data structure. The file may be corrupted or from an incompatible version.';
      }
      
      // Generic fallback
      return 'An error occurred. Please try again.';
  }
}

/**
 * Waits for cloud sync to be ready by polling the actor availability.
 * Returns true if ready, false if timeout.
 */
export async function waitForCloudSyncReady(
  checkFn: () => boolean,
  timeoutMs: number = 5000,
  intervalMs: number = 200
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (checkFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  return false;
}
