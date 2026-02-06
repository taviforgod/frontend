import React, { useEffect, useMemo, useState, useContext, useRef, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, CardHeader, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, List, ListItem, ListItemText, ListItemAvatar, Divider, Avatar,
  LinearProgress
} from '@mui/material';
import {
  Shield, Users, CalendarToday, TrendingUp, Search, Add, Edit, Delete,
  Close, ExpandMore, Person, Phone, Email, CheckCircle, Warning,
  Error as ErrorIcon, Info, Refresh, Assessment, Target, ClipboardList,
  Heart, Activity, Star, Filter, Sort, Download, Upload, Print
} from '@mui/icons-material';
import {
  CrossIcon, PrayerHandsIcon, HeartCrossIcon, ShieldCrossIcon,
  BibleIcon, DoveIcon, LightIcon, CommunityIcon,
  HealingIcon, GuidingLightIcon
} from '../components/ChristianIcons.jsx';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, RefreshCcw, FileDown, Bell, AlertTriangle,
  UserCheck, ExternalLink, UserPlus, Timeline
} from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  getCrisisFollowups, createCrisisFollowup, updateCrisisFollowup, deleteCrisisFollowup,
  getCrisisSummary, getUrgentCases, getCaseDetails, createCrisisAssessment,
  getCrisisAssessments, createInterventionPlan, getInterventionPlans,
  createFollowupSession, getFollowupSessions, createCrisisReferral,
  getCrisisReferrals, createRecoveryMilestone, getRecoveryMilestones,
  getCrisisResources
} from '../services/crisisFollowupService';

/**
 * Comprehensive Crisis Management Dashboard
 * - Multi-tab interface: Dashboard, Cases, Assessments, Interventions, Sessions
 * - Real-time urgent case alerts
 * - Complete case lifecycle management
 * - Assessment tools and intervention planning
 * - Session tracking and milestone management
 * - Referral system and resource directory
 */

const CRISIS_TYPES = ['spiritual', 'financial', 'health', 'marital', 'emotional', 'bereavement', 'addiction', 'trauma', 'other'];
const CRISIS_CATEGORIES = ['personal', 'relational', 'spiritual', 'health', 'financial', 'legal', 'other'];
const EMOTIONAL_STATES = ['stable', 'anxious', 'distressed', 'critical'];
const SEVERITY_LEVELS = ['low', 'moderate', 'high', 'critical'];
const CASE_STATUSES = ['active', 'monitoring', 'escalated', 'resolved', 'closed'];
const RISK_LEVELS = ['low', 'moderate', 'high', 'critical'];

const ASSESSMENT_TYPES = ['initial', 'follow_up', 'risk_reassessment', 'crisis_intervention'];
const SESSION_TYPES = ['check_in', 'counseling', 'support', 'assessment', 'group_session'];
const MILESTONE_CATEGORIES = ['emotional', 'spiritual', 'practical', 'relational'];
const REFERRAL_TYPES = ['professional', 'community_service', 'church_resource', 'medical', 'legal'];

