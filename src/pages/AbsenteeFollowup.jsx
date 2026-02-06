import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Alert, CircularProgress, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, TextField, Tabs, Tab, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, Avatar, Badge
} from '@mui/material';
import {
  PersonAdd, Assignment, Schedule, CheckCircle,
  Phone, WhatsApp, Home, Message, Warning,
  Refresh, FilterList, Add, Edit, Delete, AutoFixHigh
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import GenerateAbsenteeFollowups from '../components/GenerateAbsenteeFollowups';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AbsenteeFollowup = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [followups, setFollowups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    status: '',
    priority_level: '',
    assigned_to: '',
    overdue_only: false
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [followupsRes, statsRes] = await Promise.all([
        fetchWithAuth(`/api/absentee-followups?${new URLSearchParams(filters)}`),
        fetchWithAuth('/api/absentee-followups/stats/overview')
      ]);

      const followupsData = await followupsRes.json();
      const statsData = await statsRes.json();

      setFollowups(followupsData.followups || []);
      setStats(statsData.stats);
    } catch (err) {
      setError('Failed to load absentee follow-up data');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);

    // Update filters based on tab
    const newFilters = { ...filters };
    switch (newValue) {
      case 0: // All
        newFilters.status = '';
        newFilters.overdue_only = false;
        break;
      case 1: // Pending
        newFilters.status = 'pending';
        newFilters.overdue_only = false;
        break;
      case 2: // Overdue
        newFilters.status = '';
        newFilters.overdue_only = true;
        break;
      case 3: // Resolved
        newFilters.status = 'resolved';
        newFilters.overdue_only = false;
        break;
    }
    setFilters(newFilters);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'contacted': return 'info';
      case 'resolved': return 'success';
      case 'escalated': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date();
  };

  const handleAssign = async (followupId, assigneeId) => {
    try {
      const response = await fetchWithAuth(`/api/absentee-followups/${followupId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assigneeId })
      });

      if (response.ok) {
        setSuccess('Follow-up assigned successfully');
        loadData();
      } else {
        throw new Error('Failed to assign follow-up');
      }
    } catch (err) {
      setError('Failed to assign follow-up');
      console.error('Assign error:', err);
    }
  };

  const handleContactAttempt = (followup) => {
    setSelectedFollowup(followup);
    setContactDialogOpen(true);
  };

  const submitContactAttempt = async (attemptData) => {
    try {
      const response = await fetchWithAuth(`/api/absentee-followups/${selectedFollowup.id}/contact-attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attemptData)
      });

      if (response.ok) {
        setSuccess('Contact attempt recorded successfully');
        setContactDialogOpen(false);
        setSelectedFollowup(null);
        loadData();
      } else {
        throw new Error('Failed to record contact attempt');
      }
    } catch (err) {
      setError('Failed to record contact attempt');
      console.error('Contact attempt error:', err);
    }
  };

  const handleResolve = async (followupId, resolutionData) => {
    try {
      const response = await fetchWithAuth(`/api/absentee-followups/${followupId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resolutionData)
      });

      if (response.ok) {
        setSuccess('Follow-up resolved successfully');
        loadData();
      } else {
        throw new Error('Failed to resolve follow-up');
      }
    } catch (err) {
      setError('Failed to resolve follow-up');
      console.error('Resolve error:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Absentee Follow-up Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track and manage follow-ups for absent church members
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <GenerateAbsenteeFollowups
              onSuccess={() => {
                setSuccess('Follow-ups generated successfully');
                loadData();
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => {/* Open filter dialog */}}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadData}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <CheckCircle sx={{ mr: 1 }} />
            {success}
          </Alert>
        )}

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {stats.pending}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Follow-ups
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {stats.contacted}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contacted
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {stats.resolved}
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
                  <Typography variant="h6" color="error.main">
                    {stats.overdue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overdue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
            <Tab label={`All (${followups.length})`} />
            <Tab label={`Pending (${stats?.pending || 0})`} />
            <Tab label={`Overdue (${stats?.overdue || 0})`} />
            <Tab label={`Resolved (${stats?.resolved || 0})`} />
          </Tabs>
        </Paper>

        {/* Follow-ups Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Member</TableCell>
                <TableCell>Consecutive Absences</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {followups.map((followup) => (
                <TableRow key={followup.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {followup.first_name?.[0]}{followup.surname?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {followup.first_name} {followup.surname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {followup.cell_group_name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Badge badgeContent={followup.consecutive_absences} color="error">
                      <Typography>{followup.consecutive_absences}</Typography>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={followup.priority_level}
                      color={getPriorityColor(followup.priority_level)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={followup.status}
                      color={getStatusColor(followup.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {followup.assignee_first_name ? (
                      <Typography variant="body2">
                        {followup.assignee_first_name} {followup.assignee_surname}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={isOverdue(followup.due_date) ? 'error' : 'text.primary'}
                    >
                      {formatDate(followup.due_date)}
                      {isOverdue(followup.due_date) && (
                        <Warning sx={{ ml: 1, fontSize: 16 }} />
                      )}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Record Contact">
                        <IconButton
                          size="small"
                          onClick={() => handleContactAttempt(followup)}
                          color="primary"
                        >
                          <Phone />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Assign">
                        <IconButton size="small" color="secondary">
                          <Assignment />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Resolve">
                        <IconButton size="small" color="success">
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Contact Attempt Dialog */}
        <Dialog
          open={contactDialogOpen}
          onClose={() => setContactDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Record Contact Attempt</DialogTitle>
          <DialogContent>
            {selectedFollowup && (
              <Box mt={2}>
                <Typography variant="h6" gutterBottom>
                  Contacting: {selectedFollowup.first_name} {selectedFollowup.surname}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedFollowup.consecutive_absences} consecutive absences
                </Typography>

                <ContactAttemptForm
                  followup={selectedFollowup}
                  onSubmit={submitContactAttempt}
                  onCancel={() => setContactDialogOpen(false)}
                />
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

// Contact Attempt Form Component
const ContactAttemptForm = ({ followup, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    contact_method: '',
    contact_success: false,
    response_received: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel>Contact Method</InputLabel>
            <Select
              value={formData.contact_method}
              onChange={(e) => handleChange('contact_method', e.target.value)}
            >
              <MenuItem value="phone">Phone Call</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
              <MenuItem value="visit">Home Visit</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
              <MenuItem value="email">Email</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Contact Success</InputLabel>
            <Select
              value={formData.contact_success}
              onChange={(e) => handleChange('contact_success', e.target.value)}
            >
              <MenuItem value={true}>Successful Contact</MenuItem>
              <MenuItem value={false}>No Contact Made</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Response Received"
            value={formData.response_received}
            onChange={(e) => handleChange('response_received', e.target.value)}
            placeholder="What did the member say? Any concerns or needs identified?"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional details about the contact attempt"
          />
        </Grid>
      </Grid>

      <DialogActions sx={{ mt: 3 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="contained">
          Record Contact Attempt
        </Button>
      </DialogActions>
    </form>
  );
};

export default AbsenteeFollowup;