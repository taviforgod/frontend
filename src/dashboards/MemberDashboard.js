import React, { useEffect, useState, useCallback, useMemo, useContext } from 'react';
import {
  Box, Typography, Card, CardContent, CardHeader, Stack, Chip, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, IconButton,
  CircularProgress, LinearProgress, Avatar, Tooltip, List, ListItem,
  ListItemAvatar, ListItemText, Badge, AvatarGroup, Snackbar, Alert,
  Skeleton, Tabs, Tab, Paper, TextField, InputAdornment, InputLabel,
  FormControl, Select, MenuItem, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  User, Calendar, BookOpen, HeartHandshake, PlusCircle, Users,
  CalendarCheck, Bell, PhoneCall, PieChart, BarChart2, Clock, CheckCircle, CircleDashed, AlertCircle,
  Search, TrendingUp, Activity, Target, Award, Gift, MessageSquare, 
  FileText, Settings, HelpCircle, Star, ChevronRight, Home, Church,
  Users2, CalendarDays, Heart, BookMarked, UserCheck, Mail, Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PrayerForm from '../components/prayer/PrayerForm';
import DashboardLayout from '../components/DashboardLayout';
import dashboardAPI from '../services/dashboardAPI';
import { getMyCellGroups } from '../services/cellGroupService';
import { getMyWeeklyReportSummary } from '../services/weeklyReportService';
import { getPrayerRequests } from '../services/prayerService';
import { getAssignmentsByMentee } from '../services/mentorshipService';
import { listNotifications } from '../services/notificationService';
import { getAttendance } from '../services/attendanceService';
import { ThemeContext } from '../contexts/ThemeContext';
import { AuthContext } from '../contexts/AuthContext';
import { DateTime } from 'luxon';
import { useTheme } from '@mui/material/styles';
import MemberMilestones from '../components/spiritual/MemberMilestones';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import NotificationWidget from '../components/NotificationWidget';
import HeroHeader from '../components/dashboard/HeroHeader';

const API_URL = process.env.REACT_APP_API_URL || '';

const normalizeFoundationFromEnrollments = (enrollments) => {
  if (!Array.isArray(enrollments) || enrollments.length === 0) return null;
  const sorted = [...enrollments].sort(
    (a, b) => new Date(b.enrollment_date || 0) - new Date(a.enrollment_date || 0)
  );
  const current = sorted[0];
  const progressPercent = current.status === 'completed'
    ? 100
    : current.current_module
      ? Math.min(100, Math.round((current.current_module / 8) * 100))
      : undefined;

  return {
    level: current.level ?? current.class_level ?? current.level_completed ?? null,
    status: current.status,
    graduation_date: current.completion_date || current.graduation_date || null,
    progress_percent: progressPercent,
    level_notes: current.notes || current.level_notes,
  };
};

/* Small radial progress overlaying a CircularProgress */
function RadialProgress({ value = 0, size = 64, thickness = 6, label, color = 'primary' }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      <CircularProgress variant="determinate" value={Math.min(100, value)} size={size} thickness={thickness} color={color} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 700 }}>{`${Math.round(value)}%`}</Typography>
        {label && <Typography variant="caption" sx={{ mt: 0.2 }}>{label}</Typography>}
      </Box>
    </Box>
  );
}

