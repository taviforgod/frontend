import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, List, ListItem, ListItemText, ListItemSecondaryAction,
  Divider, Stepper, Step, StepLabel, LinearProgress
} from '@mui/material';
import {
  Add, Edit, Delete, PlayArrow, CheckCircle, Schedule, Group,
  LibraryBooks, ExpandMore, Save, Cancel, PersonAdd, Assignment
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const MeetingAgendas = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [templates, setTemplates] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [cellGroups, setCellGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [bibleTeachings, setBibleTeachings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [agendaDialogOpen, setAgendaDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedAgenda, setSelectedAgenda] = useState(null);

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    meeting_type: 'bible_study',
    estimated_duration: 90,
    sections: []
  });

  const [agendaForm, setAgendaForm] = useState({
    template_id: '',
    cell_group_id: '',
    title: '',
    meeting_date: new Date(),
    start_time: null,
    end_time: null,
    bible_teaching_id: '',
    facilitator_id: '',
    worship_leader_id: ''
  });

  const [generateForm, setGenerateForm] = useState({
    template_id: '',
    cell_group_id: '',
    week_start_date: new Date(),
    meeting_date: new Date()
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [templatesRes, agendasRes, cellGroupsRes, membersRes, teachingsRes] = await Promise.all([
        fetchWithAuth('/api/meeting-agendas/templates'),
        fetchWithAuth('/api/meeting-agendas/agendas'),
        fetchWithAuth('/api/cell-groups'),
        fetchWithAuth('/api/members?limit=1000'),
        fetchWithAuth('/api/bible-teaching-calendar?limit=50')
      ]);

      const templatesData = templatesRes.ok ? await templatesRes.json() : [];
      const agendasData = agendasRes.ok ? await agendasRes.json() : [];
      const cellGroupsData = cellGroupsRes.ok ? await cellGroupsRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const teachingsData = teachingsRes.ok ? await teachingsRes.json() : [];

      setTemplates(templatesData);
      setAgendas(agendasData);
      setCellGroups(cellGroupsData);
      setMembers(membersData);
      setBibleTeachings(teachingsData);

    } catch (err) {
      console.error('Failed to load meeting agenda data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTemplate = async () => {
    try {
      const response = await fetchWithAuth('/api/meeting-agendas/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      if (!response.ok) throw new Error('Failed to create template');

      setTemplateDialogOpen(false);
      setTemplateForm({
        name: '', description: '', meeting_type: 'bible_study', estimated_duration: 90, sections: []
      });
      loadData();
      setSnackbar({ open: true, message: 'Meeting template created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create template:', err);
      setSnackbar({ open: true, message: 'Failed to create template', severity: 'error' });
    }
  };

  const handleCreateAgenda = async () => {
    try {
      const response = await fetchWithAuth('/api/meeting-agendas/agendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agendaForm)
      });

      if (!response.ok) throw new Error('Failed to create agenda');

      setAgendaDialogOpen(false);
      setAgendaForm({
        template_id: '', cell_group_id: '', title: '', meeting_date: new Date(),
        start_time: null, end_time: null, bible_teaching_id: '', facilitator_id: '', worship_leader_id: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Meeting agenda created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create agenda:', err);
      setSnackbar({ open: true, message: 'Failed to create agenda', severity: 'error' });
    }
  };

  const handleGenerateFromTemplate = async () => {
    try {
      const response = await fetchWithAuth(`/api/meeting-agendas/templates/${generateForm.template_id}/generate-agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cell_group_id: generateForm.cell_group_id,
          meeting_date: generateForm.meeting_date
        })
      });

      if (!response.ok) throw new Error('Failed to generate agenda');

      setGenerateDialogOpen(false);
      setGenerateForm({
        template_id: '', cell_group_id: '', week_start_date: new Date(), meeting_date: new Date()
      });
      loadData();
      setSnackbar({ open: true, message: 'Agenda generated from template successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to generate agenda:', err);
      setSnackbar({ open: true, message: 'Failed to generate agenda', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'default',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const getMeetingTypeColor = (type) => {
    const colors = {
      bible_study: 'primary',
      prayer: 'info',
      fellowship: 'success',
      outreach: 'warning',
      leadership: 'secondary'
    };
    return colors[type] || 'default';
  };

  if (loading && templates.length === 0) {
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
          Meeting Agendas
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Automated agenda builder for cell meetings with Bible teaching integration
        </Typography>

        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setTemplateDialogOpen(true)}
          >
            Create Template
          </Button>
          <Button
            variant="outlined"
            startIcon={<Schedule />}
            onClick={() => setAgendaDialogOpen(true)}
          >
            Create Agenda
          </Button>
          <Button
            variant="outlined"
            startIcon={<LibraryBooks />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate from Template
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Meeting Templates" />
            <Tab label="Meeting Agendas" />
            <Tab label="Upcoming Meetings" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} lg={4} key={template.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {template.description}
                        </Typography>
                      </Box>
                      <Chip
                        label={template.meeting_type.replace('_', ' ')}
                        color={getMeetingTypeColor(template.meeting_type)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Duration:</strong> {template.estimated_duration} minutes
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Sections:</strong> {template.sections_count || 0}
                    </Typography>

                    {template.is_default && (
                      <Chip label="Default" color="primary" size="small" sx={{ mt: 1 }} />
                    )}

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Edit
                      </Button>
                      <Button size="small" color="error" startIcon={<Delete />}>
                        Delete
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            {agendas.map((agenda) => (
              <Grid item xs={12} md={6} key={agenda.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {agenda.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {agenda.cell_group_name} • {new Date(agenda.meeting_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Chip
                        label={agenda.status}
                        color={getStatusColor(agenda.status)}
                        size="small"
                      />
                    </Box>

                    {agenda.bible_teaching_title && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Bible Teaching:</strong> {agenda.bible_teaching_title}
                      </Typography>
                    )}

                    {agenda.facilitator_first_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Facilitator:</strong> {agenda.facilitator_first_name} {agenda.facilitator_surname}
                      </Typography>
                    )}

                    <Typography variant="body2" gutterBottom>
                      <strong>Participants:</strong> {agenda.participant_count || 0}
                    </Typography>

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<PlayArrow />}>
                        Start Meeting
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upcoming Meetings by Cell Group
            </Typography>
            {cellGroups.slice(0, 5).map((cellGroup) => (
              <Accordion key={cellGroup.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6">
                    {cellGroup.name} ({cellGroup.member_count || 0} members)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming meetings will be displayed here once scheduled.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}

        {/* Create Template Dialog */}
        <Dialog
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Meeting Template</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Meeting Type</InputLabel>
                  <Select
                    value={templateForm.meeting_type}
                    label="Meeting Type"
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, meeting_type: e.target.value }))}
                  >
                    <MenuItem value="bible_study">Bible Study</MenuItem>
                    <MenuItem value="prayer">Prayer Meeting</MenuItem>
                    <MenuItem value="fellowship">Fellowship</MenuItem>
                    <MenuItem value="outreach">Outreach Planning</MenuItem>
                    <MenuItem value="leadership">Leadership Meeting</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Duration (minutes)"
                  value={templateForm.estimated_duration}
                  onChange={(e) => setTemplateForm(prev => ({ ...prev, estimated_duration: parseInt(e.target.value) || 90 }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={templateForm.is_default || false}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, is_default: e.target.checked }))}
                    />
                  }
                  label="Set as Default Template"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplate} variant="contained">
              Create Template
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Agenda Dialog */}
        <Dialog
          open={agendaDialogOpen}
          onClose={() => setAgendaDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Meeting Agenda</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Agenda Title"
                  value={agendaForm.title}
                  onChange={(e) => setAgendaForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Cell Group</InputLabel>
                  <Select
                    value={agendaForm.cell_group_id}
                    label="Cell Group"
                    onChange={(e) => setAgendaForm(prev => ({ ...prev, cell_group_id: e.target.value }))}
                  >
                    {cellGroups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={agendaForm.template_id}
                    label="Template"
                    onChange={(e) => setAgendaForm(prev => ({ ...prev, template_id: e.target.value }))}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} ({template.meeting_type.replace('_', ' ')})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Meeting Date"
                  value={agendaForm.meeting_date}
                  onChange={(date) => setAgendaForm(prev => ({ ...prev, meeting_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={bibleTeachings}
                  getOptionLabel={(option) => option.title}
                  value={bibleTeachings.find(t => t.id === agendaForm.bible_teaching_id) || null}
                  onChange={(event, newValue) => {
                    setAgendaForm(prev => ({
                      ...prev,
                      bible_teaching_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Bible Teaching (Optional)" placeholder="Select teaching..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === agendaForm.facilitator_id) || null}
                  onChange={(event, newValue) => {
                    setAgendaForm(prev => ({
                      ...prev,
                      facilitator_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Facilitator" placeholder="Select facilitator..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === agendaForm.worship_leader_id) || null}
                  onChange={(event, newValue) => {
                    setAgendaForm(prev => ({
                      ...prev,
                      worship_leader_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Worship Leader (Optional)" placeholder="Select worship leader..." fullWidth />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAgendaDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAgenda} variant="contained">
              Create Agenda
            </Button>
          </DialogActions>
        </Dialog>

        {/* Generate from Template Dialog */}
        <Dialog
          open={generateDialogOpen}
          onClose={() => setGenerateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Generate Agenda from Template</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Template</InputLabel>
                  <Select
                    value={generateForm.template_id}
                    label="Template"
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, template_id: e.target.value }))}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name} ({template.meeting_type.replace('_', ' ')})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Cell Group</InputLabel>
                  <Select
                    value={generateForm.cell_group_id}
                    label="Cell Group"
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, cell_group_id: e.target.value }))}
                  >
                    {cellGroups.map((group) => (
                      <MenuItem key={group.id} value={group.id}>
                        {group.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <DatePicker
                  label="Meeting Date"
                  value={generateForm.meeting_date}
                  onChange={(date) => setGenerateForm(prev => ({ ...prev, meeting_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateFromTemplate} variant="contained">
              Generate Agenda
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

export default MeetingAgendas;