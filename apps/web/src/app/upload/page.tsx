'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FileDropzone,
  Progress,
  LoadingSpinner,
} from '@ai-cleanup/ui';
import { apiClient } from '@/lib/api-client';
import { useUploadStore } from '@/lib/store';
import { Upload, FileIcon, CheckCircle } from 'lucide-react';

export default function UploadPage() {
  const router = useRouter();
  const setUploadData = useUploadStore((state) => state.setUploadData);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState('');

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError('');
    setUploadComplete(false);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const result = await apiClient.uploadFiles(files);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);

      // Store upload data
      setUploadData(result.uploadId, result.files);

      // Navigate to review page after a short delay
      setTimeout(() => {
        router.push('/review');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setUploadComplete(false);
    setUploadProgress(0);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Upload Your Files</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Upload your files and let our AI detect duplicates. We support images, PDFs, and text
              files.
            </p>
          </div>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Select Files</CardTitle>
              <CardDescription>
                Drag and drop files or click to browse. Maximum 10MB per file.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                  'application/pdf': ['.pdf'],
                  'text/plain': ['.txt'],
                }}
                maxSize={10 * 1024 * 1024}
                multiple
                disabled={isUploading}
              />

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Uploading {files.length} file(s)...
                    </span>
                    <span className="font-medium">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Upload Complete */}
              {uploadComplete && (
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-600">
                    Upload complete! Redirecting to review...
                  </span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleUpload}
                  disabled={files.length === 0 || isUploading}
                  className="flex-1"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload & Analyze
                    </>
                  )}
                </Button>
                {files.length > 0 && !isUploading && (
                  <Button variant="outline" onClick={handleClear} size="lg">
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <FileIcon className="w-10 h-10 text-primary" />
                  <h3 className="font-semibold">Smart Detection</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered similarity detection finds duplicates even with different names
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <CheckCircle className="w-10 h-10 text-primary" />
                  <h3 className="font-semibold">Easy Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Review grouped duplicates and choose which files to keep
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <Upload className="w-10 h-10 text-primary" />
                  <h3 className="font-semibold">Quick Export</h3>
                  <p className="text-sm text-muted-foreground">
                    Download cleaned files as a ZIP archive in one click
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
