import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, List, ListItem, ListItemText, Avatar, Divider,
  LinearProgress
} from '@mui/material';
import {
  AttachMoney, Church, VolunteerActivism, RecordVoiceOver,
  CheckCircle, Pending, Publish, ExpandMore, Add, Edit,
  Assessment, TrendingUp, People, Favorite
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const GivingTestimony = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [givingRecords, setGivingRecords] = useState([]);
  const [testimonies, setTestimonies] = useState([]);
  const [members, setMembers] = useState([]);
  const [givingStats, setGivingStats] = useState(null);
  const [testimonyStats, setTestimonyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [givingDialogOpen, setGivingDialogOpen] = useState(false);
  const [testimonyDialogOpen, setTestimonyDialogOpen] = useState(false);

  // Form states
  const [givingForm, setGivingForm] = useState({
    member_id: '',
    giver_name: '',
    giving_type: 'tithe',
    amount: '',
    currency: 'USD',
    giving_date: new Date(),
    payment_method: 'cash',
    is_anonymous: false,
    purpose_description: ''
  });

  const [testimonyForm, setTestimonyForm] = useState({
    member_id: '',
    testifier_name: '',
    testimony_type: 'salvation',
    title: '',
    testimony_text: '',
    circumstance: '',
    how_god_intervened: '',
    life_impact: '',
    lessons_learned: '',
    testimony_date: new Date(),
    shared_in_service: false,
    shared_in_cell: false
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        givingRes,
        testimoniesRes,
        membersRes,
        givingStatsRes,
        testimonyStatsRes
      ] = await Promise.all([
        fetchWithAuth('/api/giving'),
        fetchWithAuth('/api/testimonies'),
        fetchWithAuth('/api/members?limit=1000'),
        fetchWithAuth('/api/giving/analytics/overview'),
        fetchWithAuth('/api/testimonies/stats/overview')
      ]);

      const givingData = givingRes.ok ? await givingRes.json() : [];
      const testimoniesData = testimoniesRes.ok ? await testimoniesRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const givingStatsData = givingStatsRes.ok ? await givingStatsRes.json() : null;
      const testimonyStatsData = testimonyStatsRes.ok ? await testimonyStatsRes.json() : null;

      setGivingRecords(givingData);
      setTestimonies(testimoniesData);
      setMembers(membersData);
      setGivingStats(givingStatsData);
      setTestimonyStats(testimonyStatsData);

    } catch (err) {
      console.error('Failed to load giving and testimony data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGivingRecord = async () => {
    try {
      const response = await fetchWithAuth('/api/giving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(givingForm)
      });

      if (!response.ok) throw new Error('Failed to create giving record');

      setGivingDialogOpen(false);
      setGivingForm({
        member_id: '', giver_name: '', giving_type: 'tithe', amount: '',
        currency: 'USD', giving_date: new Date(), payment_method: 'cash',
        is_anonymous: false, purpose_description: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Giving record created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create giving record:', err);
      setSnackbar({ open: true, message: 'Failed to create giving record', severity: 'error' });
    }
  };

  const handleCreateTestimony = async () => {
    try {
      const response = await fetchWithAuth('/api/testimonies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testimonyForm)
      });

      if (!response.ok) throw new Error('Failed to create testimony');

      setTestimonyDialogOpen(false);
      setTestimonyForm({
        member_id: '', testifier_name: '', testimony_type: 'salvation',
        title: '', testimony_text: '', circumstance: '', how_god_intervened: '',
        life_impact: '', lessons_learned: '', testimony_date: new Date(),
        shared_in_service: false, shared_in_cell: false
      });
      loadData();
      setSnackbar({ open: true, message: 'Testimony recorded successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create testimony:', err);
      setSnackbar({ open: true, message: 'Failed to record testimony', severity: 'error' });
    }
  };

  if (loading && givingRecords.length === 0 && testimonies.length === 0) {
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
          Giving & Testimony Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Record member giving and capture powerful testimonies of God's work
        </Typography>

        {/* Stats Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  ${typeof givingStats?.total_giving === 'number' ? givingStats.total_giving.toFixed(2) : '0.00'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Giving
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  {givingStats?.active_givers || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Givers
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="secondary.main">
                  {testimonyStats?.total_testimonies || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Testimonies
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {testimonyStats?.published_testimonies || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Published
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<AttachMoney />}
            onClick={() => setGivingDialogOpen(true)}
          >
            Record Giving
          </Button>
          <Button
            variant="outlined"
            startIcon={<RecordVoiceOver />}
            onClick={() => setTestimonyDialogOpen(true)}
          >
            Record Testimony
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Giving Records" />
            <Tab label="Testimonies" />
            <Tab label="Analytics" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {givingRecords.map((record) => (
              <Grid item xs={12} md={6} key={record.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          ${typeof record.amount === 'number' ? record.amount.toFixed(2) : '0.00'} - {record.giving_type.replace('_', ' ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {record.first_name && record.surname ?
                            `${record.first_name} ${record.surname}` :
                            record.giver_name || 'Anonymous'
                          }
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={record.payment_method.replace('_', ' ')}
                          size="small"
                          color="primary"
                        />
                        {record.is_anonymous && (
                          <Chip label="Anonymous" size="small" color="secondary" />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Date:</strong> {new Date(record.giving_date).toLocaleDateString()}
                    </Typography>

                    {record.purpose_description && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {record.purpose_description}
                      </Typography>
                    )}

                    <Typography variant="body2" gutterBottom>
                      <strong>Recorded by:</strong> {record.recorded_by_first_name} {record.recorded_by_surname}
                    </Typography>

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Update
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
            {testimonies.map((testimony) => (
              <Grid item xs={12} key={testimony.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {testimony.title || `Testimony by ${testimony.first_name || testimony.testifier_name}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {testimony.testimony_type.replace('_', ' ')} • {new Date(testimony.testimony_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        {testimony.is_approved && (
                          <Chip label="Approved" color="success" size="small" />
                        )}
                        {testimony.is_published && (
                          <Chip label="Published" color="primary" size="small" />
                        )}
                        {!testimony.is_approved && (
                          <Chip label="Pending" color="warning" size="small" />
                        )}
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                      "{testimony.testimony_text.length > 200 ?
                        testimony.testimony_text.substring(0, 200) + '...' :
                        testimony.testimony_text}"
                    </Typography>

                    <Box display="flex" gap={2} mb={2}>
                      {testimony.shared_in_service && (
                        <Chip label="Shared in Service" size="small" icon={<Church />} />
                      )}
                      {testimony.shared_in_cell && (
                        <Chip label="Shared in Cell" size="small" icon={<People />} />
                      )}
                    </Box>

                    <Box display="flex" gap={1}>
                      <Button size="small" startIcon={<Edit />}>
                        Update
                      </Button>
                      {!testimony.is_approved && (
                        <Button size="small" startIcon={<CheckCircle />} color="success">
                          Approve
                        </Button>
                      )}
                      {testimony.is_approved && !testimony.is_published && (
                        <Button size="small" startIcon={<Publish />} color="primary">
                          Publish
                        </Button>
                      )}
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
              Giving & Testimony Analytics
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>💰 Giving Breakdown</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Total Contributions: ${givingStats?.total_contributions || 0}`}
                          secondary={`Average: $${typeof givingStats?.average_gift === 'number' ? givingStats.average_gift.toFixed(2) : '0.00'}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Tithes: $${typeof givingStats?.tithe_total === 'number' ? givingStats.tithe_total.toFixed(2) : '0.00'}`}
                          secondary={`Offerings: $${typeof givingStats?.offering_total === 'number' ? givingStats.offering_total.toFixed(2) : '0.00'}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>📖 Testimony Insights</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Approval Rate: ${testimonyStats ? Math.round((testimonyStats.approved_testimonies / testimonyStats.total_testimonies) * 100) : 0}%`}
                          secondary={`${testimonyStats?.approved_testimonies || 0} of ${testimonyStats?.total_testimonies || 0} approved`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Unique Testifiers: ${testimonyStats?.unique_testifiers || 0}`}
                          secondary={`Average Length: ${testimonyStats?.avg_testimony_length ? Math.round(testimonyStats.avg_testimony_length) : 0} characters`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Follow-up Needed: ${testimonyStats?.needs_followup || 0}`}
                          secondary="Testimonies requiring pastoral follow-up"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Record Giving Dialog */}
        <Dialog
          open={givingDialogOpen}
          onClose={() => setGivingDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Record Giving</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === givingForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setGivingForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : '',
                      giver_name: newValue ? '' : prev.giver_name
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member (Optional)" placeholder="Select member or enter guest name..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guest Name (Optional)"
                  value={givingForm.giver_name}
                  onChange={(e) => setGivingForm(prev => ({ ...prev, giver_name: e.target.value }))}
                  disabled={!!givingForm.member_id}
                  placeholder="For non-members or anonymous giving"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Giving Type</InputLabel>
                  <Select
                    value={givingForm.giving_type}
                    label="Giving Type"
                    onChange={(e) => setGivingForm(prev => ({ ...prev, giving_type: e.target.value }))}
                  >
                    <MenuItem value="tithe">Tithe</MenuItem>
                    <MenuItem value="offering">General Offering</MenuItem>
                    <MenuItem value="special_offering">Special Offering</MenuItem>
                    <MenuItem value="building_fund">Building Fund</MenuItem>
                    <MenuItem value="mission_offering">Mission Offering</MenuItem>
                    <MenuItem value="benevolence">Benevolence</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Method</InputLabel>
                  <Select
                    value={givingForm.payment_method}
                    label="Payment Method"
                    onChange={(e) => setGivingForm(prev => ({ ...prev, payment_method: e.target.value }))}
                  >
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="check">Check</MenuItem>
                    <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                    <MenuItem value="online">Online Payment</MenuItem>
                    <MenuItem value="mobile_money">Mobile Money</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Amount"
                  value={givingForm.amount}
                  onChange={(e) => setGivingForm(prev => ({ ...prev, amount: e.target.value }))}
                  InputProps={{ startAdornment: '$' }}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Giving Date"
                  value={givingForm.giving_date}
                  onChange={(date) => setGivingForm(prev => ({ ...prev, giving_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Purpose/Description (Optional)"
                  value={givingForm.purpose_description}
                  onChange={(e) => setGivingForm(prev => ({ ...prev, purpose_description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={givingForm.is_anonymous}
                      onChange={(e) => setGivingForm(prev => ({ ...prev, is_anonymous: e.target.checked }))}
                    />
                  }
                  label="Anonymous giving (name will not be displayed in reports)"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGivingDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGivingRecord} variant="contained">
              Record Giving
            </Button>
          </DialogActions>
        </Dialog>

        {/* Record Testimony Dialog */}
        <Dialog
          open={testimonyDialogOpen}
          onClose={() => setTestimonyDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Record Testimony</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === testimonyForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setTestimonyForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : '',
                      testifier_name: newValue ? '' : prev.testifier_name
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member (Optional)" placeholder="Select member or enter guest name..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guest Name (Optional)"
                  value={testimonyForm.testifier_name}
                  onChange={(e) => setTestimonyForm(prev => ({ ...prev, testifier_name: e.target.value }))}
                  disabled={!!testimonyForm.member_id}
                  placeholder="For non-members sharing testimony"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Testimony Type</InputLabel>
                  <Select
                    value={testimonyForm.testimony_type}
                    label="Testimony Type"
                    onChange={(e) => setTestimonyForm(prev => ({ ...prev, testimony_type: e.target.value }))}
                  >
                    <MenuItem value="salvation">Salvation</MenuItem>
                    <MenuItem value="healing">Healing</MenuItem>
                    <MenuItem value="provision">Provision</MenuItem>
                    <MenuItem value="breakthrough">Breakthrough</MenuItem>
                    <MenuItem value="answered_prayer">Answered Prayer</MenuItem>
                    <MenuItem value="deliverance">Deliverance</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Testimony Date"
                  value={testimonyForm.testimony_date}
                  onChange={(date) => setTestimonyForm(prev => ({ ...prev, testimony_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Testimony Title (Optional)"
                  value={testimonyForm.title}
                  onChange={(e) => setTestimonyForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Testimony Text"
                  value={testimonyForm.testimony_text}
                  onChange={(e) => setTestimonyForm(prev => ({ ...prev, testimony_text: e.target.value }))}
                  required
                  placeholder="Share what God has done..."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="What led to this testimony? (Optional)"
                  value={testimonyForm.circumstance}
                  onChange={(e) => setTestimonyForm(prev => ({ ...prev, circumstance: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="How did God intervene? (Optional)"
                  value={testimonyForm.how_god_intervened}
                  onChange={(e) => setTestimonyForm(prev => ({ ...prev, how_god_intervened: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Life impact and lessons learned (Optional)"
                  value={testimonyForm.life_impact}
                  onChange={(e) => setTestimonyForm(prev => ({ ...prev, life_impact: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={testimonyForm.shared_in_service}
                      onChange={(e) => setTestimonyForm(prev => ({ ...prev, shared_in_service: e.target.checked }))}
                    />
                  }
                  label="Shared in church service"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={testimonyForm.shared_in_cell}
                      onChange={(e) => setTestimonyForm(prev => ({ ...prev, shared_in_cell: e.target.checked }))}
                    />
                  }
                  label="Shared in cell group"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTestimonyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTestimony} variant="contained">
              Record Testimony
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

export default GivingTestimony;