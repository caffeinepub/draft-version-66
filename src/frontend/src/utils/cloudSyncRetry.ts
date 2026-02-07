/**
 * Frontend-only utility for cloud operation readiness and retry logic
 */

import { getCloudSyncErrorMessage } from './cloudSync';

export interface CloudOperationOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

/**
 * Waits for actor and identity to be ready by polling.
 * Returns true if ready, false if timeout.
 */
async function waitForActorAndIdentity(
  getActor: () => any,
  getIdentity: () => any,
  timeoutMs: number = 5000,
  intervalMs: number = 200
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    if (getActor() && getIdentity()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  
  return false;
}

/**
 * Wraps a cloud operation with automatic retry on readiness failures
 */
export async function runCloudOperationWithRetry<T>(
  operation: () => Promise<T>,
  getActor: () => any,
  getIdentity: () => any,
  options: CloudOperationOptions = {}
): Promise<T> {
  const { maxRetries = 1, retryDelayMs = 500, timeoutMs = 5000 } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait for actor and identity to be ready before attempting operation
      await waitForActorAndIdentity(getActor, getIdentity, timeoutMs);

      // Execute the operation
      return await operation();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || error.toString();

      // Check if this is an authorization error - don't retry these
      if (
        errorMessage.includes('Unauthorized') ||
        errorMessage.includes('Authentication required') ||
        errorMessage.includes('not authorized') ||
        errorMessage.includes('permission')
      ) {
        throw error;
      }

      // Check if this is a readiness error and we have retries left
      const isReadinessError =
        errorMessage.includes('Actor not available') ||
        errorMessage.includes('Identity not available') ||
        errorMessage.includes('actor not initialized') ||
        errorMessage.includes('not ready');

      if (isReadinessError && attempt < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        continue;
      }

      // No more retries or not a readiness error
      throw error;
    }
  }

  // Should not reach here, but throw last error if we do
  throw lastError;
}

/**
 * Check if an error is an authorization error (should not be retried)
 */
export function isAuthorizationError(error: any): boolean {
  const errorMessage = error?.message || error?.toString() || '';
  return (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Authentication required') ||
    errorMessage.includes('not authorized') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('Runtime.trap')
  );
}

/**
 * Check if an error is a readiness error (can be retried)
 */
export function isReadinessError(error: any): boolean {
  const errorMessage = error?.message || error?.toString() || '';
  return (
    errorMessage.includes('Actor not available') ||
    errorMessage.includes('Identity not available') ||
    errorMessage.includes('actor not initialized') ||
    errorMessage.includes('not ready') ||
    errorMessage.includes('Connection not ready')
  );
}
