import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface CloudSyncErrorBannerProps {
  onRetry: () => void;
  isRetrying?: boolean;
  title?: string;
  description?: string;
  errorType?: 'authorization' | 'readiness' | 'network' | 'other';
}

export default function CloudSyncErrorBanner({
  onRetry,
  isRetrying = false,
  title = 'Failed to Load Data',
  description = 'We couldn\'t load your data. Please check your connection and try again.',
  errorType = 'other',
}: CloudSyncErrorBannerProps) {
  // Customize message based on error type
  let displayTitle = title;
  let displayDescription = description;

  if (errorType === 'authorization') {
    displayTitle = 'Authentication Required';
    displayDescription = 'Please log in to access this feature.';
  } else if (errorType === 'readiness') {
    displayTitle = 'Connecting...';
    displayDescription = 'Establishing connection to the server. This should only take a moment.';
  } else if (errorType === 'network') {
    displayTitle = 'Network Error';
    displayDescription = 'Please check your internet connection and try again.';
  }

  return (
    <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{displayTitle}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{displayDescription}</span>
        <Button
          onClick={onRetry}
          disabled={isRetrying || errorType === 'readiness'}
          variant="outline"
          size="sm"
          className="shrink-0 border-red-500/50 hover:bg-red-500/20"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Retrying...
            </>
          ) : errorType === 'readiness' ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
