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
    userMessage: 'Connecting to server... Please wait a moment.',
  },
  IDENTITY_NOT_READY: {
    code: 'IDENTITY_NOT_READY',
    message: 'User identity not available',
    userMessage: 'Authenticating... Please wait a moment.',
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
 * Enhanced to better classify authorization vs readiness errors
 */
export function getCloudSyncErrorMessage(error: any): string {
  if (!error) {
    return CLOUD_SYNC_ERRORS.BACKEND_ERROR.userMessage;
  }

  const errorMessage = error.message || error.toString();

  // Check for authorization errors first (these should NOT show "Connection not ready")
  if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Authentication required') ||
    errorMessage.includes('not authorized') ||
    errorMessage.includes('permission denied') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('Runtime.trap')
  ) {
    return CLOUD_SYNC_ERRORS.UNAUTHORIZED.userMessage;
  }

  // Check for specific backend trap messages
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
 * Classify error type for UI handling
 */
export function classifyCloudSyncError(error: any): 'authorization' | 'readiness' | 'network' | 'other' {
  if (!error) return 'other';

  const errorMessage = error.message || error.toString();

  // Authorization errors
  if (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Authentication required') ||
    errorMessage.includes('not authorized') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('Runtime.trap')
  ) {
    return 'authorization';
  }

  // Readiness errors
  if (
    errorMessage.includes('Actor not available') ||
    errorMessage.includes('Identity not available') ||
    errorMessage.includes('actor not initialized') ||
    errorMessage.includes('not ready')
  ) {
    return 'readiness';
  }

  // Network errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
    return 'network';
  }

  return 'other';
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
