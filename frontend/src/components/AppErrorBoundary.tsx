import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-2xl w-full space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Application Error</AlertTitle>
              <AlertDescription>
                The application encountered an unexpected error and cannot continue.
              </AlertDescription>
            </Alert>

            <div className="bg-muted p-4 rounded-lg space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-2">Error Message:</h3>
                <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-32">
                  {error?.message || 'Unknown error'}
                </pre>
              </div>

              {error?.stack && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Stack Trace:</h3>
                  <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-48">
                    {error.stack}
                  </pre>
                </div>
              )}

              {errorInfo?.componentStack && (
                <div>
                  <h3 className="font-semibold text-sm mb-2">Component Stack:</h3>
                  <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-48">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Reload Application
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
