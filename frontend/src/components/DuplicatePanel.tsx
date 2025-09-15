import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider
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
  Code
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Duplicate Files ({duplicates.length} groups)
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onRefresh}
          size="small"
        >
          Refresh
        </Button>
      </Box>

      {duplicates.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FolderOpen sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No duplicate files found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a scan to find duplicate files in your directories
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {duplicates.map((group) => (
            <Card key={group.group_id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6">
                      {group.files.length} duplicate files
                    </Typography>
                    <Chip
                      label={`${formatBytes(group.space_wasted)} wasted`}
                      color="warning"
                      size="small"
                    />
                    <Chip
                      label={`${formatBytes(group.total_size)} total`}
                      color="info"
                      size="small"
                    />
                  </Box>
                  <IconButton onClick={() => toggleGroup(group.group_id)}>
                    {expandedGroups.has(group.group_id) ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Detected on {formatDate(group.created_at)}
                </Typography>

                <Collapse in={expandedGroups.has(group.group_id)}>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Primary File:
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: 'success.light', bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getFileIcon(group.primary_file.file_type, null)}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {group.primary_file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {group.primary_file.path}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {formatBytes(group.primary_file.size)}
                            </Typography>
                          </Box>
                          <Chip label="Primary" color="success" size="small" />
                        </Box>
                      </CardContent>
                    </Card>

                    <Typography variant="subtitle2" gutterBottom>
                      Duplicate Files:
                    </Typography>
                    <List dense>
                      {group.files
                        .filter(file => file.id !== group.primary_file.id)
                        .map((file, index) => (
                          <React.Fragment key={file.id}>
                            <ListItem>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
                                {getFileIcon(file.file_type, file.category)}
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body2">
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
                                />
                              </Box>
                            </ListItem>
                            {index < group.files.length - 2 && <Divider />}
                          </React.Fragment>
                        ))}
                    </List>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DuplicatePanel;
