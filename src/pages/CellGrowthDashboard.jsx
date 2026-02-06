import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, List, ListItem, ListItemText, Avatar, Divider,
  LinearProgress, Stepper, Step, StepLabel
} from '@mui/material';
import {
  TrendingUp, People, GroupWork, Timeline, Assessment,
  Add, Edit, ExpandMore, Flag, CheckCircle, Warning,
  Star, Launch, School, PersonAdd
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const CellGrowthDashboard = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [cellGroups, setCellGroups] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [healthAssessments, setHealthAssessments] = useState([]);
  const [leadershipPipeline, setLeadershipPipeline] = useState([]);
  const [multiplicationPlans, setMultiplicationPlans] = useState([]);
  const [growthTargets, setGrowthTargets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [metricsDialogOpen, setMetricsDialogOpen] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [leadershipDialogOpen, setLeadershipDialogOpen] = useState(false);
  const [multiplicationDialogOpen, setMultiplicationDialogOpen] = useState(false);

  // Form states
  const [metricsForm, setMetricsForm] = useState({
    cell_group_id: '',
    metric_date: new Date(),
    attendance_count: '',
    visitor_count: '',
    member_count: '',
    first_timers: '',
    new_conversions: '',
    baptisms: '',
    offering_amount: '',
    testimony_count: '',
    prayer_requests_count: '',
    apprentice_leaders: '',
    potential_leaders_identified: '',
    multiplication_readiness_score: 5
  });

  const [assessmentForm, setAssessmentForm] = useState({
    cell_group_id: '',
    assessment_date: new Date(),
    wbs_stage: 'win',
    stage_progress_percentage: 0,
    outreach_events_count: '',
    gospel_presentations_count: '',
    conversion_rate: '',
    discipleship_sessions_count: '',
    foundation_school_completion_rate: '',
    leadership_development_score: 5,
    overall_health_score: 7,
    critical_issues: '',
    recommended_actions: ''
  });

  const [leadershipForm, setLeadershipForm] = useState({
    member_id: '',
    current_role: 'member',
    development_stage: 'potential',
    development_start_date: new Date(),
    leadership_potential: 5,
    teaching_ability: 5,
    evangelism_skills: 5,
    discipleship_capability: 5,
    administrative_skills: 5,
    development_notes: '',
    ready_for_multiplication: false
  });

  const [multiplicationForm, setMultiplicationForm] = useState({
    parent_cell_id: '',
    target_multiplication_date: new Date(),
    multiplication_type: 'split',
    primary_leader_id: '',
    apprentice_leader_id: '',
    target_location: '',
    target_audience: '',
    budget_allocated: ''
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        cellGroupsRes,
        metricsRes,
        assessmentsRes,
        leadershipRes,
        plansRes,
        targetsRes,
        analyticsRes
      ] = await Promise.all([
        fetchWithAuth('/api/cell-groups'),
        fetchWithAuth('/api/cell-growth/performance-metrics?limit=50'),
        fetchWithAuth('/api/cell-growth/health-assessments?limit=20'),
        fetchWithAuth('/api/cell-growth/leadership-pipeline'),
        fetchWithAuth('/api/cell-growth/multiplication-plans'),
        fetchWithAuth('/api/cell-growth/growth-targets'),
        fetchWithAuth('/api/cell-growth/analytics/overview')
      ]);

      const cellGroupsData = cellGroupsRes.ok ? await cellGroupsRes.json() : [];
      const metricsData = metricsRes.ok ? await metricsRes.json() : [];
      const assessmentsData = assessmentsRes.ok ? await assessmentsRes.json() : [];
      const leadershipData = leadershipRes.ok ? await leadershipRes.json() : [];
      const plansData = plansRes.ok ? await plansRes.json() : [];
      const targetsData = targetsRes.ok ? await targetsRes.json() : [];
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      setCellGroups(cellGroupsData);
      setPerformanceMetrics(metricsData);
      setHealthAssessments(assessmentsData);
      setLeadershipPipeline(leadershipData);
      setMultiplicationPlans(plansData);
      setGrowthTargets(targetsData);
      setAnalytics(analyticsData);

    } catch (err) {
      console.error('Failed to load cell growth data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePerformanceMetrics = async () => {
    try {
      const response = await fetchWithAuth('/api/cell-growth/performance-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metricsForm)
      });

      if (!response.ok) throw new Error('Failed to create performance metrics');

      setMetricsDialogOpen(false);
      setMetricsForm({
        cell_group_id: '', metric_date: new Date(), attendance_count: '', visitor_count: '',
        member_count: '', first_timers: '', new_conversions: '', baptisms: '',
        offering_amount: '', testimony_count: '', prayer_requests_count: '',
        apprentice_leaders: '', potential_leaders_identified: '', multiplication_readiness_score: 5
      });
      loadData();
      setSnackbar({ open: true, message: 'Performance metrics recorded successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create performance metrics:', err);
      setSnackbar({ open: true, message: 'Failed to record metrics', severity: 'error' });
    }
  };

  const handleCreateHealthAssessment = async () => {
    try {
      const response = await fetchWithAuth('/api/cell-growth/health-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentForm)
      });

      if (!response.ok) throw new Error('Failed to create health assessment');

      setAssessmentDialogOpen(false);
      setAssessmentForm({
        cell_group_id: '', assessment_date: new Date(), wbs_stage: 'win',
        stage_progress_percentage: 0, outreach_events_count: '', gospel_presentations_count: '',
        conversion_rate: '', discipleship_sessions_count: '', foundation_school_completion_rate: '',
        leadership_development_score: 5, overall_health_score: 7, critical_issues: '',
        recommended_actions: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Health assessment completed successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create health assessment:', err);
      setSnackbar({ open: true, message: 'Failed to complete assessment', severity: 'error' });
    }
  };

  const handleCreateLeadershipEntry = async () => {
    try {
      const response = await fetchWithAuth('/api/cell-growth/leadership-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadershipForm)
      });

      if (!response.ok) throw new Error('Failed to create leadership entry');

      setLeadershipDialogOpen(false);
      setLeadershipForm({
        member_id: '', current_role: 'member', development_stage: 'potential',
        development_start_date: new Date(), leadership_potential: 5, teaching_ability: 5,
        evangelism_skills: 5, discipleship_capability: 5, administrative_skills: 5,
        development_notes: '', ready_for_multiplication: false
      });
      loadData();
      setSnackbar({ open: true, message: 'Leadership entry created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create leadership entry:', err);
      setSnackbar({ open: true, message: 'Failed to create leadership entry', severity: 'error' });
    }
  };

  const handleCreateMultiplicationPlan = async () => {
    try {
      const response = await fetchWithAuth('/api/cell-growth/multiplication-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(multiplicationForm)
      });

      if (!response.ok) throw new Error('Failed to create multiplication plan');

      setMultiplicationDialogOpen(false);
      setMultiplicationForm({
        parent_cell_id: '', target_multiplication_date: new Date(), multiplication_type: 'split',
        primary_leader_id: '', apprentice_leader_id: '', target_location: '',
        target_audience: '', budget_allocated: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Multiplication plan created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create multiplication plan:', err);
      setSnackbar({ open: true, message: 'Failed to create multiplication plan', severity: 'error' });
    }
  };

  const getWBSStageColor = (stage) => {
    const colors = {
      win: 'primary',
      build: 'info',
      send: 'warning',
      multiply: 'success'
    };
    return colors[stage] || 'default';
  };

  const getHealthScoreColor = (score) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getDevelopmentStageColor = (stage) => {
    const colors = {
      potential: 'default',
      apprentice: 'info',
      trained: 'primary',
      leading: 'warning',
      multiplying: 'success'
    };
    return colors[stage] || 'default';
  };

  if (loading && cellGroups.length === 0) {
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
          Cell Growth Dashboard - WBS Cycle Performance
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Monitor cell health, track leadership development, and plan multiplication
        </Typography>

        {/* Analytics Cards */}
        {analytics && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {analytics.active_cells || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Cells
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {analytics.total_conversions || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Conversions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {analytics.cells_ready_to_multiply || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ready to Multiply
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {Math.round(analytics.avg_multiplication_readiness || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Readiness Score
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
            startIcon={<Assessment />}
            onClick={() => setMetricsDialogOpen(true)}
          >
            Record Metrics
          </Button>
          <Button
            variant="outlined"
            startIcon={<Timeline />}
            onClick={() => setAssessmentDialogOpen(true)}
          >
            Health Assessment
          </Button>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => setLeadershipDialogOpen(true)}
          >
            Add Leader
          </Button>
          <Button
            variant="outlined"
            startIcon={<Launch />}
            onClick={() => setMultiplicationDialogOpen(true)}
          >
            Plan Multiplication
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Cell Health Overview" />
            <Tab label="Leadership Pipeline" />
            <Tab label="Multiplication Planning" />
            <Tab label="Performance Metrics" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {healthAssessments.map((assessment) => (
              <Grid item xs={12} md={6} key={assessment.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {assessment.cell_group_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Assessment: {new Date(assessment.assessment_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={assessment.wbs_stage.toUpperCase()}
                          color={getWBSStageColor(assessment.wbs_stage)}
                          size="small"
                        />
                        <Chip
                          label={`${assessment.overall_health_score}/10`}
                          color={getHealthScoreColor(assessment.overall_health_score)}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Progress:</strong> {assessment.stage_progress_percentage}%
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={assessment.stage_progress_percentage}
                      sx={{ height: 8, borderRadius: 4, mb: 2 }}
                    />

                    {assessment.critical_issues && (
                      <Typography variant="body2" color="error.main" gutterBottom>
                        <strong>Critical Issues:</strong> {assessment.critical_issues}
                      </Typography>
                    )}

                    {assessment.recommended_actions && (
                      <Typography variant="body2" color="primary.main" gutterBottom>
                        <strong>Recommended Actions:</strong> {assessment.recommended_actions}
                      </Typography>
                    )}

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Update
                      </Button>
                      <Button size="small" startIcon={<Timeline />}>
                        View History
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
              Leadership Development Pipeline
            </Typography>

            <Grid container spacing={3}>
              {leadershipPipeline.map((leader) => (
                <Grid item xs={12} md={6} key={leader.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar>
                          {leader.first_name?.[0]}{leader.surname?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {leader.first_name} {leader.surname}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Current Role: {leader.current_role.replace('_', ' ')}
                          </Typography>
                        </Box>
                        <Chip
                          label={leader.development_stage}
                          color={getDevelopmentStageColor(leader.development_stage)}
                          size="small"
                        />
                      </Box>

                      <Typography variant="body2" gutterBottom>
                        <strong>Leadership Potential:</strong> {leader.leadership_potential}/10
                      </Typography>

                      <Typography variant="body2" gutterBottom>
                        <strong>Skills:</strong> Teaching: {leader.teaching_ability}, Evangelism: {leader.evangelism_skills}
                      </Typography>

                      <Typography variant="body2" gutterBottom>
                        <strong>Ready for Multiplication:</strong> {leader.ready_for_multiplication ? 'Yes' : 'No'}
                      </Typography>

                      <Box display="flex" gap={1} mt={2}>
                        <Button size="small" startIcon={<Edit />}>
                          Update
                        </Button>
                        <Button size="small" startIcon={<School />}>
                          Training
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Cell Multiplication Planning
            </Typography>

            <Grid container spacing={3}>
              {multiplicationPlans.map((plan) => (
                <Grid item xs={12} key={plan.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {plan.parent_cell_name} → New Cell
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Target Date: {new Date(plan.target_multiplication_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Chip
                            label={plan.status}
                            color={plan.status === 'completed' ? 'success' : 'warning'}
                            size="small"
                          />
                          <Chip
                            label={plan.multiplication_type}
                            color="primary"
                            size="small"
                          />
                        </Box>
                      </Box>

                      {plan.primary_leader_first_name && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Primary Leader:</strong> {plan.primary_leader_first_name} {plan.primary_leader_surname}
                        </Typography>
                      )}

                      <Typography variant="body2" gutterBottom>
                        <strong>Location:</strong> {plan.target_location || 'TBD'}
                      </Typography>

                      <Typography variant="body2" gutterBottom>
                        <strong>Budget:</strong> ${plan.budget_allocated || 0}
                      </Typography>

                      <Box display="flex" gap={1} mt={2}>
                        <Button size="small" startIcon={<Edit />}>
                          Update Plan
                        </Button>
                        <Button size="small" startIcon={<Flag />}>
                          Mark Milestone
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Recent Performance Metrics
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cell Group</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Attendance</TableCell>
                    <TableCell>Visitors</TableCell>
                    <TableCell>Conversions</TableCell>
                    <TableCell>Offering</TableCell>
                    <TableCell>Readiness Score</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {performanceMetrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell>{metric.cell_group_name}</TableCell>
                      <TableCell>{new Date(metric.metric_date).toLocaleDateString()}</TableCell>
                      <TableCell>{metric.attendance_count}</TableCell>
                      <TableCell>{metric.visitor_count}</TableCell>
                      <TableCell>{metric.new_conversions}</TableCell>
                      <TableCell>${metric.offering_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={metric.multiplication_readiness_score}
                          color={metric.multiplication_readiness_score >= 8 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Performance Metrics Dialog */}
        <Dialog
          open={metricsDialogOpen}
          onClose={() => setMetricsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Record Cell Performance Metrics</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={cellGroups}
                  getOptionLabel={(option) => option.name}
                  value={cellGroups.find(cg => cg.id === metricsForm.cell_group_id) || null}
                  onChange={(event, newValue) => {
                    setMetricsForm(prev => ({
                      ...prev,
                      cell_group_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Cell Group" placeholder="Select cell group..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Metric Date"
                  value={metricsForm.metric_date}
                  onChange={(date) => setMetricsForm(prev => ({ ...prev, metric_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Attendance Count"
                  value={metricsForm.attendance_count}
                  onChange={(e) => setMetricsForm(prev => ({ ...prev, attendance_count: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Visitor Count"
                  value={metricsForm.visitor_count}
                  onChange={(e) => setMetricsForm(prev => ({ ...prev, visitor_count: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="First Timers"
                  value={metricsForm.first_timers}
                  onChange={(e) => setMetricsForm(prev => ({ ...prev, first_timers: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="New Conversions"
                  value={metricsForm.new_conversions}
                  onChange={(e) => setMetricsForm(prev => ({ ...prev, new_conversions: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Offering Amount"
                  value={metricsForm.offering_amount}
                  onChange={(e) => setMetricsForm(prev => ({ ...prev, offering_amount: e.target.value }))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Multiplication Readiness (1-10)"
                  value={metricsForm.multiplication_readiness_score}
                  onChange={(e) => setMetricsForm(prev => ({ ...prev, multiplication_readiness_score: e.target.value }))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMetricsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePerformanceMetrics} variant="contained">
              Record Metrics
            </Button>
          </DialogActions>
        </Dialog>

        {/* Health Assessment Dialog */}
        <Dialog
          open={assessmentDialogOpen}
          onClose={() => setAssessmentDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Cell Health Assessment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={cellGroups}
                  getOptionLabel={(option) => option.name}
                  value={cellGroups.find(cg => cg.id === assessmentForm.cell_group_id) || null}
                  onChange={(event, newValue) => {
                    setAssessmentForm(prev => ({
                      ...prev,
                      cell_group_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Cell Group" placeholder="Select cell group..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>WBS Stage</InputLabel>
                  <Select
                    value={assessmentForm.wbs_stage}
                    label="WBS Stage"
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, wbs_stage: e.target.value }))}
                  >
                    <MenuItem value="win">Win (Evangelism)</MenuItem>
                    <MenuItem value="build">Build (Discipleship)</MenuItem>
                    <MenuItem value="send">Send (Multiplication)</MenuItem>
                    <MenuItem value="multiply">Multiply (Plant)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Overall Health Score (1-10)"
                  value={assessmentForm.overall_health_score}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, overall_health_score: e.target.value }))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stage Progress (%)"
                  value={assessmentForm.stage_progress_percentage}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, stage_progress_percentage: e.target.value }))}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Critical Issues"
                  value={assessmentForm.critical_issues}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, critical_issues: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Recommended Actions"
                  value={assessmentForm.recommended_actions}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, recommended_actions: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssessmentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateHealthAssessment} variant="contained">
              Complete Assessment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Leadership Entry Dialog */}
        <Dialog
          open={leadershipDialogOpen}
          onClose={() => setLeadershipDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Add to Leadership Pipeline</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={[]} // Would need members endpoint
                  getOptionLabel={(option) => `${option.first_name} ${option.surname}`}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" placeholder="Select member..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Current Role</InputLabel>
                  <Select
                    value={leadershipForm.current_role}
                    label="Current Role"
                    onChange={(e) => setLeadershipForm(prev => ({ ...prev, current_role: e.target.value }))}
                  >
                    <MenuItem value="member">Member</MenuItem>
                    <MenuItem value="cell_visitor">Cell Visitor</MenuItem>
                    <MenuItem value="apprentice">Apprentice</MenuItem>
                    <MenuItem value="cell_leader">Cell Leader</MenuItem>
                    <MenuItem value="zone_leader">Zone Leader</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Development Stage</InputLabel>
                  <Select
                    value={leadershipForm.development_stage}
                    label="Development Stage"
                    onChange={(e) => setLeadershipForm(prev => ({ ...prev, development_stage: e.target.value }))}
                  >
                    <MenuItem value="potential">Potential</MenuItem>
                    <MenuItem value="apprentice">Apprentice</MenuItem>
                    <MenuItem value="trained">Trained</MenuItem>
                    <MenuItem value="leading">Leading</MenuItem>
                    <MenuItem value="multiplying">Multiplying</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Leadership Potential (1-10)"
                  value={leadershipForm.leadership_potential}
                  onChange={(e) => setLeadershipForm(prev => ({ ...prev, leadership_potential: e.target.value }))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={leadershipForm.ready_for_multiplication}
                      onChange={(e) => setLeadershipForm(prev => ({ ...prev, ready_for_multiplication: e.target.checked }))}
                    />
                  }
                  label="Ready for multiplication"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLeadershipDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateLeadershipEntry} variant="contained">
              Add to Pipeline
            </Button>
          </DialogActions>
        </Dialog>

        {/* Multiplication Plan Dialog */}
        <Dialog
          open={multiplicationDialogOpen}
          onClose={() => setMultiplicationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Plan Cell Multiplication</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={cellGroups}
                  getOptionLabel={(option) => option.name}
                  value={cellGroups.find(cg => cg.id === multiplicationForm.parent_cell_id) || null}
                  onChange={(event, newValue) => {
                    setMultiplicationForm(prev => ({
                      ...prev,
                      parent_cell_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Parent Cell Group" placeholder="Select parent cell..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Target Multiplication Date"
                  value={multiplicationForm.target_multiplication_date}
                  onChange={(date) => setMultiplicationForm(prev => ({ ...prev, target_multiplication_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Multiplication Type</InputLabel>
                  <Select
                    value={multiplicationForm.multiplication_type}
                    label="Multiplication Type"
                    onChange={(e) => setMultiplicationForm(prev => ({ ...prev, multiplication_type: e.target.value }))}
                  >
                    <MenuItem value="split">Split Existing Cell</MenuItem>
                    <MenuItem value="daughter">Daughter Cell</MenuItem>
                    <MenuItem value="satellite">Satellite Cell</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Budget Allocated"
                  value={multiplicationForm.budget_allocated}
                  onChange={(e) => setMultiplicationForm(prev => ({ ...prev, budget_allocated: e.target.value }))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target Location"
                  value={multiplicationForm.target_location}
                  onChange={(e) => setMultiplicationForm(prev => ({ ...prev, target_location: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Target Audience"
                  value={multiplicationForm.target_audience}
                  onChange={(e) => setMultiplicationForm(prev => ({ ...prev, target_audience: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setMultiplicationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateMultiplicationPlan} variant="contained">
              Create Plan
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

export default CellGrowthDashboard;