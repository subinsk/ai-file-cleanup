'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Default error fallback component for error boundaries
 */
export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div
      className="flex flex-col items-center justify-center p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={resetErrorBoundary} variant="default">
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
}
