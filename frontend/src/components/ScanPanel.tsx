import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { FolderOpen, PlayArrow, Stop } from '@mui/icons-material';

interface ScanPanelProps {
  onScanStart: (directoryPath: string) => void;
  scanStatus: any;
  loading: boolean;
}

const ScanPanel: React.FC<ScanPanelProps> = ({ onScanStart, scanStatus, loading }) => {
  const [directoryPath, setDirectoryPath] = useState('');

  const handleStartScan = () => {
    if (directoryPath.trim()) {
      onScanStart(directoryPath.trim());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Directory Scanner
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Directory Path"
          value={directoryPath}
          onChange={(e) => setDirectoryPath(e.target.value)}
          placeholder="Enter directory path to scan (e.g., C:\Users\Documents)"
          variant="outlined"
          size="small"
          disabled={loading || (scanStatus?.status === 'running')}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handleStartScan}
          disabled={!directoryPath.trim() || loading || (scanStatus?.status === 'running')}
          sx={{ mr: 1 }}
        >
          Start Scan
        </Button>
        
        {scanStatus?.status === 'running' && (
          <Button
            variant="outlined"
            startIcon={<Stop />}
            disabled
            sx={{ mr: 1 }}
          >
            Stop Scan
          </Button>
        )}
      </Box>

      {scanStatus && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Scan Status
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Status:
                  </Typography>
                  <Chip
                    label={scanStatus.status}
                    color={getStatusColor(scanStatus.status) as any}
                    size="small"
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  Progress: {scanStatus.progress_percentage?.toFixed(1) || 0}%
                </Typography>
              </Grid>
            </Grid>

            {scanStatus.status === 'running' && (
              <LinearProgress
                variant="determinate"
                value={scanStatus.progress_percentage || 0}
                sx={{ mt: 1, mb: 2 }}
              />
            )}

            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Files Processed
                </Typography>
                <Typography variant="h6">
                  {scanStatus.files_processed || 0}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Files
                </Typography>
                <Typography variant="h6">
                  {scanStatus.files_total || 0}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Duplicates Found
                </Typography>
                <Typography variant="h6" color="warning.main">
                  {scanStatus.duplicates_found || 0}
                </Typography>
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Typography variant="body2" color="text.secondary">
                  Errors
                </Typography>
                <Typography variant="h6" color="error.main">
                  {scanStatus.errors_count || 0}
                </Typography>
              </Grid>
            </Grid>

            {scanStatus.started_at && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Started: {new Date(scanStatus.started_at).toLocaleString()}
              </Typography>
            )}

            {scanStatus.completed_at && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Completed: {new Date(scanStatus.completed_at).toLocaleString()}
              </Typography>
            )}

            {scanStatus.error_message && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {scanStatus.error_message}
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ScanPanel;
