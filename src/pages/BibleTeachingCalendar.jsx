import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Avatar, Alert, CircularProgress
} from '@mui/material';
import {
  Add, Edit, Delete, CalendarToday, Person, CheckCircle, Refresh
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext } from '../contexts/AuthContext';

const BibleTeachingCalendar = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [teachings, setTeachings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeaching, setEditingTeaching] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [teachingToDelete, setTeachingToDelete] = useState(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [teachingToComplete, setTeachingToComplete] = useState(null);
  const [completionData, setCompletionData] = useState({
    actual_date: null,
    attendance_count: '',
    feedback: ''
  });
  const [filters, setFilters] = useState({
    status: '',
    cell_group_id: ''
  });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Ensure we don't display duplicate teaching rows (defensive in case the API returns duplicates)
  const uniqueTeachings = useMemo(() => {
    const map = new Map();
    teachings.forEach((t) => {
      if (map.has(t.id)) {
        // Keep first occurrence; log for debugging
        // eslint-disable-next-line no-console
        console.warn('Duplicate teaching id detected:', t.id);
      } else {
        map.set(t.id, t);
      }
    });
    // Preserve ordering by planned_date (asc) as before
    return Array.from(map.values()).sort((a, b) => new Date(a.planned_date || 0) - new Date(b.planned_date || 0));
  }, [teachings]);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    scripture_reference: '',
    description: '',
    teaching_category: '',
    planned_date: null,
    cell_group_id: '',
    assigned_teacher: '',
    assistant_teacher: '',
    preparation_notes: '',
    materials_needed: '',
    key_points: '',
    status: 'planned'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load teachings
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.cell_group_id) queryParams.append('cell_group_id', filters.cell_group_id);

      const teachingsResponse = await fetchWithAuth(`/api/bible-teaching-calendar?${queryParams}`);
      const teachingsData = await teachingsResponse.json();
      setTeachings(teachingsData);

      // Load stats
      const statsResponse = await fetchWithAuth('/api/bible-teaching-calendar/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (teaching = null) => {
    if (teaching) {
      setEditingTeaching(teaching);
      setFormData({
        title: teaching.title || '',
        scripture_reference: teaching.scripture_reference || '',
        description: teaching.description || '',
        teaching_category: teaching.teaching_category || '',
        planned_date: teaching.planned_date ? new Date(teaching.planned_date) : null,
        cell_group_id: teaching.cell_group_id || '',
        assigned_teacher: teaching.assigned_teacher || '',
        assistant_teacher: teaching.assistant_teacher || '',
        preparation_notes: teaching.preparation_notes || '',
        materials_needed: teaching.materials_needed || '',
        key_points: teaching.key_points || '',
        status: teaching.status || 'planned'
      });
    } else {
      setEditingTeaching(null);
      setFormData({
        title: '',
        scripture_reference: '',
        description: '',
        teaching_category: '',
        planned_date: null,
        cell_group_id: '',
        assigned_teacher: '',
        assistant_teacher: '',
        preparation_notes: '',
        materials_needed: '',
        key_points: '',
        status: 'planned'
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTeaching(null);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        planned_date: formData.planned_date ? formData.planned_date.toISOString().split('T')[0] : null
      };

      if (editingTeaching) {
        await fetchWithAuth(`/api/bible-teaching-calendar/${editingTeaching.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      } else {
        await fetchWithAuth('/api/bible-teaching-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      handleCloseDialog();
      loadData();
    } catch (err) {
      console.error('Failed to save teaching:', err);
    }
  };

  const handleStatusUpdate = async (teachingId, newStatus) => {
    // If changing to completed, show completion dialog
    if (newStatus === 'completed') {
      const teaching = teachings.find(t => t.id === teachingId);
      if (teaching) {
        setTeachingToComplete(teaching);
        setCompletionData({
          actual_date: new Date().toISOString().split('T')[0], // Today by default
          attendance_count: teaching.attendance_count || '',
          feedback: teaching.feedback || ''
        });
        setCompletionDialogOpen(true);
      }
      return;
    }

    // For other status changes, update directly
    await updateTeachingStatus(teachingId, { status: newStatus });
  };

  const updateTeachingStatus = async (teachingId, data) => {
    try {
      await fetchWithAuth(`/api/bible-teaching-calendar/${teachingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Update local state immediately for better UX
      setTeachings(prev => prev.map(teaching =>
        teaching.id === teachingId
          ? { ...teaching, ...data }
          : teaching
      ));

      setSuccess('Status updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = (teaching) => {
    setTeachingToDelete(teaching);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!teachingToDelete) return;

    try {
      await fetchWithAuth(`/api/bible-teaching-calendar/${teachingToDelete.id}`, {
        method: 'DELETE'
      });
      loadData();
      setDeleteDialogOpen(false);
      setTeachingToDelete(null);
    } catch (err) {
      console.error('Failed to delete teaching:', err);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setTeachingToDelete(null);
  };

  const handleCompleteTeaching = async () => {
    if (!teachingToComplete) return;

    const data = {
      status: 'completed',
      actual_date: completionData.actual_date,
      attendance_count: completionData.attendance_count ? parseInt(completionData.attendance_count) : null,
      feedback: completionData.feedback || null
    };

    await updateTeachingStatus(teachingToComplete.id, data);

    setCompletionDialogOpen(false);
    setTeachingToComplete(null);
    setCompletionData({
      actual_date: null,
      attendance_count: '',
      feedback: ''
    });
  };


  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  if (loading && teachings.length === 0) {
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
              Bible Teaching Calendar
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Plan and track bible teachings for cell groups and church services
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Add Teaching
            </Button>
          </Box>
        </Box>

        {/* Statistics Cards */}
        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {stats.total_teachings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Teachings
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {stats.completed_teachings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {stats.planned_teachings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Planned
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {stats.upcoming_teachings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="planned">Planned</MenuItem>
                  <MenuItem value="prepared">Prepared</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Cell Group</InputLabel>
                <Select
                  value={filters.cell_group_id}
                  label="Cell Group"
                  onChange={(e) => setFilters(prev => ({ ...prev, cell_group_id: e.target.value }))}
                >
                  <MenuItem value="">All Groups</MenuItem>
                  {/* TODO: Load cell groups dynamically */}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

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

        {/* Teachings Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title & Scripture</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Cell Group</TableCell>
                <TableCell>Teacher</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uniqueTeachings.map((teaching) => (
                <TableRow key={teaching.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {teaching.title}
                      </Typography>
                      {teaching.scripture_reference && (
                        <Typography variant="caption" color="text.secondary">
                          {teaching.scripture_reference}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarToday fontSize="small" />
                      <Typography variant="body2">
                        {formatDate(teaching.planned_date)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {teaching.cell_group_name || 'All Groups'}
                  </TableCell>
                  <TableCell>
                    {teaching.teacher_first_name ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {teaching.teacher_first_name[0]}{teaching.teacher_surname?.[0]}
                        </Avatar>
                        <Typography variant="body2">
                          {teaching.teacher_first_name} {teaching.teacher_surname}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 100 }}>
                      <Select
                        value={teaching.status}
                        onChange={(e) => handleStatusUpdate(teaching.id, e.target.value)}
                        displayEmpty
                        sx={{
                          '& .MuiSelect-select': {
                            py: 0.5,
                            fontSize: '0.875rem'
                          }
                        }}
                      >
                        <MenuItem value="planned">Planned</MenuItem>
                        <MenuItem value="prepared">Prepared</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="cancelled">Cancelled</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenDialog(teaching)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDelete(teaching.id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Add Teaching Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingTeaching ? 'Edit Bible Teaching' : 'Add Bible Teaching'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Scripture Reference"
                  value={formData.scripture_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, scripture_reference: e.target.value }))}
                  placeholder="e.g., John 3:16"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.teaching_category}
                    label="Category"
                    onChange={(e) => setFormData(prev => ({ ...prev, teaching_category: e.target.value }))}
                  >
                    <MenuItem value="salvation">Salvation</MenuItem>
                    <MenuItem value="discipleship">Discipleship</MenuItem>
                    <MenuItem value="leadership">Leadership</MenuItem>
                    <MenuItem value="ministry">Ministry</MenuItem>
                    <MenuItem value="family">Family</MenuItem>
                    <MenuItem value="finance">Finance</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Planned Date"
                  value={formData.planned_date}
                  onChange={(date) => setFormData(prev => ({ ...prev, planned_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Cell Group</InputLabel>
                  <Select
                    value={formData.cell_group_id}
                    label="Cell Group"
                    onChange={(e) => setFormData(prev => ({ ...prev, cell_group_id: e.target.value }))}
                  >
                    <MenuItem value="">All Groups</MenuItem>
                    {/* TODO: Load cell groups dynamically */}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <MenuItem value="planned">Planned</MenuItem>
                    <MenuItem value="prepared">Prepared</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Preparation Notes"
                  value={formData.preparation_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparation_notes: e.target.value }))}
                  placeholder="What needs to be prepared for this teaching?"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Materials Needed"
                  value={formData.materials_needed}
                  onChange={(e) => setFormData(prev => ({ ...prev, materials_needed: e.target.value }))}
                  placeholder="Projector, handouts, etc."
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Key Points"
                  value={formData.key_points}
                  onChange={(e) => setFormData(prev => ({ ...prev, key_points: e.target.value }))}
                  placeholder="Main points to cover in the teaching"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={!formData.title || !formData.planned_date}
            >
              {editingTeaching ? 'Update' : 'Create'} Teaching
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={cancelDelete}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete the teaching "{teachingToDelete?.title}"?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete}>Cancel</Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Completion Dialog */}
        <Dialog
          open={completionDialogOpen}
          onClose={() => setCompletionDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Mark Teaching as Completed</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Please provide details for the completed teaching "{teachingToComplete?.title}"
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Actual Date"
                  value={completionData.actual_date}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, actual_date: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Attendance Count"
                  value={completionData.attendance_count}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, attendance_count: parseInt(e.target.value) || '' }))}
                  placeholder="Number of people who attended"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Feedback & Notes"
                  value={completionData.feedback}
                  onChange={(e) => setCompletionData(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="How did the teaching go? Any feedback or observations?"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompletionDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCompleteTeaching}
              variant="contained"
              color="success"
            >
              Mark as Completed
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BibleTeachingCalendar;