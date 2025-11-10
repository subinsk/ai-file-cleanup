'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@ai-cleanup/ui';
import { useUploadStore } from '@/lib/store';
import { apiClient } from '@/lib/api-client';
import type { DedupeGroup } from '@ai-cleanup/types';
import { Download, FileCheck, Trash2, AlertCircle } from 'lucide-react';
import { formatBytes } from '@ai-cleanup/ui';

export default function ReviewPage() {
  const router = useRouter();
  const {
    duplicateGroups: storeGroups,
    selectedFiles,
    toggleFileSelection,
    selectAll,
    deselectAll,
    reset,
    sessionId,
  } = useUploadStore();
  const [groups, setGroups] = useState<DedupeGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [visibleGroupCount, setVisibleGroupCount] = useState<number>(10);

  useEffect(() => {
    if (!sessionId) {
      router.push('/upload');
      return;
    }

    // Use groups from the upload store instead of calling API
    const loadResults = async () => {
      try {
        setIsLoading(true);

        // Use groups from the upload store
        setGroups((storeGroups as DedupeGroup[]) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [sessionId, storeGroups, router]);

  const totalDuplicates = groups.reduce((sum, g) => sum + g.duplicates.length, 0);
  const totalSizeSaved = groups.reduce((sum, g) => sum + g.totalSizeSaved, 0);
  const allDuplicateIds = groups.flatMap((g) => g.duplicates.map((d) => d.file.id));
  const displayedGroups = groups.slice(0, visibleGroupCount);

  const handleSelectAllDuplicates = () => {
    selectAll(allDuplicateIds);
  };

  const handleDeselectAll = () => {
    deselectAll();
  };

  const handleDownload = async () => {
    if (!sessionId || selectedFiles.size === 0) return;

    setIsDownloading(true);
    try {
      const blob = await apiClient.cleanupSessionFiles(sessionId, Array.from(selectedFiles));

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cleaned-files-${Date.now()}.zip`;
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
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-muted-foreground">Analyzing files for duplicates...</p>
          </div>
        </main>
      </div>
    );
  }

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
                    <p className="text-2xl font-bold">{groups.length}</p>
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
                    <p className="text-2xl font-bold">{totalDuplicates}</p>
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

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          {groups.length > 0 && (
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
          {groups.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Duplicate Groups</CardTitle>
                <CardDescription>
                  Expand each group to see details and select files to remove
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GroupAccordion
                  groups={displayedGroups}
                  selectedFiles={selectedFiles}
                  onFileSelect={toggleFileSelection}
                />

                {groups.length > visibleGroupCount && (
                  <div className="pt-4 flex justify-center">
                    <Button
                      variant="ghost"
                      onClick={() => setVisibleGroupCount((c) => c + 10)}
                    >
                      Load more groups
                    </Button>
                  </div>
                )}
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
