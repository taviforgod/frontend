import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
  Add, Edit, Delete, Event, Group, LocationOn, CalendarToday,
  CheckCircle, Schedule, ExpandMore, Save, People, Assessment
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const OutreachEvents = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [cellGroups, setCellGroups] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form states
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'evangelism',
    event_date: new Date(),
    start_time: null,
    end_time: null,
    location: '',
    address: '',
    target_audience: '',
    expected_attendance: '',
    objective: '',
    preparation_needed: '',
    materials_needed: '',
    estimated_budget: '',
    event_coordinator_id: '',
    team_members: []
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [eventsRes, membersRes, cellGroupsRes, statsRes] = await Promise.all([
        fetchWithAuth('/api/outreach-events'),
        fetchWithAuth('/api/members?limit=1000'),
        fetchWithAuth('/api/cell-groups'),
        fetchWithAuth('/api/outreach-events/summary/by-type')
      ]);

      const eventsData = eventsRes.ok ? await eventsRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const cellGroupsData = cellGroupsRes.ok ? await cellGroupsRes.json() : [];
      const statsData = statsRes.ok ? await statsRes.json() : [];

      setEvents(eventsData);
      setMembers(membersData);
      setCellGroups(cellGroupsData);
      setStats(statsData);

    } catch (err) {
      console.error('Failed to load outreach events data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateEvent = async () => {
    try {
      const response = await fetchWithAuth('/api/outreach-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventForm)
      });

      if (!response.ok) throw new Error('Failed to create event');

      setCreateDialogOpen(false);
      setEventForm({
        title: '', description: '', event_type: 'evangelism', event_date: new Date(),
        start_time: null, end_time: null, location: '', address: '', target_audience: '',
        expected_attendance: '', objective: '', preparation_needed: '', materials_needed: '',
        estimated_budget: '', event_coordinator_id: '', team_members: []
      });
      loadData();
      setSnackbar({ open: true, message: 'Outreach event created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create event:', err);
      setSnackbar({ open: true, message: 'Failed to create event', severity: 'error' });
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      evangelism: 'primary',
      community_service: 'success',
      outreach: 'warning',
      mission: 'info'
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      planned: 'default',
      confirmed: 'info',
      in_progress: 'warning',
      completed: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading && events.length === 0) {
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
          Outreach Events
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Plan and manage community outreach, evangelism, and service activities
        </Typography>

        {/* Stats Cards */}
        {stats.length > 0 && (
          <Grid container spacing={3} mb={3}>
            {stats.map((stat) => (
              <Grid item xs={12} sm={6} md={3} key={stat.event_type}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary.main">
                      {stat.total_events}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.event_type.replace('_', ' ')} Events
                    </Typography>
                    <Typography variant="caption" color="success.main">
                      {stat.completed_events} completed
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Plan New Event
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Events" />
            <Tab label="Upcoming Events" />
            <Tab label="Event Planning" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {events.map((event) => (
              <Grid item xs={12} md={6} key={event.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {event.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {event.description}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={event.event_type.replace('_', ' ')}
                          color={getEventTypeColor(event.event_type)}
                          size="small"
                        />
                        <Chip
                          label={event.status}
                          color={getStatusColor(event.status)}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>📅 Date:</strong> {new Date(event.event_date).toLocaleDateString()}
                      {event.start_time && ` at ${event.start_time}`}
                    </Typography>

                    {event.location && (
                      <Typography variant="body2" gutterBottom>
                        <strong>📍 Location:</strong> {event.location}
                      </Typography>
                    )}

                    {event.expected_attendance && (
                      <Typography variant="body2" gutterBottom>
                        <strong>👥 Expected:</strong> {event.expected_attendance} people
                      </Typography>
                    )}

                    {event.coordinator_first_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>👤 Coordinator:</strong> {event.coordinator_first_name} {event.coordinator_surname}
                      </Typography>
                    )}

                    <Typography variant="body2" gutterBottom>
                      <strong>👥 Team:</strong> {event.team_size || 0} members
                    </Typography>

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Edit
                      </Button>
                      <Button size="small" startIcon={<People />}>
                        Manage Team
                      </Button>
                      <Button size="small" startIcon={<Assessment />}>
                        Update Status
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
              Upcoming Outreach Events
            </Typography>
            {events
              .filter(event => new Date(event.event_date) >= new Date() && event.status !== 'cancelled')
              .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
              .map((event) => (
                <Card key={event.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{event.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(event.event_date).toLocaleDateString()}
                          {event.location && ` • ${event.location}`}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${event.expected_attendance || 0} expected`}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Event Planning Checklist
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Use this checklist to ensure all aspects of your outreach events are properly planned
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>📋 Planning Phase</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Define event objective and target audience" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Set date, time, and location" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Estimate budget and resources needed" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Assign event coordinator and team" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>🎯 Execution Phase</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Confirm all logistics and materials" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Communicate with team and participants" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Track attendance and engagement" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Follow up with contacts made" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Create Event Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Plan New Outreach Event</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Event Title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={eventForm.event_type}
                    label="Event Type"
                    onChange={(e) => setEventForm(prev => ({ ...prev, event_type: e.target.value }))}
                  >
                    <MenuItem value="evangelism">Evangelism</MenuItem>
                    <MenuItem value="community_service">Community Service</MenuItem>
                    <MenuItem value="outreach">General Outreach</MenuItem>
                    <MenuItem value="mission">Mission</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Event Date"
                  value={eventForm.event_date}
                  onChange={(date) => setEventForm(prev => ({ ...prev, event_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target Audience"
                  value={eventForm.target_audience}
                  onChange={(e) => setEventForm(prev => ({ ...prev, target_audience: e.target.value }))}
                  placeholder="Who is this event for? (families, youth, community, etc.)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Expected Attendance"
                  value={eventForm.expected_attendance}
                  onChange={(e) => setEventForm(prev => ({ ...prev, expected_attendance: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === eventForm.event_coordinator_id) || null}
                  onChange={(event, newValue) => {
                    setEventForm(prev => ({
                      ...prev,
                      event_coordinator_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Event Coordinator" placeholder="Select coordinator..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Event Objective"
                  value={eventForm.objective}
                  onChange={(e) => setEventForm(prev => ({ ...prev, objective: e.target.value }))}
                  placeholder="What do you hope to achieve?"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Preparation Needed"
                  value={eventForm.preparation_needed}
                  onChange={(e) => setEventForm(prev => ({ ...prev, preparation_needed: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Materials Needed"
                  value={eventForm.materials_needed}
                  onChange={(e) => setEventForm(prev => ({ ...prev, materials_needed: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Estimated Budget"
                  value={eventForm.estimated_budget}
                  onChange={(e) => setEventForm(prev => ({ ...prev, estimated_budget: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateEvent} variant="contained">
              Plan Event
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

export default OutreachEvents;