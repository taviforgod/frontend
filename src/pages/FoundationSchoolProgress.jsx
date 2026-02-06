import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Snackbar, Stepper, Step, StepLabel
} from '@mui/material';
import {
  School, ExpandMore, CheckCircle, PlayArrow, Assignment,
  Assessment, Grade, AssignmentTurnedIn, Timeline
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

const FoundationSchoolProgress = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [selectedProgressId, setSelectedProgressId] = useState(null);
  const [progressData, setProgressData] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false);

  // Form states
  const [progressForm, setProgressForm] = useState({
    status: 'not_started',
    assessment_score: '',
    instructor_feedback: '',
    study_notes: ''
  });

  const [certificateForm, setCertificateForm] = useState({
    certificate_type: 'completion',
    issued_date: new Date(),
    gpa_score: ''
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [enrollmentsRes, modulesRes] = await Promise.all([
        fetchWithAuth('/api/foundation-school/enrollments'),
        fetchWithAuth('/api/foundation-school-progress/modules')
      ]);

      const enrollmentsData = enrollmentsRes.ok ? await enrollmentsRes.json() : [];
      const modulesData = modulesRes.ok ? await modulesRes.json() : [];

      setEnrollments(enrollmentsData);
      setModules(modulesData);

    } catch (err) {
      console.error('Failed to load foundation school progress data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadProgressData = async (enrollmentId) => {
    try {
      const response = await fetchWithAuth(`/api/foundation-school-progress/enrollments/${enrollmentId}/progress`);
      if (response.ok) {
        const progress = await response.json();
        setProgressData(progress);
        return progress;
      }
    } catch (err) {
      console.error('Failed to load progress data:', err);
    }
    return [];
  };

  const handleViewProgress = (enrollment) => {
    setSelectedEnrollment(enrollment);
    loadProgressData(enrollment.id);
    setTabValue(1); // Switch to progress tab
  };

  const openProgressEditor = async (enrollment, progress = null) => {
    if (!enrollment) return;
    setSelectedEnrollment(enrollment);

    let targetProgress = progress;
    if (!targetProgress) {
      const data = await loadProgressData(enrollment.id);
      targetProgress = data.find(p => p.status !== 'completed' && p.status !== 'reviewed') || data[0];
    }

    if (!targetProgress) {
      setSnackbar({ open: true, message: 'No progress records available for this enrollment', severity: 'info' });
      return;
    }

    setSelectedProgress(targetProgress);
    setSelectedProgressId(targetProgress.id);
    setProgressForm({
      status: targetProgress.status || 'not_started',
      assessment_score: targetProgress.assessment_score || '',
      instructor_feedback: targetProgress.instructor_feedback || '',
      study_notes: targetProgress.study_notes || ''
    });
    setProgressDialogOpen(true);
  };

  const handleUpdateProgress = async (progressId) => {
    if (!progressId) {
      setSnackbar({ open: true, message: 'Select a module to update.', severity: 'info' });
      return;
    }

    const statusLocked = selectedProgress?.status === 'completed' || selectedProgress?.status === 'reviewed';
    if (statusLocked && progressForm.status !== selectedProgress?.status) {
      setSnackbar({ open: true, message: 'Completed modules are locked and cannot change status.', severity: 'warning' });
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/foundation-school-progress/progress/${progressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressForm)
      });

      if (response.status === 409) {
        setSnackbar({ open: true, message: 'Enrollment is completed and locked.', severity: 'warning' });
        return;
      }
      if (!response.ok) throw new Error('Failed to update progress');

      setProgressDialogOpen(false);
      setSelectedProgressId(null);
      setSelectedProgress(null);
      setProgressForm({
        status: 'not_started',
        assessment_score: '',
        instructor_feedback: '',
        study_notes: ''
      });

      // Reload progress data
      if (selectedEnrollment) {
        loadProgressData(selectedEnrollment.id);
      }

      setSnackbar({ open: true, message: 'Progress updated successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to update progress:', err);
      setSnackbar({ open: true, message: 'Failed to update progress', severity: 'error' });
    }
  };

  const handleIssueCertificate = async () => {
    if (!selectedEnrollment) return;

    try {
      const certificateData = {
        ...certificateForm,
        enrollment_id: selectedEnrollment.id,
        student_name: `${selectedEnrollment.first_name} ${selectedEnrollment.surname}`,
        level_completed: selectedEnrollment.level,
        completion_date: new Date()
      };

      const response = await fetchWithAuth('/api/foundation-school-progress/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certificateData)
      });

      if (!response.ok) throw new Error('Failed to issue certificate');

      setCertificateDialogOpen(false);
      setCertificateForm({
        certificate_type: 'completion',
        issued_date: new Date(),
        gpa_score: ''
      });

      setSnackbar({ open: true, message: 'Certificate issued successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to issue certificate:', err);
      setSnackbar({ open: true, message: 'Failed to issue certificate', severity: 'error' });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'default',
      in_progress: 'info',
      completed: 'success',
      reviewed: 'primary'
    };
    return colors[status] || 'default';
  };

  const getProgressPercentage = (enrollment) => {
    if (!progressData.length) return 0;
    const completed = progressData.filter(p => p.status === 'completed').length;
    return Math.round((completed / progressData.length) * 100);
  };

  if (loading && enrollments.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Foundation School Progress Tracker
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Detailed progress tracking and assessment for foundation school students
      </Typography>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<School />}
          onClick={() => setTabValue(0)}
        >
          View All Students
        </Button>
        <Button
          variant="outlined"
          startIcon={<AssignmentTurnedIn />}
          onClick={() => setCertificateDialogOpen(true)}
          disabled={!selectedEnrollment}
        >
          Issue Certificate
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="All Students" />
          <Tab label="Student Progress" disabled={!selectedEnrollment} />
          <Tab label="Module Overview" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {enrollments.map((enrollment) => (
            <Grid item xs={12} md={6} lg={4} key={enrollment.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {enrollment.first_name} {enrollment.surname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Level {enrollment.level} • {enrollment.status}
                      </Typography>
                    </Box>
                    <Chip
                      label={`Level ${enrollment.level}`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" gutterBottom>
                    <strong>Class:</strong> {enrollment.class_name}
                  </Typography>

                  <Typography variant="body2" gutterBottom>
                    <strong>Enrolled:</strong> {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </Typography>

                  <Box display="flex" gap={1} mt={2}>
                    <Button
                      size="small"
                      startIcon={<Timeline />}
                      onClick={() => handleViewProgress(enrollment)}
                    >
                      View Progress
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Assessment />}
                      onClick={() => openProgressEditor(enrollment)}
                      disabled={enrollment.status === 'completed'}
                    >
                      Update
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {tabValue === 1 && selectedEnrollment && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">
              Progress for {selectedEnrollment.first_name} {selectedEnrollment.surname}
            </Typography>
            <Chip
              label={`${getProgressPercentage(selectedEnrollment)}% Complete`}
              color="primary"
              size="small"
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={getProgressPercentage(selectedEnrollment)}
            sx={{ height: 10, borderRadius: 5, mb: 3 }}
          />

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Module</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assessment Score</TableCell>
                  <TableCell>Completed Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progressData.map((progress) => (
                  <TableRow key={progress.id}>
                    <TableCell>{progress.module_number}</TableCell>
                    <TableCell>{progress.module_title}</TableCell>
                    <TableCell>
                      <Chip
                        label={progress.status.replace('_', ' ')}
                        color={getStatusColor(progress.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {progress.assessment_score ? `${progress.assessment_score}%` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {progress.completed_date ? new Date(progress.completed_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => openProgressEditor(selectedEnrollment, progress)}
                        disabled={selectedEnrollment?.status === 'completed'}
                      >
                        Update
                      </Button>
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
            Foundation School Modules
          </Typography>

          {modules.map((module) => (
            <Accordion key={module.id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">
                  Level {module.level} - Module {module.module_number}: {module.module_title}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" gutterBottom>
                  {module.module_description}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Objectives:</strong> {module.objectives}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>Duration:</strong> {module.estimated_weeks} weeks
                </Typography>

                {module.key_scriptures && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Key Scriptures:</strong> {module.key_scriptures}
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Update Progress Dialog */}
      <Dialog
        open={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Update Student Progress</DialogTitle>
        <DialogContent>
          {selectedProgress && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Module {selectedProgress.module_number}: {selectedProgress.module_title}
            </Typography>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={progressForm.status}
                  label="Status"
                  onChange={(e) => setProgressForm(prev => ({ ...prev, status: e.target.value }))}
                  disabled={selectedProgress?.status === 'completed' || selectedProgress?.status === 'reviewed'}
                >
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                </Select>
              </FormControl>
              {(selectedProgress?.status === 'completed' || selectedProgress?.status === 'reviewed') && (
                <Typography variant="caption" color="text.secondary">
                  Status is locked for completed modules.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Assessment Score (%)"
                value={progressForm.assessment_score}
                onChange={(e) => setProgressForm(prev => ({ ...prev, assessment_score: e.target.value }))}
                inputProps={{ min: 0, max: 100 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Instructor Feedback"
                value={progressForm.instructor_feedback}
                onChange={(e) => setProgressForm(prev => ({ ...prev, instructor_feedback: e.target.value }))}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Student Study Notes"
                value={progressForm.study_notes}
                onChange={(e) => setProgressForm(prev => ({ ...prev, study_notes: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProgressDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleUpdateProgress(selectedProgressId)} variant="contained" disabled={!selectedProgressId}>
            Update Progress
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue Certificate Dialog */}
      <Dialog
        open={certificateDialogOpen}
        onClose={() => setCertificateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Issue Foundation School Certificate</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Certificate Type</InputLabel>
                <Select
                  value={certificateForm.certificate_type}
                  label="Certificate Type"
                  onChange={(e) => setCertificateForm(prev => ({ ...prev, certificate_type: e.target.value }))}
                >
                  <MenuItem value="completion">Completion</MenuItem>
                  <MenuItem value="excellence">Excellence</MenuItem>
                  <MenuItem value="participation">Participation</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label="GPA Score"
                value={certificateForm.gpa_score}
                onChange={(e) => setCertificateForm(prev => ({ ...prev, gpa_score: e.target.value }))}
                inputProps={{ min: 0, max: 4.0, step: 0.1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleIssueCertificate} variant="contained">
            Issue Certificate
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
  );
};

export default FoundationSchoolProgress;
