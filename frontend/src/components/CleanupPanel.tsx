import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Slider,
  Grid,
  Alert,
  Divider,
  Chip
} from '@mui/material';
import { Delete, MoveToInbox, Archive, FolderOpen } from '@mui/icons-material';

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

interface CleanupPanelProps {
  onCleanup: (cleanupRules: any) => void;
  duplicates: DuplicateGroup[];
  loading: boolean;
}

const CleanupPanel: React.FC<CleanupPanelProps> = ({ onCleanup, duplicates, loading }) => {
  const [cleanupAction, setCleanupAction] = useState('delete_duplicates');
  const [keepPrimary, setKeepPrimary] = useState(true);
  const [minSimilarity, setMinSimilarity] = useState(0.8);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  const handleGroupToggle = (groupId: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroups(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedGroups.size === duplicates.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(duplicates.map(g => g.group_id)));
    }
  };

  const handleCleanup = () => {
    const cleanupRules = {
      rules: [{
        action: cleanupAction,
        target_duplicate_groups: selectedGroups.size > 0 ? Array.from(selectedGroups) : null,
        min_similarity_score: minSimilarity,
        keep_primary: keepPrimary,
        dry_run: dryRun
      }],
      confirm: confirmCleanup,
      backup: true
    };

    onCleanup(cleanupRules);
  };

  const formatBytes = (bytes: number | null) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalSpaceWasted = () => {
    if (selectedGroups.size === 0) {
      return duplicates.reduce((total, group) => total + group.space_wasted, 0);
    }
    return duplicates
      .filter(group => selectedGroups.has(group.group_id))
      .reduce((total, group) => total + group.space_wasted, 0);
  };

  const getTotalFilesToProcess = () => {
    if (selectedGroups.size === 0) {
      return duplicates.reduce((total, group) => total + group.files.length, 0);
    }
    return duplicates
      .filter(group => selectedGroups.has(group.group_id))
      .reduce((total, group) => total + group.files.length, 0);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Cleanup Operations
      </Typography>

      {duplicates.length === 0 ? (
        <Alert severity="info">
          No duplicate files found. Start a scan to find duplicates that can be cleaned up.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {/* Cleanup Settings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cleanup Settings
                </Typography>

                <FormControl component="fieldset" sx={{ mb: 3 }}>
                  <FormLabel component="legend">Cleanup Action</FormLabel>
                  <RadioGroup
                    value={cleanupAction}
                    onChange={(e) => setCleanupAction(e.target.value)}
                  >
                    <FormControlLabel
                      value="delete_duplicates"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Delete color="error" />
                          <Box>
                            <Typography variant="body2">Delete Duplicates</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Permanently remove duplicate files
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="move_to_trash"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <MoveToInbox color="warning" />
                          <Box>
                            <Typography variant="body2">Move to Trash</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Move duplicates to trash folder
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="archive_old"
                      control={<Radio />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Archive color="info" />
                          <Box>
                            <Typography variant="body2">Archive Old Files</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Archive older duplicate files
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>

                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    Minimum Similarity Score: {Math.round(minSimilarity * 100)}%
                  </Typography>
                  <Slider
                    value={minSimilarity}
                    onChange={(_, value) => setMinSimilarity(value as number)}
                    min={0.5}
                    max={1.0}
                    step={0.05}
                    marks={[
                      { value: 0.5, label: '50%' },
                      { value: 0.7, label: '70%' },
                      { value: 0.8, label: '80%' },
                      { value: 0.9, label: '90%' },
                      { value: 1.0, label: '100%' }
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={keepPrimary}
                        onChange={(e) => setKeepPrimary(e.target.checked)}
                      />
                    }
                    label="Keep primary file in each group"
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={dryRun}
                        onChange={(e) => setDryRun(e.target.checked)}
                      />
                    }
                    label="Dry run (preview changes only)"
                  />
                </Box>

                {!dryRun && (
                  <Box sx={{ mb: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={confirmCleanup}
                          onChange={(e) => setConfirmCleanup(e.target.checked)}
                        />
                      }
                      label="I understand this action cannot be undone"
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Duplicate Groups Selection */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Select Duplicate Groups
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleSelectAll}
                  >
                    {selectedGroups.size === duplicates.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </Box>

                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  {duplicates.map((group) => (
                    <Card
                      key={group.group_id}
                      variant="outlined"
                      sx={{
                        mb: 1,
                        cursor: 'pointer',
                        bgcolor: selectedGroups.has(group.group_id) ? 'action.selected' : 'background.paper',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => handleGroupToggle(group.group_id)}
                    >
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Checkbox
                            checked={selectedGroups.has(group.group_id)}
                            onChange={() => handleGroupToggle(group.group_id)}
                            size="small"
                          />
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" fontWeight="bold">
                              {group.files.length} duplicate files
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatBytes(group.space_wasted)} wasted space
                            </Typography>
                          </Box>
                          <Chip
                            label={formatBytes(group.total_size)}
                            size="small"
                            color="info"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Summary and Actions */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Cleanup Summary
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Groups Selected
                    </Typography>
                    <Typography variant="h6">
                      {selectedGroups.size === 0 ? duplicates.length : selectedGroups.size}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Files to Process
                    </Typography>
                    <Typography variant="h6">
                      {getTotalFilesToProcess()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Space to Free
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatBytes(getTotalSpaceWasted())}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">
                      Action
                    </Typography>
                    <Typography variant="h6">
                      {cleanupAction.replace('_', ' ').toUpperCase()}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color={cleanupAction === 'delete_duplicates' ? 'error' : 'primary'}
                    onClick={handleCleanup}
                    disabled={loading || (!dryRun && !confirmCleanup)}
                    size="large"
                  >
                    {dryRun ? 'Preview Changes' : 'Execute Cleanup'}
                  </Button>
                  
                  {!dryRun && (
                    <Alert severity="warning" sx={{ flexGrow: 1 }}>
                      This action will permanently modify your files. Make sure you have backups!
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default CleanupPanel;
