import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  Storage,
  Duplicate,
  FolderOpen,
  Warning
} from '@mui/icons-material';

interface StatsPanelProps {
  stats: {
    total_duplicate_groups: number;
    total_duplicate_files: number;
    total_space_wasted: number;
    space_wasted_mb: number;
    space_wasted_gb: number;
    most_common_type: string | null;
    largest_group_size: number;
  } | null;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSpaceWastedColor = (gb: number) => {
    if (gb > 10) return 'error';
    if (gb > 1) return 'warning';
    return 'success';
  };

  const getSpaceWastedSeverity = (gb: number) => {
    if (gb > 10) return 'high';
    if (gb > 1) return 'medium';
    return 'low';
  };

  if (!stats) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No data available. Start a scan to see statistics.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Statistics
        </Typography>

        <Grid container spacing={2}>
          {/* Duplicate Groups */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Duplicate color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" color="primary">
                {stats.total_duplicate_groups}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duplicate Groups
              </Typography>
            </Box>
          </Grid>

          {/* Duplicate Files */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <FolderOpen color="secondary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" color="secondary">
                {stats.total_duplicate_files}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Duplicate Files
              </Typography>
            </Box>
          </Grid>

          {/* Space Wasted */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Storage color="warning" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" color="warning.main">
                {stats.space_wasted_gb.toFixed(1)}GB
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Space Wasted
              </Typography>
            </Box>
          </Grid>

          {/* Largest Group */}
          <Grid item xs={6} sm={3}>
            <Box sx={{ textAlign: 'center' }}>
              <Warning color="error" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h4" color="error.main">
                {stats.largest_group_size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Largest Group
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Space Wasted Breakdown
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                Total Space Wasted
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatBytes(stats.total_space_wasted)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((stats.space_wasted_gb / 50) * 100, 100)}
              color={getSpaceWastedColor(stats.space_wasted_gb) as any}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${stats.space_wasted_mb.toFixed(1)} MB`}
              color="info"
              size="small"
            />
            <Chip
              label={`${stats.space_wasted_gb.toFixed(2)} GB`}
              color={getSpaceWastedColor(stats.space_wasted_gb) as any}
              size="small"
            />
            <Chip
              label={`Severity: ${getSpaceWastedSeverity(stats.space_wasted_gb)}`}
              color={getSpaceWastedColor(stats.space_wasted_gb) as any}
              size="small"
            />
          </Box>
        </Box>

        {stats.most_common_type && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Most Common Duplicate Type
            </Typography>
            <Chip
              label={stats.most_common_type}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}

        {/* Recommendations */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Recommendations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {stats.space_wasted_gb > 10 ? (
              "High space waste detected! Consider running cleanup operations to free up significant storage space."
            ) : stats.space_wasted_gb > 1 ? (
              "Moderate space waste detected. Cleanup operations can help optimize your storage."
            ) : (
              "Low space waste. Your files are well organized!"
            )}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default StatsPanel;
