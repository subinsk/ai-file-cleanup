import { useState } from 'react';
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
import { useScanStore } from '../lib/store';
import { ArrowLeft, Trash2, FileCheck, AlertCircle } from 'lucide-react';
import { formatBytes } from '@ai-cleanup/ui';

interface ReviewPageProps {
  onBack: () => void;
}

export default function ReviewPage({ onBack }: ReviewPageProps) {
  const { groups, selectedFiles, toggleFileSelection, selectAll, deselectAll, reset } =
    useScanStore();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const totalDuplicates = groups.reduce((sum, g) => sum + (g.duplicates?.length || 0), 0);
  const totalSizeSaved = groups.reduce((sum, g) => sum + (g.totalSizeSaved || 0), 0);
  const allDuplicatePaths = groups.flatMap((g) =>
    (g.duplicates || []).map((d) => d.file?.id).filter((id): id is string => id != null)
  );

  const handleSelectAllDuplicates = () => {
    selectAll(allDuplicatePaths);
  };

  const handleDeselectAll = () => {
    deselectAll();
  };

  const handleMoveToTrash = async () => {
    if (selectedFiles.size === 0) return;

    setIsDeleting(true);
    setError('');

    try {
      // Map selected file IDs to actual file paths
      const filePathsToDelete: string[] = [];

      // Check all groups for files matching the selected IDs
      for (const group of groups) {
        // Check duplicates
        if (group.duplicates) {
          for (const duplicate of group.duplicates) {
            if (duplicate.file?.id && selectedFiles.has(duplicate.file.id)) {
              // Get the file path - check multiple possible locations
              const fileObj = duplicate.file as any;
              const filePath = fileObj.path || fileObj.filePath || fileObj.file?.path;

              if (filePath && typeof filePath === 'string' && filePath.trim().length > 0) {
                filePathsToDelete.push(filePath);
                console.log('Found file path for deletion:', filePath);
              } else {
                console.warn('File path not found for file:', fileObj);
                console.warn('Available keys:', Object.keys(fileObj));
              }
            }
          }
        }
        // Check keepFile (though we probably don't want to delete the keep file)
        // But if it's selected, we should handle it
        if (group.keepFile?.id && selectedFiles.has(group.keepFile.id)) {
          const fileObj = group.keepFile as any;
          const filePath = fileObj.path || fileObj.filePath || fileObj.file?.path;

          if (filePath && typeof filePath === 'string' && filePath.trim().length > 0) {
            filePathsToDelete.push(filePath);
            console.log('Found keepFile path for deletion:', filePath);
          } else {
            console.warn('File path not found for keepFile:', fileObj);
            console.warn('Available keys:', Object.keys(fileObj));
          }
        }
      }

      if (filePathsToDelete.length === 0) {
        throw new Error('No valid file paths found for selected files');
      }

      console.log('Moving files to trash:', filePathsToDelete);
      await window.electronAPI.moveToTrash(filePathsToDelete);

      // Remove deleted files from groups and update the state
      const updatedGroups = groups
        .map((group) => {
          // Filter out deleted duplicates
          const remainingDuplicates = group.duplicates?.filter(
            (dup) => dup.file?.id && !selectedFiles.has(dup.file.id)
          );

          // Check if keepFile was deleted
          const keepFileDeleted = group.keepFile?.id && selectedFiles.has(group.keepFile.id);

          // If keepFile was deleted and there are duplicates, promote the first duplicate to keepFile
          if (keepFileDeleted && remainingDuplicates && remainingDuplicates.length > 0) {
            const newKeepFile = remainingDuplicates[0];
            return {
              ...group,
              keepFile: newKeepFile.file,
              duplicates: remainingDuplicates.slice(1),
              totalSizeSaved: group.totalSizeSaved || 0,
            };
          }

          // If keepFile was deleted and no duplicates remain, return null to filter out this group
          if (keepFileDeleted) {
            return null;
          }

          // Update the group with remaining duplicates
          return {
            ...group,
            duplicates: remainingDuplicates,
            totalSizeSaved: group.totalSizeSaved || 0,
          };
        })
        .filter((group): group is NonNullable<typeof group> => {
          // Filter out groups that have no duplicates left
          return group !== null && (group.duplicates?.length || 0) > 0;
        });

      // Update the store with new groups
      const scanStore = useScanStore.getState();
      scanStore.setGroups(updatedGroups);

      // Clear selected files
      deselectAll();

      // Show success message
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);

        // Only navigate back if there are no more groups to review
        if (updatedGroups.length === 0) {
          reset();
          onBack();
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move files to trash');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-8">
          <Button variant="ghost" onClick={onBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span className="font-semibold">Review Duplicates</span>
        </div>
      </header>

      <main className="container py-8 px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Review Duplicates</h1>
            <p className="text-muted-foreground">
              Review detected duplicate files and select which ones to move to Recycle Bin
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
                  <Trash2 className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="flex items-start gap-3 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-4 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <FileCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>
                Files moved to Recycle Bin successfully!
                {groups.filter((g) => (g.duplicates?.length || 0) > 0).length === 0
                  ? ' Returning to scan page...'
                  : ' Continue reviewing remaining duplicates.'}
              </span>
            </div>
          )}

          {/* Actions */}
          {groups.length > 0 && !success && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Select files to move to Recycle Bin</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={handleSelectAllDuplicates}
                  disabled={allDuplicatePaths.length === selectedFiles.size || isDeleting}
                >
                  Select All Duplicates
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeselectAll}
                  disabled={selectedFiles.size === 0 || isDeleting}
                >
                  Deselect All
                </Button>
                <div className="flex-1" />
                <Badge variant="secondary" className="px-3 py-2">
                  {selectedFiles.size} file(s) selected
                </Badge>
                <Button
                  onClick={handleMoveToTrash}
                  disabled={selectedFiles.size === 0 || isDeleting}
                  variant="destructive"
                  size="lg"
                >
                  {isDeleting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Moving to Trash...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Move to Recycle Bin
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
                  groups={groups}
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
                      Great news! We didn&apos;t find any duplicate files in the scanned directory.
                      All files are unique.
                    </p>
                  </div>
                  <Button onClick={onBack} className="mt-4">
                    Back to Scan
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
