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
  Fade,
  Container,
  InputAdornment,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  FolderOpen,
  PlayArrow,
  ArrowBack,
  Info,
  Computer,
  Folder,
  InsertDriveFile
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const NewScanPage: React.FC = () => {
  const [directoryPath, setDirectoryPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  // Common directory suggestions
  const commonDirectories = [
    { path: 'C:\\Users\\Documents', label: 'Documents', icon: <Folder /> },
    { path: 'C:\\Users\\Downloads', label: 'Downloads', icon: <Folder /> },
    { path: 'C:\\Users\\Desktop', label: 'Desktop', icon: <Computer /> },
    { path: 'C:\\Users\\Pictures', label: 'Pictures', icon: <Folder /> },
    { path: 'C:\\Users\\Videos', label: 'Videos', icon: <Folder /> },
    { path: 'D:\\', label: 'D: Drive', icon: <Computer /> },
  ];

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
    setShowSuggestions(!showSuggestions);
  };

  const handleSelectDirectory = (path: string) => {
    setDirectoryPath(path);
    setShowSuggestions(false);
    setError(null);
  };

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', py: 4 }}>
      <Fade in={true} timeout={500}>
        <Box>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/')}
              variant="outlined"
              size="small"
            >
              Back to Dashboard
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 48,
                height: 48
              }}
            >
              <FolderOpen />
            </Avatar>
          </Box>

          {/* Main Card */}
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              overflow: 'visible'
            }}
          >
            <CardContent sx={{ p: 4 }}>
                {/* Title Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                    Start New Scan
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Scan a directory to detect duplicate files and free up space
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {/* Directory Input Section */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Select Directory to Scan
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="Enter directory path (e.g., C:\Users\Documents)"
                    value={directoryPath}
                    onChange={(e) => {
                      setDirectoryPath(e.target.value);
                      setError(null);
                    }}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FolderOpen color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<FolderOpen />}
                      onClick={handleBrowseDirectory}
                      disabled={loading}
                      size="small"
                    >
                      {showSuggestions ? 'Hide Suggestions' : 'Browse Common Folders'}
                    </Button>
                    <Tooltip title="We'll scan all supported file types in the selected directory">
                      <Button
                        variant="text"
                        startIcon={<Info />}
                        size="small"
                        disabled
                      >
                        Info
                      </Button>
                    </Tooltip>
                  </Box>

                  {/* Directory Suggestions */}
                  {showSuggestions && (
                    <Fade in={showSuggestions}>
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          border: '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: 2,
                          overflow: 'hidden'
                        }}
                      >
                        <List dense>
                          {commonDirectories.map((dir, index) => (
                            <ListItem
                              key={index}
                              button
                              onClick={() => handleSelectDirectory(dir.path)}
                              sx={{
                                '&:hover': {
                                  bgcolor: 'primary.light',
                                  color: 'primary.contrastText',
                                }
                              }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {dir.icon}
                              </ListItemIcon>
                              <ListItemText 
                                primary={dir.label}
                                secondary={dir.path}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </Fade>
                  )}
                </Box>

                {/* File Types Info */}
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 3, 
                    mb: 4, 
                    bgcolor: 'primary.light', 
                    color: 'primary.contrastText',
                    borderRadius: 2 
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InsertDriveFile />
                    Supported File Types
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Documents</Typography>
                      <Typography variant="caption">PDF, DOC, TXT</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Images</Typography>
                      <Typography variant="caption">JPG, PNG, GIF</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Code Files</Typography>
                      <Typography variant="caption">PY, JS, HTML</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>Archives</Typography>
                      <Typography variant="caption">ZIP, RAR, 7Z</Typography>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', pt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/')}
                    disabled={loading}
                    size="large"
                    sx={{ minWidth: 120 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    onClick={handleStartScan}
                    disabled={loading || !directoryPath.trim()}
                    size="large"
                    sx={{ 
                      minWidth: 160,
                      py: 1.5,
                      px: 3,
                      fontWeight: 600,
                      fontSize: '1.1rem'
                    }}
                  >
                    {loading ? 'Starting Scan...' : 'Start Scan'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Fade>
      </Container>
    );
};

export default NewScanPage;
