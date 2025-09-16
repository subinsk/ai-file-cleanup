import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Avatar,
  Fade
} from '@mui/material';
import {
  FolderOpen,
  PlayArrow,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const NewScanPage: React.FC = () => {
  const [directoryPath, setDirectoryPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleStartScan = async () => {
    if (!directoryPath.trim()) {
      setError('Please enter a directory path');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting scan for directory:', directoryPath.trim());
      const response = await apiService.startScan(directoryPath.trim());
      console.log('✅ Scan started, response:', response);
      console.log('🔍 Navigating to scan detail page:', `/scan/${response.session_id}`);
      
      // Navigate to the scan detail page
      navigate(`/scan/${response.session_id}`);
      
    } catch (err: any) {
      console.error('Error starting scan:', err);
      setError(err.message || 'Failed to start scan');
    } finally {
      setLoading(false);
    }
  };

  const handleBrowseDirectory = () => {
    // This would open a directory picker in a real app
    // For now, we'll just show an alert
    alert('Directory picker would open here. Please enter the path manually.');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      <Grid container justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Fade in={true} timeout={500}>
            <Card 
              elevation={0}
              sx={{ 
                border: '1px solid rgba(0, 0, 0, 0.05)',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                  <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ minWidth: 'auto', p: 1 }}
                  >
                    Back
                  </Button>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                    }}
                  >
                    <FolderOpen />
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      Start New Scan
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Scan a directory for duplicate files
                    </Typography>
                  </Box>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    Directory Path
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Enter directory path (e.g., C:\Users\Documents)"
                    value={directoryPath}
                    onChange={(e) => setDirectoryPath(e.target.value)}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                          <FolderOpen color="action" />
                        </Box>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleBrowseDirectory}
                    disabled={loading}
                    size="small"
                  >
                    Browse Directory
                  </Button>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                    What will be scanned?
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      • Text files (.txt, .md, .py, .js, .html, etc.)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Image files (.jpg, .png, .gif, .bmp, etc.)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Document files (.pdf, .doc, .docx, etc.)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      • Archive files (.zip, .rar, .7z, etc.)
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/dashboard')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                    onClick={handleStartScan}
                    disabled={loading || !directoryPath.trim()}
                    size="large"
                  >
                    {loading ? 'Starting Scan...' : 'Start Scan'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NewScanPage;
