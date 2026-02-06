import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar
} from '@mui/material';
import {
  PersonAdd, ExpandMore, Church, Person, Group, School,
  CheckCircle, Schedule, Assignment
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const NewBelieverIntegration = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [journeys, setJourneys] = useState([]);
  const [members, setMembers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);

  // Form states
  const [journeyForm, setJourneyForm] = useState({
    visitor_id: '',
    member_id: '',
    is_ntyaba: false,
    first_visit_date: new Date(),
    how_heard_about_church: '',
    age_group: '',
    conversion_date: new Date(),
    conversion_notes: '',
    baptized: false,
    baptism_date: null,
    primary_mentor_id: '',
    salvation_testimony: '',
    prayer_requests: ''
  });

  const [convertForm, setConvertForm] = useState({
    is_ntyaba: false,
    conversion_date: new Date(),
    conversion_notes: '',
    baptized: false,
    baptism_date: null,
    primary_mentor_id: '',
    salvation_testimony: ''
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [journeysRes, membersRes, visitorsRes, statsRes] = await Promise.all([
        fetchWithAuth('/api/cell-visitors/journeys'),
        fetchWithAuth('/api/members?limit=1000'),
        fetchWithAuth('/api/visitors?limit=1000'),
        fetchWithAuth('/api/cell-visitors/stats')
      ]);

      const journeysData = journeysRes.ok ? await journeysRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const visitorsData = visitorsRes.ok ? await visitorsRes.json() : [];
      const statsData = statsRes.ok ? await statsRes.json() : null;

      setJourneys(journeysData);
      setMembers(membersData);
      setVisitors(visitorsData);
      setStats(statsData);

    } catch (err) {
      console.error('Failed to load new believer data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateJourney = async () => {
    try {
      const response = await fetchWithAuth('/api/cell-visitors/journeys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journeyForm)
      });

      if (!response.ok) throw new Error('Failed to create journey');

      setCreateDialogOpen(false);
      setJourneyForm({
        visitor_id: '', member_id: '', is_ntyaba: false, first_visit_date: new Date(),
        how_heard_about_church: '', age_group: '', conversion_date: new Date(),
        conversion_notes: '', baptized: false, baptism_date: null, primary_mentor_id: '',
        salvation_testimony: '', prayer_requests: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'New believer journey created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create journey:', err);
      setSnackbar({ open: true, message: 'Failed to create journey', severity: 'error' });
    }
  };

  const handleConvertVisitor = async () => {
    if (!selectedVisitor) return;

    try {
      const response = await fetchWithAuth(`/api/cell-visitors/convert-visitor/${selectedVisitor.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convertForm)
      });

      if (!response.ok) throw new Error('Failed to convert visitor');

      setConvertDialogOpen(false);
      setSelectedVisitor(null);
      setConvertForm({
        is_ntyaba: false, conversion_date: new Date(), conversion_notes: '',
        baptized: false, baptism_date: null, primary_mentor_id: '', salvation_testimony: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Visitor converted to new believer successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to convert visitor:', err);
      setSnackbar({ open: true, message: 'Failed to convert visitor', severity: 'error' });
    }
  };

  const getStageColor = (stage) => {
    const colors = {
      cell_visitor: 'default',
      church_attendee: 'primary',
      foundation_school: 'info',
      membership_class: 'warning',
      disciple: 'success',
      leader: 'secondary'
    };
    return colors[stage] || 'default';
  };

  if (loading && journeys.length === 0) {
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
          Cell Visitor Integration
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Track cell visitors' journey from cell meetings to church attendance and membership
        </Typography>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {stats.total_journeys}
                  </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cell Visitor Journeys
                </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {stats.new_believers}
                  </Typography>
                <Typography variant="body2" color="text.secondary">
                  Church Attendees
                </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {stats.baptized_count}
                  </Typography>
                <Typography variant="body2" color="text.secondary">
                  Baptized Members
                </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {stats.ntyaba_count}
                  </Typography>
                <Typography variant="body2" color="text.secondary">
                  NTYABA Visitors
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
            startIcon={<PersonAdd />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Add New Believer Journey
          </Button>
          <Button
            variant="outlined"
            startIcon={<Church />}
            onClick={() => setConvertDialogOpen(true)}
          >
            Convert Cell Visitor to Church Attendee
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="All Cell Visitor Journeys" />
            <Tab label="By Integration Stage" />
            <Tab label="NTYABA Tracking" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {journeys.map((journey) => (
              <Grid item xs={12} md={6} lg={4} key={journey.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Person />
                      <Box>
                        <Typography variant="h6">
                          {journey.visitor_first_name || journey.member_first_name}
                          {' '}
                          {journey.visitor_surname || journey.member_surname}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {journey.is_ntyaba && <Chip label="NTYABA" size="small" color="warning" sx={{ mr: 1 }} />}
                          <Chip
                            label={journey.current_stage === 'cell_visitor' ? 'Cell Visitor' :
                                   journey.current_stage === 'church_attendee' ? 'Church Attendee' :
                                   journey.current_stage?.replace('_', ' ')}
                            color={getStageColor(journey.current_stage)}
                            size="small"
                          />
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Conversion:</strong> {new Date(journey.conversion_date).toLocaleDateString()}
                    </Typography>

                    {journey.primary_mentor_first_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Mentor:</strong> {journey.primary_mentor_first_name} {journey.primary_mentor_surname}
                      </Typography>
                    )}

                    {journey.baptized && (
                      <Typography variant="body2" color="success.main">
                        ✓ Baptized {journey.baptism_date && `(${new Date(journey.baptism_date).toLocaleDateString()})`}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tabValue === 1 && (
          <Box>
            {['cell_visitor', 'church_attendee', 'foundation_school', 'membership_class', 'disciple', 'leader'].map((stage) => {
              const stageJourneys = journeys.filter(j => j.current_stage === stage);
              return (
                <Accordion key={stage} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {stage === 'cell_visitor' ? 'Cell Visitor' :
                     stage === 'church_attendee' ? 'Church Attendee' :
                     stage.replace('_', ' ')} ({stageJourneys.length})
                  </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {stageJourneys.map((journey) => (
                        <Grid item xs={12} sm={6} md={4} key={journey.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Typography variant="subtitle1">
                                {journey.visitor_first_name || journey.member_first_name} {journey.visitor_surname || journey.member_surname}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Started: {new Date(journey.created_at).toLocaleDateString()}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              NTYABA (New To Your Area By Accident) - Cell Visitors
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Cell visitors who attend meetings without being invited through normal evangelism outreach
            </Typography>
            <Grid container spacing={3}>
              {journeys.filter(j => j.is_ntyaba).map((journey) => (
                <Grid item xs={12} md={6} key={journey.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">
                        {journey.visitor_first_name || journey.member_first_name} {journey.visitor_surname || journey.member_surname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        First Cell Visit: {new Date(journey.first_visit_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Church Attendance Started:</strong> {new Date(journey.conversion_date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Current Stage:</strong> {journey.current_stage === 'cell_visitor' ? 'Cell Visitor' :
                                                       journey.current_stage === 'church_attendee' ? 'Church Attendee' :
                                                       journey.current_stage?.replace('_', ' ')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Create Journey Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Cell Visitor Journey</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={visitors}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                  }
                  value={visitors.find(v => v.id === journeyForm.visitor_id) || null}
                  onChange={(event, newValue) => {
                    setJourneyForm(prev => ({
                      ...prev,
                      visitor_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Visitor (Optional)" placeholder="Search visitor..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                  }
                  value={members.find(m => m.id === journeyForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setJourneyForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Existing Member (Optional)" placeholder="Search member..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={journeyForm.is_ntyaba}
                      onChange={(e) => setJourneyForm(prev => ({ ...prev, is_ntyaba: e.target.checked }))}
                    />
                  }
                  label="NTYABA (New To Your Area By Accident)"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="First Visit Date"
                  value={journeyForm.first_visit_date}
                  onChange={(date) => setJourneyForm(prev => ({ ...prev, first_visit_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="How heard about church"
                  value={journeyForm.how_heard_about_church}
                  onChange={(e) => setJourneyForm(prev => ({ ...prev, how_heard_about_church: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Age Group</InputLabel>
                  <Select
                    value={journeyForm.age_group}
                    label="Age Group"
                    onChange={(e) => setJourneyForm(prev => ({ ...prev, age_group: e.target.value }))}
                  >
                    <MenuItem value="under_18">Under 18</MenuItem>
                    <MenuItem value="18_25">18-25</MenuItem>
                    <MenuItem value="26_35">26-35</MenuItem>
                    <MenuItem value="36_50">36-50</MenuItem>
                    <MenuItem value="51_65">51-65</MenuItem>
                    <MenuItem value="over_65">Over 65</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Conversion Date"
                  value={journeyForm.conversion_date}
                  onChange={(date) => setJourneyForm(prev => ({ ...prev, conversion_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Conversion Notes"
                  value={journeyForm.conversion_notes}
                  onChange={(e) => setJourneyForm(prev => ({ ...prev, conversion_notes: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={journeyForm.baptized}
                      onChange={(e) => setJourneyForm(prev => ({ ...prev, baptized: e.target.checked }))}
                    />
                  }
                  label="Baptized"
                />
              </Grid>

              {journeyForm.baptized && (
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label="Baptism Date"
                    value={journeyForm.baptism_date}
                    onChange={(date) => setJourneyForm(prev => ({ ...prev, baptism_date: date }))}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                  }
                  value={members.find(m => m.id === journeyForm.primary_mentor_id) || null}
                  onChange={(event, newValue) => {
                    setJourneyForm(prev => ({
                      ...prev,
                      primary_mentor_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Primary Mentor" placeholder="Search mentor..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Salvation Testimony"
                  value={journeyForm.salvation_testimony}
                  onChange={(e) => setJourneyForm(prev => ({ ...prev, salvation_testimony: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Prayer Requests"
                  value={journeyForm.prayer_requests}
                  onChange={(e) => setJourneyForm(prev => ({ ...prev, prayer_requests: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateJourney} variant="contained">
              Create Journey
            </Button>
          </DialogActions>
        </Dialog>

        {/* Convert Visitor Dialog */}
        <Dialog
          open={convertDialogOpen}
          onClose={() => setConvertDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Convert Cell Visitor to Church Attendee</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={visitors.filter(v => !v.converted)}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                  }
                  value={selectedVisitor}
                  onChange={(event, newValue) => setSelectedVisitor(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Visitor" placeholder="Search unconverted visitors..." fullWidth />
                  )}
                />
              </Grid>

              {selectedVisitor && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Converting cell visitor: {selectedVisitor.first_name} {selectedVisitor.surname} (First cell visit: {new Date(selectedVisitor.date_of_first_visit).toLocaleDateString()})
                    </Alert>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={convertForm.is_ntyaba}
                          onChange={(e) => setConvertForm(prev => ({ ...prev, is_ntyaba: e.target.checked }))}
                        />
                      }
                      label="NTYABA (New To Your Area By Accident)"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Conversion Date"
                      value={convertForm.conversion_date}
                      onChange={(date) => setConvertForm(prev => ({ ...prev, conversion_date: date }))}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Conversion Notes"
                      value={convertForm.conversion_notes}
                      onChange={(e) => setConvertForm(prev => ({ ...prev, conversion_notes: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={convertForm.baptized}
                          onChange={(e) => setConvertForm(prev => ({ ...prev, baptized: e.target.checked }))}
                        />
                      }
                      label="Baptized"
                    />
                  </Grid>

                  {convertForm.baptized && (
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label="Baptism Date"
                        value={convertForm.baptism_date}
                        onChange={(date) => setConvertForm(prev => ({ ...prev, baptism_date: date }))}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                      />
                    </Grid>
                  )}

                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={members}
                      getOptionLabel={(option) =>
                        `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                      }
                      value={members.find(m => m.id === convertForm.primary_mentor_id) || null}
                      onChange={(event, newValue) => {
                        setConvertForm(prev => ({
                          ...prev,
                          primary_mentor_id: newValue ? newValue.id : ''
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Primary Mentor" placeholder="Search mentor..." fullWidth />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Salvation Testimony"
                      value={convertForm.salvation_testimony}
                      onChange={(e) => setConvertForm(prev => ({ ...prev, salvation_testimony: e.target.value }))}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConvertDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConvertVisitor}
              variant="contained"
              disabled={!selectedVisitor}
            >
              Convert to New Believer
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

export default NewBelieverIntegration;