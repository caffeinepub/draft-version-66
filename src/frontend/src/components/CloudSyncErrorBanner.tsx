import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface CloudSyncErrorBannerProps {
  onRetry: () => void;
  isRetrying?: boolean;
  title?: string;
  description?: string;
}

export default function CloudSyncErrorBanner({
  onRetry,
  isRetrying = false,
  title = 'Failed to Load Data',
  description = 'We couldn\'t load your data. Please check your connection and try again.',
}: CloudSyncErrorBannerProps) {
  return (
    <Alert variant="destructive" className="max-w-2xl mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <span>{description}</span>
        <Button
          onClick={onRetry}
          disabled={isRetrying}
          size="sm"
          variant="outline"
          className="border-destructive/50 hover:bg-destructive/10 shrink-0"
        >
          {isRetrying ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Retrying...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
