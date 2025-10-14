import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  LoadingSpinner,
  Progress,
} from '@ai-cleanup/ui';
import { useScanStore, useAuthStore, useLicenseStore } from '../lib/store';
import { FolderOpen, Search, FileSearch, Trash2, User, LogOut } from 'lucide-react';
import { formatBytes } from '@ai-cleanup/ui';

interface ScanPageProps {
  onStartReview: () => void;
}

export default function ScanPage({ onStartReview }: ScanPageProps) {
  const { user, clearUser } = useAuthStore();
  const { clearLicense } = useLicenseStore();
  const {
    directoryPath,
    files,
    isScanning,
    isAnalyzing,
    setDirectory,
    setFiles,
    setGroups,
    setScanning,
    setAnalyzing,
    reset,
  } = useScanStore();

  const [error, setError] = useState('');
  const [scanProgress, setScanProgress] = useState(0);

  const handleSelectDirectory = async () => {
    try {
      const path = await window.electronAPI.selectDirectory();
      if (path) {
        setDirectory(path);
        setError('');
      }
    } catch (err) {
      setError('Failed to select directory');
    }
  };

  const handleScanDirectory = async () => {
    if (!directoryPath) return;

    setScanning(true);
    setError('');
    setScanProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const scannedFiles = await window.electronAPI.scanDirectory(directoryPath);

      clearInterval(progressInterval);
      setScanProgress(100);
      setFiles(scannedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan directory');
    } finally {
      setScanning(false);
      setScanProgress(0);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    setAnalyzing(true);
    setError('');

    try {
      // For MVP, we'll create mock groups
      // In production, this would call the API with file hashes/embeddings
      const mockGroups: DedupeGroup[] = [];

      setGroups(mockGroups);
      onStartReview();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogout = () => {
    reset();
    clearUser();
    clearLicense();
    // Force reload to go back to login page
    window.location.reload();
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-8">
          <div className="flex items-center gap-2">
            <FileSearch className="h-6 w-6" />
            <span className="font-semibold">AI File Cleanup</span>
          </div>

          <div className="ml-auto flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <FolderOpen className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Scan Local Directory</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select a folder to scan for duplicate files. We&apos;ll analyze images, PDFs, and text
              files.
            </p>
          </div>

          {/* Directory Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Directory</CardTitle>
              <CardDescription>Choose a folder to scan for duplicate files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleSelectDirectory}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  disabled={isScanning || isAnalyzing}
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Select Folder
                </Button>
              </div>

              {directoryPath && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-1">Selected Directory:</p>
                  <p className="text-sm text-muted-foreground font-mono break-all">
                    {directoryPath}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  {error}
                </div>
              )}

              {isScanning && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Scanning directory...</span>
                    <span className="font-medium">{scanProgress}%</span>
                  </div>
                  <Progress value={scanProgress} />
                </div>
              )}

              {directoryPath && !isScanning && files.length === 0 && (
                <Button
                  onClick={handleScanDirectory}
                  className="w-full"
                  size="lg"
                  disabled={isAnalyzing}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Start Scanning
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Scan Results */}
          {files.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Files Found</p>
                        <p className="text-2xl font-bold">{files.length}</p>
                      </div>
                      <FileSearch className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Size</p>
                        <p className="text-2xl font-bold">{formatBytes(totalSize)}</p>
                      </div>
                      <Trash2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant="secondary" className="mt-1">
                          Ready to Analyze
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Start Analysis</CardTitle>
                  <CardDescription>
                    Analyze files for duplicates using AI-powered similarity detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Analyzing Files...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Analyze for Duplicates
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
