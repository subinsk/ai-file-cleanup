import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  Divider,
  Fade,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Refresh,
  FolderOpen,
  Image,
  Description,
  VideoFile,
  AudioFile,
  Code,
  Storage,
  Warning,
  CheckCircle
} from '@mui/icons-material';

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

interface DuplicatePanelProps {
  duplicates: DuplicateGroup[];
  onRefresh: () => void;
}

const DuplicatePanel: React.FC<DuplicatePanelProps> = ({ duplicates, onRefresh }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getFileIcon = (fileType: string | null, category: string | null) => {
    if (category === 'image' || (fileType && fileType.startsWith('image/'))) {
      return <Image color="primary" />;
    } else if (category === 'video' || (fileType && fileType.startsWith('video/'))) {
      return <VideoFile color="primary" />;
    } else if (category === 'audio' || (fileType && fileType.startsWith('audio/'))) {
      return <AudioFile color="primary" />;
    } else if (category === 'code' || (fileType && fileType.includes('code'))) {
      return <Code color="primary" />;
    } else {
      return <Description color="primary" />;
    }
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Storage color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Duplicate Files
          </Typography>
          <Chip
            label={`${duplicates.length} groups`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onRefresh}
          size="small"
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          Refresh
        </Button>
      </Box>

      {duplicates.length === 0 ? (
        <Fade in={duplicates.length === 0}>
          <Card 
            elevation={0}
            sx={{ 
              border: '1px solid rgba(0, 0, 0, 0.05)',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            }}
          >
            <CardContent>
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
                  No duplicate files found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start a scan to find duplicate files in your directories
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Fade>
      ) : (
        <Box>
          {duplicates.map((group, index) => (
            <Fade in key={group.group_id} timeout={300 + index * 100}>
              <div>
                <Card 
                elevation={0}
                sx={{ 
                  mb: 3,
                  border: '1px solid rgba(0, 0, 0, 0.05)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: 'rgba(255, 152, 0, 0.1)',
                          color: 'warning.main',
                          width: 40,
                          height: 40,
                        }}
                      >
                        <Warning />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {group.files.length} duplicate files
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Detected on {formatDate(group.created_at)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${formatBytes(group.space_wasted)} wasted`}
                        color="warning"
                        size="small"
                        icon={<Storage />}
                      />
                      <Chip
                        label={`${formatBytes(group.total_size)} total`}
                        color="info"
                        size="small"
                        variant="outlined"
                      />
                      <Tooltip title={expandedGroups.has(group.group_id) ? 'Collapse' : 'Expand'}>
                        <IconButton 
                          onClick={() => toggleGroup(group.group_id)}
                          sx={{
                            bgcolor: 'rgba(0, 0, 0, 0.05)',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.1)',
                            },
                          }}
                        >
                          {expandedGroups.has(group.group_id) ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                <Collapse in={expandedGroups.has(group.group_id)}>
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Primary File
                    </Typography>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        mb: 3, 
                        bgcolor: 'rgba(76, 175, 80, 0.05)',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                      }}
                    >
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(76, 175, 80, 0.1)',
                              color: 'success.main',
                              width: 40,
                              height: 40,
                            }}
                          >
                            {getFileIcon(group.primary_file.file_type, group.primary_file.category)}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body1" fontWeight="bold" sx={{ mb: 0.5 }}>
                              {group.primary_file.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {group.primary_file.path}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatBytes(group.primary_file.size)}
                            </Typography>
                          </Box>
                          <Chip 
                            label="Primary" 
                            color="success" 
                            size="small"
                            icon={<CheckCircle />}
                          />
                        </Box>
                      </CardContent>
                    </Card>

                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Duplicate Files
                    </Typography>
                    <List sx={{ bgcolor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2, p: 1 }}>
                      {group.files
                        .filter(file => file.id !== group.primary_file.id)
                        .map((file, index) => (
                          <React.Fragment key={file.id}>
                            <ListItem sx={{ py: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                                <Avatar
                                  sx={{
                                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                                    color: 'text.secondary',
                                    width: 32,
                                    height: 32,
                                  }}
                                >
                                  {getFileIcon(file.file_type, file.category)}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body2" fontWeight="500">
                                    {file.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {file.path}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                    {formatBytes(file.size)}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={`${(group.similarity_scores[index] * 100).toFixed(1)}% similar`}
                                  color={getSimilarityColor(group.similarity_scores[index]) as any}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </ListItem>
                            {index < group.files.length - 2 && <Divider sx={{ mx: 2 }} />}
                          </React.Fragment>
                        ))}
                    </List>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
              </div>
            </Fade>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DuplicatePanel;
