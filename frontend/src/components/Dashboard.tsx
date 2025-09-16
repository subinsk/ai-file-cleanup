import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Alert,
  Snackbar,
  Fade,
  Button,
  Grid
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Info,
  Add,
  PlayArrow
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

  const handleScanDeleted = (scanId: string) => {
    // Remove the deleted scan from the local state
    setScanHistory(prev => prev.filter(scan => scan.id !== scanId));
  };

  const handleMultipleScansDeleted = (scanIds: string[]) => {
    // Remove the deleted scans from the local state
    setScanHistory(prev => prev.filter(scan => !scanIds.includes(scan.id)));
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={12} md={8}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                AI File Cleanup
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600 }}>
                Manage your file duplicates with intelligent scanning and cleanup tools. 
                View your scan history and start new scans to organize your files.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, mt: { xs: 2, md: 0 } }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => navigate('/scan/new')}
                sx={{
                  py: 1.5,
                  px: 3,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  }
                }}
              >
                Start New Scan
              </Button>
            </Grid>
          </Grid>
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
          onScanDeleted={handleScanDeleted}
          onMultipleScansDeleted={handleMultipleScansDeleted}
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