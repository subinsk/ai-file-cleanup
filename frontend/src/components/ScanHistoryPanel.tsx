import React, { useState } from 'react';
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
  Avatar,
  Divider,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Checkbox,
  Menu,
  MenuItem,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import {
  FolderOpen,
  PlayArrow,
  CheckCircle,
  Error,
  Schedule,
  Storage,
  Refresh,
  Add,
  Delete,
  MoreVert,
  DeleteSweep,
  SelectAll
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

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
  onScanDeleted?: (scanId: string) => void;
  onMultipleScansDeleted?: (scanIds: string[]) => void;
}

const ScanHistoryPanel: React.FC<ScanHistoryPanelProps> = ({
  scanHistory,
  onScanSelect,
  onRefresh,
  loading,
  onScanDeleted,
  onMultipleScansDeleted
}) => {
  const navigate = useNavigate();
  
  // State for delete functionality
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set());
  const [bulkSelectMode, setBulkSelectMode] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Delete handlers
  const handleDeleteClick = (scanId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setScanToDelete(scanId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!scanToDelete) return;
    
    setIsDeleting(true);
    try {
      await apiService.deleteScan(scanToDelete);
      setSnackbarMessage('Scan deleted successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      if (onScanDeleted) {
        onScanDeleted(scanToDelete);
      }
      onRefresh();
    } catch (error: any) {
      setSnackbarMessage(`Failed to delete scan: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setScanToDelete(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedScans.size === 0) return;
    
    setIsDeleting(true);
    try {
      const scanIds = Array.from(selectedScans);
      await apiService.deleteMultipleScans(scanIds);
      setSnackbarMessage(`Successfully deleted ${scanIds.length} scans`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      
      if (onMultipleScansDeleted) {
        onMultipleScansDeleted(scanIds);
      }
      setSelectedScans(new Set());
      setBulkSelectMode(false);
      onRefresh();
    } catch (error: any) {
      setSnackbarMessage(`Failed to delete scans: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleScanSelectionToggle = (scanId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelected = new Set(selectedScans);
    if (newSelected.has(scanId)) {
      newSelected.delete(scanId);
    } else {
      newSelected.add(scanId);
    }
    setSelectedScans(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedScans.size === scanHistory.length) {
      setSelectedScans(new Set());
    } else {
      setSelectedScans(new Set(scanHistory.map(scan => scan.id)));
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBulkModeToggle = () => {
    setBulkSelectMode(!bulkSelectMode);
    setSelectedScans(new Set());
    handleMenuClose();
  };

  if (scanHistory.length === 0) {
    return (
      <>
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
      </>
    );
  }

  return (
    <>
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
          
          {/* Bulk selection controls */}
          {bulkSelectMode && (
            <>
              <Tooltip title="Select all">
                <IconButton onClick={handleSelectAll} size="small">
                  <SelectAll />
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteSweep />}
                onClick={() => setBulkDeleteDialogOpen(true)}
                disabled={selectedScans.size === 0 || isDeleting}
                size="small"
              >
                Delete ({selectedScans.size})
              </Button>
              <Button
                variant="outlined"
                onClick={handleBulkModeToggle}
                size="small"
              >
                Cancel
              </Button>
            </>
          )}
          
          {!bulkSelectMode && (
            <>
              <Tooltip title="More options">
                <IconButton onClick={handleMenuClick} size="small">
                  <MoreVert />
                </IconButton>
              </Tooltip>
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
            </>
          )}
        </Box>

        <List sx={{ p: 0 }}>
          {scanHistory.map((scan, index) => (
            <Fade in={true} key={scan.id} timeout={300 + index * 100}>
              <div>
                <ListItem
                  button
                  onClick={() => !bulkSelectMode && onScanSelect(scan.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    bgcolor: selectedScans.has(scan.id) ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                    border: selectedScans.has(scan.id) ? '1px solid rgba(25, 118, 210, 0.3)' : '1px solid transparent',
                    '&:hover': {
                      bgcolor: selectedScans.has(scan.id) ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  {/* Checkbox for bulk selection */}
                  {bulkSelectMode && (
                    <Checkbox
                      checked={selectedScans.has(scan.id)}
                      onChange={(e) => handleScanSelectionToggle(scan.id, e as any)}
                      sx={{ mr: 1 }}
                    />
                  )}
                  
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ textAlign: 'right', mr: 1 }}>
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
                      
                      {/* Delete button - only show if not in bulk mode */}
                      {!bulkSelectMode && (
                        <Tooltip title="Delete scan">
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={(e) => handleDeleteClick(scan.id, e)}
                            disabled={isDeleting}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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

      {/* More options menu */}
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleBulkModeToggle}>
        <DeleteSweep sx={{ mr: 1 }} />
        Bulk Delete Mode
      </MenuItem>
    </Menu>

    {/* Single delete confirmation dialog */}
    <Dialog
      open={deleteDialogOpen}
      onClose={() => !isDeleting && setDeleteDialogOpen(false)}
    >
      <DialogTitle>Delete Scan</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this scan? This action will permanently remove all scan data, 
          including files and duplicates information. This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
          Cancel
        </Button>
        <Button onClick={handleDeleteConfirm} color="error" disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Bulk delete confirmation dialog */}
    <Dialog
      open={bulkDeleteDialogOpen}
      onClose={() => !isDeleting && setBulkDeleteDialogOpen(false)}
    >
      <DialogTitle>Delete Multiple Scans</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete {selectedScans.size} selected scans? This action will permanently 
          remove all scan data, including files and duplicates information. This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setBulkDeleteDialogOpen(false)} disabled={isDeleting}>
          Cancel
        </Button>
        <Button onClick={handleBulkDelete} color="error" disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : `Delete ${selectedScans.size} Scans`}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Success/Error snackbar */}
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={6000}
      onClose={() => setSnackbarOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert 
        onClose={() => setSnackbarOpen(false)} 
        severity={snackbarSeverity}
        sx={{ width: '100%' }}
      >
        {snackbarMessage}
      </Alert>
    </Snackbar>
    </>
  );
};

export default ScanHistoryPanel;
