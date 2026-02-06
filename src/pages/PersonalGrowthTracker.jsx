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
  Psychology, SelfImprovement, HealthAndSafety, Church,
  ExpandMore, Add, Edit, Timeline, Assessment,
  Favorite, Spa, Book, Prayer, People
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const PersonalGrowthTracker = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [growthPlans, setGrowthPlans] = useState([]);
  const [burnoutAssessments, setBurnoutAssessments] = useState([]);
  const [wellnessCheckins, setWellnessCheckins] = useState([]);
  const [spiritualDisciplines, setSpiritualDisciplines] = useState([]);
  const [personalDevelopmentGoals, setPersonalDevelopmentGoals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [growthPlanDialogOpen, setGrowthPlanDialogOpen] = useState(false);
  const [burnoutDialogOpen, setBurnoutDialogOpen] = useState(false);
  const [wellnessDialogOpen, setWellnessDialogOpen] = useState(false);
  const [spiritualDialogOpen, setSpiritualDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);

  // Form states
  const [growthPlanForm, setGrowthPlanForm] = useState({
    member_id: '',
    plan_title: '',
    plan_description: '',
    plan_category: 'spiritual',
    start_date: new Date(),
    target_completion_date: new Date(),
    primary_goal: '',
    accountability_partner: ''
  });

  const [burnoutForm, setBurnoutForm] = useState({
    member_id: '',
    assessment_date: new Date(),
    emotional_exhaustion: 5,
    depersonalization: 5,
    reduced_accomplishment: 5,
    work_hours_per_week: '',
    sleep_hours_per_night: '',
    stress_factors: '',
    support_system_rating: 5,
    physical_health_rating: 5,
    mental_health_rating: 5,
    spiritual_health_rating: 5,
    recommended_actions: '',
    intervention_needed: false,
    intervention_type: 'counseling'
  });

  const [wellnessForm, setWellnessForm] = useState({
    member_id: '',
    checkin_date: new Date(),
    energy_level: 7,
    stress_level: 4,
    sleep_quality: 7,
    spiritual_connection: 8,
    exercise_days_this_week: 0,
    rest_days_this_week: 1,
    time_with_family: 0,
    personal_devotion_time: 0,
    ministry_hours_per_week: 0,
    non_ministry_hours_per_week: 0,
    work_life_balance_rating: 6,
    support_system_satisfaction: 7,
    community_connection_rating: 8,
    general_notes: '',
    goals_for_next_period: ''
  });

  const [spiritualForm, setSpiritualForm] = useState({
    member_id: '',
    discipline_date: new Date(),
    bible_reading: false,
    prayer_time: false,
    meditation: false,
    fasting: false,
    worship: false,
    service: false,
    bible_reading_time: 0,
    prayer_time_minutes: 0,
    scripture_focus: '',
    spiritual_insights: ''
  });

  const [goalForm, setGoalForm] = useState({
    member_id: '',
    goal_title: '',
    goal_description: '',
    goal_category: 'personal',
    specific_description: '',
    measurable_criteria: '',
    achievable_action_steps: [],
    relevant_reason: '',
    time_bound_deadline: new Date(),
    accountability_partner: '',
    start_date: new Date(),
    target_completion_date: new Date()
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        membersRes,
        plansRes,
        burnoutRes,
        wellnessRes,
        spiritualRes,
        goalsRes,
        burnoutSummaryRes,
        membersAttentionRes
      ] = await Promise.all([
        fetchWithAuth('/api/members?limit=1000'),
        fetchWithAuth('/api/personal-growth/growth-plans'),
        fetchWithAuth('/api/personal-growth/burnout-assessments'),
        fetchWithAuth('/api/personal-growth/wellness-checkins'),
        fetchWithAuth('/api/personal-growth/spiritual-disciplines'),
        fetchWithAuth('/api/personal-growth/personal-development-goals'),
        fetchWithAuth('/api/personal-growth/analytics/burnout-risk-summary'),
        fetchWithAuth('/api/personal-growth/analytics/members-needing-attention')
      ]);

      const membersData = membersRes.ok ? await membersRes.json() : [];
      const plansData = plansRes.ok ? await plansRes.json() : [];
      const burnoutData = burnoutRes.ok ? await burnoutRes.json() : [];
      const wellnessData = wellnessRes.ok ? await wellnessRes.json() : [];
      const spiritualData = spiritualRes.ok ? await spiritualRes.json() : [];
      const goalsData = goalsRes.ok ? await goalsRes.json() : [];
      const burnoutSummaryData = burnoutSummaryRes.ok ? await burnoutSummaryRes.json() : [];
      const membersAttentionData = membersAttentionRes.ok ? await membersAttentionRes.json() : [];

      setMembers(membersData);
      setGrowthPlans(plansData);
      setBurnoutAssessments(burnoutData);
      setWellnessCheckins(wellnessData);
      setSpiritualDisciplines(spiritualData);
      setPersonalDevelopmentGoals(goalsData);
      setAnalytics({
        burnoutSummary: burnoutSummaryData,
        membersNeedingAttention: membersAttentionData
      });

    } catch (err) {
      console.error('Failed to load personal growth data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateGrowthPlan = async () => {
    try {
      const response = await fetchWithAuth('/api/personal-growth/growth-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(growthPlanForm)
      });

      if (!response.ok) throw new Error('Failed to create growth plan');

      setGrowthPlanDialogOpen(false);
      setGrowthPlanForm({
        member_id: '', plan_title: '', plan_description: '', plan_category: 'spiritual',
        start_date: new Date(), target_completion_date: new Date(), primary_goal: '',
        accountability_partner: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Growth plan created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create growth plan:', err);
      setSnackbar({ open: true, message: 'Failed to create growth plan', severity: 'error' });
    }
  };

  const handleCreateBurnoutAssessment = async () => {
    try {
      const response = await fetchWithAuth('/api/personal-growth/burnout-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(burnoutForm)
      });

      if (!response.ok) throw new Error('Failed to create burnout assessment');

      setBurnoutDialogOpen(false);
      setBurnoutForm({
        member_id: '', assessment_date: new Date(), emotional_exhaustion: 5,
        depersonalization: 5, reduced_accomplishment: 5, work_hours_per_week: '',
        sleep_hours_per_night: '', stress_factors: '', support_system_rating: 5,
        physical_health_rating: 5, mental_health_rating: 5, spiritual_health_rating: 5,
        recommended_actions: '', intervention_needed: false, intervention_type: 'counseling'
      });
      loadData();
      setSnackbar({ open: true, message: 'Burnout assessment completed successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create burnout assessment:', err);
      setSnackbar({ open: true, message: 'Failed to complete assessment', severity: 'error' });
    }
  };

  const handleCreateWellnessCheckin = async () => {
    try {
      const response = await fetchWithAuth('/api/personal-growth/wellness-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wellnessForm)
      });

      if (!response.ok) throw new Error('Failed to create wellness check-in');

      setWellnessDialogOpen(false);
      setWellnessForm({
        member_id: '', checkin_date: new Date(), energy_level: 7, stress_level: 4,
        sleep_quality: 7, spiritual_connection: 8, exercise_days_this_week: 0,
        rest_days_this_week: 1, time_with_family: 0, personal_devotion_time: 0,
        ministry_hours_per_week: 0, non_ministry_hours_per_week: 0,
        work_life_balance_rating: 6, support_system_satisfaction: 7,
        community_connection_rating: 8, general_notes: '', goals_for_next_period: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Wellness check-in recorded successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create wellness check-in:', err);
      setSnackbar({ open: true, message: 'Failed to record check-in', severity: 'error' });
    }
  };

  const handleCreateSpiritualDiscipline = async () => {
    try {
      const response = await fetchWithAuth('/api/personal-growth/spiritual-disciplines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(spiritualForm)
      });

      if (!response.ok) throw new Error('Failed to record spiritual discipline');

      setSpiritualDialogOpen(false);
      setSpiritualForm({
        member_id: '', discipline_date: new Date(), bible_reading: false,
        prayer_time: false, meditation: false, fasting: false, worship: false,
        service: false, bible_reading_time: 0, prayer_time_minutes: 0,
        scripture_focus: '', spiritual_insights: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Spiritual discipline recorded successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to record spiritual discipline:', err);
      setSnackbar({ open: true, message: 'Failed to record discipline', severity: 'error' });
    }
  };

  const handleCreatePersonalDevelopmentGoal = async () => {
    try {
      const response = await fetchWithAuth('/api/personal-growth/personal-development-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalForm)
      });

      if (!response.ok) throw new Error('Failed to create personal development goal');

      setGoalDialogOpen(false);
      setGoalForm({
        member_id: '', goal_title: '', goal_description: '', goal_category: 'personal',
        specific_description: '', measurable_criteria: '', achievable_action_steps: [],
        relevant_reason: '', time_bound_deadline: new Date(), accountability_partner: '',
        start_date: new Date(), target_completion_date: new Date()
      });
      loadData();
      setSnackbar({ open: true, message: 'Personal development goal created successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to create personal development goal:', err);
      setSnackbar({ open: true, message: 'Failed to create goal', severity: 'error' });
    }
  };

  const getRiskLevelColor = (level) => {
    const colors = {
      low: 'success',
      moderate: 'warning',
      high: 'error',
      critical: 'error'
    };
    return colors[level] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'primary',
      completed: 'success',
      paused: 'warning',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  if (loading && members.length === 0) {
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
          Personal Growth & Wellness Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Monitor spiritual growth, prevent burnout, and support personal development
        </Typography>

        {/* Analytics Cards */}
        {analytics?.burnoutSummary && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">
                    {analytics.burnoutSummary.find(r => r.overall_risk_level === 'critical')?.count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Burnout Risk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {analytics.burnoutSummary.find(r => r.overall_risk_level === 'high')?.count || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Burnout Risk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {growthPlans.filter(p => p.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Growth Plans
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {analytics.membersNeedingAttention?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Members Needing Attention
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<SelfImprovement />}
            onClick={() => setGrowthPlanDialogOpen(true)}
          >
            Create Growth Plan
          </Button>
          <Button
            variant="outlined"
            startIcon={<HealthAndSafety />}
            onClick={() => setBurnoutDialogOpen(true)}
          >
            Burnout Assessment
          </Button>
          <Button
            variant="outlined"
            startIcon={<Spa />}
            onClick={() => setWellnessDialogOpen(true)}
          >
            Wellness Check-in
          </Button>
          <Button
            variant="outlined"
            startIcon={<Church />}
            onClick={() => setSpiritualDialogOpen(true)}
          >
            Spiritual Discipline
          </Button>
          <Button
            variant="outlined"
            startIcon={<Psychology />}
            onClick={() => setGoalDialogOpen(true)}
          >
            Development Goal
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Growth Plans" />
            <Tab label="Wellness & Burnout" />
            <Tab label="Spiritual Disciplines" />
            <Tab label="Development Goals" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {growthPlans.map((plan) => (
              <Grid item xs={12} md={6} key={plan.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {plan.plan_title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {plan.first_name} {plan.surname} • {plan.plan_category}
                        </Typography>
                      </Box>
                      <Chip
                        label={plan.status}
                        color={getStatusColor(plan.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Primary Goal:</strong> {plan.primary_goal}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Progress:</strong> {plan.overall_progress_percentage}%
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={plan.overall_progress_percentage}
                      sx={{ height: 8, borderRadius: 4, mb: 2 }}
                    />

                    <Typography variant="body2" gutterBottom>
                      <strong>Target Completion:</strong> {new Date(plan.target_completion_date).toLocaleDateString()}
                    </Typography>

                    {plan.accountability_first_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Accountability Partner:</strong> {plan.accountability_first_name} {plan.accountability_surname}
                      </Typography>
                    )}

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Update
                      </Button>
                      <Button size="small" startIcon={<Timeline />}>
                        View Milestones
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
              Wellness & Burnout Monitoring
            </Typography>

            <Grid container spacing={3}>
              {/* Burnout Assessments */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>🛡️ Burnout Risk Assessments</Typography>
                    {burnoutAssessments.slice(0, 5).map((assessment) => (
                      <Box key={assessment.id} mb={2}>
                        <Typography variant="body2">
                          <strong>{assessment.first_name} {assessment.surname}:</strong>
                          <Chip
                            label={assessment.overall_risk_level}
                            color={getRiskLevelColor(assessment.overall_risk_level)}
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(assessment.assessment_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Wellness Check-ins */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>💚 Recent Wellness Check-ins</Typography>
                    {wellnessCheckins.slice(0, 5).map((checkin) => (
                      <Box key={checkin.id} mb={2}>
                        <Typography variant="body2">
                          <strong>{checkin.first_name} {checkin.surname}:</strong>
                          Energy: {checkin.energy_level}/10, Stress: {checkin.stress_level}/10
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(checkin.checkin_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Members Needing Attention */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>⚠️ Members Needing Attention</Typography>
                    {analytics?.membersNeedingAttention?.map((member) => (
                      <Box key={member.id} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">
                          {member.first_name} {member.surname}
                        </Typography>
                        <Box display="flex" gap={1}>
                          {member.overall_risk_level && (
                            <Chip
                              label={`Burnout: ${member.overall_risk_level}`}
                              color={getRiskLevelColor(member.overall_risk_level)}
                              size="small"
                            />
                          )}
                          {member.stress_level > 7 && (
                            <Chip label={`Stress: ${member.stress_level}/10`} color="warning" size="small" />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Spiritual Discipline Tracking
            </Typography>

            <Grid container spacing={3}>
              {spiritualDisciplines.slice(0, 10).map((discipline) => (
                <Grid item xs={12} md={6} key={discipline.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {discipline.first_name} {discipline.surname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {new Date(discipline.discipline_date).toLocaleDateString()}
                      </Typography>

                      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                        {discipline.bible_reading && <Chip label="Bible Reading" size="small" color="primary" />}
                        {discipline.prayer_time && <Chip label="Prayer" size="small" color="primary" />}
                        {discipline.meditation && <Chip label="Meditation" size="small" color="primary" />}
                        {discipline.fasting && <Chip label="Fasting" size="small" color="primary" />}
                        {discipline.worship && <Chip label="Worship" size="small" color="primary" />}
                        {discipline.service && <Chip label="Service" size="small" color="primary" />}
                      </Box>

                      {discipline.scripture_focus && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Scripture Focus:</strong> {discipline.scripture_focus}
                        </Typography>
                      )}

                      {discipline.spiritual_insights && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Insights:</strong> {discipline.spiritual_insights}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tabValue === 3 && (
          <Grid container spacing={3}>
            {personalDevelopmentGoals.map((goal) => (
              <Grid item xs={12} md={6} key={goal.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {goal.goal_title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {goal.first_name} {goal.surname} • {goal.goal_category}
                        </Typography>
                      </Box>
                      <Chip
                        label={goal.status}
                        color={getStatusColor(goal.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Specific:</strong> {goal.specific_description}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Measurable:</strong> {goal.measurable_criteria}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Deadline:</strong> {new Date(goal.time_bound_deadline).toLocaleDateString()}
                    </Typography>

                    <Typography variant="body2" gutterBottom>
                      <strong>Progress:</strong> {goal.progress_percentage}%
                    </Typography>

                    <LinearProgress
                      variant="determinate"
                      value={goal.progress_percentage}
                      sx={{ height: 8, borderRadius: 4, mb: 2 }}
                    />

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Update
                      </Button>
                      <Button size="small" startIcon={<Timeline />}>
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Growth Plan Dialog */}
        <Dialog
          open={growthPlanDialogOpen}
          onClose={() => setGrowthPlanDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Personal Growth Plan</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === growthPlanForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setGrowthPlanForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" placeholder="Select member..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plan Title"
                  value={growthPlanForm.plan_title}
                  onChange={(e) => setGrowthPlanForm(prev => ({ ...prev, plan_title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Plan Category</InputLabel>
                  <Select
                    value={growthPlanForm.plan_category}
                    label="Plan Category"
                    onChange={(e) => setGrowthPlanForm(prev => ({ ...prev, plan_category: e.target.value }))}
                  >
                    <MenuItem value="spiritual">Spiritual Growth</MenuItem>
                    <MenuItem value="personal">Personal Development</MenuItem>
                    <MenuItem value="leadership">Leadership Development</MenuItem>
                    <MenuItem value="ministry">Ministry Skills</MenuItem>
                    <MenuItem value="family">Family & Relationships</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Target Completion Date"
                  value={growthPlanForm.target_completion_date}
                  onChange={(date) => setGrowthPlanForm(prev => ({ ...prev, target_completion_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Primary Goal"
                  value={growthPlanForm.primary_goal}
                  onChange={(e) => setGrowthPlanForm(prev => ({ ...prev, primary_goal: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === growthPlanForm.accountability_partner) || null}
                  onChange={(event, newValue) => {
                    setGrowthPlanForm(prev => ({
                      ...prev,
                      accountability_partner: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Accountability Partner (Optional)" placeholder="Select accountability partner..." fullWidth />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGrowthPlanDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateGrowthPlan} variant="contained">
              Create Growth Plan
            </Button>
          </DialogActions>
        </Dialog>

        {/* Burnout Assessment Dialog */}
        <Dialog
          open={burnoutDialogOpen}
          onClose={() => setBurnoutDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Burnout Risk Assessment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === burnoutForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setBurnoutForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" placeholder="Select member..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Burnout Indicators (1-10 scale)</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Emotional Exhaustion"
                  value={burnoutForm.emotional_exhaustion}
                  onChange={(e) => setBurnoutForm(prev => ({ ...prev, emotional_exhaustion: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Feeling emotionally drained"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Depersonalization"
                  value={burnoutForm.depersonalization}
                  onChange={(e) => setBurnoutForm(prev => ({ ...prev, depersonalization: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Feeling detached from others"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Reduced Accomplishment"
                  value={burnoutForm.reduced_accomplishment}
                  onChange={(e) => setBurnoutForm(prev => ({ ...prev, reduced_accomplishment: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 10 }}
                  helperText="Feeling ineffective at work"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Recommended Actions"
                  value={burnoutForm.recommended_actions}
                  onChange={(e) => setBurnoutForm(prev => ({ ...prev, recommended_actions: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={burnoutForm.intervention_needed}
                      onChange={(e) => setBurnoutForm(prev => ({ ...prev, intervention_needed: e.target.checked }))}
                    />
                  }
                  label="Intervention needed"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBurnoutDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateBurnoutAssessment} variant="contained">
              Complete Assessment
            </Button>
          </DialogActions>
        </Dialog>

        {/* Wellness Check-in Dialog */}
        <Dialog
          open={wellnessDialogOpen}
          onClose={() => setWellnessDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Wellness Check-in</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === wellnessForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setWellnessForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" placeholder="Select member..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Rate the following (1-10 scale)</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Energy Level"
                  value={wellnessForm.energy_level}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, energy_level: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stress Level"
                  value={wellnessForm.stress_level}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, stress_level: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Sleep Quality"
                  value={wellnessForm.sleep_quality}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, sleep_quality: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Spiritual Connection"
                  value={wellnessForm.spiritual_connection}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, spiritual_connection: parseInt(e.target.value) }))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Goals for Next Period"
                  value={wellnessForm.goals_for_next_period}
                  onChange={(e) => setWellnessForm(prev => ({ ...prev, goals_for_next_period: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWellnessDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateWellnessCheckin} variant="contained">
              Record Check-in
            </Button>
          </DialogActions>
        </Dialog>

        {/* Spiritual Discipline Dialog */}
        <Dialog
          open={spiritualDialogOpen}
          onClose={() => setSpiritualDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Record Spiritual Discipline</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === spiritualForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setSpiritualForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" placeholder="Select member..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Spiritual Disciplines Practiced Today</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={spiritualForm.bible_reading}
                      onChange={(e) => setSpiritualForm(prev => ({ ...prev, bible_reading: e.target.checked }))}
                    />
                  }
                  label="Bible Reading"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={spiritualForm.prayer_time}
                      onChange={(e) => setSpiritualForm(prev => ({ ...prev, prayer_time: e.target.checked }))}
                    />
                  }
                  label="Prayer Time"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={spiritualForm.meditation}
                      onChange={(e) => setSpiritualForm(prev => ({ ...prev, meditation: e.target.checked }))}
                    />
                  }
                  label="Meditation"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={spiritualForm.fasting}
                      onChange={(e) => setSpiritualForm(prev => ({ ...prev, fasting: e.target.checked }))}
                    />
                  }
                  label="Fasting"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={spiritualForm.worship}
                      onChange={(e) => setSpiritualForm(prev => ({ ...prev, worship: e.target.checked }))}
                    />
                  }
                  label="Worship"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={spiritualForm.service}
                      onChange={(e) => setSpiritualForm(prev => ({ ...prev, service: e.target.checked }))}
                    />
                  }
                  label="Service"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Scripture Focus (Optional)"
                  value={spiritualForm.scripture_focus}
                  onChange={(e) => setSpiritualForm(prev => ({ ...prev, scripture_focus: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Spiritual Insights (Optional)"
                  value={spiritualForm.spiritual_insights}
                  onChange={(e) => setSpiritualForm(prev => ({ ...prev, spiritual_insights: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSpiritualDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSpiritualDiscipline} variant="contained">
              Record Discipline
            </Button>
          </DialogActions>
        </Dialog>

        {/* Personal Development Goal Dialog */}
        <Dialog
          open={goalDialogOpen}
          onClose={() => setGoalDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Create Personal Development Goal</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === goalForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setGoalForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" placeholder="Select member..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Goal Title"
                  value={goalForm.goal_title}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, goal_title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Goal Category</InputLabel>
                  <Select
                    value={goalForm.goal_category}
                    label="Goal Category"
                    onChange={(e) => setGoalForm(prev => ({ ...prev, goal_category: e.target.value }))}
                  >
                    <MenuItem value="personal">Personal Development</MenuItem>
                    <MenuItem value="spiritual">Spiritual Growth</MenuItem>
                    <MenuItem value="professional">Professional</MenuItem>
                    <MenuItem value="relational">Relationships</MenuItem>
                    <MenuItem value="health">Health & Wellness</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Target Completion Date"
                  value={goalForm.time_bound_deadline}
                  onChange={(date) => setGoalForm(prev => ({ ...prev, time_bound_deadline: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Specific Description (SMART Goal)"
                  value={goalForm.specific_description}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, specific_description: e.target.value }))}
                  placeholder="What exactly do you want to achieve?"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Measurable Criteria"
                  value={goalForm.measurable_criteria}
                  onChange={(e) => setGoalForm(prev => ({ ...prev, measurable_criteria: e.target.value }))}
                  placeholder="How will you measure success?"
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === goalForm.accountability_partner) || null}
                  onChange={(event, newValue) => {
                    setGoalForm(prev => ({
                      ...prev,
                      accountability_partner: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Accountability Partner (Optional)" placeholder="Select accountability partner..." fullWidth />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGoalDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePersonalDevelopmentGoal} variant="contained">
              Create Goal
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

export default PersonalGrowthTracker;