// Member Selector Component
function MemberSelector({ fetchWithAuth, value, onChange, label = "Select Member" }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load all members once when component mounts
  useEffect(() => {
    const loadMembers = async () => {
      if (!fetchWithAuth || loaded) return;
      
      try {
        setLoading(true);
        console.log('Loading all members for crisis care...');
        
        // Use the new all-members endpoint
        const res = await fetchWithAuth('/api/crisis-followups/all-members');
        
        if (!res.ok) {
          console.error('Failed to load members:', res.status, res.statusText);
          setMembers([]);
          return;
        }
        
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        console.log('Loaded members:', list.length);
        setMembers(list);
        setLoaded(true);
      } catch (err) {
        console.error('Failed to load members:', err);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [fetchWithAuth, loaded]);

  // Format member options for autocomplete
  const memberOptions = members.map(m => ({ 
    label: `${m.first_name} ${m.surname}`, 
    value: m.id, 
    ...m 
  }));

  // Find current value for autocomplete
  const currentValue = value ? memberOptions.find(opt => opt.value === value.id) || null : null;

  return (
    <Autocomplete
      options={memberOptions}
      getOptionLabel={(option) => option?.label || ''}
      value={currentValue}
      onChange={(_, newValue) => {
        onChange(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Select a member..."
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      loading={loading}
      noOptionsText={loading ? "Loading members..." : "No members found"}
      isOptionEqualToValue={(option, value) => option?.value === value?.value}
      filterOptions={(options, { inputValue }) => {
        // Client-side filtering by name or contact
        if (!inputValue) return options;
        
        const searchLower = inputValue.toLowerCase();
        return options.filter(option => 
          option.label.toLowerCase().includes(searchLower) ||
          option.phone?.toLowerCase().includes(searchLower) ||
          option.email?.toLowerCase().includes(searchLower)
        );
      }}
    />
  );
}

export default function CrisisFollowupPage() {
  const theme = useTheme();
  const auth = useContext(AuthContext);
  const { fetchWithAuth } = auth || {};
  const notifications = useNotifications();

  // Main state
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [urgentCases, setUrgentCases] = useState([]);
  const [summary, setSummary] = useState({});
  const [resources, setResources] = useState([]);
  // Show only cases for leader's cells when true
  const [leaderScope, setLeaderScope] = useState(false);

  // Dialog states
  const [caseDialog, setCaseDialog] = useState({ open: false, mode: 'create', case: null });
  const [assessmentDialog, setAssessmentDialog] = useState({ open: false, caseId: null });
  const [interventionDialog, setInterventionDialog] = useState({ open: false, caseId: null });
  const [sessionDialog, setSessionDialog] = useState({ open: false, caseId: null });
  const [referralDialog, setReferralDialog] = useState({ open: false, caseId: null });
  const [milestoneDialog, setMilestoneDialog] = useState({ open: false, caseId: null });
  const [assignDialog, setAssignDialog] = useState({ open: false, caseId: null, assignee: null });

  // Detail views
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    severity_level: 'all',
    case_status: 'all',
    crisis_type: 'all',
    risk_level: 'all'
  });

  // Forms
  const [caseForm, setCaseForm] = useState({
    member_id: '', member: null,
    crisis_type: '', crisis_category: '', severity_level: 'moderate',
    emotional_state: '', immediate_needs: '', confidentiality_level: 'standard',
    support_provided: '', external_referral: '', followup_person_id: '',
    followup_frequency: 'weekly', recovery_progress: 3, comments: '',
    next_followup_date: ''
  });

  const [assessmentForm, setAssessmentForm] = useState({
    assessment_type: 'initial',
    suicide_risk: 1, self_harm_risk: 1, harm_to_others_risk: 1, medical_risk: 1,
    depression_level: 3, anxiety_level: 3, hopelessness_level: 3, isolation_level: 3,
    family_support: false, friend_support: false, church_support: false, professional_help: false,
    support_network_notes: '', primary_trigger: '', contributing_factors: '', recent_stressors: '',
    overall_risk_level: 'moderate', immediate_action_required: false, immediate_action_details: '',
    assessment_notes: ''
  });

  const [interventionForm, setInterventionForm] = useState({
    plan_type: 'short_term', plan_start_date: '', plan_end_date: '',
    immediate_actions: [], immediate_timeline: 'within_24h',
    short_term_goals: [], short_term_interventions: [],
    long_term_goals: [], long_term_interventions: [],
    safety_plan: {}, emergency_contacts: [],
    assigned_caregivers: [], external_resources: [],
    review_frequency: 'weekly', next_review_date: ''
  });

  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Load main data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const churchId = auth?.user?.church_id;
      console.log('Loading crisis data for church:', churchId);

      const crisisParams = { church_id: churchId, limit: 100 };
      if (leaderScope) crisisParams.scope = 'leader';

      const [casesRes, summaryRes, urgentRes, resourcesRes] = await Promise.all([
        getCrisisFollowups(fetchWithAuth, crisisParams),
        getCrisisSummary(fetchWithAuth, churchId),
        getUrgentCases(fetchWithAuth, churchId),
        getCrisisResources(fetchWithAuth, { church_id: churchId })
      ]);

      console.log('Loaded crisis cases:', casesRes);
      console.log('Cases array length:', Array.isArray(casesRes) ? casesRes.length : 0);
      console.log('Loaded resources:', resourcesRes);
      console.log('Resources array length:', Array.isArray(resourcesRes) ? resourcesRes.length : 0);

      setCases(Array.isArray(casesRes) ? casesRes : []);
      setSummary(summaryRes || {});
      setUrgentCases(Array.isArray(urgentRes) ? urgentRes : []);
      setResources(Array.isArray(resourcesRes) ? resourcesRes : []);
    } catch (err) {
      console.error('Failed to load crisis data:', err);
      setSnackbar({ open: true, message: 'Failed to load crisis data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [auth?.user?.church_id, fetchWithAuth, leaderScope]);

  useEffect(() => {
    console.log('Initial useEffect triggered - calling loadData()');
    loadData();
  }, [loadData]);

  // Load case details
  const loadCaseDetails = useCallback(async (caseId) => {
    try {
      const details = await getCaseDetails(fetchWithAuth, caseId);
      setCaseDetails(details);
    } catch (err) {
      console.error('Failed to load case details:', err);
      setSnackbar({ open: true, message: 'Failed to load case details', severity: 'error' });
    }
  }, [fetchWithAuth]);

  // Filtered cases
  const filteredCases = useMemo(() => {
    return cases.filter(caseItem => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        `${caseItem.member_first_name || ''} ${caseItem.member_surname || ''} ${caseItem.crisis_type || ''} ${caseItem.comments || ''}`.toLowerCase().includes(query);

      const matchesSeverity = filters.severity_level === 'all' || caseItem.severity_level === filters.severity_level;
      const matchesStatus = filters.case_status === 'all' || caseItem.case_status === filters.case_status;
      const matchesType = filters.crisis_type === 'all' || caseItem.crisis_type === filters.crisis_type;
      const matchesRisk = filters.risk_level === 'all' || caseItem.current_risk_level === filters.risk_level;

      return matchesSearch && matchesSeverity && matchesStatus && matchesType && matchesRisk;
    });
  }, [cases, searchQuery, filters]);

  // Dialog handlers
  const openCaseDialog = (mode = 'create', caseItem = null) => {
    setCaseDialog({ open: true, mode, case: caseItem });
    if (caseItem) {
      setCaseForm({
        member_id: caseItem.member_id,
        member: {
          id: caseItem.member_id,
          first_name: caseItem.member_first_name,
          surname: caseItem.member_surname
        },
        crisis_type: caseItem.crisis_type || '',
        crisis_category: caseItem.crisis_category || '',
        severity_level: caseItem.severity_level || 'moderate',
        emotional_state: caseItem.emotional_state || '',
        immediate_needs: caseItem.immediate_needs || '',
        confidentiality_level: caseItem.confidentiality_level || 'standard',
        support_provided: caseItem.support_provided || '',
        external_referral: caseItem.external_referral || '',
        followup_person_id: caseItem.followup_person_id || '',
        followup_frequency: caseItem.followup_frequency || 'weekly',
        recovery_progress: caseItem.recovery_progress || 3,
        comments: caseItem.comments || '',
        next_followup_date: caseItem.next_followup_date || ''
      });
    } else {
      setCaseForm({
        member_id: '', member: null,
        crisis_type: '', crisis_category: '', severity_level: 'moderate',
        emotional_state: '', immediate_needs: '', confidentiality_level: 'standard',
        support_provided: '', external_referral: '', followup_person_id: '',
        followup_frequency: 'weekly', recovery_progress: 3, comments: '',
        next_followup_date: ''
      });
    }
  };

  const openAssessmentDialog = (caseId) => {
    setAssessmentDialog({ open: true, caseId });
    setAssessmentForm({
      assessment_type: 'follow_up',
      suicide_risk: 1, self_harm_risk: 1, harm_to_others_risk: 1, medical_risk: 1,
      depression_level: 3, anxiety_level: 3, hopelessness_level: 3, isolation_level: 3,
      family_support: false, friend_support: false, church_support: false, professional_help: false,
      support_network_notes: '', primary_trigger: '', contributing_factors: '', recent_stressors: '',
      overall_risk_level: 'moderate', immediate_action_required: false, immediate_action_details: '',
      assessment_notes: ''
    });
  };

  const handleAssignCase = async () => {
    try {
      if (!assignDialog.caseId || !assignDialog.assignee?.id) {
        setSnackbar({ open: true, message: 'Please select a member to assign', severity: 'warning' });
        return;
      }
      
      const payload = { assignee_member_id: assignDialog.assignee.id };
      const response = await fetchWithAuth(`/api/crisis-followups/${assignDialog.caseId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to assign case');
      }
      
      const result = await response.json();
      setSnackbar({ open: true, message: 'Case assigned successfully', severity: 'success' });
      setAssignDialog({ open: false, caseId: null, assignee: null });
      
      // Refresh data
      await loadData();
      if (selectedCase && assignDialog.caseId === selectedCase.id) {
        await loadCaseDetails(assignDialog.caseId);
      }
    } catch (err) {
      console.error('Failed to assign case:', err);
      setSnackbar({ open: true, message: `Assignment failed: ${err.message}`, severity: 'error' });
    }
  };

  // Form handlers
  const handleCaseSubmit = async () => {
    try {
      const payload = {
        ...caseForm,
        member_id: caseForm.member?.id || caseForm.member_id,
        church_id: auth?.user?.church_id
      };

      if (caseDialog.mode === 'edit' && caseDialog.case) {
        await updateCrisisFollowup(fetchWithAuth, caseDialog.case.id, payload);
        notifications.modules.crisis.caseCreated({ title: 'Success' });
      } else {
        await createCrisisFollowup(fetchWithAuth, payload);
        notifications.modules.crisis.caseCreated({ title: 'Success' });
      }

      setCaseDialog({ open: false, mode: 'create', case: null });
      loadData();
    } catch (err) {
      console.error('Case save failed:', err);
      notifications.crud.createError('crisis case');
    }
  };

  const handleAssessmentSubmit = async () => {
    try {
      await createCrisisAssessment(fetchWithAuth, assessmentDialog.caseId, assessmentForm);
      setAssessmentDialog({ open: false, caseId: null });
      notifications.success('Assessment completed successfully');
      if (selectedCase?.id === assessmentDialog.caseId) {
        loadCaseDetails(assessmentDialog.caseId);
      }
    } catch (err) {
      console.error('Assessment failed:', err);
      notifications.error('Failed to complete assessment');
    }
  };

  const handleCloseCase = async (caseId) => {
    try {
      await updateCrisisFollowup(fetchWithAuth, caseId, {
        case_status: 'closed',
        is_active: false,
        closed_date: new Date().toISOString().split('T')[0]
      });
      setSnackbar({ open: true, message: 'Case closed successfully', severity: 'success' });
      loadData();
    } catch (err) {
      console.error('Case close failed:', err);
      setSnackbar({ open: true, message: 'Failed to close case', severity: 'error' });
    }
  };

  // Utility functions
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'moderate': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'moderate': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  const isOverdue = (nextFollowupDate) => {
    if (!nextFollowupDate) return false;
    const today = new Date();
    const followup = new Date(nextFollowupDate);
    return followup < today;
  };

  if (loading && !cases.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, background: theme.palette.background.default, minHeight: '100vh' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Crisis Management Center
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Comprehensive crisis care and intervention management
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<HeartCrossIcon />}
              onClick={() => openCaseDialog('create')}
              sx={{
                background: 'linear-gradient(45deg, #2E7D32 0%, #43A047 100%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1B5E20 0%, #2E7D32 100%)',
                }
              }}
            >
              New Crisis Case
            </Button>
            <Button
              variant={leaderScope ? 'contained' : 'outlined'}
              startIcon={<UserPlus />}
              onClick={() => setLeaderScope(s => !s)}
              sx={{ mr: 1 }}
              title="Show cases for the cell(s) you lead"
            >
              {leaderScope ? 'Leader: My Cell Cases' : 'Show My Cell Cases'}
            </Button>
            <IconButton onClick={loadData} sx={{
              backgroundColor: 'rgba(46, 125, 50, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(46, 125, 50, 0.2)'
              }
            }}>
              <RefreshCcw />
            </IconButton>
          </Box>
        </Box>

        {/* Urgent Cases Alert */}
        {urgentCases.length > 0 && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <PrayerHandsIcon sx={{ mr: 1 }} />
            <strong>{urgentCases.length} urgent cases</strong> require immediate prayer and intervention
          </Alert>
        )}

        {/* Summary Dashboard */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="error.main">
                      {summary.critical_cases || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Critical Cases
                    </Typography>
                  </Box>
                  <AlertTriangle color="error" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="warning.main">
                      {summary.active || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Cases
                    </Typography>
                  </Box>
                  <HeartCrossIcon color="warning" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="info.main">
                      {summary.due_today || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Due Today
                    </Typography>
                  </Box>
                  <GuidingLightIcon color="info" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" color="success.main">
                      {Math.round(summary.avg_recovery_progress || 0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Recovery
                    </Typography>
                  </Box>
                  <HealingIcon color="success" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Dashboard" icon={<ShieldCrossIcon />} />
            <Tab label="Active Cases" icon={<HeartCrossIcon />} />
            <Tab label="Assessments" icon={<BibleIcon />} />
            <Tab label="Interventions" icon={<PrayerHandsIcon />} />
            <Tab label="Sessions" icon={<CommunityIcon />} />
            <Tab label="Resources" icon={<LightIcon />} />
            <Tab label="Reports" icon={<TrendingUp />} />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Box>
            {/* Urgent Cases */}
            {urgentCases.length > 0 && (
              <Card sx={{ mb: 3 }}>
                <CardHeader title="🚨 Urgent Cases Requiring Attention" />
                <CardContent>
                  <Grid container spacing={2}>
                    {urgentCases.slice(0, 6).map((caseItem) => (
                      <Grid item xs={12} md={6} key={caseItem.id}>
                        <Card variant="outlined" sx={{ borderColor: 'error.main' }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                              <Typography variant="h6">
                                {caseItem.member_first_name} {caseItem.member_surname}
                              </Typography>
                              <Chip
                                label={caseItem.severity_level}
                                color={getSeverityColor(caseItem.severity_level)}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                              {caseItem.crisis_type} • {caseItem.date_reported}
                            </Typography>
                            {caseItem.current_risk_level && (
                              <Typography variant="body2" sx={{ color: getRiskColor(caseItem.current_risk_level) }}>
                                Risk Level: {caseItem.current_risk_level}
                              </Typography>
                            )}
                            <Box mt={2}>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                onClick={() => setSelectedCase(caseItem)}
                              >
                                View Details
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Recent Cases */}
            <Card>
              <CardHeader title="Recent Crisis Cases" />
              <CardContent>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Member</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Severity</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Next Follow-up</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCases.slice(0, 10).map((caseItem) => (
                        <TableRow key={caseItem.id}>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                {caseItem.member_first_name?.[0]}{caseItem.member_surname?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {caseItem.member_first_name} {caseItem.member_surname}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {caseItem.contact_primary}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{caseItem.crisis_type}</TableCell>
                          <TableCell>
                            <Chip
                              label={caseItem.severity_level}
                              color={getSeverityColor(caseItem.severity_level)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{caseItem.case_status}</TableCell>
                          <TableCell>
                            {caseItem.next_followup_date && (
                              <Typography
                                variant="body2"
                                color={isOverdue(caseItem.next_followup_date) ? 'error.main' : 'text.primary'}
                              >
                                {new Date(caseItem.next_followup_date).toLocaleDateString()}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedCase(caseItem);
                                loadCaseDetails(caseItem.id);
                              }}
                            >
                              <ExternalLink size={16} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            {/* Filters */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6} md={3}>
                    <TextField
                      fullWidth
                      placeholder="Search cases..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Severity</InputLabel>
                      <Select
                        value={filters.severity_level}
                        label="Severity"
                        onChange={(e) => setFilters(prev => ({ ...prev, severity_level: e.target.value }))}
                      >
                        <MenuItem value="all">All Severities</MenuItem>
                        {SEVERITY_LEVELS.map(level => (
                          <MenuItem key={level} value={level}>{level}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={filters.case_status}
                        label="Status"
                        onChange={(e) => setFilters(prev => ({ ...prev, case_status: e.target.value }))}
                      >
                        <MenuItem value="all">All Statuses</MenuItem>
                        {CASE_STATUSES.map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => setFilters({
                        severity_level: 'all',
                        case_status: 'all',
                        crisis_type: 'all',
                        risk_level: 'all'
                      })}
                    >
                      Reset Filters
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Cases Grid */}
            <Grid container spacing={3}>
              {filteredCases.map((caseItem) => (
                <Grid item xs={12} md={6} lg={4} key={caseItem.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {caseItem.member_first_name} {caseItem.member_surname}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {caseItem.crisis_type} • {caseItem.crisis_category}
                          </Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Chip
                            label={caseItem.severity_level}
                            color={getSeverityColor(caseItem.severity_level)}
                            size="small"
                          />
                          {caseItem.current_risk_level && (
                            <Chip
                              label={`Risk: ${caseItem.current_risk_level}`}
                              size="small"
                              sx={{ bgcolor: getRiskColor(caseItem.current_risk_level), color: 'white' }}
                            />
                          )}
                        </Box>
                      </Box>

                      <Box mb={2}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Status:</strong> {caseItem.case_status}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Progress:</strong> {caseItem.recovery_progress}/5
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(caseItem.recovery_progress / 5) * 100}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>

                      {caseItem.comments && (
                        <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                          "{caseItem.comments.length > 100 ? caseItem.comments.slice(0, 100) + '...' : caseItem.comments}"
                        </Typography>
                      )}

                      <Box display="flex" gap={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ExternalLink />}
                          onClick={() => {
                            setSelectedCase(caseItem);
                            loadCaseDetails(caseItem.id);
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<CheckCircle />}
                          onClick={() => openAssessmentDialog(caseItem.id)}
                        >
                          Assess
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => handleCloseCase(caseItem.id)}
                        >
                          Close
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {filteredCases.length === 0 && (
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="text.secondary">
                  No crisis cases found matching your criteria
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Case Details Modal */}
        {selectedCase && (
          <Dialog
            open={!!selectedCase}
            onClose={() => setSelectedCase(null)}
            maxWidth="lg"
            fullWidth
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2} justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar>
                    {selectedCase.member_first_name?.[0]}{selectedCase.member_surname?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">
                      {selectedCase.member_first_name} {selectedCase.member_surname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCase.crisis_type} • {selectedCase.severity_level} priority
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<UserPlus />}
                  onClick={() => setAssignDialog({ open: true, caseId: selectedCase.id, assignee: null })}
                >
                  Assign
                </Button>
              </Box>
            </DialogTitle>
            <DialogContent>
              {caseDetails ? (
                <Box>
                  {/* Case Information */}
                  <Card sx={{ mb: 3 }}>
                    <CardHeader title="Case Information" />
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Type</Typography>
                          <Typography>{caseDetails.crisis_type}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Severity</Typography>
                          <Chip label={caseDetails.severity_level} color={getSeverityColor(caseDetails.severity_level)} />
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Typography>{caseDetails.case_status}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">Recovery Progress</Typography>
                          <Typography>{caseDetails.recovery_progress}/5</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Assessments */}
                  {caseDetails.assessments && caseDetails.assessments.length > 0 && (
                    <Card sx={{ mb: 3 }}>
                      <CardHeader title="Risk Assessments" />
                      <CardContent>
                        {caseDetails.assessments.map((assessment) => (
                          <Accordion key={assessment.id}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography>
                                {assessment.assessment_type} - {new Date(assessment.assessment_date).toLocaleDateString()}
                              </Typography>
                              <Chip
                                label={assessment.overall_risk_level}
                                color={getSeverityColor(assessment.overall_risk_level)}
                                size="small"
                                sx={{ ml: 2 }}
                              />
                            </AccordionSummary>
                            <AccordionDetails>
                              <Typography variant="body2">
                                Risk Assessment Details...
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Intervention Plans */}
                  {caseDetails.intervention_plans && caseDetails.intervention_plans.length > 0 && (
                    <Card sx={{ mb: 3 }}>
                      <CardHeader title="Intervention Plans" />
                      <CardContent>
                        {caseDetails.intervention_plans.map((plan) => (
                          <Accordion key={plan.id}>
                            <AccordionSummary expandIcon={<ExpandMore />}>
                              <Typography>{plan.plan_type} Plan - {plan.plan_status}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Typography variant="body2">
                                Plan details and actions...
                              </Typography>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Follow-up Sessions */}
                  {caseDetails.followup_sessions && caseDetails.followup_sessions.length > 0 && (
                    <Card sx={{ mb: 3 }}>
                      <CardHeader title="Follow-up Sessions" />
                      <CardContent>
                        <List>
                          {caseDetails.followup_sessions.map((session) => (
                            <ListItem key={session.id}>
                              <ListItemAvatar>
                                <Avatar>
                                  <CalendarToday size={20} />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${session.session_type} - ${new Date(session.session_date).toLocaleDateString()}`}
                                secondary={`Duration: ${session.session_duration} min • ${session.emotional_state}`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </CardContent>
                    </Card>
                  )}
                </Box>
              ) : (
                <CircularProgress />
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* New Case Dialog */}
        <Dialog
          open={caseDialog.open}
          onClose={() => setCaseDialog({ open: false, mode: 'create', case: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {caseDialog.mode === 'edit' ? 'Edit Crisis Case' : 'New Crisis Case'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <MemberSelector
                  fetchWithAuth={fetchWithAuth}
                  value={caseForm.member}
                  onChange={(member) => setCaseForm(prev => ({ ...prev, member, member_id: member?.id || '' }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Crisis Type</InputLabel>
                  <Select
                    value={caseForm.crisis_type}
                    label="Crisis Type"
                    onChange={(e) => setCaseForm(prev => ({ ...prev, crisis_type: e.target.value }))}
                  >
                    {CRISIS_TYPES.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={caseForm.crisis_category}
                    label="Category"
                    onChange={(e) => setCaseForm(prev => ({ ...prev, crisis_category: e.target.value }))}
                  >
                    {CRISIS_CATEGORIES.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Severity Level</InputLabel>
                  <Select
                    value={caseForm.severity_level}
                    label="Severity Level"
                    onChange={(e) => setCaseForm(prev => ({ ...prev, severity_level: e.target.value }))}
                  >
                    {SEVERITY_LEVELS.map(level => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Emotional State</InputLabel>
                  <Select
                    value={caseForm.emotional_state}
                    label="Emotional State"
                    onChange={(e) => setCaseForm(prev => ({ ...prev, emotional_state: e.target.value }))}
                  >
                    {EMOTIONAL_STATES.map(state => (
                      <MenuItem key={state} value={state}>{state}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Immediate Needs"
                  value={caseForm.immediate_needs}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, immediate_needs: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Support Provided"
                  value={caseForm.support_provided}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, support_provided: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Follow-up Frequency</InputLabel>
                  <Select
                    value={caseForm.followup_frequency}
                    label="Follow-up Frequency"
                    onChange={(e) => setCaseForm(prev => ({ ...prev, followup_frequency: e.target.value }))}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="biweekly">Bi-weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Next Follow-up Date"
                  InputLabelProps={{ shrink: true }}
                  value={caseForm.next_followup_date}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, next_followup_date: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Comments"
                  value={caseForm.comments}
                  onChange={(e) => setCaseForm(prev => ({ ...prev, comments: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCaseDialog({ open: false, mode: 'create', case: null })}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCaseSubmit}>
              {caseDialog.mode === 'edit' ? 'Update Case' : 'Create Case'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Assessment Dialog */}
        <Dialog
          open={assessmentDialog.open}
          onClose={() => setAssessmentDialog({ open: false, caseId: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Crisis Risk Assessment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Assessment Type</InputLabel>
                  <Select
                    value={assessmentForm.assessment_type}
                    label="Assessment Type"
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, assessment_type: e.target.value }))}
                  >
                    {ASSESSMENT_TYPES.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Risk Assessment (1-10 scale)</Typography>
              </Grid>

              {[
                { key: 'suicide_risk', label: 'Suicide Risk' },
                { key: 'self_harm_risk', label: 'Self-Harm Risk' },
                { key: 'harm_to_others_risk', label: 'Harm to Others Risk' },
                { key: 'medical_risk', label: 'Medical Risk' }
              ].map(({ key, label }) => (
                <Grid item xs={6} sm={3} key={key}>
                  <TextField
                    fullWidth
                    type="number"
                    label={label}
                    inputProps={{ min: 1, max: 10 }}
                    value={assessmentForm[key]}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, [key]: parseInt(e.target.value) || 1 }))}
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Emotional State Assessment</Typography>
              </Grid>

              {[
                { key: 'depression_level', label: 'Depression Level' },
                { key: 'anxiety_level', label: 'Anxiety Level' },
                { key: 'hopelessness_level', label: 'Hopelessness Level' },
                { key: 'isolation_level', label: 'Isolation Level' }
              ].map(({ key, label }) => (
                <Grid item xs={6} sm={3} key={key}>
                  <TextField
                    fullWidth
                    type="number"
                    label={label}
                    inputProps={{ min: 1, max: 10 }}
                    value={assessmentForm[key]}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, [key]: parseInt(e.target.value) || 1 }))}
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Support Network</Typography>
              </Grid>

              {[
                { key: 'family_support', label: 'Family Support' },
                { key: 'friend_support', label: 'Friend Support' },
                { key: 'church_support', label: 'Church Support' },
                { key: 'professional_help', label: 'Professional Help' }
              ].map(({ key, label }) => (
                <Grid item xs={6} sm={3} key={key}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={assessmentForm[key]}
                        onChange={(e) => setAssessmentForm(prev => ({ ...prev, [key]: e.target.checked }))}
                      />
                    }
                    label={label}
                  />
                </Grid>
              ))}

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Overall Risk Level</InputLabel>
                  <Select
                    value={assessmentForm.overall_risk_level}
                    label="Overall Risk Level"
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, overall_risk_level: e.target.value }))}
                  >
                    {RISK_LEVELS.map(level => (
                      <MenuItem key={level} value={level}>{level}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={assessmentForm.immediate_action_required}
                      onChange={(e) => setAssessmentForm(prev => ({ ...prev, immediate_action_required: e.target.checked }))}
                    />
                  }
                  label="Immediate Action Required"
                />
              </Grid>

              {assessmentForm.immediate_action_required && (
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Immediate Action Details"
                    value={assessmentForm.immediate_action_details}
                    onChange={(e) => setAssessmentForm(prev => ({ ...prev, immediate_action_details: e.target.value }))}
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Assessment Notes"
                  value={assessmentForm.assessment_notes}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, assessment_notes: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssessmentDialog({ open: false, caseId: null })}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleAssessmentSubmit}>
              Complete Assessment
            </Button>
          </DialogActions>
        </Dialog>

        {tabValue === 6 && (
          <Box>
            <Typography variant="h4" gutterBottom>
              Crisis Reports & Analytics
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Case Statistics" />
                  <CardContent>
                    <Typography variant="h6" color="primary">
                      Total Active Cases: {cases.filter(c => c.case_status === 'active').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Critical Cases: {cases.filter(c => c.severity_level === 'critical').length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      High Priority: {cases.filter(c => c.severity_level === 'high').length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="Assessment Overview" />
                  <CardContent>
                    <Typography variant="h6" color="secondary">
                      Total Assessments: {cases.reduce((sum, c) => sum + (c.assessments?.length || 0), 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      High Risk Assessments: {cases.reduce((sum, c) =>
                        sum + (c.assessments?.filter(a => a.overall_risk_level === 'critical' || a.overall_risk_level === 'high').length || 0), 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Monthly Trends" />
                  <CardContent>
                    <Typography variant="body1" color="text.secondary">
                      Crisis case trends and intervention effectiveness reports will be displayed here.
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      This section will include charts and graphs showing case resolution rates, intervention success metrics, and resource utilization.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Assign Case Dialog */}
        <Dialog
          open={assignDialog.open}
          onClose={() => setAssignDialog({ open: false, caseId: null, assignee: null })}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assign Case to Leader</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select an active leader to assign this crisis case to:
            </Typography>
            <MemberSelector
              fetchWithAuth={fetchWithAuth}
              value={assignDialog.assignee}
              onChange={(member) => setAssignDialog(prev => ({ ...prev, assignee: member }))}
              label="Select Leader to Assign"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialog({ open: false, caseId: null, assignee: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignCase}
              variant="contained"
              disabled={!assignDialog.assignee}
            >
              Assign Case
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
