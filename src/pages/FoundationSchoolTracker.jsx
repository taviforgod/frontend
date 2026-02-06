import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Avatar, CircularProgress, Tabs, Tab, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete,
  Snackbar, Alert
} from '@mui/material';
import {
  PersonAdd, School, ExpandMore, Assessment, Lock
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

const FoundationSchoolTracker = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [members, setMembers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [stats, setStats] = useState(null);

  // Derive unique student list: one row per member showing the highest level they have
  const uniqueStudents = useMemo(() => {
    const map = new Map();
    enrollments.forEach((e) => {
      const key = e.member_id ?? `${e.first_name}||${e.surname}||${e.contact_primary ?? ''}`;
      const lvl = Number(e.level) || 0;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, e);
      } else {
        const existingLevel = Number(existing.level) || 0;
        if (lvl > existingLevel) {
          map.set(key, e);
        } else if (lvl === existingLevel) {
          // prefer completed > in_progress > enrolled > dropped, then higher module
          const statusOrder = { completed: 3, in_progress: 2, enrolled: 1, dropped: 0 };
          const existingStatus = statusOrder[existing.status] || 0;
          const newStatus = statusOrder[e.status] || 0;
          if (newStatus > existingStatus) {
            map.set(key, e);
          } else if (newStatus === existingStatus) {
            const existingModule = existing.current_module || 0;
            const newModule = e.current_module || 0;
            if (newModule > existingModule) map.set(key, e);
          }
        }
      }
    });
    return Array.from(map.values());
  }, [enrollments]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Dialog states
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const selectedIsCompleted = selectedEnrollment?.status === 'completed';

  // Form states
  const [enrollmentForm, setEnrollmentForm] = useState({
    member_id: '',
    class_id: '',
    mentor_id: ''
  });

  const [progressForm, setProgressForm] = useState({
    current_module: 1,
    attendance_percentage: 0,
    status: 'enrolled'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load classes, enrollments, stats, members, and mentors in parallel
      const [classesRes, enrollmentsRes, statsRes, membersRes, mentorsRes] = await Promise.all([
        fetchWithAuth('/api/foundation-school/classes'),
        fetchWithAuth('/api/foundation-school/enrollments'),
        fetchWithAuth('/api/foundation-school/stats'),
        fetchWithAuth('/api/members?limit=1000'), // Get all members
        fetchWithAuth('/api/members/leaders') // Get leaders who can be mentors
      ]);

      if (!classesRes.ok || !enrollmentsRes.ok || !statsRes.ok) {
        console.error('API Errors:', {
          classes: classesRes.status,
          enrollments: enrollmentsRes.status,
          stats: statsRes.status,
          members: membersRes.status,
          mentors: mentorsRes.status
        });
        // Don't throw error for members/mentors as they might not be critical
      }

      const classesData = await classesRes.json();
      const enrollmentsData = await enrollmentsRes.json();
      const statsData = await statsRes.json();
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const mentorsData = mentorsRes.ok ? await mentorsRes.json() : [];

      console.log('API Responses:', {
        classes: classesData,
        enrollments: enrollmentsData,
        stats: statsData,
        members: membersData,
        mentors: mentorsData
      });

      // Ensure we have arrays for mapping
      setClasses(Array.isArray(classesData) ? classesData : []);
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : []);
      setMembers(Array.isArray(membersData) ? membersData : []);
      setMentors(Array.isArray(mentorsData) ? mentorsData : []);
      setStats(statsData || null);

    } catch (err) {
      console.error('Failed to load foundation school data:', err);
      // Set empty arrays on error to prevent map errors
      setClasses([]);
      setEnrollments([]);
      setMembers([]);
      setMentors([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEnrollMember = async () => {
    try {
      await fetchWithAuth('/api/foundation-school/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrollmentForm)
      });

      setEnrollDialogOpen(false);
      setEnrollmentForm({ member_id: '', class_id: '', mentor_id: '' });
      loadData();
    } catch (err) {
      console.error('Failed to enroll member:', err);
    }
  };

  const handleUpdateProgress = async () => {
    if (!selectedEnrollment) return;
    if (selectedEnrollment.status === 'completed') return;

    try {
      const res = await fetchWithAuth(`/api/foundation-school/enrollments/${selectedEnrollment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressForm)
      });
      if (res.status === 409) {
        setSnackbar({ open: true, message: 'Enrollment is completed and locked.', severity: 'warning' });
        return;
      }
      if (!res.ok) {
        let msg = 'Failed to update progress';
        try {
          const body = await res.json();
          msg = body?.error || body?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      setProgressDialogOpen(false);
      setSelectedEnrollment(null);
      loadData();
    } catch (err) {
      console.error('Failed to update progress:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to update progress', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'info';
      case 'enrolled': return 'warning';
      case 'dropped': return 'error';
      default: return 'default';
    }
  };

  const getProgressPercentage = (enrollment) => {
    // If completed, show 100% regardless of current module
    if (enrollment.status === 'completed') {
      return 100;
    }

    // Simple calculation based on modules completed
    const totalModules = 8; // Assuming 8 modules per class
    const completedModules = enrollment.current_module || 1;
    return Math.min((completedModules / totalModules) * 100, 100);
  };

  if (loading && classes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Foundation School Progress Tracker
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track discipleship progress through foundation school classes
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => setEnrollDialogOpen(true)}
        >
          Enroll Member
        </Button>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  {stats.total_enrollments}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Enrollments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {stats.completed_courses}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Courses
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {stats.active_students}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Students
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {Math.round(stats.avg_attendance || 0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Attendance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Enrollments" />
          <Tab label="By Class" />
          <Tab label="Progress Overview" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Mentor</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uniqueStudents.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {enrollment.first_name?.[0]}{enrollment.surname?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {enrollment.first_name} {enrollment.surname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {enrollment.contact_primary}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {enrollment.class_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Level {enrollment.level}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 200 }}>
                    <Box>
                      <Typography variant="caption">
                        {enrollment.status === 'completed' ? 'Completed (8 of 8)' : `Module ${enrollment.current_module || 1} of 8`}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={getProgressPercentage(enrollment)}
                        sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(getProgressPercentage(enrollment))}% Complete
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={enrollment.status === 'completed' ? 'Completed (Locked)' : enrollment.status}
                      color={getStatusColor(enrollment.status)}
                      size="small"
                      icon={enrollment.status === 'completed' ? <Lock fontSize="small" /> : undefined}
                    />
                  </TableCell>
                  <TableCell>
                    {enrollment.mentor_first_name ? (
                      <Typography variant="body2">
                        {enrollment.mentor_first_name} {enrollment.mentor_surname}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={enrollment.status === 'completed' ? 'Completed enrollments are locked' : 'Update Progress'}>
                      <span>
                        <IconButton
                          size="small"
                          disabled={enrollment.status === 'completed'}
                          onClick={() => {
                            setSelectedEnrollment(enrollment);
                            setProgressForm({
                              current_module: enrollment.current_module || 1,
                              attendance_percentage: enrollment.attendance_percentage || 0,
                              status: enrollment.status
                            });
                            setProgressDialogOpen(true);
                          }}
                        >
                          <Assessment />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tabValue === 1 && (
        <Box>
          {classes.map((cls) => {
            const classEnrollments = enrollments.filter(e => e.class_id === cls.id);
            return (
              <Accordion key={cls.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <School />
                    <Box>
                      <Typography variant="h6">{cls.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {classEnrollments.length} students enrolled
                      </Typography>
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {cls.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Duration: {cls.duration_weeks} weeks
                  </Typography>

                  {classEnrollments.length > 0 ? (
                    <TableContainer component={Paper} size="small">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Student</TableCell>
                            <TableCell>Progress</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {classEnrollments.map((enrollment) => (
                            <TableRow key={enrollment.id}>
                              <TableCell>
                                {enrollment.first_name} {enrollment.surname}
                              </TableCell>
                              <TableCell>
                                <LinearProgress
                                  variant="determinate"
                                  value={getProgressPercentage(enrollment)}
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={enrollment.status === 'completed' ? 'Completed (Locked)' : enrollment.status}
                                  color={getStatusColor(enrollment.status)}
                                  size="small"
                                  icon={enrollment.status === 'completed' ? <Lock fontSize="small" /> : undefined}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No students enrolled in this class yet.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {uniqueStudents.map((enrollment) => (
            <Grid item xs={12} md={6} lg={4} key={enrollment.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Avatar>
                      {enrollment.first_name?.[0]}{enrollment.surname?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {enrollment.first_name} {enrollment.surname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {enrollment.class_name}
                      </Typography>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Typography variant="body2" gutterBottom>
                      Progress: {enrollment.status === 'completed' ? 'Completed (8 of 8)' : `Module ${enrollment.current_module || 1} of 8`}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={getProgressPercentage(enrollment)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={enrollment.status === 'completed' ? 'Completed (Locked)' : enrollment.status}
                      color={getStatusColor(enrollment.status)}
                      size="small"
                      icon={enrollment.status === 'completed' ? <Lock fontSize="small" /> : undefined}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(enrollment.attendance_percentage || 0)}% attendance
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Enroll Member Dialog */}
      <Dialog
        open={enrollDialogOpen}
        onClose={() => setEnrollDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enroll Member in Foundation Class</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Autocomplete
                options={members}
                getOptionLabel={(option) =>
                  `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                }
                value={members.find(member => member.id === enrollmentForm.member_id) || null}
                onChange={(event, newValue) => {
                  setEnrollmentForm(prev => ({
                    ...prev,
                    member_id: newValue ? newValue.id : ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Member"
                    placeholder={loading ? "Loading members..." : "Search and select a member..."}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                fullWidth
                disabled={loading}
                loading={loading}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={enrollmentForm.class_id}
                  label="Class"
                  onChange={(e) => setEnrollmentForm(prev => ({ ...prev, class_id: e.target.value }))}
                >
                  {classes.map((cls) => (
                    <MenuItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.description})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={[{ id: '', first_name: 'No mentor', surname: 'assigned', contact_primary: null }, ...mentors]}
                getOptionLabel={(option) =>
                  option.id === '' ? 'No mentor assigned' :
                  `${option.first_name} ${option.surname}${option.contact_primary ? ` (${option.contact_primary})` : ''}`
                }
                value={enrollmentForm.mentor_id === '' ?
                  { id: '', first_name: 'No mentor', surname: 'assigned', contact_primary: null } :
                  mentors.find(mentor => mentor.id === enrollmentForm.mentor_id) || null
                }
                onChange={(event, newValue) => {
                  setEnrollmentForm(prev => ({
                    ...prev,
                    mentor_id: newValue ? newValue.id : ''
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Mentor (Optional)"
                    placeholder={loading ? "Loading mentors..." : "Search and select a mentor..."}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                fullWidth
                disabled={loading}
                loading={loading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleEnrollMember}
            variant="contained"
            disabled={!enrollmentForm.member_id || !enrollmentForm.class_id}
          >
            Enroll Member
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog
        open={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Progress</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Update progress for {selectedEnrollment?.first_name} {selectedEnrollment?.surname}
          </Typography>
          {selectedIsCompleted && (
            <Typography variant="body2" sx={{ mb: 2, color: 'success.main', fontWeight: 600 }}>
              This enrollment is completed and locked.
            </Typography>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Current Module</InputLabel>
                <Select
                  value={progressForm.current_module}
                  label="Current Module"
                  onChange={(e) => setProgressForm(prev => ({ ...prev, current_module: parseInt(e.target.value) }))}
                  disabled={selectedIsCompleted}
                >
                  {[...Array(8)].map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      Module {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="Attendance Percentage"
                value={progressForm.attendance_percentage}
                onChange={(e) => setProgressForm(prev => ({ ...prev, attendance_percentage: parseInt(e.target.value) || 0 }))}
                inputProps={{ min: 0, max: 100 }}
                disabled={selectedIsCompleted}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={progressForm.status}
                  label="Status"
                  onChange={(e) => setProgressForm(prev => ({ ...prev, status: e.target.value }))}
                  disabled={selectedIsCompleted}
                >
                  <MenuItem value="enrolled">Enrolled</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="dropped">Dropped</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateProgress} variant="contained" disabled={selectedIsCompleted}>
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FoundationSchoolTracker;
