/**
 * Cloud sync utility for authenticated backend operations
 * Provides standardized error handling, readiness checks, and async wait helpers
 */

export const CLOUD_SYNC_ERRORS = {
  NOT_READY: 'CLOUD_SYNC_NOT_READY',
  ACTOR_UNAVAILABLE: 'ACTOR_UNAVAILABLE',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
} as const;

export const CLOUD_SYNC_MESSAGES = {
  NOT_READY: 'Cloud sync is not ready yet. Please wait a moment and try again.',
  ACTOR_UNAVAILABLE: 'Unable to connect to the backend. Please check your connection and try again.',
  NOT_AUTHENTICATED: 'You must be logged in to perform this action.',
} as const;

export class CloudSyncError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'CloudSyncError';
  }
}

/**
 * Checks if cloud sync is ready for authenticated operations
 * @param actor - The backend actor instance
 * @param isAuthenticated - Whether the user is authenticated
 * @param actorFetching - Whether the actor is currently being fetched
 * @throws CloudSyncError if not ready
 */
export function ensureCloudSyncReady(
  actor: any,
  isAuthenticated: boolean,
  actorFetching: boolean
): void {
  if (!isAuthenticated) {
    throw new CloudSyncError(
      CLOUD_SYNC_ERRORS.NOT_AUTHENTICATED,
      CLOUD_SYNC_MESSAGES.NOT_AUTHENTICATED
    );
  }

  if (!actor || actorFetching) {
    throw new CloudSyncError(
      CLOUD_SYNC_ERRORS.NOT_READY,
      CLOUD_SYNC_MESSAGES.NOT_READY
    );
  }
}

/**
 * Waits for cloud sync to be ready with timeout and retry logic
 * @param getActor - Function to get the backend actor instance (may be null initially)
 * @param getIsAuthenticated - Function to check if user is authenticated
 * @param getActorFetching - Function to check if actor is currently being fetched
 * @param maxWaitMs - Maximum time to wait in milliseconds (default: 8000)
 * @param checkIntervalMs - Interval between checks in milliseconds (default: 150)
 * @returns Promise that resolves when ready or rejects on timeout
 */
export async function waitForCloudSyncReady(
  getActor: () => any,
  getIsAuthenticated: () => boolean,
  getActorFetching: () => boolean,
  maxWaitMs: number = 8000,
  checkIntervalMs: number = 150
): Promise<void> {
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const checkReady = () => {
      const actor = getActor();
      const isAuthenticated = getIsAuthenticated();
      const actorFetching = getActorFetching();

      if (!isAuthenticated) {
        reject(new CloudSyncError(
          CLOUD_SYNC_ERRORS.NOT_AUTHENTICATED,
          CLOUD_SYNC_MESSAGES.NOT_AUTHENTICATED
        ));
        return;
      }

      if (actor && !actorFetching) {
        resolve();
        return;
      }

      if (Date.now() - startTime > maxWaitMs) {
        reject(new CloudSyncError(
          CLOUD_SYNC_ERRORS.NOT_READY,
          CLOUD_SYNC_MESSAGES.NOT_READY
        ));
        return;
      }

      setTimeout(checkReady, checkIntervalMs);
    };

    checkReady();
  });
}

/**
 * Gets a user-friendly error message for cloud sync errors
 */
export function getCloudSyncErrorMessage(error: any): string {
  if (error instanceof CloudSyncError) {
    return error.message;
  }
  
  const errorMsg = error?.message || String(error);
  
  // Map backend error messages to user-friendly messages
  if (errorMsg.includes('Unauthorized') || errorMsg.includes('Authentication required')) {
    return CLOUD_SYNC_MESSAGES.NOT_AUTHENTICATED;
  }
  
  if (
    errorMsg.includes('Actor not available') || 
    errorMsg.includes('not ready') ||
    errorMsg.includes('not initialized') ||
    errorMsg.includes('initialization') ||
    errorMsg.includes('Cannot read properties of null')
  ) {
    return CLOUD_SYNC_MESSAGES.NOT_READY;
  }
  
  // Return the original error message if no mapping found
  return errorMsg || 'An unexpected error occurred. Please try again.';
}
