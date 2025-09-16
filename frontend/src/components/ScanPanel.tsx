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
  Grid,
  Fade,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  FolderOpen,
  CheckCircle,
  Error,
  Schedule,
  Storage,
  Speed
} from '@mui/icons-material';

interface ScanPanelProps {
  onScanStart: (directoryPath: string) => void;
  scanStatus: any;
  loading: boolean;
  showScanForm?: boolean; // Optional prop to show/hide scan form
}

const ScanPanel: React.FC<ScanPanelProps> = ({ onScanStart, scanStatus, loading, showScanForm = true }) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'running': return <CircularProgress size={16} />;
      case 'failed': return <Error />;
      default: return <Schedule />;
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!startTime) return 'N/A';
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    return `${diffMins}m ${diffSecs}s`;
  };


  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <FolderOpen color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Directory Scanner
        </Typography>
      </Box>
      
      {showScanForm && (
        <>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Directory Path"
              value={directoryPath}
              onChange={(e) => setDirectoryPath(e.target.value)}
              placeholder="Enter directory path to scan (e.g., C:\Users\Documents)"
              variant="outlined"
              size="small"
              disabled={loading || (scanStatus?.status === 'running')}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
              onClick={handleStartScan}
              disabled={!directoryPath.trim() || loading || (scanStatus?.status === 'running')}
              sx={{ 
                px: 3,
                py: 1,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                },
              }}
            >
              {loading ? 'Starting...' : 'Start Scan'}
            </Button>
            
            {scanStatus?.status === 'running' && (
              <Button
                variant="outlined"
                startIcon={<Stop />}
                disabled
                sx={{ 
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Stop Scan
              </Button>
            )}
          </Box>
        </>
      )}

      {scanStatus && (
        <Fade in={!!scanStatus}>
          <Card 
            elevation={0}
            sx={{ 
              mt: 3,
              border: '1px solid rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                {getStatusIcon(scanStatus.status)}
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Scan Status
                </Typography>
                <Chip
                  label={scanStatus.status}
                  color={getStatusColor(scanStatus.status) as any}
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Box>
              
              {scanStatus.status === 'running' && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {scanStatus.progress_percentage?.toFixed(1) || 0}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={scanStatus.progress_percentage || 0}
                    sx={{ 
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      },
                    }}
                  />
                </Box>
              )}

              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(25, 118, 210, 0.05)', borderRadius: 2 }}>
                    <Storage color="primary" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {scanStatus.files_processed || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Files Processed
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(76, 175, 80, 0.05)', borderRadius: 2 }}>
                    <FolderOpen color="success" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {scanStatus.files_total || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Files
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(255, 152, 0, 0.05)', borderRadius: 2 }}>
                    <CheckCircle color="warning" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                      {scanStatus.duplicates_found || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duplicates Found
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'rgba(244, 67, 54, 0.05)', borderRadius: 2 }}>
                    <Error color="error" sx={{ fontSize: 24, mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, color: 'error.main' }}>
                      {scanStatus.errors_count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Errors
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2}>
                {scanStatus.started_at && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule color="action" sx={{ fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Started
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {new Date(scanStatus.started_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {scanStatus.completed_at && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircle color="success" sx={{ fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Completed
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {new Date(scanStatus.completed_at).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {scanStatus.started_at && !scanStatus.completed_at && scanStatus.status === 'running' && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Speed color="primary" sx={{ fontSize: 16 }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Duration
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDuration(scanStatus.started_at)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>

              {scanStatus.error_message && (
                <Alert 
                  severity="error" 
                  sx={{ mt: 3 }}
                  icon={<Error />}
                >
                  {scanStatus.error_message}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}
    </Box>
  );
};

export default ScanPanel;
