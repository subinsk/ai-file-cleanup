'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingSpinner,
  Badge,
} from '@ai-cleanup/ui';
import { apiClient } from '@/lib/api-client';
import { Key, Copy, Trash2, Plus, CheckCircle2, XCircle } from 'lucide-react';

interface License {
  key: string;
  createdAt: string;
  revoked: boolean;
}

export default function LicensesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchLicenses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const fetchLicenses = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.listLicenseKeys();
      setLicenses(response.licenses);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load licenses';
      if (errorMessage.includes('Not authenticated')) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLicense = async () => {
    try {
      setIsGenerating(true);
      setError('');
      await apiClient.generateLicenseKey();
      await fetchLicenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate license');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeLicense = async (key: string) => {
    if (!confirm('Are you sure you want to revoke this license key? This cannot be undone.')) {
      return;
    }

    try {
      await apiClient.revokeLicenseKey(key);
      await fetchLicenses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke license');
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Key className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">License Keys</h1>
              <p className="text-muted-foreground">Manage your desktop app license keys</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => router.push('/upload')} variant="outline">
              Back to Upload
            </Button>
            <Button onClick={handleGenerateLicense} disabled={isGenerating || isLoading}>
              {isGenerating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New License
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="w-5 h-5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-muted-foreground">Loading licenses...</p>
              </div>
            </CardContent>
          </Card>
        ) : licenses.length === 0 ? (
          /* Empty State */
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Key className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No License Keys Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate a license key to use the desktop application
                  </p>
                  <Button onClick={handleGenerateLicense} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Your First License
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* License List */
          <div className="space-y-4">
            {licenses.map((license) => (
              <Card key={license.key}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">License Key</CardTitle>
                        <Badge variant={license.revoked ? 'destructive' : 'secondary'}>
                          {license.revoked ? (
                            <>
                              <XCircle className="w-3 h-3 mr-1" />
                              Revoked
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </>
                          )}
                        </Badge>
                      </div>
                      <CardDescription>Created {formatDate(license.createdAt)}</CardDescription>
                    </div>
                    {!license.revoked && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeLicense(license.key)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm break-all">
                      {license.key}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyKey(license.key)}
                      disabled={license.revoked}
                    >
                      {copiedKey === license.key ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  {license.revoked && (
                    <p className="text-sm text-muted-foreground mt-3">
                      This license key has been revoked and can no longer be used.
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About License Keys</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• License keys are required to activate the desktop application</p>
            <p>• Each key is unique and tied to your account</p>
            <p>• You can generate multiple keys for different devices</p>
            <p>• Revoked keys cannot be reactivated - generate a new one if needed</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
