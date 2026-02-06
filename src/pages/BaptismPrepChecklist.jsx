import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, CardHeader,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Chip, IconButton, CircularProgress, Checkbox, LinearProgress,
  Alert, Snackbar, List, ListItem, ListItemText, ListItemSecondaryAction, ListItemButton,
  Divider, MenuItem, Stack, Container
} from '@mui/material';
import {
  CheckCircle, RadioButtonUnchecked, WaterDrop, Event,
  Person, Assignment, Celebration, Add as AddIcon
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

const BaptismPrepChecklist = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Deduplicate candidates by member/visitor, preferring higher status and readiness
  const uniqueCandidates = useMemo(() => {
    const map = new Map();
    const statusOrder = { completed: 4, scheduled: 3, ready: 2, preparing: 1, deferred: 0 };

    candidates.forEach((c) => {
      const key = c.member_id ? `m:${c.member_id}` : c.visitor_id ? `v:${c.visitor_id}` : `${c.first_name}||${c.surname}||${c.contact_primary || ''}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, c);
        return;
      }

      const existingScore = statusOrder[existing.status] || 0;
      const newScore = statusOrder[c.status] || 0;

      if (newScore > existingScore) {
        map.set(key, c);
        return;
      }

      if (newScore === existingScore) {
        const existingCounsel = existing.counseling_completed ? 1 : 0;
        const newCounsel = c.counseling_completed ? 1 : 0;
        if (newCounsel > existingCounsel) { map.set(key, c); return; }

        const existingFound = existing.foundation_class_completed ? 1 : 0;
        const newFound = c.foundation_class_completed ? 1 : 0;
        if (newFound > existingFound) { map.set(key, c); return; }

        const existingDate = existing.preferred_date ? new Date(existing.preferred_date) : null;
        const newDate = c.preferred_date ? new Date(c.preferred_date) : null;
        if (newDate && (!existingDate || newDate < existingDate)) { map.set(key, c); return; }
      }
    });

    return Array.from(map.values());
  }, [candidates]);

  // Dialog states
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    session_date: new Date(),
    session_type: 'counseling',
    topics_covered: '',
    next_steps: ''
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadCandidates = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/baptisms/candidates');
      if (response.ok) {
        const candidatesData = await response.json();
        setCandidates(candidatesData);
      }
    } catch (err) {
      console.error('Failed to load candidates:', err);
    }
  }, [fetchWithAuth]);

  const loadChecklist = async (candidateId) => {
    try {
      const [checklistRes, progressRes] = await Promise.all([
        fetchWithAuth(`/api/baptism-prep/candidates/${candidateId}/checklist`),
        fetchWithAuth(`/api/baptism-prep/candidates/${candidateId}/checklist-progress`)
      ]);

      if (checklistRes.ok) {
        const checklistData = await checklistRes.json();
        setChecklist(checklistData);
      }

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgress(progressData);
      }
    } catch (err) {
      console.error('Failed to load checklist:', err);
    }
  };

  useEffect(() => {
    loadCandidates();
    setLoading(false);
  }, [loadCandidates]);

  const handleSelectCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    loadChecklist(candidate.id);
  };

  const handleToggleChecklistItem = async (itemId, currentStatus) => {
    try {
      const response = await fetchWithAuth(`/api/baptism-prep/checklist/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_completed: !currentStatus,
          completed_date: !currentStatus ? new Date() : null
        })
      });

      if (!response.ok) throw new Error('Failed to update checklist item');

      // Reload checklist
      if (selectedCandidate) {
        loadChecklist(selectedCandidate.id);
      }

      setSnackbar({
        open: true,
        message: `Checklist item ${!currentStatus ? 'completed' : 'marked incomplete'}`,
        severity: 'success'
      });
    } catch (err) {
      console.error('Failed to update checklist item:', err);
      setSnackbar({ open: true, message: 'Failed to update checklist item', severity: 'error' });
    }
  };

  const handleCreateSession = async () => {
    if (!selectedCandidate) return;

    try {
      const response = await fetchWithAuth('/api/baptism-prep/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: selectedCandidate.id,
          ...sessionForm
        })
      });

      if (!response.ok) throw new Error('Failed to create session');

      setSessionDialogOpen(false);
      setSessionForm({
        session_date: new Date(),
        session_type: 'counseling',
        topics_covered: '',
        next_steps: ''
      });

      setSnackbar({ open: true, message: 'Preparation session recorded successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create session:', err);
      setSnackbar({ open: true, message: 'Failed to record session', severity: 'error' });
    }
  };

  const getChecklistIcon = (isCompleted, isRequired) => {
    if (isCompleted) {
      return <CheckCircle color="success" />;
    }
    return isRequired ? <RadioButtonUnchecked color="error" /> : <RadioButtonUnchecked />;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      counseling: <Person />,
      foundation_school: <Assignment />,
      testimony: <Celebration />,
      sponsors: <Person />,
      practical: <WaterDrop />
    };
    return icons[category] || <Assignment />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Baptism Preparation Checklist
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track and manage baptism candidates' preparation progress
          </Typography>
        </Box>

        {/* Candidates List and Checklist */}
        <Grid container spacing={3}>
          {/* Candidates List */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Baptism Candidates"
                titleTypographyProps={{ variant: 'h6' }}
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ p: 0 }}>
                {candidates.length === 0 ? (
                  <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      No candidates found
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ width: '100%' }}>
                    {uniqueCandidates.map((candidate) => (
                      <ListItemButton
                        key={candidate.id}
                        selected={selectedCandidate?.id === candidate.id}
                        onClick={() => handleSelectCandidate(candidate)}
                        sx={{
                          borderLeft: selectedCandidate?.id === candidate.id ? 4 : 0,
                          borderColor: 'primary.main',
                          backgroundColor: selectedCandidate?.id === candidate.id ? 'action.selected' : 'transparent',
                        }}
                      >
                        <ListItemText
                          primary={`${candidate.first_name} ${candidate.surname}`}
                          secondary={`${candidate.status} • ${candidate.baptism_type || 'Not specified'}`}
                        />
                        <Chip
                          label={candidate.status}
                          size="small"
                          color={candidate.status === 'ready' ? 'success' : 'warning'}
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Checklist */}
          <Grid item xs={12} md={8}>
            {selectedCandidate ? (
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title={`Preparation Checklist`}
                  subheader={`${selectedCandidate.first_name} ${selectedCandidate.surname}`}
                  action={
                    <Button
                      variant="contained"
                      startIcon={<Event />}
                      onClick={() => setSessionDialogOpen(true)}
                      size="small"
                    >
                      Record Session
                    </Button>
                  }
                />
                <CardContent>
                  {/* Progress Overview */}
                  {progress && (
                    <Box sx={{ mb: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Overall Progress
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {progress.completion_percentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress.completion_percentage}
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Required items: {progress.completed_required_items}/{progress.required_items} completed
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ mb: 2 }} />

                  {/* Checklist Items */}
                  {checklist.length === 0 ? (
                    <Alert severity="info">
                      No checklist items found. Initialize checklist for this candidate.
                    </Alert>
                  ) : (
                    <Stack spacing={1}>
                      {checklist.map((item) => (
                        <Box
                          key={item.id}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            backgroundColor: item.is_completed ? 'action.hover' : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderColor: 'primary.light'
                            }
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                            <Box sx={{ mt: 0.5, color: 'primary.main' }}>
                              {getCategoryIcon(item.category)}
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 600,
                                    textDecoration: item.is_completed ? 'line-through' : 'none',
                                    color: item.is_completed ? 'text.secondary' : 'text.primary'
                                  }}
                                >
                                  {item.checklist_item}
                                </Typography>
                                {item.is_required && (
                                  <Chip label="Required" size="small" color="error" variant="filled" />
                                )}
                                {item.is_completed && (
                                  <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
                                )}
                              </Box>
                              {item.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  {item.description}
                                </Typography>
                              )}
                              {item.is_completed && item.completed_date && (
                                <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 500 }}>
                                  Completed: {new Date(item.completed_date).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                            <Checkbox
                              checked={item.is_completed}
                              onChange={() => handleToggleChecklistItem(item.id, item.is_completed)}
                              color="primary"
                              sx={{ mt: -1 }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                    <Typography variant="h6" color="text.secondary" align="center">
                      Select a candidate to view their preparation checklist
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

      {/* Record Session Dialog */}
      <Dialog
        open={sessionDialogOpen}
        onClose={() => setSessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Record Preparation Session</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              type="date"
              label="Session Date"
              value={sessionForm.session_date.toISOString().split('T')[0]}
              onChange={(e) => setSessionForm(prev => ({ ...prev, session_date: new Date(e.target.value) }))}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              select
              label="Session Type"
              value={sessionForm.session_type}
              onChange={(e) => setSessionForm(prev => ({ ...prev, session_type: e.target.value }))}
            >
              <MenuItem value="counseling">Counseling</MenuItem>
              <MenuItem value="testimony_prep">Testimony Preparation</MenuItem>
              <MenuItem value="q_and_a">Q&A Session</MenuItem>
              <MenuItem value="prayer">Prayer Session</MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Topics Covered"
              placeholder="What topics were discussed?"
              value={sessionForm.topics_covered}
              onChange={(e) => setSessionForm(prev => ({ ...prev, topics_covered: e.target.value }))}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Next Steps"
              placeholder="What are the follow-up actions?"
              value={sessionForm.next_steps}
              onChange={(e) => setSessionForm(prev => ({ ...prev, next_steps: e.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setSessionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateSession} variant="contained">
            Record Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      </Stack>
    </Container>
  );
};

export default BaptismPrepChecklist;