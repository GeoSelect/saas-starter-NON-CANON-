'use client';

import React, { ReactNode } from 'react';
import { logger } from '@/lib/observability/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  operation: string;
  fallback?: ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error with context
    logger.error(this.props.operation, error, {
      errorBoundary: true,
      componentStack: errorInfo.componentStack,
    });

    // Call custom handler if provided
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-700 text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <details className="text-xs text-red-600">
              <summary className="cursor-pointer font-medium mb-2">Details</summary>
              <pre className="bg-red-100 p-3 rounded overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export function useAsyncError() {
  const [, setError] = React.useState();
  React.useCallback(
    (e: Error) => {
      setError(() => {
        throw e;
      });
    },
    [setError]
  );
}
