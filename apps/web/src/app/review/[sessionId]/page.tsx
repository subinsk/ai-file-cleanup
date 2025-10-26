'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  GroupAccordion,
  Badge,
  LoadingSpinner,
  Progress,
} from '@ai-cleanup/ui';
import { useUploadStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import type { DedupeGroup } from '@ai-cleanup/types';
import { Download, FileCheck, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatBytes } from '@ai-cleanup/ui';

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const {
    sessionStatus,
    progress,
    totalFiles,
    processedFiles,
    duplicateGroups,
    processingStats,
    errorMessage,
    selectedFiles,
    toggleFileSelection,
    selectAll,
    deselectAll,
    updateSessionStatus,
    reset,
  } = useUploadStore();

  const [isPolling, setIsPolling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadSessionData = useCallback(async () => {
    try {
      const status = await apiClient.getSessionStatus(sessionId);

      // Update store with latest status
      updateSessionStatus(
        status.status,
        status.progress,
        status.processed_files,
        status.failed_files,
        status.duplicate_groups,
        status.processing_stats,
        status.error_message
      );

      // Start polling if still processing
      if (status.status === 'processing' || status.status === 'uploaded') {
        startPolling();
      }
    } catch (err) {
      // Failed to load session data
    }
  }, [sessionId, updateSessionStatus]);

  useEffect(() => {
    if (!sessionId) {
      router.push('/upload');
      return;
    }

    // Load initial session data immediately
    loadSessionData();

    return () => {
      // Cleanup polling on unmount
      setIsPolling(false);
    };
  }, [sessionId, router, loadSessionData]);

  const startPolling = () => {
    setIsPolling(true);
    pollSessionStatus();
  };

  const pollSessionStatus = async () => {
    if (!isPolling) return;

    try {
      const status = await apiClient.getSessionStatus(sessionId);

      // Update store with latest status
      updateSessionStatus(
        status.status,
        status.progress,
        status.processed_files,
        status.failed_files,
        status.duplicate_groups,
        status.processing_stats,
        status.error_message
      );

      // Continue polling if not completed or failed
      if (status.status === 'processing' || status.status === 'uploaded') {
        setTimeout(pollSessionStatus, 2000); // Poll every 2 seconds
      } else {
        setIsPolling(false);
      }
    } catch (err) {
      // Failed to poll session status
      setIsPolling(false);
    }
  };

  const handleRefresh = () => {
    loadSessionData();
  };

  const handleDownload = async () => {
    if (!sessionId || selectedFiles.size === 0) return;

    setIsDownloading(true);
    try {
      // Call the real cleanup API
      const blob = await apiClient.cleanupSessionFiles(sessionId, Array.from(selectedFiles));

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned-files-${sessionId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset state after download
      setTimeout(() => {
        reset();
        router.push('/upload');
      }, 1000);
    } catch (err) {
      // Download failed
    } finally {
      setIsDownloading(false);
    }
  };

  const totalDuplicates = duplicateGroups.reduce((sum: number, g) => {
    const group = g as DedupeGroup;
    return sum + (group.duplicates?.length || 0);
  }, 0);
  const totalSizeSaved = duplicateGroups.reduce((sum: number, g) => {
    const group = g as DedupeGroup;
    return sum + (group.totalSizeSaved || 0);
  }, 0);
  const allDuplicateIds = duplicateGroups.flatMap((g) => {
    const group = g as DedupeGroup;
    return group.duplicates?.map((d) => d.file.id) || [];
  });

  const handleSelectAllDuplicates = () => {
    selectAll(allDuplicateIds);
  };

  const handleDeselectAll = () => {
    deselectAll();
  };

  // Show loading state while processing
  if (sessionStatus === 'processing' || sessionStatus === 'uploaded') {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <h2 className="mt-4 text-2xl font-bold">Processing Your Files</h2>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              We&apos;re analyzing your files for duplicates. This may take a few moments...
            </p>

            <div className="mt-8 w-full max-w-md">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />

              <div className="mt-4 text-sm text-muted-foreground text-center">
                {processedFiles} of {totalFiles} files processed
              </div>
            </div>

            <Button variant="outline" onClick={handleRefresh} className="mt-6" disabled={isPolling}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isPolling ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (sessionStatus === 'failed') {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600">Processing Failed</h2>
            <p className="mt-2 text-muted-foreground text-center max-w-md">
              {errorMessage || 'An error occurred while processing your files.'}
            </p>
            <Button onClick={() => router.push('/upload')} className="mt-6">
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show completed state
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Review Duplicates</h1>
            <p className="text-muted-foreground">
              Review detected duplicate files and select which ones to remove
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Duplicate Groups</p>
                    <p className="text-2xl font-bold">{duplicateGroups.length}</p>
                  </div>
                  <FileCheck className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Duplicates</p>
                    <p className="text-2xl font-bold">{totalDuplicates.toString()}</p>
                  </div>
                  <Trash2 className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Space to Save</p>
                    <p className="text-2xl font-bold">{formatBytes(totalSizeSaved)}</p>
                  </div>
                  <Download className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Processing Stats */}
          {Object.keys(processingStats).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Processing Statistics</CardTitle>
                <CardDescription>Details about the file processing results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Files</p>
                    <p className="font-semibold">{(processingStats as any)?.total_files || 0}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Successful</p>
                    <p className="font-semibold text-green-600">
                      {(processingStats as any)?.successful_files || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failed</p>
                    <p className="font-semibold text-red-600">
                      {(processingStats as any)?.failed_files || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Text Files</p>
                    <p className="font-semibold">{(processingStats as any)?.text_files || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {duplicateGroups.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Select files to remove and download the cleaned archive
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleSelectAllDuplicates}
                  disabled={allDuplicateIds.length === selectedFiles.size}
                >
                  Select All Duplicates
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeselectAll}
                  disabled={selectedFiles.size === 0}
                >
                  Deselect All
                </Button>
                <div className="flex-1" />
                <Badge variant="secondary" className="px-3 py-2">
                  {selectedFiles.size} file(s) selected for removal
                </Badge>
                <Button
                  onClick={handleDownload}
                  disabled={selectedFiles.size === 0 || isDownloading}
                  size="lg"
                >
                  {isDownloading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Cleaned Files
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Duplicate Groups */}
          {duplicateGroups.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Duplicate Groups</CardTitle>
                <CardDescription>
                  Expand each group to see details and select files to remove
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GroupAccordion
                  groups={duplicateGroups as DedupeGroup[]}
                  selectedFiles={selectedFiles}
                  onFileSelect={toggleFileSelection}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-20">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <FileCheck className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">No Duplicates Found!</h3>
                    <p className="text-muted-foreground max-w-md">
                      Great news! We didn&apos;t find any duplicate files in your upload. All files
                      are unique.
                    </p>
                  </div>
                  <Button onClick={() => router.push('/upload')} className="mt-4">
                    Upload More Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
