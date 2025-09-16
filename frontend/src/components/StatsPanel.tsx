import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Fade,
  Avatar,
  Divider
} from '@mui/material';
import {
  Storage,
  ContentCopy,
  FolderOpen,
  Warning,
  TrendingUp,
  Speed,
  CheckCircle
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

  // Check if stats is null/undefined OR if it's an empty stats object (all zeros)
  const hasValidStats = stats && (
    stats.total_duplicate_groups > 0 || 
    stats.total_duplicate_files > 0 || 
    stats.total_space_wasted > 0 ||
    stats.most_common_type
  );
  
  if (!hasValidStats) {
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
            <TrendingUp color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Statistics
            </Typography>
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
              <TrendingUp sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              No data available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start a scan to see statistics
            </Typography>
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
          <TrendingUp color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Statistics
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Duplicate Groups */}
          <Grid item xs={6} sm={3}>
            <Fade in timeout={300}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2,
                bgcolor: 'rgba(25, 118, 210, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(25, 118, 210, 0.1)',
              }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    color: 'primary.main',
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  <ContentCopy />
                </Avatar>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats.total_duplicate_groups}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Duplicate Groups
                </Typography>
              </Box>
            </Fade>
          </Grid>

          {/* Duplicate Files */}
          <Grid item xs={6} sm={3}>
            <Fade in timeout={500}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2,
                bgcolor: 'rgba(156, 39, 176, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(156, 39, 176, 0.1)',
              }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(156, 39, 176, 0.1)',
                    color: 'secondary.main',
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  <FolderOpen />
                </Avatar>
                <Typography variant="h4" color="secondary" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats.total_duplicate_files}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Duplicate Files
                </Typography>
              </Box>
            </Fade>
          </Grid>

          {/* Space Wasted */}
          <Grid item xs={6} sm={3}>
            <Fade in timeout={700}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2,
                bgcolor: 'rgba(255, 152, 0, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(255, 152, 0, 0.1)',
              }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(255, 152, 0, 0.1)',
                    color: 'warning.main',
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  <Storage />
                </Avatar>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats.space_wasted_gb.toFixed(1)}GB
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Space Wasted
                </Typography>
              </Box>
            </Fade>
          </Grid>

          {/* Largest Group */}
          <Grid item xs={6} sm={3}>
            <Fade in timeout={900}>
              <Box sx={{ 
                textAlign: 'center', 
                p: 2,
                bgcolor: 'rgba(244, 67, 54, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(244, 67, 54, 0.1)',
              }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(244, 67, 54, 0.1)',
                    color: 'error.main',
                    width: 48,
                    height: 48,
                    mx: 'auto',
                    mb: 1,
                  }}
                >
                  <Warning />
                </Avatar>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {stats.largest_group_size}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Largest Group
                </Typography>
              </Box>
            </Fade>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Space Wasted Breakdown
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total Space Wasted
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="warning.main">
                {formatBytes(stats.total_space_wasted)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((stats.space_wasted_mb / 100) * 100, 100)}
              color={getSpaceWastedColor(stats.space_wasted_gb) as any}
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              label={`${stats.space_wasted_mb.toFixed(1)} MB`}
              color="info"
              size="small"
              variant="outlined"
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
              icon={<Speed />}
            />
          </Box>
        </Box>

        {stats.most_common_type && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
              Most Common Duplicate Type
            </Typography>
            <Chip
              label={stats.most_common_type}
              color="primary"
              variant="outlined"
              icon={<ContentCopy />}
            />
          </Box>
        )}

        {/* Recommendations */}
        <Box sx={{ 
          mt: 3, 
          p: 3, 
          bgcolor: 'rgba(0, 0, 0, 0.02)', 
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.05)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircle color="primary" sx={{ fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Recommendations
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
            {stats.total_duplicate_groups === 0 ? (
              "No duplicates found. Your files are well organized!"
            ) : stats.space_wasted_gb > 10 ? (
              "High space waste detected! Consider running cleanup operations to free up significant storage space."
            ) : stats.space_wasted_gb > 1 ? (
              "Moderate space waste detected. Cleanup operations can help optimize your storage."
            ) : stats.total_duplicate_groups > 0 ? (
              "Duplicates detected but minimal space waste. Consider reviewing duplicate groups for organization."
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
