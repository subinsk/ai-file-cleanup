'use client';

import { ErrorBoundary } from '@ai-cleanup/ui';

export function ClientErrorBoundary({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
