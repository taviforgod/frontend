import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, List, ListItem, ListItemText, Divider
} from '@mui/material';
import ReportProblem from '@mui/icons-material/ReportProblem';
import Person from '@mui/icons-material/Person';
import Group from '@mui/icons-material/Group';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Warning from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import Timeline from '@mui/icons-material/Timeline';
import { AuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ConflictManagement = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const notifications = useNotifications();
  const [conflicts, setConflicts] = useState([]);
  const [members, setMembers] = useState([]);
  const [cellGroups, setCellGroups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState(null);

  // Form states
  const [conflictForm, setConflictForm] = useState({
    title: '',
    description: '',
    conflict_type: 'interpersonal',
    primary_party: '',
    secondary_party: '',
    involved_parties: [],
    cell_group_id: '',
    ministry_area: '',
    incident_date: new Date(),
    severity: 'medium',
    witnesses: '',
    evidence: ''
  });

  const [actionForm, setActionForm] = useState({
    action_date: new Date(),
    action_type: 'meeting',
    action_description: '',
    responsible_party: '',
    notes: ''
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [conflictsRes, membersRes, cellGroupsRes, statsRes] = await Promise.all([
        fetchWithAuth('/api/conflicts'),
        fetchWithAuth('/api/members?limit=1000'),
        fetchWithAuth('/api/cell-groups'),
        fetchWithAuth('/api/conflicts/stats/overview')
      ]);

      const conflictsData = conflictsRes.ok ? await conflictsRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const cellGroupsData = cellGroupsRes.ok ? await cellGroupsRes.json() : [];
      const statsData = statsRes.ok ? await statsRes.json() : null;

      setConflicts(conflictsData);
      setMembers(membersData);
      setCellGroups(cellGroupsData);
      setStats(statsData);

    } catch (err) {
      console.error('Failed to load conflict data:', err);
      notifications.error('Failed to load conflict data');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateConflict = async () => {
    try {
      const response = await fetchWithAuth('/api/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conflictForm)
      });

      if (!response.ok) throw new Error('Failed to create conflict report');

      setCreateDialogOpen(false);
      setConflictForm({
        title: '', description: '', conflict_type: 'interpersonal', primary_party: '',
        secondary_party: '', involved_parties: [], cell_group_id: '', ministry_area: '',
        incident_date: new Date(), severity: 'medium', witnesses: '', evidence: ''
      });
      loadData();
      notifications.success('Conflict reported successfully');
    } catch (err) {
      console.error('Failed to create conflict:', err);
      notifications.crud.createError('conflict');
    }
  };

  const handleCreateAction = async () => {
    if (!selectedConflict) return;

    try {
      const response = await fetchWithAuth('/api/conflicts/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflict_id: selectedConflict.id,
          ...actionForm
        })
      });

      if (!response.ok) throw new Error('Failed to create action');

      setActionDialogOpen(false);
      setActionForm({
        action_date: new Date(), action_type: 'meeting', action_description: '',
        responsible_party: '', notes: ''
      });
      loadData();
      notifications.success('Action recorded successfully');
    } catch (err) {
      console.error('Failed to create action:', err);
      notifications.error('Failed to record action');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      low: 'info',
      medium: 'warning',
      high: 'error',
      critical: 'error'
    };
    return colors[severity] || 'default';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'low': return <Warning color="info" />;
      case 'medium': return <Warning color="warning" />;
      case 'high': return <ErrorIcon color="error" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <Warning />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      reported: 'warning',
      investigating: 'info',
      mediating: 'primary',
      resolved: 'success',
      escalated: 'error',
      closed: 'default',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  };

  if (loading && conflicts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Conflict Management
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Track and resolve conflicts within the ministry community
        </Typography>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {stats.total_conflicts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Conflicts
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {stats.resolved_conflicts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Resolved
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {stats.investigating_conflicts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Investigating
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">
                    {stats.high_severity_conflicts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Severity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<ReportProblem />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Report Conflict
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Conflicts" />
            <Tab label="Active Issues" />
            <Tab label="Resolution Tracker" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {conflicts.map((conflict) => (
              <Grid item xs={12} md={6} key={conflict.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {conflict.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {conflict.description}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        {getSeverityIcon(conflict.severity)}
                        <Chip
                          label={conflict.status}
                          color={getStatusColor(conflict.status)}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Type:</strong> {conflict.conflict_type}
                    </Typography>

                    {conflict.primary_party_first_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Primary Party:</strong> {conflict.primary_party_first_name} {conflict.primary_party_surname}
                      </Typography>
                    )}

                    {conflict.cell_group_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Cell Group:</strong> {conflict.cell_group_name}
                      </Typography>
                    )}

                    <Typography variant="body2" gutterBottom>
                      <strong>Reported:</strong> {new Date(conflict.reported_date).toLocaleDateString()}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Actions:</strong> {conflict.actions_count || 0}
                    </Typography>

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Update
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Timeline />}
                        onClick={() => {
                          setSelectedConflict(conflict);
                          setActionDialogOpen(true);
                        }}
                      >
                        Add Action
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Active Conflict Issues
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Conflicts requiring immediate attention
            </Typography>

            {conflicts
              .filter(conflict => ['reported', 'investigating', 'mediating'].includes(conflict.status))
              .sort((a, b) => {
                const severityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
                return severityOrder[a.severity] - severityOrder[b.severity];
              })
              .map((conflict) => (
                <Card key={conflict.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{conflict.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {conflict.conflict_type} • {conflict.severity} severity • {conflict.status}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Reported: {new Date(conflict.reported_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={conflict.severity}
                          color={getSeverityColor(conflict.severity)}
                          icon={getSeverityIcon(conflict.severity)}
                        />
                        <Button variant="outlined" size="small">
                          Take Action
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Conflict Resolution Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Monitor progress toward conflict resolution
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>📋 Resolution Steps</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Initial assessment and documentation" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Individual conversations with parties involved" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Mediation and facilitated discussion" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Action plan and follow-up commitments" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Resolution confirmation and closure" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>✅ Resolution Metrics</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Average resolution time: ${stats?.avg_resolution_days ? Math.round(stats.avg_resolution_days) : 'N/A'} days`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary={`Resolution rate: ${stats ? Math.round((stats.resolved_conflicts / stats.total_conflicts) * 100) : 0}%`} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Active investigations" secondary={stats?.investigating_conflicts || 0} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="High-priority conflicts" secondary={stats?.high_severity_conflicts || 0} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Create Conflict Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Report New Conflict</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Conflict Title"
                  value={conflictForm.title}
                  onChange={(e) => setConflictForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={conflictForm.description}
                  onChange={(e) => setConflictForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Conflict Type</InputLabel>
                  <Select
                    value={conflictForm.conflict_type}
                    label="Conflict Type"
                    onChange={(e) => setConflictForm(prev => ({ ...prev, conflict_type: e.target.value }))}
                  >
                    <MenuItem value="interpersonal">Interpersonal</MenuItem>
                    <MenuItem value="leadership">Leadership</MenuItem>
                    <MenuItem value="doctrinal">Doctrinal</MenuItem>
                    <MenuItem value="ministry">Ministry</MenuItem>
                    <MenuItem value="financial">Financial</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity</InputLabel>
                  <Select
                    value={conflictForm.severity}
                    label="Severity"
                    onChange={(e) => setConflictForm(prev => ({ ...prev, severity: e.target.value }))}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === conflictForm.primary_party) || null}
                  onChange={(event, newValue) => {
                    setConflictForm(prev => ({
                      ...prev,
                      primary_party: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Primary Party" placeholder="Select primary party..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === conflictForm.secondary_party) || null}
                  onChange={(event, newValue) => {
                    setConflictForm(prev => ({
                      ...prev,
                      secondary_party: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Secondary Party (Optional)" placeholder="Select secondary party..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Cell Group (Optional)</InputLabel>
                  <Select
                    value={conflictForm.cell_group_id}
                    label="Cell Group (Optional)"
                    onChange={(e) => setConflictForm(prev => ({ ...prev, cell_group_id: e.target.value }))}
                  >
                    <MenuItem value="">No specific cell group</MenuItem>
                    {cellGroups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Incident Date"
                  value={conflictForm.incident_date}
                  onChange={(date) => setConflictForm(prev => ({ ...prev, incident_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ministry Area (Optional)"
                  value={conflictForm.ministry_area}
                  onChange={(e) => setConflictForm(prev => ({ ...prev, ministry_area: e.target.value }))}
                  placeholder="e.g., Worship, Children, Youth, Administration"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Witnesses (Optional)"
                  value={conflictForm.witnesses}
                  onChange={(e) => setConflictForm(prev => ({ ...prev, witnesses: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateConflict} variant="contained">
              Report Conflict
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Action Dialog */}
        <Dialog
          open={actionDialogOpen}
          onClose={() => setActionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Resolution Action</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Action Date"
                  value={actionForm.action_date}
                  onChange={(date) => setActionForm(prev => ({ ...prev, action_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Action Type</InputLabel>
                  <Select
                    value={actionForm.action_type}
                    label="Action Type"
                    onChange={(e) => setActionForm(prev => ({ ...prev, action_type: e.target.value }))}
                  >
                    <MenuItem value="meeting">Meeting</MenuItem>
                    <MenuItem value="counseling">Counseling</MenuItem>
                    <MenuItem value="mediation">Mediation</MenuItem>
                    <MenuItem value="prayer">Prayer</MenuItem>
                    <MenuItem value="discipline">Discipline</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === actionForm.responsible_party) || null}
                  onChange={(event, newValue) => {
                    setActionForm(prev => ({
                      ...prev,
                      responsible_party: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Responsible Party" placeholder="Select responsible person..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Action Description"
                  value={actionForm.action_description}
                  onChange={(e) => setActionForm(prev => ({ ...prev, action_description: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={actionForm.notes}
                  onChange={(e) => setActionForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAction} variant="contained">
              Record Action
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
      </Box>
    </LocalizationProvider>
  );
};

export default ConflictManagement;