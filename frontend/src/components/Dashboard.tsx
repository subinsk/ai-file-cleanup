import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Alert,
  Snackbar,
  Fade
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Info
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ScanHistoryPanel from './ScanHistoryPanel';
import { apiService } from '../services/apiService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  useEffect(() => {
    // Load scan history on mount
    loadScanHistory();
  }, []);

  const loadScanHistory = async () => {
    try {
      const historyData = await apiService.getScanHistory();
      setScanHistory(historyData);
    } catch (err) {
      console.error('Error loading scan history:', err);
    }
  };

  const handleScanSelect = (scanId: string) => {
    // Navigate to the scan detail page
    navigate(`/scan/${scanId}`);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            AI File Cleanup
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
            Manage your file duplicates with intelligent scanning and cleanup tools. 
            View your scan history and start new scans to organize your files.
          </Typography>
        </Box>

        {error && (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ mb: 3 }} 
              onClose={() => setError(null)}
              icon={<Error />}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {/* Scan History Panel */}
        <ScanHistoryPanel
          scanHistory={scanHistory}
          onScanSelect={handleScanSelect}
          onRefresh={loadScanHistory}
          loading={loading}
        />
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          icon={snackbarSeverity === 'success' ? <CheckCircle /> : 
                snackbarSeverity === 'error' ? <Error /> : <Info />}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;