/* Simple sparkline SVG from an array of numeric values 0..1 */
function Sparkline({ values = [], stroke, width = 100, height = 28 }) {
  const theme = useTheme();
  const strokeColor = stroke || theme.palette.primary.main;
  if (!values || values.length === 0) {
    return <Box sx={{ width, height, bgcolor: theme.palette.grey[100], borderRadius: 1 }} />;
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);
  const points = values.map((v, i) => {
    const x = i * step;
    // invert y: higher value -> lower y
    const y = height - ((v - min) / range) * height;;
    return [x, y];
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="sparkGrad" x1="0" x2="1">
          <stop offset="0%" stopColor={theme.palette.info.light} stopOpacity="0.9" />
          <stop offset="100%" stopColor={theme.palette.info.light} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkGrad)" />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Mini attendance bar chart using simple divs */
function AttendanceBars({ records = [], maxHeight = 36 }) {
  if (!records || records.length === 0) {
    return <Typography variant="caption" color="text.secondary">No attendance history</Typography>;
  }
  // Map present -> tall bar, absent -> short bar. Use deterministic sizes (not random) based on index to avoid layout jumps.
  return (
    <Box display="flex" alignItems="end" gap={0.5} sx={{ mt: 1 }}>
      {records.slice(0, 10).map((r, i) => {
        const height = r.present ? Math.round(maxHeight * (0.6 + ((i % 4) * 0.1))) : Math.round(maxHeight * (0.15 + ((i % 3) * 0.05)));
        return (
          <Tooltip key={i} title={`${r.present ? 'Present' : 'Absent'} • ${DateTime.fromISO(r.meeting_date).toLocaleString(DateTime.DATE_MED)}`}>
            <Box
              role="img"
              aria-label={`${r.present ? 'Present' : 'Absent'} on ${new Date(r.meeting_date).toLocaleDateString()}`}
              sx={{
                width: 8,
                height,
                bgcolor: r.present ? 'success.main' : 'grey.300',
                borderRadius: 1,
                transition: 'transform 0.12s',
                '&:hover': { transform: 'translateY(-3px)' }
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}

export default function MemberDashboard() {
  const { theme } = useContext(ThemeContext);
  const { fetchWithAuth, user } = useContext(AuthContext);
  const navigate = useNavigate();
  // modal
  const [open, setOpen] = useState(false);
  const handleOpenForm = () => {
    setOpen(true);
  };
  const handleCloseForm = () => setOpen(false);

  // snack
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const [snackSeverity, setSnackSeverity] = useState('info'); // 'success' | 'error' | 'info' | 'warning'

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackMsg(message);
    setSnackSeverity(severity);
    setSnackOpen(true);
  }, []);

  const handleCloseSnack = useCallback((event, reason) => {
    if (reason === 'clickaway') return;
    setSnackOpen(false);
  }, []);

  // Comprehensive dashboard state
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [myPrayers, setMyPrayers] = useState([]);
  const [myGiving, setMyGiving] = useState(null);
  const [myTestimonies, setMyTestimonies] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [myMentorship, setMyMentorship] = useState(null);
  const [myFoundation, setMyFoundation] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myNotifications, setMyNotifications] = useState([]);
  const [myStats, setMyStats] = useState({
    prayerCount: 0,
    givingTotal: 0,
    testimonyCount: 0,
    attendanceRate: 0,
    upcomingEvents: 0
  });

  // cell module state (kept same as original)
  const [cellLoading, setCellLoading] = useState(true);
  const [myCell, setMyCell] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [growth, setGrowth] = useState(null);
  const [mentorships, setMentorships] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [leaderHealth, setLeaderHealth] = useState(null);
  const [rsvpInProgress, setRsvpInProgress] = useState(false);
  const [foundation, setFoundation] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [myWeeklySummary, setMyWeeklySummary] = useState(null); 

  // per-meeting RSVP pending state and error state
  const [rsvpPending, setRsvpPending] = useState({}); 
  const [rsvpError, setRsvpError] = useState({}); 

  // Add a refresh key for milestones
  const [milestoneRefreshKey, setMilestoneRefreshKey] = useState(0);

  // When a milestone is added or deleted, increment the refresh key
  const handleMilestoneRefresh = useCallback(() => {
    setMilestoneRefreshKey(k => k + 1);
  }, []);

  // Load comprehensive dashboard data
  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      try {
        setCellLoading(true);
        console.log('🔄 Starting dashboard data load...');
        
        // Get cell groups first to have cell ID for attendance
        console.log('📱 Fetching cell groups...');
        const cellGroups = await getMyCellGroups(fetchWithAuth);
        console.log('✅ Cell groups received:', cellGroups);
        const cellData = Array.isArray(cellGroups) && cellGroups.length > 0 ? cellGroups[0] : null;
        console.log('🏠 Cell data:', cellData);
        
        // Load data one by one to identify which service fails
        console.log('🙏 Fetching prayers...');
        const prayers = await getPrayerRequests(fetchWithAuth, { limit: 5 });
        console.log('✅ Prayers received:', prayers);
        
        console.log('👥 Fetching mentorship...');
        const mentorship = await getAssignmentsByMentee(fetchWithAuth, user?.id || 'me');
        console.log('✅ Mentorship received:', mentorship);
        
        console.log('🎓 Fetching foundation...');
        const memberKey = user?.member_id || user?.id;
        const enrollmentsRes = memberKey
          ? await fetchWithAuth(`/api/foundation-school/enrollments?member_id=${encodeURIComponent(memberKey)}`)
          : { ok: false, json: async () => [] };
        const enrollmentsPayload = enrollmentsRes.ok ? await enrollmentsRes.json() : [];
        const memberEnrollments = Array.isArray(enrollmentsPayload) ? enrollmentsPayload : [];
        const foundation = normalizeFoundationFromEnrollments(memberEnrollments);
        console.log('✅ Foundation received:', foundation);
        
        console.log('📊 Fetching attendance...');
        const attendance = cellData ? await getAttendance(fetchWithAuth, cellData.id) : [];
        console.log('✅ Attendance received:', attendance);
        
        console.log('🔔 Fetching notifications...');
        const notifications = await listNotifications(fetchWithAuth, { unread_only: true, limit: 10 });
        console.log('✅ Notifications received:', notifications);

        if (!mounted) return;

        // Process cell data
        setMyCell(cellData);

        // Set all data
        setMyPrayers(Array.isArray(prayers) ? prayers : []);
        setMyMentorship(mentorship);
        setMyFoundation(memberEnrollments);
        setFoundation(foundation);
        setMyAttendance(Array.isArray(attendance) ? attendance : []);
        setMyNotifications(Array.isArray(notifications) ? notifications : []);

        // Calculate user stats
        const stats = {
          prayerCount: Array.isArray(prayers) ? prayers.length : 0,
          givingTotal: 0, // Will be implemented when giving service is available
          testimonyCount: 0, // Will be implemented when testimony service is available
          attendanceRate: Array.isArray(attendance) && attendance.length > 0 
            ? Math.round((attendance.filter(a => a.present).length / attendance.length) * 100) 
            : 0,
          upcomingEvents: 0 // Will be implemented when event service is available
        };
        setMyStats(stats);
        
        console.log('✅ Dashboard data loaded successfully!');

      } catch (err) {
        console.error('❌ Error loading dashboard data:', err);
        showSnackbar(`Error loading dashboard data: ${err.message}`, 'error');
      } finally {
        if (mounted) setCellLoading(false);
      }
    }

    loadDashboardData();
    return () => { mounted = false; };
  }, [fetchWithAuth, showSnackbar, user?.id]);

  // RSVP handler (per-item, optimistic pending) — preserved endpoints
  const handleRsvp = useCallback(async (meetingId, attending = true) => {
    // if a per-item rsvp is in progress ignore
    if (rsvpPending[meetingId]) return;
    setRsvpPending(prev => ({ ...prev, [meetingId]: true }));
    setRsvpError(prev => ({ ...prev, [meetingId]: undefined }));

    try {
      const res = await fetch(`${API_URL}/api/cells/meetings/${meetingId}/rsvp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ attending })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error || 'RSVP failed';
        setRsvpError(prev => ({ ...prev, [meetingId]: msg }));
        showSnackbar(`RSVP failed: ${msg}`, 'error');
        return;
      }
      // optimistic success message
      showSnackbar('RSVP saved', 'success');

      // refresh meetings list (attempt to keep data up to date)
      if (myCell?.id) {
        const reload = await fetch(`${API_URL}/api/cells/${myCell.id}/meetings?limit=3`, { credentials: 'include' });
        if (reload.ok) {
          const list = await reload.json();
          setMeetings(Array.isArray(list) && list.length ? [list[0]] : []);
        }
      }
    } catch (e) {
      console.error(e);
      setRsvpError(prev => ({ ...prev, [meetingId]: e.message || 'RSVP failed' }));
      showSnackbar(`RSVP failed: ${e.message || 'unknown error'}`, 'error');
    } finally {
      setRsvpPending(prev => {
        const copy = { ...prev };
        delete copy[meetingId];
        return copy;
      });
    }
  }, [myCell?.id, rsvpPending, showSnackbar]);

  // Helper: count consecutive absences from attendanceHistory (kept as original)
  function countConsecutiveAbsences(records) {
    let count = 0;
    for (const rec of records) {
      if (rec.present) break;
      count++;
    }
    return count;
  }

  // Helper: get last attended date
  function getLastAttendedDate(records) {
    const last = records.find(rec => rec.present);
    return last ? new Date(last.meeting_date) : null;
  }

  const leaderStatusColor = (status) => {
    if (status === 'Healthy' || status === 'healthy') return 'success';
    if (status === 'At Risk' || status === 'at_risk' || status === 'Risk') return 'error';
    return 'warning';
  };

  // Motion-wrapped card for subtle appearance/hover
  const MotionCard = motion(Card);

  // helper: small urgency chip for meetings
  function meetingUrgencyChip(sessionDate) {
    if (!sessionDate) return <Chip label="TBD" size="small" />;
    const days = Math.round((new Date(sessionDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return <Chip label="Today" color="error" size="small" />;
    if (days <= 3) return <Chip label={`In ${days}d`} color="warning" size="small" />;
    return <Chip label={`In ${days}d`} size="small" />;
  }

  // MeetingItem is a small presentational component for each meeting row, memoized
  const MeetingItem = useMemo(() => {
    function Inner({ mt, onRsvp, pending }) {
      // use meeting_date (from weekly_reports) as session date
      const sessionDate = mt?.meeting_date ? new Date(mt.meeting_date) : null;
      return (
        <ListItem
          key={mt.id}
          secondaryAction={
            <Box display="flex" alignItems="center">
              <Tooltip title="RSVP attending">
                <span>
                  {/* wrap button in span so disabled tooltip still shows; aria-label added */}
                  <IconButton
                    aria-label={`RSVP attending for meeting ${mt?.topic || ''}`}
                    onClick={() => onRsvp(mt.id, true)}
                    disabled={pending}
                    size="small"
                  >
                    {pending ? <CircularProgress size={18} /> : <CalendarCheck size={16} />}
                  </IconButton>
                </span>
              </Tooltip>
              <Button
                size="small"
                onClick={() => window.location.href = `/meetings/${mt.id}`}
                sx={{ ml: 1 }}
                aria-label={`View meeting ${mt.topic || ''}`}
              >
                View
              </Button>
            </Box>
          }
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: '#e0f2fe' }} aria-hidden><Calendar size={14} color="#0369a1" /></Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" gap={1}>
                <strong>{mt.topic || 'Topic TBD'}</strong>
                {meetingUrgencyChip(sessionDate)}
              </Box>
            }
            secondary={
              <>
                {DateTime.fromISO(mt.meeting_date).toLocaleString(DateTime.DATETIME_MED)}
                {mt.next_meeting_date && (
                  <span>
                    {' | Next: '}
                    {DateTime.fromISO(mt.next_meeting_date).toLocaleString(DateTime.DATE_MED)}
                  </span>
                )}
              </>
            }
          />
        </ListItem>
      );
    }
    return React.memo(Inner);
  }, []);

  // PrayerForm success wrapper
  const onPrayerSuccess = useCallback(() => {
    handleCloseForm();
    showSnackbar('Prayer request submitted', 'success');
  }, [showSnackbar]);

  // cell modal state
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [cellReport, setCellReport] = useState(null);

  // Add these states for profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleOpenReportModal = async () => {
    if (!myCell?.id) return;
    try {
      // Fetch the latest weekly report for this cell
      const res = await fetch(`${API_URL}/api/weekly-reports?cell_group_id=${myCell.id}&limit=1&order=desc`, { credentials: 'include' });
      if (res.ok) {
        const reports = await res.json();
        setCellReport(reports && reports.length ? reports[0] : null);
        setReportModalOpen(true);
      }
    } catch (err) {
      setCellReport(null);
      setReportModalOpen(true);
    }
  };

  return (
    <DashboardLayout title="Member Dashboard">
      <Box
        sx={{
          bgcolor: 'background.default',
          transition: 'background 0.3s',
        }}
      >
      <HeroHeader
        title="Member Dashboard"
        subtitle={
          myCell
            ? `${myCell.name || 'Your Cell'} • ${myCell.members_count ?? 0} members`
            : 'Overview of your cell, growth, and activity'
        }
        icon={<User size={22} />}
        rightSlot={(
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<PlusCircle size={18} />}
              onClick={handleOpenForm}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: { xs: 12, sm: 16 } }}
              aria-label="Open new prayer request form"
            >
              New Prayer Request
            </Button>
            <Button
              variant="outlined"
              onClick={() => setProfileModalOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: { xs: 12, sm: 16 } }}
              aria-label="Edit profile"
            >
              Edit Profile
            </Button>
            <Tooltip title="Notifications">
              <IconButton aria-label="Notifications">
                <Bell />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      />

      {/* Snackbar */}
      <Snackbar open={snackOpen} autoHideDuration={5000} onClose={handleCloseSnack}>
        <Alert onClose={handleCloseSnack} severity={snackSeverity} sx={{ width: '100%' }}>
          {snackMsg}
        </Alert>
      </Snackbar>

      {/* Cell group info */}
      {cellLoading ? (
        <Box sx={{ mb: 2 }}>
          <Skeleton variant="rectangular" height={128} sx={{ borderRadius: 3 }} />
        </Box>
      ) : myCell ? (
        <MotionCard
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          sx={{
            mb: 3,
            borderRadius: 3,
            boxShadow: 3,
            background: 'linear-gradient(135deg,#f5fbff,#eef7ff)',
            maxWidth: '100%',
          }}
        >
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
            >
              <Box display="flex" alignItems="center" minWidth={0}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>{(myCell.name || 'C').charAt(0)}</Avatar>
                <Box minWidth={0}>
                  <Typography variant="h6" fontWeight={700} noWrap>
                    You are in: {myCell.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    Zone: {myCell.zone} &nbsp;|&nbsp; Members: {myCell.members_count ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    Leader: {myCell.leader?.first_name} {myCell.leader?.surname}
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: { xs: 2, sm: 0 } }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setCellModalOpen(true)}
                  aria-label="Open cell"
                >
                  Open Cell
                </Button>
                <Chip label={myCell.status || 'Unknown'} color={leaderStatusColor(myCell.status)} sx={{ textTransform: 'none' }} />
              </Stack>
            </Box>

            {/* member avatars + quick sparkline of attendance */}
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mt={2}
              flexDirection={{ xs: 'column', sm: 'row' }}
              gap={2}
            >
              <Box display="flex" alignItems="center">
                <AvatarGroup max={5}>
                  {(myCell.members_preview || myCell.members || []).slice(0, 6).map((m, i) => (
                    <Tooltip key={i} title={`${m.first_name || m.full_name || 'Member'} ${m.surname || ''}`}>
                      <Avatar sx={{ bgcolor: '#111827' }}>{(m.first_name || m.full_name || 'M').charAt(0)}</Avatar>
                    </Tooltip>
                  ))}
                </AvatarGroup>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  {myCell.members_count ?? 0} members • {myCell.zone}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" gap={2} sx={{ mt: { xs: 2, sm: 0 } }}>
                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">Leader Health</Typography>
                  <Box mt={0.5}>
                    <Chip label={leaderHealth?.status || 'Unknown'} color={leaderStatusColor(leaderHealth?.status)} size="small" />
                  </Box>
                </Box>

                <Box textAlign="center">
                  <Typography variant="caption" color="text.secondary">My Attendance</Typography>
                  <Box mt={0.5}>
                    <RadialProgress
                      value={myWeeklySummary && myWeeklySummary.attendanceHistory && myWeeklySummary.attendanceHistory.length > 0
                        ? Math.round(
                            (myWeeklySummary.attendanceHistory.filter(a => a === 1).length /
                              myWeeklySummary.attendanceHistory.length) * 100
                          )
                        : 0}
                      size={48}
                      label="You"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Recent trend</Typography>
                  <Box sx={{ width: 100, mt: 0.5 }}>
                    <Sparkline values={(attendanceHistory || []).slice(0, 12).map(r => r.present ? 1 : 0)} />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Attendance alerts */}
            {attendanceHistory.length > 0 && (
              <Box mt={2}>
                <Typography variant="body2">
                  Last attended:{' '}
                  {getLastAttendedDate(attendanceHistory) ? getLastAttendedDate(attendanceHistory).toLocaleDateString() : 'No recent attendance'}
                </Typography>
                {countConsecutiveAbsences(attendanceHistory) >= 3 && (
                  <Box mt={1}>
                    <Chip
                      label={`You have missed ${countConsecutiveAbsences(attendanceHistory)} consecutive meetings — reach out to your leader`}
                      color="error"
                      icon={<Bell />}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                )}
                <AttendanceBars records={attendanceHistory} />
              </Box>
            )}
          </CardContent>
        </MotionCard>
      ) : (
        <Card sx={{ mb: 3, background: '#fffbe6', borderLeft: '6px solid #f59e42', borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700}>You are not assigned to a cell group.</Typography>
            <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={() => window.location.href = '/cells/join'} aria-label="Request to join a cell">
              Request to join a cell
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Top cards row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={4}>
          {/* Profile card */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              {cellLoading ? (
                <Box>
                  <Skeleton width="40%" height={28} />
                  <Skeleton width="80%" height={18} sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" height={48} sx={{ mt: 2, borderRadius: 2 }} />
                </Box>
              ) : (
                <>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{
                        mr: 2,
                        bgcolor: theme.palette.grey[900],
                        width: { xs: 32, sm: 40 },
                        height: { xs: 32, sm: 40 }
                      }}>
                        <User size={18} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontSize: { xs: 16, sm: 20 }, color: theme.palette.text.primary }}>My Profile</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: 11, sm: 13 } }}>Quick personal status</Typography>
                      </Box>
                    </Box>
                    <Tooltip title="View profile">
                      <IconButton onClick={() => window.location.href = '/profile'} aria-label="View profile">
                        <User />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Stack direction="row" spacing={1} mt={2} flexWrap="wrap" alignItems="center">
                    <Chip label="Born Again" color="success" icon={<HeartHandshake size={14} />} />
                    <Chip label="Baptized" color="info" icon={<CalendarCheck size={14} />} />
                    <Chip label={`Foundation: ${foundation?.level ?? 'N/A'}`} color="secondary" icon={<BookOpen size={14} />} />
                    <Box sx={{ ml: 'auto' }}>
                      <Tooltip title="Growth progress">
                        <span>
                          <RadialProgress value={growth?.progress_percent ?? 0} size={48} label="Growth" />
                        </span>
                      </Tooltip>
                    </Box>
                  </Stack>
                </>
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          {/* Upcoming meetings */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ p: 1, bgcolor: '#e0f2fe', borderRadius: 2 }}>
                    <Calendar size={18} color="#0369a1" />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>Next Cell Meeting</Typography>
                </Box>
                <Button size="small" onClick={() => window.location.href = myCell ? `/cells/${myCell.id}/meetings` : '/cells/meetings'} aria-label="Manage meetings" sx={{ textTransform: 'none', fontWeight: 600 }}>Manage</Button>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {cellLoading ? (
                <Skeleton height={60} />
              ) : (
                <Box>
                  {meetings.length > 0 ? (
                    meetings.map(mt => (
                      <Box key={mt.id} sx={{
                        py: 2, 
                        px: 1.5,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%)',
                        border: '1px solid #e0f2fe',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1.5 
                      }}>
                        <Box sx={{ p: 1, bgcolor: '#dbeafe', borderRadius: 1.5 }}>
                          <Calendar size={16} color="#0369a1" />
                        </Box>
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={700} color="#1e293b">
                            {DateTime.fromISO(mt.next_meeting_date ?? mt.meeting_date).toLocaleString(DateTime.DATE_MED)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Cell Meeting
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No meetings scheduled</Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={4}>
          {/* Discipleship / Growth */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              {cellLoading ? (
                <Box>
                  <Skeleton width="50%" />
                  <Skeleton width="80%" />
                  <Skeleton variant="rectangular" height={48} sx={{ mt: 1, borderRadius: 2 }} />
                </Box>
              ) : (
                <>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <BookOpen size={18} style={{ marginRight: 8 }} />
                      <Typography variant="h6">Discipleship Progress</Typography>
                    </Box>
                    <Button size="small" onClick={() => window.location.href = '/growth'} aria-label="Open growth">Open</Button>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {growth ? (
                    <>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="body2">Foundation Level: <b>{growth.foundation_level ?? 'N/A'}</b></Typography>
                          <Typography variant="body2">Born Again: <b>{growth.born_again ? 'Yes' : 'No'}</b></Typography>
                        </Box>
                        <RadialProgress value={growth.progress_percent ?? 0} size={64} label="Progress" />
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        <LinearProgress variant="determinate" value={Math.min(100, growth.progress_percent || 0)} sx={{ height: 10, borderRadius: 2 }} />
                        <Typography variant="caption">{growth.progress_percent ?? 0}% complete</Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Button size="small" onClick={() => window.location.href = '/foundation-school'}>Foundation school</Button>
                        <Button size="small" onClick={() => window.location.href = '/mentorship'} sx={{ ml: 1 }}>Mentorship</Button>
                      </Box>
                    </>
                  ) : <Typography variant="body2">No growth data</Typography>}
                </>
              )}
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Additional cards row - Baptism, Giving, Leadership, Events */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          {/* Baptism Journey */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ p: 1, bgcolor: '#e0f2fe', borderRadius: 2 }}>
                    <CalendarCheck size={18} color="#0369a1" />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>Baptism Journey</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>Baptism Status</Typography>
                <Chip label="Ready for Water Baptism" color="success" size="small" />
                <Typography variant="caption" color="text.secondary">Date of Birth Again: July 15, 2024</Typography>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          {/* Giving & Generosity */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ p: 1, bgcolor: '#fef3c7', borderRadius: 2 }}>
                    <Gift size={18} color="#d97706" />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>My Giving</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>This Month</Typography>
                <Typography variant="h5" color="primary" fontWeight={700}>R350</Typography>
                <Typography variant="caption" color="text.secondary">Last Month: R300</Typography>
                <Typography variant="caption" color="text.secondary">This Quarter: R950</Typography>
                <Typography variant="caption" color="text.secondary">This Year: R2,100</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  Your generosity supports the mission of the church.
                </Typography>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          {/* Leadership Opportunities */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ p: 1, bgcolor: '#dcfce7', borderRadius: 2 }}>
                    <Award size={18} color="#16a34a" />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>Leadership</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>Based on your growth and commitment, leadership opportunities are available.</Typography>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Potential Roles</Typography>
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" display="block">• Cell Treasurer</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">  Help manage cell finances & giving records</Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>• Prayer Coordinator</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">  Lead intercession & prayer initiatives</Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          {/* Upcoming Events & Birthdays */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ p: 1, bgcolor: '#fce7f3', borderRadius: 2 }}>
                    <CalendarDays size={18} color="#db2777" />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>Events</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Jane Smith's Birthday</Typography>
                  <Typography variant="caption" color="text.secondary">January 15 (2 weeks)</Typography>
                  <Button size="small" variant="text" sx={{ p: 0, minWidth: 'auto' }}>Send love</Button>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Cell Anniversary Celebration</Typography>
                  <Typography variant="caption" color="text.secondary">January 22 (Special Meeting)</Typography>
                  <Button size="small" variant="text" sx={{ p: 0, minWidth: 'auto' }}>Mark calendar</Button>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Foundation School Graduation</Typography>
                  <Typography variant="caption" color="text.secondary">February 1 (Celebration)</Typography>
                  <Button size="small" variant="text" sx={{ p: 0, minWidth: 'auto' }}>Attend</Button>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Big middle grid: Cell summary + Meetings/Growth/Mentorships (preserved original content) */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Cell summary card (detailed) */}
        <Grid item xs={12} md={6}>
          <MotionCard whileHover={{ scale: 1.01 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              {cellLoading ? (
                <Box>
                  <Skeleton width="30%" height={28} />
                  <Skeleton width="80%" height={18} sx={{ mt: 1 }} />
                  <Skeleton variant="rectangular" height={120} sx={{ mt: 2, borderRadius: 2 }} />
                </Box>
              ) : (
                <>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center">
                      <Users size={18} style={{ marginRight: 8 }} />
                      <Typography variant="h6">My Cell</Typography>
                    </Box>
                    {cellLoading ? <CircularProgress size={20} /> : myCell ? (
                      <Chip label={myCell.status || 'Unknown'} color={leaderStatusColor(myCell.status)} />
                    ) : <Chip label="Not assigned" />}
                  </Box>

                  {myCell ? (
                    <>
                      <Box display="flex" alignItems="center" mt={2}>
                        <Avatar sx={{ mr: 1 }}>{(myCell.name || 'C').charAt(0)}</Avatar>
                        <Box>
                          <Typography variant="subtitle1"><b>{myCell.name}</b></Typography>
                          <Typography variant="caption">{myCell.zone} • {myCell.members_count ?? 0} members</Typography>
                        </Box>
                      </Box>

                      <Typography variant="body2" mt={1}>Leader: {myCell.leader?.first_name} {myCell.leader?.surname}</Typography>

                      <Stack direction="row" spacing={1} mt={2}>
                        <Button size="small" variant="outlined" onClick={() => setCellModalOpen(true)} aria-label="Open cell">Open Cell</Button>
                        <Button size="small" variant="text" onClick={() => setLeaderModalOpen(true)} aria-label="View leader">View Leader</Button>
                        <Button size="small" variant="contained" onClick={() => { if (myCell.leader?.phone) window.open(`tel:${myCell.leader.phone}`); }} aria-label="Call leader">
                          <PhoneCall size={14} style={{ marginRight: 6 }} /> Call Leader
                        </Button>
                      </Stack>

                      <Divider sx={{ my: 1 }} />

                      {/* Attendance summary (preserved) */}
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle2">Attendance (last meeting)</Typography>
                          {attendanceSummary ? (
                            <>
                              <Typography variant="body2">Present: <b>{attendanceSummary.present_count ?? 0}</b></Typography>
                              <Typography variant="body2">Visitors: <b>{attendanceSummary.visitor_count ?? 0}</b></Typography>
                              <Typography variant="body2">Absentees flagged: <b>{attendanceSummary.absent_flagged ?? 0}</b></Typography>
                            </>
                          ) : <Typography variant="body2">No attendance data</Typography>}
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="caption" color="text.secondary">Last meeting performance</Typography>
                          <Box sx={{ mt: 0.5 }}>
                            <Sparkline values={(attendanceHistory || []).slice(0, 12).map(r => r.present ? 1 : 0)} width={160} />
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        <Button size="small" onClick={() => window.location.href = `/cells/${myCell.id}/attendance`}>View full attendance</Button>
                        <Button size="small" onClick={() => window.location.href = `/cells/${myCell.id}/report`} sx={{ ml: 1 }}>
                          Weekly report
                        </Button>
                      </Box>

                      {/* My attendance quick view - ADD SAFE GUARDS */}
                      {myWeeklySummary && myWeeklySummary.attendanceHistory && myWeeklySummary.attendanceHistory.length > 0 && myWeeklySummary.reports && myWeeklySummary.reports.length > 0 && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2">My Attendance</Typography>
                          <Typography variant="body2" mt={1}>
                            Last attended:{' '}
                            {(() => {
                              const lastAttendedIdx = myWeeklySummary.attendanceHistory.findIndex(a => a === 1);
                              return lastAttendedIdx !== -1 && myWeeklySummary.reports[lastAttendedIdx]
                                ? DateTime.fromISO(myWeeklySummary.reports[lastAttendedIdx].meeting_date).toLocaleString(DateTime.DATE_MED)
                                : 'No recent attendance';
                            })()}
                          </Typography>
                          {myWeeklySummary.attendanceHistory.filter(a => a === 0).length >= 3 && (
                            <Box mt={1}>
                              <Chip
                                label={`You have missed ${myWeeklySummary.attendanceHistory.filter(a => a === 0).length} consecutive meetings`}
                                color="error"
                                icon={<Bell />}
                                sx={{ fontWeight: 700 }}
                              />
                            </Box>
                          )}
                          <AttendanceBars 
                            records={myWeeklySummary.reports.map((r, i) => ({
                              present: myWeeklySummary.attendanceHistory[i] === 1,
                              meeting_date: r.meeting_date
                            }))} 
                          />
                        </>
                      )}

                      <Divider sx={{ my: 1 }} />

                      {/* Leader health */}
                      <Typography variant="subtitle2">Leader Health</Typography>
                      {leaderHealth ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={leaderHealth.status || 'Unknown'} color={leaderStatusColor(leaderHealth.status)} />
                          <Typography variant="caption">{leaderHealth.notes || ''}</Typography>
                        </Stack>
                      ) : <Typography variant="body2">No health data</Typography>}
                    </>
                  ) : (
                    <Box mt={1}>
                      <Typography variant="body2">You're not currently assigned to a cell.</Typography>
                      <Button variant="contained" size="small" sx={{ mt: 1 }} onClick={() => window.location.href = '/cells/join'}>
                        Request to join a cell
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        {/* Meetings, Growth & Mentorships (right column) */}
        <Grid item xs={12} md={6}>
          <Stack spacing={2}>
            {/* Upcoming meetings (detailed list) */}
            <MotionCard whileHover={{ scale: 1.01 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <Calendar size={16} style={{ marginRight: 6 }} />
                    <Typography variant="h6">Upcoming meetings</Typography>
                  </Box>
                  <Button size="small" onClick={() => window.location.href = myCell ? `/cells/${myCell.id}/meetings` : '/cells/meetings'} aria-label="Manage meetings">Manage</Button>
                </Box>

                <Divider sx={{ my: 1 }} />

                {cellLoading ? <Skeleton variant="rectangular" height={120} /> : (
                  <List>
                    {meetings.length === 0 && <ListItem><ListItemText primary="No meetings scheduled" /></ListItem>}
                    {meetings.map(mt => (
                      <MeetingItem
                        key={mt.id}
                        mt={mt}
                        onRsvp={handleRsvp}
                        pending={Boolean(rsvpPending[mt.id])}
                      />
                    ))}
                  </List>
                )}
              </CardContent>
            </MotionCard>

            {/* Growth snapshot */}
            <MotionCard whileHover={{ scale: 1.01 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                {cellLoading ? (
                  <Box>
                    <Skeleton width="40%" />
                    <Skeleton width="90%" />
                  </Box>
                ) : (
                  <>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <BookOpen size={16} style={{ marginRight: 6 }} />
                        <Typography variant="h6">Growth snapshot</Typography>
                      </Box>
                      <Button size="small" onClick={() => window.location.href = '/growth'} aria-label="Open growth">Open</Button>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {growth ? (
                      <>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2">Foundation Level: <b>{growth.foundation_level ?? 'N/A'}</b></Typography>
                            <Typography variant="body2">Born Again: <b>{growth.born_again ? 'Yes' : 'No'}</b></Typography>
                            <Box sx={{ mt: 1 }}>
                              <LinearProgress variant="determinate" value={Math.min(100, growth.progress_percent || 0)} sx={{ height: 10, borderRadius: 2 }} />
                              <Typography variant="caption">{growth.progress_percent ?? 0}% complete</Typography>
                            </Box>
                          </Box>

                          <Box>
                            <RadialProgress value={growth.progress_percent ?? 0} size={72} label="Overall" />
                            <Box textAlign="center" sx={{ mt: 1 }}>
                              <Button size="small" onClick={() => window.location.href = '/foundation-school'}>Foundation school</Button>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ mt: 1 }}>
                          <Button size="small" onClick={() => window.location.href = '/foundation-school'}>Foundation school</Button>
                          <Button size="small" onClick={() => window.location.href = '/mentorship'} sx={{ ml: 1 }}>Mentorship</Button>
                        </Box>
                      </>
                    ) : <Typography variant="body2">No growth data</Typography>}
                  </>
                )}
              </CardContent>
            </MotionCard>

            {/* Mentorship preview (preserved logic) */}
            <MotionCard whileHover={{ scale: 1.01 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                {cellLoading ? (
                  <Box>
                    <Skeleton width="30%" />
                    <Skeleton width="100%" />
                  </Box>
                ) : (
                  <>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <Users size={14} style={{ marginRight: 6 }} />
                        <Typography variant="h6">Mentorship</Typography>
                      </Box>
                      <Button size="small" onClick={() => window.location.href = '/mentorship'} aria-label="Open mentorship">Open</Button>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    {mentorships && mentorships.length > 0 ? (
                      <List dense>
                        {mentorships.slice(0, 3).map(a => (
                          <ListItem key={a.id}>
                            <ListItemAvatar>
                              <Avatar>{(a.mentor_first_name || a.mentor_name || 'M').charAt(0)}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${a.mentor_first_name || a.mentor_name || 'Mentor'} ${a.mentor_surname || ''}`}
                              secondary={a.sessions?.length ? `last: ${DateTime.fromISO(a.sessions[0].session_date).toLocaleString(DateTime.DATE_MED)}` : 'no sessions yet'}
                            />
                            <Button size="small" onClick={() => window.location.href = `/mentorship/assignment/${a.id}`} sx={{ ml: 1 }} aria-label={`Open mentorship ${a.id}`}>Open</Button>
                          </ListItem>
                        ))}
                      </List>
                    ) : <Typography variant="body2">No mentorship assignments</Typography>}
                  </>
                )}
              </CardContent>
            </MotionCard>
          </Stack>
        </Grid>
      </Grid>

      {/* Spiritual Journey & Announcements row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          {/* My Spiritual Journey */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ p: 1, bgcolor: '#e0e7ff', borderRadius: 2 }}>
                    <BookMarked size={18} color="#4f46e5" />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>My Spiritual Journey</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Daily Devotion Streak</Typography>
                  <Box display="flex" alignItems="center" gap={1} sx={{ mt: 1 }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <Box
                        key={day}
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: day <= 5 ? 'success.main' : 'grey.300',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 12,
                          fontWeight: 600
                        }}
                      >
                        {day}
                      </Box>
                    ))}
                    <Typography variant="caption" color="text.secondary">5 of 7 days completed this week</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Spiritual Goals (This Month)</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="caption">• Read the Bible daily</Typography>
                    <Typography variant="caption">• Attend all cell meetings</Typography>
                    <Typography variant="caption">• Invite 2 friends to cell</Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Cell Announcements */}
          <MotionCard whileHover={{ scale: 1.02 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ p: 1, bgcolor: '#f3f4f6', borderRadius: 2 }}>
                    <Bell size={18} color="#6b7280" />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>Cell Announcements</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Meeting Location Change</Typography>
                  <Typography variant="caption" color="text.secondary">Next meeting moved to Community Center, Room 3</Typography>
                  <Typography variant="caption" color="text.secondary">Posted by John Doe • 2 days ago</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Outreach Event Coming</Typography>
                  <Typography variant="caption" color="text.secondary">Cell-wide evangelism event on Jan 25. Volunteers needed!</Typography>
                  <Typography variant="caption" color="text.secondary">Posted by Cell Leader • 5 days ago</Typography>
                </Box>
              </Stack>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Visitors & Leader Development row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          {/* Visitors & Outreach */}
          <MotionCard whileHover={{ scale: 1.01 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Bell size={16} style={{ marginRight: 6 }} />
                  <Typography variant="h6">Visitors & Outreach</Typography>
                </Box>
                <Button size="small" onClick={() => window.location.href = myCell ? `/cells/${myCell?.id}/visitors` : '/visitors'} aria-label="Manage visitors">Manage</Button>
              </Box>

              <Divider sx={{ my: 1 }} />

              {cellLoading ? (
                <Box>
                  <Skeleton width="60%" />
                  <Skeleton width="90%" />
                </Box>
              ) : visitors && visitors.length > 0 ? (
                <List dense>
                  {visitors.slice(0, 5).map(v => (
                    <ListItem key={v.id}>
                      <ListItemAvatar>
                        <Avatar>{(v.full_name || 'V').charAt(0)}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={v.full_name} secondary={`${v.area || 'Area N/A'} • ${v.response || 'No response'}`} />
                      <Button size="small" onClick={() => window.location.href = `/visitors/${v.id}`} sx={{ ml: 1 }} aria-label={`Open visitor ${v.full_name}`}>Open</Button>
                    </ListItem>
                  ))}
                </List>
              ) : <Typography variant="body2">No recent visitors</Typography>}
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Leader Development */}
          <MotionCard whileHover={{ scale: 1.01 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6">Leader Development</Typography>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2">Self-evals, leadership checks, and reproductive leadership trackers are available for leaders.</Typography>
              <Box sx={{ mt: 1 }}>
                <Button size="small" onClick={() => window.location.href = '/leadership'} aria-label="Open leader tools">Open Leader Tools</Button>
                <Button size="small" onClick={() => window.location.href = '/reports'} sx={{ ml: 1 }} aria-label="Open reports">Reports</Button>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>

      {/* Foundation School & Milestones (updated milestones card) */}
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <MotionCard whileHover={{ scale: 1.01 }} sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              {/* Replace old milestone chips/progress with MemberMilestones */}
              <MemberMilestones
                memberId="me"
                refreshKey={milestoneRefreshKey}
                onRefresh={handleMilestoneRefresh}
              />
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          {/* Foundation School card */}
          <MotionCard
            whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(37,99,235,0.12)' }}
            sx={{
              borderRadius: 4,
              boxShadow: 4,
              background: 'linear-gradient(135deg,#f8fafc 60%,#e0e7ff 100%)',
              transition: 'box-shadow 0.2s, transform 0.2s',
              p: 2,
              mb: 3,
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                    <BookOpen size={20} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>Foundation School</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Your discipleship journey
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => window.location.href = '/foundation-school'}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                  aria-label="Open foundation school"
                >
                  Open
                </Button>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Stack direction="row" spacing={1} alignItems="center" mb={2} flexWrap="wrap">
                <Chip
                  label={`Level: ${foundation?.level ?? 'N/A'}`}
                  color="secondary"
                  sx={{ fontWeight: 600, fontSize: 15 }}
                />
                <Chip
                  label={
                    foundation?.status === 'in_progress'
                      ? 'In Progress'
                      : foundation?.status === 'completed'
                        ? 'Completed'
                        : foundation?.status ?? 'N/A'
                  }
                  color={
                    foundation?.status === 'completed'
                      ? 'success'
                      : foundation?.status === 'in_progress'
                        ? 'info'
                        : 'default'
                  }
                  icon={foundation?.status === 'completed'
                    ? <CalendarCheck size={16} />
                    : foundation?.status === 'in_progress'
                      ? <CircularProgress size={14} color="inherit" thickness={6} />
                      : undefined
                  }
                  sx={{
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    fontSize: 15,
                    px: 1.5,
                  }}
                />
                {foundation?.graduation_date && (
                  <Chip
                    label={`Graduated: ${DateTime.fromISO(foundation.graduation_date).toLocaleString(DateTime.DATE_MED)}`}
                    color="success"
                    sx={{ fontWeight: 500, fontSize: 13, ml: 1 }}
                  />
                )}
                <Box sx={{ ml: 'auto' }}>
                  <PieChart />
                </Box>
              </Stack>
              {foundation?.progress_percent !== undefined && (
                <Box mb={1}>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, foundation.progress_percent)}
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      background: '#e0e7ff',
                      '& .MuiLinearProgress-bar': {
                        background: (theme) => `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.light})`,
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {foundation.progress_percent}% complete
                  </Typography>
                </Box>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Track your Foundation School progress, status, and graduation here.
              </Typography>
              {foundation?.level_notes && (
                <Typography variant="caption" color="info.main" sx={{ mt: 0.5, display: 'block' }}>
                  {foundation.level_notes}
                </Typography>
              )}
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <NotificationWidget 
            role="member"
            limit={6}
            onViewAll={() => navigate('/notifications')}
          />
        </Grid>
      </Grid>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSuccess={() => {
          showSnackbar('Profile updated successfully', 'success');
          // Optional: refresh cell data if needed
        }}
      />

      {/* Prayer Request Modal */}
      <Dialog open={open} onClose={handleCloseForm} maxWidth="sm" fullWidth aria-labelledby="prayer-form-title">
        <DialogTitle id="prayer-form-title">Submit Prayer / Counseling Request</DialogTitle>
        <DialogContent>
          <PrayerForm onSuccess={onPrayerSuccess} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForm} color="secondary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cell Details Modal (newly added) */}
      <Dialog open={cellModalOpen} onClose={() => setCellModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cell Details</DialogTitle>
        <DialogContent>
          {myCell ? (
            <Box>
              <Typography variant="h6">{myCell.name}</Typography>
              <Typography variant="body2">Zone: {myCell.zone}</Typography>
              <Typography variant="body2">Members: {myCell.members_count ?? 0}</Typography>
              <Typography variant="body2">Leader: {myCell.leader?.first_name} {myCell.leader?.surname}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2">Members:</Typography>
              <List>
                {(myCell.members || []).map((m, i) => (
                  <ListItem key={i}>
                    <ListItemAvatar>
                      <Avatar>{(m.first_name || m.full_name || 'M').charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={`${m.first_name || m.full_name || 'Member'} ${m.surname || ''}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Typography>No cell data available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCellModalOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Leader Details Modal (newly added) */}
      <Dialog open={leaderModalOpen} onClose={() => setLeaderModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Leader Details</DialogTitle>
        <DialogContent>
          {myCell?.leader ? (
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  {(myCell.leader.first_name || 'L').charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {myCell.leader.first_name} {myCell.leader.surname}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Contact: {myCell.leader.contact_primary || 'N/A'}
                  </Typography>
                  {myCell.leader.email && (
                    <Typography variant="body2" color="text.secondary">
                      Email: {myCell.leader.email}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={2} mb={2}>
                {myCell.leader.contact_primary && (
                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<PhoneCall size={16} />}
                    onClick={() => window.open(`tel:${myCell.leader.contact_primary}`)}
                  >
                    Call
                  </Button>
                )}
                {myCell.leader.email && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<Bell size={16} />}
                    onClick={() => window.open(`mailto:${myCell.leader.email}`)}
                  >
                    Email
                  </Button>
                )}
                {myCell.leader.contact_primary && (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<Users size={16} />}
                    onClick={() => window.open(`https://wa.me/${myCell.leader.contact_primary.replace(/\D/g, '')}`)}
                  >
                    WhatsApp
                  </Button>
                )}
              </Stack>
              <Typography variant="body2">
                You can reach out to your leader for support, questions, or cell matters.
              </Typography>
            </Box>
          ) : (
            <Typography>No leader data available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaderModalOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Report Modal (newly added) */}
      <Dialog open={reportModalOpen} onClose={() => setReportModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Weekly Cell Report</DialogTitle>
        <DialogContent>
          {cellReport ? (
            <Box>
              <Typography variant="h6">Date: {new Date(cellReport.meeting_date).toLocaleDateString()}</Typography>
              <Typography variant="body2">Topic: {cellReport.topic || 'N/A'}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2">Attendance: {cellReport.total_cell_attendance ?? 'N/A'}</Typography>
              <Typography variant="body2">Visitors: {cellReport.visitors ?? 'N/A'}</Typography>
              <Typography variant="body2">Souls Saved: {cellReport.souls_saved_meeting ?? 'N/A'}</Typography>
              <Typography variant="body2">Testimonies: {cellReport.testimonies || 'None'}</Typography>
              <Typography variant="body2">Prayer Requests: {cellReport.prayer_requests || 'None'}</Typography>
              {/* Add more fields as needed */}
            </Box>
          ) : (
            <Typography>No report available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportModalOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Baptism Status Card */}
      <Card sx={{ mb: 3, p: 2, bgcolor: 'info.50' }}>
        <CardHeader
          title="Your Baptism Journey"
          avatar={<Avatar sx={{ bgcolor: 'info.main' }}>💧</Avatar>}
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Baptism Status</Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Date of Birth Again: July 15, 2024
              </Typography>
              <Chip 
                label="Ready for Water Baptism" 
                color="success" 
                variant="filled"
                size="small"
              />
            </Box>
            <Button variant="outlined" size="small">
              View Baptism Preparation Checklist
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* My Giving History */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="My Giving & Generosity" 
          avatar={<Avatar sx={{ bgcolor: 'success.main' }}>💰</Avatar>}
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Grid container spacing={2} mb={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">This Month</Typography>
              <Typography variant="h6" fontWeight={700}>R350</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">Last Month</Typography>
              <Typography variant="h6" fontWeight={700}>R300</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">This Quarter</Typography>
              <Typography variant="h6" fontWeight={700}>R950</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary">This Year</Typography>
              <Typography variant="h6" fontWeight={700}>R2,100</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary" mb={1}>
            Your generosity supports the mission of the church.
          </Typography>
          <Button variant="outlined" size="small" fullWidth>View Full History</Button>
        </CardContent>
      </Card>

      {/* Leadership Opportunities */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Leadership Opportunities" 
          avatar={<Avatar sx={{ bgcolor: 'warning.main' }}>⭐</Avatar>}
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Based on your growth and commitment, leadership opportunities are available.
            </Alert>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Potential Roles</Typography>
              <Stack spacing={1}>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Cell Treasurer</Typography>
                  <Typography variant="caption" color="text.secondary">Help manage cell finances & giving records</Typography>
                </Box>
                <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight={600}>Prayer Coordinator</Typography>
                  <Typography variant="caption" color="text.secondary">Lead intercession & prayer initiatives</Typography>
                </Box>
              </Stack>
            </Box>
            <Button variant="contained" size="small">Discuss with Cell Leader</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Upcoming Events & Birthdays */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Upcoming Events & Birthdays" 
          avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>🎉</Avatar>}
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <List dense>
            <ListItem>
              <ListItemText 
                primary="Jane Smith's Birthday" 
                secondary="January 15 (2 weeks)"
              />
              <Chip label="Send love" size="small" variant="outlined" />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Cell Anniversary Celebration" 
                secondary="January 22 (Special Meeting)"
              />
              <Chip label="Mark calendar" size="small" color="primary" />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Foundation School Graduation" 
                secondary="February 1 (Celebration)"
              />
              <Chip label="Attend" size="small" variant="outlined" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Cell Announcements & Updates */}
      <Card sx={{ mb: 3 }}>
        <CardHeader 
          title="Cell Announcements" 
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>📢</Avatar>}
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Stack spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 1, borderLeft: '4px solid', borderColor: 'primary.main' }}>
              <Typography variant="subtitle2" fontWeight={600}>Meeting Location Change</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Next meeting moved to Community Center, Room 3
              </Typography>
              <Typography variant="caption" color="text.secondary">Posted by John Doe • 2 days ago</Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'info.50', borderRadius: 1, borderLeft: '4px solid', borderColor: 'info.main' }}>
              <Typography variant="subtitle2" fontWeight={600}>Outreach Event Coming</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Cell-wide evangelism event on Jan 25. Volunteers needed!
              </Typography>
              <Typography variant="caption" color="text.secondary">Posted by Cell Leader • 5 days ago</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Personal Spiritual Dashboard */}
      <Card>
        <CardHeader 
          title="My Spiritual Journey" 
          avatar={<Avatar sx={{ bgcolor: 'success.main' }}>✝️</Avatar>}
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Daily Devotion Streak</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                  <Box
                    key={i}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: i <= 5 ? 'success.main' : 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {i}
                  </Box>
                ))}
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                5 of 7 days completed this week
              </Typography>
            </Box>
            <Divider />
            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Spiritual Goals (This Month)</Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle size={18} color="#10b981" />
                  <Typography variant="body2">Read the Bible daily</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle size={18} color="#10b981" />
                  <Typography variant="body2">Attend all cell meetings</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircleDashed size={18} color="#f59e0b" />
                  <Typography variant="body2">Invite 2 friends to cell</Typography>
                </Box>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      </Box>
    </DashboardLayout>
  );
}
