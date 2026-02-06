/**
 * Cloud sync utility for standardized error handling and readiness checks
 */

export interface CloudSyncError {
  code: string;
  message: string;
  userMessage: string;
}

export const CLOUD_SYNC_ERRORS = {
  ACTOR_NOT_READY: {
    code: 'ACTOR_NOT_READY',
    message: 'Backend actor not initialized',
    userMessage: 'Connection not ready. Please wait a moment and try again.',
  },
  IDENTITY_NOT_READY: {
    code: 'IDENTITY_NOT_READY',
    message: 'User identity not available',
    userMessage: 'Authentication not ready. Please log in and try again.',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    message: 'User not authorized',
    userMessage: 'You need to be logged in to access this feature.',
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    message: 'Network request failed',
    userMessage: 'Network error. Please check your connection and try again.',
  },
  BACKEND_ERROR: {
    code: 'BACKEND_ERROR',
    message: 'Backend operation failed',
    userMessage: 'Server error. Please try again later.',
  },
  VALIDATION_ERROR: {
    code: 'VALIDATION_ERROR',
    message: 'Data validation failed',
    userMessage: 'Invalid data format. Please check your input.',
  },
  DUPLICATE_RITUAL: {
    code: 'DUPLICATE_RITUAL',
    message: 'Duplicate ritual',
    userMessage: 'This ritual already exists in your collection.',
  },
  RITUAL_LIMIT: {
    code: 'RITUAL_LIMIT',
    message: 'Ritual limit exceeded',
    userMessage: 'You can only save up to 5 rituals. Please delete one before saving a new one.',
  },
  IMPORT_ERROR: {
    code: 'IMPORT_ERROR',
    message: 'Import failed',
    userMessage: 'Failed to import data. Please check the file format and try again.',
  },
} as const;

/**
 * Map backend error messages to user-friendly messages
 */
export function getCloudSyncErrorMessage(error: any): string {
  if (!error) {
    return CLOUD_SYNC_ERRORS.BACKEND_ERROR.userMessage;
  }

  const errorMessage = error.message || error.toString();

  // Check for specific backend trap messages
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication required')) {
    return CLOUD_SYNC_ERRORS.UNAUTHORIZED.userMessage;
  }

  if (errorMessage.includes('DuplicateSoundscape') || errorMessage.includes('identical soundscape')) {
    return CLOUD_SYNC_ERRORS.DUPLICATE_RITUAL.userMessage;
  }

  if (errorMessage.includes('RitualLimitExceeded') || errorMessage.includes('up to 5 ritual')) {
    return CLOUD_SYNC_ERRORS.RITUAL_LIMIT.userMessage;
  }

  if (errorMessage.includes('RitualNotFound')) {
    return 'Ritual not found. It may have already been deleted.';
  }

  // Check for actor/identity readiness issues
  if (errorMessage.includes('Actor not available') || errorMessage.includes('actor not initialized')) {
    return CLOUD_SYNC_ERRORS.ACTOR_NOT_READY.userMessage;
  }

  if (errorMessage.includes('Identity not available') || errorMessage.includes('not authenticated')) {
    return CLOUD_SYNC_ERRORS.IDENTITY_NOT_READY.userMessage;
  }

  // Check for network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
    return CLOUD_SYNC_ERRORS.NETWORK_ERROR.userMessage;
  }

  // Check for validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
    return CLOUD_SYNC_ERRORS.VALIDATION_ERROR.userMessage;
  }

  // Check for import errors
  if (errorMessage.includes('import') || errorMessage.includes('Import') || errorMessage.includes('export file')) {
    return CLOUD_SYNC_ERRORS.IMPORT_ERROR.userMessage;
  }

  // Default to backend error
  return CLOUD_SYNC_ERRORS.BACKEND_ERROR.userMessage;
}

/**
 * Check if actor and identity are ready for cloud operations
 */
export function isCloudSyncReady(actor: any, identity: any): boolean {
  return !!actor && !!identity;
}

/**
 * Wait for cloud sync to be ready with timeout
 */
export async function waitForCloudSyncReady(
  getActor: () => any,
  getIdentity: () => any,
  timeoutMs: number = 5000
): Promise<{ actor: any; identity: any }> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const actor = getActor();
    const identity = getIdentity();

    if (isCloudSyncReady(actor, identity)) {
      return { actor, identity };
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(CLOUD_SYNC_ERRORS.ACTOR_NOT_READY.message);
}
