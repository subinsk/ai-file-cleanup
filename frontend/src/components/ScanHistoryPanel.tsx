import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  IconButton,
  Button,
  Grid,
  Avatar,
  Divider,
  Fade
} from '@mui/material';
import {
  FolderOpen,
  PlayArrow,
  CheckCircle,
  Error,
  Schedule,
  Storage,
  Refresh,
  Add
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface ScanHistoryItem {
  id: string;
  directory_path: string;
  status: string;
  files_processed: number;
  files_total: number;
  duplicates_found: number;
  progress_percentage: number;
  started_at: string;
  completed_at?: string;
  error_message?: string;
}

interface ScanHistoryPanelProps {
  scanHistory: ScanHistoryItem[];
  onScanSelect: (scanId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const ScanHistoryPanel: React.FC<ScanHistoryPanelProps> = ({
  scanHistory,
  onScanSelect,
  onRefresh,
  loading
}) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'primary';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'running': return <PlayArrow />;
      case 'failed': return <Error />;
      case 'pending': return <Schedule />;
      default: return <FolderOpen />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatPath = (path: string) => {
    // Show only the last part of the path for brevity
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1] || path;
  };

  if (scanHistory.length === 0) {
    return (
      <Card 
        elevation={0}
        sx={{ 
          border: '1px solid rgba(0, 0, 0, 0.05)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <FolderOpen color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Scan History
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/scan/new')}
              size="small"
            >
              New Scan
            </Button>
          </Box>
          
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                color: 'primary.main',
                mx: 'auto',
                mb: 2,
              }}
            >
              <FolderOpen sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              No scans yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Start your first scan to find duplicate files
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/scan/new')}
              size="large"
            >
              Start New Scan
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      elevation={0}
      sx={{ 
        border: '1px solid rgba(0, 0, 0, 0.05)',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <FolderOpen color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Scan History
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={onRefresh} disabled={loading} size="small">
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/scan/new')}
            size="small"
          >
            New Scan
          </Button>
        </Box>

        <List sx={{ p: 0 }}>
          {scanHistory.map((scan, index) => (
            <Fade in={true} key={scan.id} timeout={300 + index * 100}>
              <div>
                <ListItem
                  button
                  onClick={() => onScanSelect(scan.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.02)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: `${getStatusColor(scan.status)}.light`,
                      color: `${getStatusColor(scan.status)}.contrastText`,
                      mr: 2,
                    }}
                  >
                    {getStatusIcon(scan.status)}
                  </Avatar>
                  
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {formatPath(scan.directory_path)}
                        </Typography>
                        <Chip
                          label={scan.status}
                          color={getStatusColor(scan.status) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {scan.files_processed} of {scan.files_total} files processed
                          {scan.duplicates_found > 0 && ` • ${scan.duplicates_found} duplicates found`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Started: {formatDate(scan.started_at)}
                          {scan.completed_at && ` • Completed: ${formatDate(scan.completed_at)}`}
                        </Typography>
                        {scan.error_message && (
                          <Typography variant="caption" color="error" display="block">
                            Error: {scan.error_message}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  
                  <ListItemSecondaryAction>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                        {scan.progress_percentage.toFixed(1)}%
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <Storage sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {scan.files_total} files
                        </Typography>
                      </Box>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < scanHistory.length - 1 && <Divider sx={{ mx: 2 }} />}
              </div>
            </Fade>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default ScanHistoryPanel;
