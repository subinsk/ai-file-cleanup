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
  Badge,
  LoadingSpinner,
} from '@ai-cleanup/ui';
import { apiClient } from '@/lib/api-client';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Trash2,
  HardDrive,
} from 'lucide-react';
import { formatBytes } from '@ai-cleanup/ui';

interface Session {
  session_id: string;
  status: string;
  progress: number;
  total_files: number;
  processed_files: number;
  failed_files: number;
  duplicate_groups: any[];
  processing_stats: any;
  error_message?: string;
  created_at?: string;
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const userSessions = await apiClient.listUserSessions();
      setSessions(userSessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'uploaded':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      failed: 'destructive',
      uploaded: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewSession = (sessionId: string) => {
    router.push(`/review/${sessionId}`);
  };

  const handleDeleteSession = async (sessionId: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to delete this upload session? This action cannot be undone and will remove all associated files.'
    );

    if (!confirmed) return;

    setDeletingSessionId(sessionId);
    try {
      await apiClient.deleteSession(sessionId);
      // Remove from local state
      setSessions(sessions.filter((s) => s.session_id !== sessionId));

      // Session deleted successfully (could add toast notification here)
    } catch (err) {
      console.error('Failed to delete session:', err);
      // Show error message to user
      alert('Failed to delete session. Please try again.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container py-8">
          <div className="max-w-6xl mx-auto flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
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
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Upload History</h1>
              <p className="text-muted-foreground">View and manage your file processing sessions</p>
            </div>
            <Button onClick={() => router.push('/upload')}>
              <FileText className="w-4 h-4 mr-2" />
              New Upload
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="py-20">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">No Upload Sessions</h3>
                    <p className="text-muted-foreground max-w-md">
                      You haven&apos;t uploaded any files yet. Start by uploading some files to see
                      them here.
                    </p>
                  </div>
                  <Button onClick={() => router.push('/upload')}>Upload Files</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card key={session.session_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(session.status)}
                        <div>
                          <CardTitle className="text-lg">
                            Session {session.session_id.slice(0, 8)}...
                          </CardTitle>
                          <CardDescription>{formatDate(session.created_at)}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewSession(session.session_id)}
                            disabled={session.status === 'processing'}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSession(session.session_id)}
                            disabled={deletingSessionId === session.session_id}
                          >
                            {deletingSessionId === session.session_id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-1" />
                            )}
                            {deletingSessionId === session.session_id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Total Files</p>
                          <p className="font-semibold">{session.total_files}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <div>
                          <p className="text-muted-foreground">Processed</p>
                          <p className="font-semibold text-green-600">{session.processed_files}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-muted-foreground">Failed</p>
                          <p className="font-semibold text-red-600">{session.failed_files}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-muted-foreground">Duplicates</p>
                          <p className="font-semibold text-blue-600">
                            {session.duplicate_groups.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar for Processing Sessions */}
                    {session.status === 'processing' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Processing Progress</span>
                          <span className="font-medium">{session.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${session.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Error Message for Failed Sessions */}
                    {session.status === 'failed' && session.error_message && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-sm text-red-600">{session.error_message}</p>
                      </div>
                    )}

                    {/* Processing Stats for Completed Sessions */}
                    {session.status === 'completed' && session.processing_stats && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Text Files:</span>
                            <span className="font-semibold ml-1">
                              {session.processing_stats.text_files || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Image Files:</span>
                            <span className="font-semibold ml-1">
                              {session.processing_stats.image_files || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Total Duplicates:</span>
                            <span className="font-semibold ml-1">
                              {session.processing_stats.total_duplicates || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Space Saved:</span>
                            <span className="font-semibold ml-1">
                              {formatBytes(session.processing_stats.total_size_saved || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
