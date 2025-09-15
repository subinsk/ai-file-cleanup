import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import ScanPanel from './components/ScanPanel';
import DuplicatePanel from './components/DuplicatePanel';
import CleanupPanel from './components/CleanupPanel';
import StatsPanel from './components/StatsPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { apiService } from './services/apiService';

interface ScanStatus {
  session_id: string;
  status: string;
  progress_percentage: number;
  files_processed: number;
  files_total: number;
  duplicates_found: number;
  errors_count: number;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
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
  };
  similarity_scores: number[];
  total_size: number;
  space_wasted: number;
  created_at: string;
}

function App() {
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // WebSocket connection
  const { socket, isConnected } = useWebSocket('ws://localhost:8000/ws/scan');

  useEffect(() => {
    // Load initial data
    loadStats();
    loadDuplicates();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await apiService.getDuplicateStats();
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadDuplicates = async () => {
    try {
      const duplicatesData = await apiService.getDuplicates();
      setDuplicates(duplicatesData);
    } catch (err) {
      console.error('Error loading duplicates:', err);
    }
  };

  const handleScanStart = async (directoryPath: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.startScan(directoryPath);
      setSnackbarMessage('Scan started successfully!');
      setSnackbarOpen(true);
      
      // Start polling for status updates
      pollScanStatus(response.session_id);
      
    } catch (err: any) {
      setError(err.message || 'Failed to start scan');
      setSnackbarMessage('Failed to start scan');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const pollScanStatus = async (sessionId: string) => {
    try {
      const status = await apiService.getScanStatus(sessionId);
      setScanStatus(status);
      
      // Continue polling if scan is still running
      if (status.status === 'running') {
        setTimeout(() => pollScanStatus(sessionId), 2000);
      } else if (status.status === 'completed') {
        // Reload duplicates when scan completes
        loadDuplicates();
        loadStats();
        setSnackbarMessage('Scan completed successfully!');
        setSnackbarOpen(true);
      } else if (status.status === 'failed') {
        setError(status.error_message || 'Scan failed');
        setSnackbarMessage('Scan failed');
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error('Error polling scan status:', err);
    }
  };

  const handleCleanup = async (cleanupRules: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.executeCleanup(cleanupRules);
      setSnackbarMessage('Cleanup started successfully!');
      setSnackbarOpen(true);
      
      // Reload data after cleanup
      setTimeout(() => {
        loadDuplicates();
        loadStats();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to start cleanup');
      setSnackbarMessage('Failed to start cleanup');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            AI File Management System
          </Typography>
          <Typography variant="body2">
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Scan Panel */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <ScanPanel
                onScanStart={handleScanStart}
                scanStatus={scanStatus}
                loading={loading}
              />
            </Paper>
          </Grid>

          {/* Stats Panel */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <StatsPanel stats={stats} />
            </Paper>
          </Grid>

          {/* Duplicates Panel */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <DuplicatePanel
                duplicates={duplicates}
                onRefresh={loadDuplicates}
              />
            </Paper>
          </Grid>

          {/* Cleanup Panel */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
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
        message={snackbarMessage}
      />
    </Box>
  );
}

export default App;
