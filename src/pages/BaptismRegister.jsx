import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
  Add, Edit, Delete, Church, Person, WaterDrop, CheckCircle,
  Schedule, ExpandMore, Save, People, Assessment, Celebration, Phone, WhatsApp
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const BaptismRegister = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [candidates, setCandidates] = useState([]);
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Derive unique candidate list: one entry per person (member or visitor) showing the most progressed state.
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
        // Prefer one with counseling completed, then foundation class completed, then earlier preferred_date
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
  const [candidateDialogOpen, setCandidateDialogOpen] = useState(false);
  const [baptismDialogOpen, setBaptismDialogOpen] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // Form states
  const [candidateForm, setCandidateForm] = useState({
    member_id: null,
    visitor_id: null,
    first_name: '',
    surname: '',
    contact_primary: '',
    email: '',
    age: '',
    address: '',
    baptism_type: 'water',
    preferred_date: null,
    sponsor_1_id: null,
    sponsor_1_name: '',
    sponsor_2_id: null,
    sponsor_2_name: '',
    counseling_completed: false,
    counseling_date: null,
    counselor_id: null,
    foundation_class_completed: false,
    salvation_testimony: '',
    faith_journey: '',
    baptized_elsewhere: false,
    previous_church: '',
    preparation_notes: '',
    special_requests: ''
  });

  const [baptismForm, setBaptismForm] = useState({
    baptism_date: new Date(),
    baptism_time: null,
    location: '',
    location_id: null,
    officiator_id: null,
    baptism_method: 'immersion',
    water_temperature: '',
    weather_conditions: '',
    witnesses: [],
    photographer_id: null,
    scripture_reading: '',
    prayer_offered: '',
    special_music: '',
    ceremony_notes: '',
    certificate_issued: false,
    certificate_number: ''
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [candidatesRes, recordsRes, membersRes, visitorsRes, statsRes] = await Promise.all([
        fetchWithAuth('/api/baptisms/candidates'),
        fetchWithAuth('/api/baptisms/records'),
        fetchWithAuth('/api/members?limit=1000'),
        fetchWithAuth('/api/visitors?limit=1000'),
        fetchWithAuth('/api/baptisms/stats/overview')
      ]);

      const candidatesData = candidatesRes.ok ? await candidatesRes.json() : [];
      const recordsData = recordsRes.ok ? await recordsRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const visitorsData = visitorsRes.ok ? await visitorsRes.json() : [];
      const statsData = statsRes.ok ? await statsRes.json() : null;

      setCandidates(candidatesData);
      setRecords(recordsData);
      setMembers(membersData);
      setVisitors(visitorsData);
      setStats(statsData);

    } catch (err) {
      console.error('Failed to load baptism data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCandidate = async () => {
    try {
      const response = await fetchWithAuth('/api/baptisms/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateForm)
      });

      if (!response.ok) throw new Error('Failed to create candidate');

      setCandidateDialogOpen(false);
      setCandidateForm({
        member_id: null, visitor_id: null, first_name: '', surname: '', contact_primary: '',
        email: '', age: '', address: '', baptism_type: 'water', preferred_date: null,
        sponsor_1_id: null, sponsor_1_name: '', sponsor_2_id: null, sponsor_2_name: '',
        counseling_completed: false, counseling_date: null, counselor_id: null,
        foundation_class_completed: false, salvation_testimony: '', faith_journey: '',
        baptized_elsewhere: false, previous_church: '', preparation_notes: '', special_requests: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Baptism candidate added successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create candidate:', err);
      setSnackbar({ open: true, message: 'Failed to add candidate', severity: 'error' });
    }
  };

  const handlePerformBaptism = async () => {
    if (!selectedCandidate) return;

    try {
      const response = await fetchWithAuth(`/api/baptisms/candidates/${selectedCandidate.id}/perform`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(baptismForm)
      });

      if (!response.ok) throw new Error('Failed to perform baptism');

      setBaptismDialogOpen(false);
      setSelectedCandidate(null);
      setBaptismForm({
        baptism_date: new Date(), baptism_time: null, location: '', location_id: null, officiator_id: null,
        baptism_method: 'immersion', water_temperature: '', weather_conditions: '',
        witnesses: [], photographer_id: null, scripture_reading: '', prayer_offered: '',
        special_music: '', ceremony_notes: '', certificate_issued: false, certificate_number: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Baptism performed successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to perform baptism:', err);
      setSnackbar({ open: true, message: 'Failed to perform baptism', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      preparing: 'warning',
      ready: 'info',
      scheduled: 'primary',
      completed: 'success',
      deferred: 'error'
    };
    return colors[status] || 'default';
  };

  const getReadinessIndicators = (candidate) => {
    const indicators = [];
    if (candidate.counseling_completed) indicators.push('Counseling ✓');
    if (candidate.foundation_class_completed) indicators.push('Foundation Class ✓');
    if (candidate.salvation_testimony) indicators.push('Testimony ✓');
    return indicators;
  };

  // Normalize phone: strip non-digits for tel: and WhatsApp use
  const normalizePhone = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '');
  };

  if (loading && candidates.length === 0) {
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
          Baptism Register
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Track baptism candidates, preparation, and ceremony records
        </Typography>
        <Typography variant="body2" color="text.secondary">
          💡 <strong>Member Integration:</strong> When church members are baptized, their member records are automatically updated with baptism details.
        </Typography>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {stats.total_candidates}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Candidates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {stats.baptized}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Baptized
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {stats.preparing}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Preparing
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {stats.ready}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready
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
            startIcon={<Add />}
            onClick={() => setCandidateDialogOpen(true)}
          >
            Add Baptism Candidate
          </Button>
          <Button
            variant="outlined"
            startIcon={<WaterDrop />}
            onClick={() => setBaptismDialogOpen(true)}
          >
            Perform Baptism
          </Button>
          <Button
            variant="outlined"
            startIcon={<Person />}
            onClick={() => setMemberDialogOpen(true)}
          >
            Add from Members
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Candidates" />
            <Tab label="Baptism Records" />
            <Tab label="Preparation Tracker" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {uniqueCandidates.map((candidate) => (
              <Grid item xs={12} md={6} lg={4} key={candidate.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {candidate.first_name} {candidate.surname}
                          {candidate.member_first_name && (
                            <Chip label="Church Member" size="small" color="primary" sx={{ ml: 1 }} />
                          )}
                          {candidate.visitor_first_name && (
                            <Chip label="Cell Visitor" size="small" color="info" sx={{ ml: 1 }} />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {candidate.age && `${candidate.age} years old`}
                          {(() => {
                            const phone = candidate.contact_primary || candidate.member_contact_primary || candidate.visitor_contact_primary;
                            return phone ? ` • ${phone}` : '';
                          })()}
                        </Typography>
                      </Box>
                      <Chip
                        label={candidate.status}
                        color={getStatusColor(candidate.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Type:</strong> {candidate.baptism_type} baptism
                    </Typography>

                    {getReadinessIndicators(candidate).length > 0 && (
                      <Box mb={1}>
                        {getReadinessIndicators(candidate).map((indicator, index) => (
                          <Chip key={index} label={indicator} size="small" color="success" sx={{ mr: 0.5, mb: 0.5 }} />
                        ))}
                      </Box>
                    )}

                    {candidate.counselor_first_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Counselor:</strong> {candidate.counselor_first_name} {candidate.counselor_surname}
                      </Typography>
                    )}

                    {(candidate.sponsor_1_name || candidate.sponsor_1_first_name) && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Sponsor:</strong> {candidate.sponsor_1_name || `${candidate.sponsor_1_first_name} ${candidate.sponsor_1_surname}`}
                      </Typography>
                    )}

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Edit
                      </Button>
                      {candidate.status === 'ready' && (
                        <Button size="small" startIcon={<WaterDrop />} color="primary">
                          Schedule Baptism
                        </Button>
                      )}
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
              Baptism Records
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Officiator</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Certificate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {record.first_name} {record.surname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {record.contact_primary || record.member_contact_primary || record.visitor_contact_primary || 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {new Date(record.baptism_date).toLocaleDateString()}
                        {record.baptism_time && ` ${record.baptism_time}`}
                      </TableCell>
                      <TableCell>
                        {record.officiator_first_name} {record.officiator_surname}
                      </TableCell>
                      <TableCell>{record.baptism_method}</TableCell>
                      <TableCell>{record.location}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption">
                            {record.contact_primary || record.member_contact_primary || record.visitor_contact_primary || 'N/A'}
                          </Typography>
                          { (record.contact_primary || record.member_contact_primary || record.visitor_contact_primary) && (
                            <>
                              {(() => {
                                const phone = normalizePhone(record.contact_primary || record.member_contact_primary || record.visitor_contact_primary);
                                return (
                                  <>
                                    <Tooltip title="Call">
                                      <a href={`tel:${phone}`} style={{ color: 'inherit' }}>
                                        <IconButton size="small"><Phone fontSize="small" /></IconButton>
                                      </a>
                                    </Tooltip>
                                    <Tooltip title="WhatsApp">
                                      <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                                        <IconButton size="small"><WhatsApp fontSize="small" /></IconButton>
                                      </a>
                                    </Tooltip>
                                  </>
                                );
                              })()}
                            </>
                          )}
                        </Box>
                      </TableCell>

                      <TableCell>
                        {record.certificate_issued ? (
                          <Chip label="Issued" color="success" size="small" />
                        ) : (
                          <Chip label="Pending" color="warning" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Baptism Preparation Tracker
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Track candidates' progress through baptism preparation requirements
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>📚 Required Preparation</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Personal counseling session completed" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Foundation class completed" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Salvation testimony prepared" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Sponsors/godparents identified" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>⏰ Timeline</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Initial inquiry and registration" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Counseling and preparation (2-4 weeks)" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Foundation class completion" />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Baptism ceremony scheduling" />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box mt={3}>
              <Typography variant="h6" gutterBottom>
                Candidates by Preparation Status
              </Typography>
              {['preparing', 'ready', 'scheduled'].map((status) => {
                const statusCandidates = uniqueCandidates.filter(c => c.status === status);
                return (
                  <Accordion key={status} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        {status.replace('_', ' ').toUpperCase()} ({statusCandidates.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {statusCandidates.map((candidate) => (
                          <ListItem key={candidate.id}>
                            <ListItemText
                              primary={`${candidate.first_name} ${candidate.surname}`}
                              secondary={`Readiness: ${getReadinessIndicators(candidate).join(', ') || 'None'}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Add from Members Dialog */}
        <Dialog
          open={memberDialogOpen}
          onClose={() => setMemberDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add Baptism Candidate from Church Members</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members.filter(m => !m.date_baptized_immersion)}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                  }
                  value={selectedMember}
                  onChange={(event, newValue) => setSelectedMember(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Church Member" placeholder="Search unbaptized members..." fullWidth />
                  )}
                />
              </Grid>

              {selectedMember && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Selected: {selectedMember.first_name} {selectedMember.surname} (Member since: {new Date(selectedMember.date_joined_church).toLocaleDateString()})
                    </Alert>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Preferred Baptism Date"
                      type="date"
                      value={candidateForm.preferred_date ? candidateForm.preferred_date.toISOString().split('T')[0] : ''}
                      onChange={(e) => setCandidateForm(prev => ({ ...prev, preferred_date: e.target.value ? new Date(e.target.value) : null }))}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={members}
                      getOptionLabel={(option) =>
                        `${option.first_name} ${option.surname}`
                      }
                      value={members.find(m => m.id === candidateForm.counselor_id) || null}
                      onChange={(event, newValue) => {
                        setCandidateForm(prev => ({
                          ...prev,
                          counselor_id: newValue ? newValue.id : ''
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Counselor (Optional)" placeholder="Search member..." fullWidth />
                      )}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (selectedMember) {
                  setCandidateForm(prev => ({
                    ...prev,
                    member_id: selectedMember.id,
                    first_name: selectedMember.first_name,
                    surname: selectedMember.surname,
                    contact_primary: selectedMember.contact_primary,
                    email: selectedMember.email,
                    age: selectedMember.date_of_birth ?
                      new Date().getFullYear() - new Date(selectedMember.date_of_birth).getFullYear() : ''
                  }));
                  setCandidateDialogOpen(true);
                  setMemberDialogOpen(false);
                  setSelectedMember(null);
                }
              }}
              variant="contained"
              disabled={!selectedMember}
            >
              Continue to Candidate Form
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Candidate Dialog */}
        <Dialog
          open={candidateDialogOpen}
          onClose={() => setCandidateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add Baptism Candidate</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                  }
                  value={members.find(m => m.id === candidateForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setCandidateForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : null,
                      first_name: newValue ? newValue.first_name : prev.first_name,
                      surname: newValue ? newValue.surname : prev.surname,
                      contact_primary: newValue ? newValue.contact_primary : prev.contact_primary
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Church Member (Optional)" placeholder="Search member..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={visitors}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                  }
                  value={visitors.find(v => v.id === candidateForm.visitor_id) || null}
                  onChange={(event, newValue) => {
                    setCandidateForm(prev => ({
                      ...prev,
                      visitor_id: newValue ? newValue.id : null,
                      first_name: newValue ? newValue.first_name : prev.first_name,
                      surname: newValue ? newValue.surname : prev.surname,
                      contact_primary: newValue ? newValue.contact_primary : prev.contact_primary
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Cell Visitor (Optional)" placeholder="Search visitor..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={candidateForm.first_name}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, first_name: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Surname"
                  value={candidateForm.surname}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, surname: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Contact Number"
                  value={candidateForm.contact_primary}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, contact_primary: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Age"
                  value={candidateForm.age}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, age: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Baptism Type</InputLabel>
                  <Select
                    value={candidateForm.baptism_type}
                    label="Baptism Type"
                    onChange={(e) => setCandidateForm(prev => ({ ...prev, baptism_type: e.target.value }))}
                  >
                    <MenuItem value="water">Water Baptism</MenuItem>
                    <MenuItem value="spirit">Spirit Baptism</MenuItem>
                    <MenuItem value="believer">Believer Baptism</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Preferred Baptism Date"
                  value={candidateForm.preferred_date}
                  onChange={(date) => setCandidateForm(prev => ({ ...prev, preferred_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === candidateForm.sponsor_1_id) || null}
                  onChange={(event, newValue) => {
                    setCandidateForm(prev => ({
                      ...prev,
                      sponsor_1_id: newValue ? newValue.id : null,
                      sponsor_1_name: newValue ? '' : prev.sponsor_1_name
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Primary Sponsor" placeholder="Search member..." fullWidth />
                  )}
                />
              </Grid>

              {!candidateForm.sponsor_1_id && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Primary Sponsor Name"
                    value={candidateForm.sponsor_1_name}
                    onChange={(e) => setCandidateForm(prev => ({ ...prev, sponsor_1_name: e.target.value }))}
                  />
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === candidateForm.counselor_id) || null}
                  onChange={(event, newValue) => {
                    setCandidateForm(prev => ({
                      ...prev,
                      counselor_id: newValue ? newValue.id : null
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Counselor" placeholder="Search member..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={candidateForm.counseling_completed}
                      onChange={(e) => setCandidateForm(prev => ({ ...prev, counseling_completed: e.target.checked }))}
                    />
                  }
                  label="Counseling completed"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={candidateForm.foundation_class_completed}
                      onChange={(e) => setCandidateForm(prev => ({ ...prev, foundation_class_completed: e.target.checked }))}
                    />
                  }
                  label="Foundation class completed"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Salvation Testimony"
                  value={candidateForm.salvation_testimony}
                  onChange={(e) => setCandidateForm(prev => ({ ...prev, salvation_testimony: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCandidateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCandidate} variant="contained">
              Add Candidate
            </Button>
          </DialogActions>
        </Dialog>

        {/* Perform Baptism Dialog */}
        <Dialog
          open={baptismDialogOpen}
          onClose={() => setBaptismDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Perform Baptism</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={uniqueCandidates.filter(c => c.status === 'ready' || c.status === 'scheduled')}
                  getOptionLabel={(option) => {
                    const phone = option.contact_primary || option.member_contact_primary || option.visitor_contact_primary || '';
                    return `${option.first_name} ${option.surname}${phone ? ` (${phone})` : ''}`;
                  }}
                  value={selectedCandidate}
                  onChange={(event, newValue) => setSelectedCandidate(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Candidate" placeholder="Search ready candidates..." fullWidth required />
                  )}
                />
              </Grid>

              {selectedCandidate && (
                <>
                  <Grid item xs={12}>
                    <Alert severity="info">
                      Performing baptism for: {selectedCandidate.first_name} {selectedCandidate.surname}
                    </Alert>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="Baptism Date"
                      value={baptismForm.baptism_date}
                      onChange={(date) => setBaptismForm(prev => ({ ...prev, baptism_date: date }))}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TimePicker
                      label="Baptism Time"
                      value={baptismForm.baptism_time}
                      onChange={(time) => setBaptismForm(prev => ({ ...prev, baptism_time: time }))}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Location"
                      value={baptismForm.location}
                      onChange={(e) => setBaptismForm(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Autocomplete
                      options={members}
                      getOptionLabel={(option) =>
                        `${option.first_name} ${option.surname}`
                      }
                      value={members.find(m => m.id === baptismForm.officiator_id) || null}
                      onChange={(event, newValue) => {
                        setBaptismForm(prev => ({
                          ...prev,
                          officiator_id: newValue ? newValue.id : null
                        }));
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Officiator" placeholder="Search member..." fullWidth />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Baptism Method</InputLabel>
                      <Select
                        value={baptismForm.baptism_method}
                        label="Baptism Method"
                        onChange={(e) => setBaptismForm(prev => ({ ...prev, baptism_method: e.target.value }))}
                      >
                        <MenuItem value="immersion">Immersion</MenuItem>
                        <MenuItem value="sprinkling">Sprinkling</MenuItem>
                        <MenuItem value="pouring">Pouring</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Water Temperature"
                      value={baptismForm.water_temperature}
                      onChange={(e) => setBaptismForm(prev => ({ ...prev, water_temperature: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Ceremony Notes"
                      value={baptismForm.ceremony_notes}
                      onChange={(e) => setBaptismForm(prev => ({ ...prev, ceremony_notes: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={baptismForm.certificate_issued}
                          onChange={(e) => setBaptismForm(prev => ({ ...prev, certificate_issued: e.target.checked }))}
                        />
                      }
                      label="Certificate issued"
                    />
                  </Grid>

                  {baptismForm.certificate_issued && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Certificate Number"
                        value={baptismForm.certificate_number}
                        onChange={(e) => setBaptismForm(prev => ({ ...prev, certificate_number: e.target.value }))}
                      />
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBaptismDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePerformBaptism} variant="contained" disabled={!selectedCandidate}>
              Perform Baptism
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

export default BaptismRegister;