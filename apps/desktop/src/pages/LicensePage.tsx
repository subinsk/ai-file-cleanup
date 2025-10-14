import { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LoadingSpinner,
} from '@ai-cleanup/ui';
import { useLicenseStore } from '../lib/store';
import { Key, CheckCircle, XCircle } from 'lucide-react';

interface LicensePageProps {
  onValidated: () => void;
}

export default function LicensePage({ onValidated }: LicensePageProps) {
  const { setLicense } = useLicenseStore();
  const [licenseKey, setLicenseKeyInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleValidate = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setIsValidating(true);
    setError('');
    setSuccess(false);

    try {
      const result = await window.electronAPI.validateLicense(licenseKey.trim());

      if (result.valid) {
        setSuccess(true);
        setLicense(licenseKey.trim(), true);
        setTimeout(() => {
          onValidated();
        }, 1000);
      } else {
        setError('Invalid license key');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'License validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4">
            <Key className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">AI File Cleanup</CardTitle>
          <CardDescription className="text-center">
            Enter your license key to activate the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="license" className="text-sm font-medium">
              License Key
            </label>
            <input
              id="license"
              type="text"
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              value={licenseKey}
              onChange={(e) => setLicenseKeyInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              disabled={isValidating || success}
            />
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-3 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>License validated successfully! Starting application...</span>
            </div>
          )}

          <Button
            onClick={handleValidate}
            disabled={isValidating || success}
            className="w-full"
            size="lg"
          >
            {isValidating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Validating...
              </>
            ) : success ? (
              'Validated ✓'
            ) : (
              'Validate License'
            )}
          </Button>

          <div className="mt-6 p-4 bg-muted rounded-md">
            <p className="text-xs font-medium mb-2">For Testing:</p>
            <p className="text-xs text-muted-foreground">
              Generate a license key from the web application or use the test API to create one.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
