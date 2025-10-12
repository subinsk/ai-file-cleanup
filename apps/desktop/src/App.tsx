import { useEffect, useState } from 'react';
import { useLicenseStore } from './lib/store';
import LicensePage from './pages/LicensePage';
import ScanPage from './pages/ScanPage';
import ReviewPage from './pages/ReviewPage';

type Page = 'license' | 'scan' | 'review';

function App() {
  const { licenseKey, isValid, setLicense } = useLicenseStore();
  const [currentPage, setCurrentPage] = useState<Page>('license');

  useEffect(() => {
    // Auto-validate license on startup if one exists
    if (licenseKey && !isValid) {
      window.electronAPI
        .validateLicense(licenseKey)
        .then((result) => {
          if (result.valid) {
            setLicense(licenseKey, true, result.user);
            setCurrentPage('scan');
          }
        })
        .catch(() => {
          // Invalid license, stay on license page
        });
    } else if (isValid) {
      setCurrentPage('scan');
    }
  }, []);

  const handleLicenseValidated = () => {
    setCurrentPage('scan');
  };

  const handleStartReview = () => {
    setCurrentPage('review');
  };

  const handleBackToScan = () => {
    setCurrentPage('scan');
  };

  if (currentPage === 'license') {
    return <LicensePage onValidated={handleLicenseValidated} />;
  }

  if (currentPage === 'review') {
    return <ReviewPage onBack={handleBackToScan} />;
  }

  return <ScanPage onStartReview={handleStartReview} />;
}

export default App;

