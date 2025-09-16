import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Alert,
  Snackbar,
  Chip,
  Fade,
  Slide,
  Container,
  CircularProgress,
  Button,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Wifi,
  WifiOff,
  CheckCircle,
  Error,
  Info,
  Refresh
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import ScanPanel from './ScanPanel';
import DuplicatePanel from './DuplicatePanel';
import CleanupPanel from './CleanupPanel';
import StatsPanel from './StatsPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import { apiService } from '../services/apiService';

interface ScanStatus {
  session_id: string;
  status: string;
  progress_percentage: number;
  files_processed: number;
  files_total: number;
  duplicates_found: number;
  errors_count: number;
  directory_path: string;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

interface DuplicateGroup {
  group_id: string;
  files: Array<{
    id: string;
    name: string;
    path: string;
    size: number | null;
    file_type: string | null;
    category: string | null;
  }>;
  primary_file: {
    id: string;
    name: string;
    path: string;
    size: number | null;
    file_type: string | null;
    category: string | null;
  };
  similarity_scores: number[];
  total_size: number;
  space_wasted: number;
  created_at: string;
}

const ScanDetailPage: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  
  console.log('🔍 ScanDetailPage component rendered with scanId:', scanId);
  console.log('🔍 Current URL:', window.location.pathname);
  
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [showStatusBanner, setShowStatusBanner] = useState(false);

  // WebSocket connection
  const { isConnected, lastMessage, connect: connectWebSocket, disconnect: disconnectWebSocket } = useWebSocket('ws://localhost:8000');

  useEffect(() => {
    console.log('🔍 ScanDetailPage useEffect - scanId:', scanId);
    if (scanId) {
      console.log('🔍 Loading scan data for scanId:', scanId);
      loadScanData(scanId);
      // Connect to WebSocket for this specific scan
      connectWebSocket(scanId);
    } else {
      console.log('❌ No scanId provided');
      setLoading(false);
      setError('No scan ID provided');
    }
    
    // Cleanup WebSocket on unmount
    return () => {
      disconnectWebSocket();
    };
  }, [scanId, connectWebSocket, disconnectWebSocket]);

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage && lastMessage.session_id === scanId) {
      if (lastMessage.type === 'scan_progress') {
        const progressData = lastMessage.data;
        setScanStatus(prev => ({
          ...prev,
          ...progressData,
          session_id: lastMessage.session_id,
        }));
        
        // Show status banner for active scans
        if (progressData.status === 'running') {
          setShowStatusBanner(true);
        } else if (progressData.status === 'completed') {
          setShowStatusBanner(false);
          // Refresh data when scan completes
          loadScanData(scanId!);
        }
      }
    }
  }, [lastMessage, scanId]);

  const loadScanData = async (sessionId: string) => {
    try {
      console.log('🔍 loadScanData called with sessionId:', sessionId);
      setLoading(true);
      setError(null);
      
      // Load all data for this specific scan session using the consolidated endpoint
      console.log('🔍 Calling apiService.getScanById...');
      const response = await apiService.getScanById(sessionId);
      console.log('✅ API response received:', response);
      
      setScanStatus(response.scan);
      setDuplicates(response.duplicates || []);
      setStats(response.stats);
      console.log('✅ State updated successfully');
    } catch (err: any) {
      console.error('❌ Error loading scan data:', err);
      console.error('❌ Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.message || 'Failed to load scan data');
    } finally {
      setLoading(false);
    }
  };

  const handleScanStart = async (directoryPath: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.startScan(directoryPath);
      setSnackbarMessage('Scan started successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Navigate to the new scan page
      navigate(`/scan/${response.session_id}`);
      
    } catch (err: any) {
      console.error('Error starting scan:', err);
      setError(err.message || 'Failed to start scan');
      setSnackbarMessage('Failed to start scan');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async (cleanupRules: any) => {
    try {
      setLoading(true);
      await apiService.executeCleanup(cleanupRules);
      setSnackbarMessage('Cleanup completed successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      // Refresh data after cleanup
      if (scanId) {
        loadScanData(scanId);
      }
    } catch (err: any) {
      console.error('Error executing cleanup:', err);
      setSnackbarMessage('Failed to execute cleanup');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (scanId) {
      loadScanData(scanId);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading && !scanStatus) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Loading scan data...
        </Typography>
      </Box>
    );
  }

  if (error && !scanStatus) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Status Banner */}
      <Slide direction="down" in={showStatusBanner} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            py: 2,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={24} sx={{ color: 'white' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Scan in progress: {scanStatus?.files_processed || 0} of {scanStatus?.files_total || 0} files processed
                  {scanStatus?.duplicates_found ? ` • ${scanStatus.duplicates_found} duplicates found` : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  {scanStatus?.progress_percentage?.toFixed(1) || 0}%
                </Typography>
                <CircularProgress
                  variant="determinate"
                  value={scanStatus?.progress_percentage || 0}
                  size={32}
                  thickness={4}
                  sx={{ color: 'white' }}
                />
              </Box>
            </Box>
          </Container>
        </Box>
      </Slide>

      <Container maxWidth="xl" sx={{ mt: showStatusBanner ? 8 : 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            variant="outlined"
            size="small"
          >
            Back to Dashboard
          </Button>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              Scan Details
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {scanStatus?.directory_path || 'Loading...'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={isConnected ? <Wifi /> : <WifiOff />}
              label={isConnected ? 'Connected' : 'Disconnected'}
              color={isConnected ? 'success' : 'error'}
              variant="outlined"
              size="small"
            />
            <IconButton onClick={handleRefresh} disabled={loading} size="small">
              <Refresh />
            </IconButton>
          </Box>
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

        <Grid container spacing={3}>
          {/* Scan Panel */}
          <Grid item xs={12} lg={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                height: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <ScanPanel
                onScanStart={handleScanStart}
                scanStatus={scanStatus}
                loading={loading}
                showScanForm={false}
              />
            </Paper>
          </Grid>

          {/* Stats Panel */}
          <Grid item xs={12} lg={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                height: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <StatsPanel stats={stats} />
            </Paper>
          </Grid>

          {/* Duplicates Panel */}
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <DuplicatePanel
                duplicates={duplicates}
                onRefresh={() => scanId && loadScanData(scanId)}
              />
            </Paper>
          </Grid>

          {/* Cleanup Panel */}
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
              }}
            >
              <CleanupPanel
                onCleanup={handleCleanup}
                duplicates={duplicates}
                loading={loading}
              />
            </Paper>
          </Grid>
        </Grid>
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

export default ScanDetailPage;
