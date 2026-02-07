/**
 * Composition hook for cloud operations with readiness-aware retry logic
 */

import { useRef, useCallback } from 'react';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { runCloudOperationWithRetry, type CloudOperationOptions } from '../utils/cloudSyncRetry';

export function useCloudOperation() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  // Use refs to capture latest values without causing re-renders
  const actorRef = useRef(actor);
  const identityRef = useRef(identity);

  // Update refs when values change
  actorRef.current = actor;
  identityRef.current = identity;

  /**
   * Run a cloud write operation with automatic readiness retry
   */
  const runCloudWriteWithRetry = useCallback(
    async <T>(
      operation: () => Promise<T>,
      options?: CloudOperationOptions
    ): Promise<T> => {
      return runCloudOperationWithRetry(
        operation,
        () => actorRef.current,
        () => identityRef.current,
        options
      );
    },
    []
  );

  return {
    runCloudWriteWithRetry,
    actor,
    identity,
  };
}
