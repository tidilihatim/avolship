'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger, LogCategory } from '@/lib/logging/logger';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showError?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundaryWithLogging extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our logging service
    logger.error('React Error Boundary caught an error', error, {
      category: LogCategory.SYSTEM_ERROR,
      metadata: {
        errorId: this.state.errorId,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h2 className="mt-4 text-xl font-semibold text-center text-gray-900 dark:text-white">
              Something went wrong
            </h2>
            
            <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
              An unexpected error occurred. The error has been logged and our team will investigate.
            </p>

            {this.state.errorId && (
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-500">
                Error ID: {this.state.errorId}
              </p>
            )}

            {this.props.showError && this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 overflow-auto text-gray-600 dark:text-gray-400">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={() => window.location.href = '/dashboard'}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary
export function useErrorHandler() {
  return (error: Error, errorInfo?: any) => {
    logger.error('Manual error caught', error, {
      category: LogCategory.SYSTEM_ERROR,
      metadata: errorInfo,
    });
  };
}