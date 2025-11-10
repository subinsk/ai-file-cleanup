import { useEffect, useState } from 'react';
import { ErrorBoundary } from '@ai-cleanup/ui';
import { useAuthStore, useLicenseStore } from './lib/store';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LicensePage from './pages/LicensePage';
import ScanPage from './pages/ScanPage';
import ReviewPage from './pages/ReviewPage';

type Page = 'login' | 'signup' | 'license' | 'scan' | 'review';

interface User {
  id: string;
  email: string;
  name?: string;
}

function App() {
  const { isAuthenticated, setUser } = useAuthStore();
  const { licenseKey, isValid, setLicense } = useLicenseStore();
  const [currentPage, setCurrentPage] = useState<Page | null>(null);

  useEffect(() => {
    // Determine initial page based on auth and license state
    if (!isAuthenticated) {
      setCurrentPage('login');
    } else if (!isValid) {
      // Auto-validate license on startup if one exists
      if (licenseKey) {
        window.electronAPI
          .validateLicense(licenseKey)
          .then((result) => {
            if (result.valid) {
              setLicense(licenseKey, true);
              setCurrentPage('scan');
            } else {
              setCurrentPage('license');
            }
          })
          .catch(() => {
            // Invalid license, go to license page
            setCurrentPage('license');
          });
      } else {
        setCurrentPage('license');
      }
    } else {
      setCurrentPage('scan');
    }
  }, [isAuthenticated, isValid, licenseKey, setLicense]);

  const handleLoginSuccess = (user: User, accessToken?: string) => {
    setUser(user, accessToken);
    setCurrentPage('license');
  };

  const handleSignupSuccess = (user: User, accessToken?: string) => {
    setUser(user, accessToken);
    setCurrentPage('license');
  };

  const handleGoToSignup = () => {
    setCurrentPage('signup');
  };

  const handleGoToLogin = () => {
    setCurrentPage('login');
  };

  const handleLicenseValidated = () => {
    setCurrentPage('scan');
  };

  const handleStartReview = () => {
    setCurrentPage('review');
  };

  const handleBackToScan = () => {
    setCurrentPage('scan');
  };

  // Show loading while determining initial page
  if (currentPage === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {currentPage === 'login' && (
        <LoginPage onLoginSuccess={handleLoginSuccess} onGoToSignup={handleGoToSignup} />
      )}

      {currentPage === 'signup' && (
        <SignupPage onSignupSuccess={handleSignupSuccess} onGoToLogin={handleGoToLogin} />
      )}

      {currentPage === 'license' && <LicensePage onValidated={handleLicenseValidated} />}

      {currentPage === 'review' && <ReviewPage onBack={handleBackToScan} />}

      {currentPage === 'scan' && <ScanPage onStartReview={handleStartReview} />}
    </ErrorBoundary>
  );
}

export default App;
