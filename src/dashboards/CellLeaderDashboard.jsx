import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Avatar,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Paper,
  Badge,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material';
import {
  Users,
  Activity,
  Heart,
  Calendar,
  TrendingUp,
  AlertCircle,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  UserCheck,
  PhoneCall
} from 'lucide-react';
import { Medal, HeartHandshake, UserPlus, BellRing, CircleDashed, Book, Target } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { DateTime } from 'luxon';
import DashboardLayout from '../components/DashboardLayout';
import LeaderReadinessCard from '../components/leadership/LeaderReadinessCard';
import StatsCard from '../components/dashboard/StatsCard';
import AddEditReportModal from '../components/AddEditReportModal';
import AddVisitorStepper from '../components/visitors/AddVisitorStepper';
import PrayerForm from '../components/prayer/PrayerForm';
import { getMyCellGroups, getCellMembers } from '../services/cellGroupService';
import { getMeetingScheduleAndAttendance, getWeeklyReports } from '../services/weeklyReportService';
import { listContacts } from '../services/evangelismService';
import { getPrayerRequests } from '../services/prayerService';
import HeroHeader from '../components/dashboard/HeroHeader';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function CellLeaderDashboard() {
  const { fetchWithAuth, user } = useContext(AuthContext);
  const theme = useTheme();

  const [cellGroup, setCellGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [cellGroups, setCellGroups] = useState([]);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [lastMeetingAbsentees, setLastMeetingAbsentees] = useState([]);
  const [absenteesLoading, setAbsenteesLoading] = useState(false);
  const [visitorsNeedingFollowUp, setVisitorsNeedingFollowUp] = useState([]);
  const [evangelismContacts, setEvangelismContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [prayerLoading, setPrayerLoading] = useState(false);
  const [activities, setActivities] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const API_URL = process.env.REACT_APP_API_URL || '';

  // Comprehensive mock data set for cell group dashboard
  const mockMembersData = [
    { id: 1, first_name: 'John', surname: 'Doe', full_name: 'John Doe', status: 'Active', milestone: 'Foundation School', phone: '+234 810 123 4567' },
    { id: 2, first_name: 'Mary', surname: 'Smith', full_name: 'Mary Smith', status: 'Active', milestone: 'Baptism Ready', phone: '+234 810 234 5678' },
    { id: 3, first_name: 'James', surname: 'Wilson', full_name: 'James Wilson', status: 'Active', milestone: 'Sent Out', phone: '+234 810 345 6789' },
    { id: 4, first_name: 'Sarah', surname: 'Brown', full_name: 'Sarah Brown', status: 'Active', milestone: 'Foundation School', phone: '+234 810 456 7890' },
    { id: 5, first_name: 'David', surname: 'Johnson', full_name: 'David Johnson', status: 'Inactive', milestone: 'Foundation School', phone: '+234 810 567 8901' },
    { id: 6, first_name: 'Grace', surname: 'Williams', full_name: 'Grace Williams', status: 'Active', milestone: 'Active Cell Member', phone: '+234 810 678 9012' },
    { id: 7, first_name: 'Peter', surname: 'Martinez', full_name: 'Peter Martinez', status: 'Active', milestone: 'Sent Out', phone: '+234 810 789 0123' },
    { id: 8, first_name: 'Ruth', surname: 'Davis', full_name: 'Ruth Davis', status: 'Active', milestone: 'Baptism Ready', phone: '+234 810 890 1234' },
    { id: 9, first_name: 'Michael', surname: 'Trent', full_name: 'Michael Trent', status: 'Active', milestone: 'Foundation School', phone: '+234 810 901 2345' },
    { id: 10, first_name: 'Anna', surname: 'Garcia', full_name: 'Anna Garcia', status: 'Active', milestone: 'Active Cell Member', phone: '+234 810 012 3456' },
  ];

  const mockMeetingsData = [
    { id: 1, date: DateTime.now().toISO(), agenda: 'Weekly Cell Meeting', attendance: 8, location: 'Community Center' },
    { id: 2, date: DateTime.now().plus({ days: 7 }).toISO(), agenda: 'Prayer & Intercession', attendance: 7, location: 'Community Center' },
    { id: 3, date: DateTime.now().plus({ days: 14 }).toISO(), agenda: 'Bible Study & Discussion', attendance: 9, location: 'Community Center' },
    { id: 4, date: DateTime.now().plus({ days: 21 }).toISO(), agenda: 'Discipleship Training', attendance: 6, location: 'Community Center' },
  ];

  const mockAbsenteesData = [
    { id: 1, name: 'Mary Ann Santos', lastAttended: DateTime.now().minus({ days: 14 }).toISO(), reason: 'Work commitment', notes: 'Send encouragement message' },
    { id: 2, name: 'Robert Chen', lastAttended: DateTime.now().minus({ days: 7 }).toISO(), reason: 'Health issue', notes: 'Follow up on health status' },
  ];

  const mockVisitorsData = [
    { id: 1, first_name: 'John', surname: 'Great', full_name: 'John Great', inviterName: 'Andrew J Walker', followup_status: 'Pending', invited_date: DateTime.now().minus({ days: 5 }).toISO() },
    { id: 2, first_name: 'Elizabeth', surname: 'King', full_name: 'Elizabeth King', inviterName: 'Mary Smith', followup_status: 'Pending', invited_date: DateTime.now().minus({ days: 2 }).toISO() },
    { id: 3, first_name: 'Thomas', surname: 'Scott', full_name: 'Thomas Scott', inviterName: 'James Wilson', followup_status: 'Completed', invited_date: DateTime.now().minus({ days: 20 }).toISO() },
  ];

  const mockEvangelismContactsData = [
    { id: 1, first_name: 'Ahmed', surname: 'Hassan', status: 'Active', outcome: 'Attending meetings', last_contact: DateTime.now().minus({ days: 3 }).toISO() },
    { id: 2, first_name: 'Zainab', surname: 'Ali', status: 'Active', outcome: 'Interested in faith', last_contact: DateTime.now().minus({ days: 5 }).toISO() },
    { id: 3, first_name: 'Mark', surname: 'Taylor', status: 'Converted', outcome: 'Baptized', last_contact: DateTime.now().minus({ days: 10 }).toISO() },
  ];

  const mockPrayerRequestsData = [
    { id: 1, request: 'Pray for job breakthrough', submitter: 'John Doe', category: 'Employment', urgency: 'High', created: DateTime.now().minus({ days: 1 }).toISO() },
    { id: 2, request: 'Healing for family member recovering from surgery', submitter: 'Jane Smith', category: 'Health', urgency: 'High', created: DateTime.now().minus({ days: 2 }).toISO() },
    { id: 3, request: 'Wisdom for major life decision', submitter: 'Michael Trent', category: 'Guidance', urgency: 'Medium', created: DateTime.now().minus({ days: 3 }).toISO() },
    { id: 4, request: 'Financial stability for growing family', submitter: 'Sarah Brown', category: 'Finance', urgency: 'Medium', created: DateTime.now().minus({ days: 4 }).toISO() },
    { id: 5, request: 'Safe travels and protection abroad', submitter: 'Peter Martinez', category: 'Travel', urgency: 'Low', created: DateTime.now().minus({ days: 5 }).toISO() },
  ];

  const mockActivitiesData = [
    { id: 1, type: 'member_join', description: 'Elizabeth King visited the cell group', member: 'Elizabeth King', timestamp: DateTime.now().minus({ hours: 2 }).toISO(), icon: 'user-plus' },
    { id: 2, type: 'prayer', description: 'New prayer request submitted', member: 'Sarah Brown', timestamp: DateTime.now().minus({ hours: 4 }).toISO(), icon: 'heart' },
    { id: 3, type: 'milestone', description: 'Mary Smith completed Foundation School', member: 'Mary Smith', timestamp: DateTime.now().minus({ days: 1 }).toISO(), icon: 'award' },
    { id: 4, type: 'meeting', description: 'Weekly Cell Meeting held successfully', member: 'Cell Group', timestamp: DateTime.now().minus({ days: 2 }).toISO(), icon: 'calendar' },
    { id: 5, type: 'evangelism', description: 'Mark Taylor baptized after accepting Christ', member: 'Mark Taylor', timestamp: DateTime.now().minus({ days: 5 }).toISO(), icon: 'heart-handshake' },
  ];

  // Discipleship & Health metrics
  const discipleshipStatus = {
    foundationSchool: 5,
    baptismReady: 2,
    sentOut: 2,
    activeCellMembers: 1,
    totalMembers: mockMembersData.length,
  };

  const dummyAbsentees = lastMeetingAbsentees && lastMeetingAbsentees.length > 0 
    ? lastMeetingAbsentees 
    : mockAbsenteesData;

  const dummyVisitors = visitorsNeedingFollowUp && visitorsNeedingFollowUp.length > 0 
    ? visitorsNeedingFollowUp 
    : mockVisitorsData;

  const dummyPrayerRequests = prayerRequests && prayerRequests.length > 0 
    ? prayerRequests 
    : mockPrayerRequestsData;

  const dummyEvangelismContacts = evangelismContacts && evangelismContacts.length > 0 
    ? evangelismContacts 
    : mockEvangelismContactsData;

  const dummyMeetings = meetings && meetings.length > 0 
    ? meetings 
    : mockMeetingsData;

  const timothyProgress = {
    name: 'Michael Trent',
    stage: 'Lesson 3 — Evangelism Foundations',
    progress: 60,
    lastUpdate: DateTime.now().minus({ days: 3 }).toISO()
  };

  const groupHealth = {
    fellowship: 82,
    testimonies: 75,
    spiritualAtmosphere: 88,
    evangelism: 70,
    discipleship: 78
  };

  // Load and normalize groups/members, pick preferred group and load related data
  useEffect(() => {
    let mounted = true;
    async function loadMembers() {
      setMembersLoading(true);
      try {
        const groupsRaw = await getMyCellGroups(fetchWithAuth).catch(() => null);
        const normalize = (r) => {
          if (!r) return [];
          if (Array.isArray(r)) return r;
          if (r.data && Array.isArray(r.data)) return r.data;
          if (r.rows && Array.isArray(r.rows)) return r.rows;
          if (r.items && Array.isArray(r.items)) return r.items;
          const arr = Object.values(r).find(v => Array.isArray(v));
          return Array.isArray(arr) ? arr : [];
        };
        const groupsArr = normalize(groupsRaw);

        const currentMemberId =
          user?.member_id ??
          user?.memberId ??
          user?.member?.id ??
          user?.member?.member_id ??
          user?.id ??
          user?.userId ??
          user?.user_id ??
          (user && user.user && (user.user.member_id ?? user.user.id)) ??
          null;

        const preferred =
          groupsArr.find(g => {
            const leaderIdCandidates = [
              g?.leader_id,
              g?.leaderId,
              g?.leader?.id,
              g?.leader?.member_id,
              g?.leader_member_id,
              g?.leader
            ].filter(Boolean);
            return leaderIdCandidates.some(lid => currentMemberId != null && String(lid) === String(currentMemberId));
          })
          || (currentMemberId == null ? null : groupsArr.find(g => {
            const leaderEmail = g?.leader_email ?? g?.leader?.email;
            const userEmail = user?.email ?? user?.user?.email;
            return leaderEmail && userEmail && String(leaderEmail).toLowerCase() === String(userEmail).toLowerCase();
          }))
          || groupsArr[0] || null;

        if (!preferred) {
          if (mounted) {
            setMembers([]);
            setCellGroups(groupsArr);
          }
          return;
        }

        const chosenGroupId = preferred?.id ?? preferred?._id ?? preferred?.group_id ?? null;

        if (mounted) {
          setGroupName(preferred?.name ?? preferred?.group_name ?? preferred?.zone_name ?? '');
          setCellGroups(groupsArr);
          setSelectedGroupId(chosenGroupId);
          setCellGroup(preferred);
          setActivities(mockActivitiesData);
        }

        const memResp = await getCellMembers(fetchWithAuth, chosenGroupId, true).catch(() => null);
        let list = [];
        if (Array.isArray(memResp)) list = memResp;
        else if (memResp?.data && Array.isArray(memResp.data)) list = memResp.data;
        else if (memResp?.rows && Array.isArray(memResp.rows)) list = memResp.rows;
        else if (memResp?.members && Array.isArray(memResp.members)) list = memResp.members;

        const mapped = (list || []).map(m => ({
          id: m.id ?? m.member_id ?? m._id ?? null,
          name: m.full_name ?? [m.first_name, m.surname].filter(Boolean).join(' ') ?? m.name ?? 'Member',
          firstName: m.first_name,
          surname: m.surname,
          status: m.status,
          milestone: m.milestone ?? m.status ?? '',
          phone: m.phone
        }));

        if (mounted) setMembers(mapped.length > 0 ? mapped : mockMembersData);
      } catch (err) {
        console.error('Failed to load cell members', err);
        if (mounted) setMembers(mockMembersData);
      } finally {
        if (mounted) {
          setMembersLoading(false);
          setLoading(false);
        }
      }
    }
    if (fetchWithAuth) loadMembers();
    return () => { mounted = false; };
  }, [fetchWithAuth, user]);

  // Load meeting schedule for selectedGroupId
  useEffect(() => {
    let mounted = true;
    async function loadSchedule() {
      if (!selectedGroupId || !fetchWithAuth) {
        setMeetings(mockMeetingsData);
        return;
      }
      setMeetingsLoading(true);
      try {
        const resp = await getMeetingScheduleAndAttendance(fetchWithAuth, selectedGroupId).catch(() => null);
        const list = Array.isArray(resp) ? resp : (resp?.rows || resp?.data || []);
        if (mounted) setMeetings(list.length > 0 ? list : mockMeetingsData);
      } catch (err) {
        console.error('Failed to load meeting schedule', err);
        if (mounted) setMeetings(mockMeetingsData);
      } finally {
        if (mounted) setMeetingsLoading(false);
      }
    }
    loadSchedule();
    return () => { mounted = false; };
  }, [selectedGroupId, fetchWithAuth]);

  // Load absentees from last meeting
  useEffect(() => {
    let mounted = true;
    async function loadAbsentees() {
      if (!selectedGroupId || !fetchWithAuth) {
        setLastMeetingAbsentees(mockAbsenteesData);
        return;
      }
      setAbsenteesLoading(true);
      try {
        const resp = await getWeeklyReports(fetchWithAuth, { cell_group_id: selectedGroupId, limit: 1, offset: 0 }).catch(() => null);
        const reports = Array.isArray(resp) ? resp : (resp?.rows || resp?.data || []);
        if (reports.length > 0) {
          const lastReport = reports[0];
          const absentees = lastReport.absentees || [];
          const membersForLookup = await getCellMembers(fetchWithAuth, selectedGroupId, true).catch(() => []);
          let membersList = [];
          if (Array.isArray(membersForLookup)) membersList = membersForLookup;
          else if (membersForLookup?.data && Array.isArray(membersForLookup.data)) membersList = membersForLookup.data;
          else if (membersForLookup?.rows && Array.isArray(membersForLookup.rows)) membersList = membersForLookup.rows;
          const memberMap = {};
          if (Array.isArray(membersList) && membersList.length > 0) {
            membersList.forEach(m => { memberMap[m.member_id] = `${m.first_name ?? ''} ${m.surname ?? ''}`.trim(); });
          }
          const absenteeList = await Promise.all(absentees.map(async (a) => {
            let name = a.first_name && a.surname ? `${a.first_name} ${a.surname}` : (a.name || memberMap[a.member_id]);
            if (!name && a.member_id) {
              try {
                const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
                const memberResp = await fetchWithAuth(`${API_URL}/api/members/${a.member_id}`);
                const member = await memberResp.json();
                name = `${member.first_name ?? ''} ${member.surname ?? ''}`.trim();
              } catch (err) {
                console.warn(`Failed to fetch member ${a.member_id}:`, err);
                name = `Member #${a.member_id}`;
              }
            }
            return { ...a, name: name || `Member #${a.member_id}` };
          }));
          if (mounted) setLastMeetingAbsentees(absenteeList.length > 0 ? absenteeList : mockAbsenteesData);
        } else {
          if (mounted) setLastMeetingAbsentees(mockAbsenteesData);
        }
      } catch (err) {
        console.error('Failed to load absentees', err);
        if (mounted) setLastMeetingAbsentees(mockAbsenteesData);
      } finally {
        if (mounted) setAbsenteesLoading(false);
      }
    }
    loadAbsentees();
    return () => { mounted = false; };
  }, [selectedGroupId, fetchWithAuth, user]);

  // Load visitors needing follow-up
  useEffect(() => {
    let mounted = true;
    async function loadVisitorsFollowUp() {
      if (!selectedGroupId || !fetchWithAuth) {
        setVisitorsNeedingFollowUp(mockVisitorsData);
        return;
      }
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const membersRaw = await getCellMembers(fetchWithAuth, selectedGroupId, true).catch(() => []);
        let membersList = [];
        if (Array.isArray(membersRaw)) membersList = membersRaw;
        else if (membersRaw?.data && Array.isArray(membersRaw.data)) membersList = membersRaw.data;
        else if (membersRaw?.rows && Array.isArray(membersRaw.rows)) membersList = membersRaw.rows;
        const resp = await fetchWithAuth(`${API_URL}/api/visitors?cell_group_id=${selectedGroupId}`);
        const data = await resp.json();
        let visitors = Array.isArray(data) ? data : (data?.rows || data?.data || []);
        visitors = visitors.filter(v => Number(v.cell_group_id) === Number(selectedGroupId) && (v.followup_status === 'Pending' || v.followup_status === 'pending' || !v.followup_status));
        const visitorsWithInviters = visitors.map(v => {
          const inviterId = v.invited_by ?? v.invited_by_id;
          const inviter = membersList.find(m => Number(m.id) === Number(inviterId) || Number(m.member_id) === Number(inviterId));
          const inviterName = inviter ? `${inviter.first_name ?? ''} ${inviter.surname ?? ''}`.trim() : (v.invited_by_first_name && v.invited_by_surname ? `${v.invited_by_first_name} ${v.invited_by_surname}` : 'Unknown');
          return { ...v, inviterName };
        });
        if (mounted) setVisitorsNeedingFollowUp(visitorsWithInviters.length > 0 ? visitorsWithInviters : mockVisitorsData);
      } catch (err) {
        console.error('Failed to load visitors', err);
        if (mounted) setVisitorsNeedingFollowUp(mockVisitorsData);
      }
    }
    loadVisitorsFollowUp();
    return () => { mounted = false; };
  }, [selectedGroupId, fetchWithAuth]);

  // Load evangelism contacts
  useEffect(() => {
    let mounted = true;
    async function loadContacts() {
      if (!selectedGroupId || !fetchWithAuth) {
        setEvangelismContacts(mockEvangelismContactsData);
        return;
      }
      setContactsLoading(true);
      try {
        const resp = await listContacts(fetchWithAuth, { cell_group_id: selectedGroupId, status: 'Active' }).catch(() => null);
        const contacts = Array.isArray(resp) ? resp : (resp?.rows || resp?.data || []);
        if (mounted) setEvangelismContacts(contacts.length > 0 ? contacts : mockEvangelismContactsData);
      } catch (err) {
        console.error('Failed to load evangelism contacts', err);
        if (mounted) setEvangelismContacts(mockEvangelismContactsData);
      } finally {
        if (mounted) setContactsLoading(false);
      }
    }
    loadContacts();
    return () => { mounted = false; };
  }, [selectedGroupId, fetchWithAuth]);

  // Load prayer requests
  useEffect(() => {
    let mounted = true;
    async function loadPrayerRequests() {
      if (!selectedGroupId || !fetchWithAuth) {
        setPrayerRequests(mockPrayerRequestsData);
        return;
      }
      setPrayerLoading(true);
      try {
        const prayers = await getPrayerRequests(fetchWithAuth, { limit: 10 }).catch(() => []);
        if (mounted) setPrayerRequests(prayers && prayers.length > 0 ? prayers : mockPrayerRequestsData);
      } catch (err) {
        console.error('Failed to load prayer requests:', err);
        if (mounted) setPrayerRequests(mockPrayerRequestsData);
      } finally {
        if (mounted) setPrayerLoading(false);
      }
    }
    loadPrayerRequests();
    return () => { mounted = false; };
  }, [selectedGroupId, fetchWithAuth]);

  const generateActivities = (membersData) => {
    const baseActivities = mockActivitiesData.length > 0 ? mockActivitiesData : [
      {
        id: 1,
        type: 'member_join',
        description: 'Welcome to the Cell Group',
        member: membersData[0]?.full_name || membersData[0]?.name || 'New Member',
        timestamp: DateTime.now().minus({ days: 1 }).toISO(),
        icon: 'user-plus'
      },
      {
        id: 2,
        type: 'prayer',
        description: 'Prayer Request Submitted',
        member: membersData[1]?.full_name || membersData[1]?.name || 'Member',
        timestamp: DateTime.now().minus({ days: 2 }).toISO(),
        icon: 'heart'
      },
      {
        id: 3,
        type: 'milestone',
        description: 'Completed Foundation School',
        member: membersData[0]?.full_name || membersData[0]?.name || 'Member',
        timestamp: DateTime.now().minus({ days: 3 }).toISO(),
        icon: 'award'
      },
      {
        id: 4,
        type: 'meeting',
        description: 'Weekly Meeting Held',
        member: 'Cell Group',
        timestamp: DateTime.now().minus({ days: 4 }).toISO(),
        icon: 'calendar'
      }
    ];
    return baseActivities;
  };

  // Using shared `StatsCard` from components/dashboard for consistent styling

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <DashboardLayout hideUserMenu>
        <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </DashboardLayout>
    );
  }

  // Stats cards data
    const stats = [
      { label: 'Members', value: members.length, icon: Users, colorKey: 'primary' },
      { label: 'Activities', value: activities.length, icon: Activity, colorKey: 'success' },
      { label: 'Meetings', value: meetings.length, icon: Calendar, colorKey: 'info' },
      { label: 'Engagement', value: '85%', icon: TrendingUp, colorKey: 'warning' }
    ];

  return (
    <DashboardLayout hideUserMenu showAppBar={false}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <HeroHeader
          title="Cell Leader Dashboard"
          subtitle={
            cellGroup
              ? `${cellGroup.name} • ${cellGroup.meeting_day || 'TBA'}`
              : 'Lead your cell with clarity and momentum'
          }
          icon={<Users size={22} />}
        />

        {/* Stats Grid */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {stats.map((stat, idx) => {
            const themeColor = theme.palette[stat.colorKey]?.main || theme.palette.primary.main;
            const lightColor = theme.palette[stat.colorKey]?.light || theme.palette.primary.light;
            return (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <StatsCard
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  color={stat.colorKey}
                  sx={{
                    background: `linear-gradient(135deg, ${alpha(themeColor, 0.08)} 0%, ${alpha(lightColor, 0.03)} 100%)`,
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(themeColor, 0.12)}`,
                    borderRadius: 2,
                    height: '100%'
                  }}
                />
              </Grid>
            );
          })}
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Members Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Users size={24} color={theme.palette.primary.main} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Cell Members ({members.length})
                    </Typography>
                  </Box>
                }
                action={
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<Plus size={16} />}
                    sx={{ textTransform: 'none' }}
                  >
                    Add Member
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                {members.length > 0 ? (
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {members.map((member, idx) => (
                      <ListItem
                        key={idx}
                        sx={{
                          py: 1.5,
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                              width: 40,
                              height: 40
                            }}
                          >
                            {(member.first_name?.[0] || member.name?.[0] || 'M').toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {member.first_name && member.surname 
                                ? `${member.first_name} ${member.surname}` 
                                : member.name || 'Member'}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              {member.status && (
                                <Chip
                                  label={member.status}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20 }}
                                />
                              )}
                              {member.phone && (
                                <Tooltip title={member.phone}>
                                  <PhoneCall size={14} opacity={0.6} />
                                </Tooltip>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Users size={48} opacity={0.3} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      No members yet
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Activities Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
              <CardHeader
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Activity size={24} color={theme.palette.success.main} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      Recent Activities
                    </Typography>
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                {activities.length > 0 ? (
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {activities.map((activity, idx) => {
                      const getActivityIcon = (type) => {
                        switch (type) {
                          case 'member_join':
                            return <UserCheck size={18} color={theme.palette.primary.main} />;
                          case 'prayer':
                            return <Heart size={18} color={theme.palette.error.main} />;
                          case 'milestone':
                            return <CheckCircle2 size={18} color={theme.palette.success.main} />;
                          case 'meeting':
                            return <Calendar size={18} color={theme.palette.info.main} />;
                          default:
                            return <Activity size={18} />;
                        }
                      };

                      return (
                        <ListItem
                          key={idx}
                          sx={{
                            py: 1.5,
                            borderLeft: `3px solid ${theme.palette.divider}`,
                            pl: 2,
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              bgcolor: 'action.hover'
                            }
                          }}
                        >
                          <ListItemAvatar sx={{ minWidth: 40 }}>
                            {getActivityIcon(activity.type)}
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {activity.description}
                              </Typography>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  by {activity.member}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {DateTime.fromISO(activity.timestamp).toRelative()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Activity size={48} opacity={0.3} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      No activities yet
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

        </Grid>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <LeaderReadinessCard leaderId={user?.id} fetchWithAuth={fetchWithAuth} showSnackbar={showSnackbar} />
          </Grid>
        </Grid>

        {/* Meetings Section */}
        <Card sx={{ mt: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Calendar size={24} color={theme.palette.info.main} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Upcoming Meetings
                </Typography>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            <Grid container spacing={2}>
              {meetings.length > 0 ? (
                meetings.map((meeting, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Paper
                      sx={{
                        p: 2,
                        background: `linear-gradient(135deg, ${theme.palette.info.light}, ${theme.palette.info.lighter || '#e3f2fd'})`,
                        border: `1px solid ${theme.palette.info.main}30`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${theme.palette.info.main}20`
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Calendar size={18} color={theme.palette.info.main} />
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {DateTime.fromISO(meeting.date).toFormat('MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {meeting.agenda || 'Cell Meeting'}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={(meeting.attendance / 15) * 100}
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Attendance: {meeting.attendance || 0}/15
                      </Typography>
                    </Paper>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                    <Calendar size={48} opacity={0.3} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      No meetings scheduled
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
 
          {/* Absentees for Follow-Up */}
          <Card sx={{ mt: 3, mb: 2 }}>
            <CardHeader title={<Typography variant="h6">Absentees for Follow-Up</Typography>} />
            <Divider />
            <CardContent>
              <List>
                {absenteesLoading ? (
                  [1, 2].map(i => (
                    <ListItem key={i}>
                      <ListItemText primary="Loading…" secondary="" />
                    </ListItem>
                  ))
                ) : (dummyAbsentees && dummyAbsentees.length > 0) ? (
                  (dummyAbsentees).map((a, idx) => (
                    <ListItem key={idx}>
                      <ListItemText primary={a.name} secondary={a.reason ? `Reason: ${a.reason}` : (a.notes || '—')} />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No absentees recorded" />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>

          {/* New Visitors & Follow-Up Assignments */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <UserPlus size={20} /> New Visitors & Follow-Up Assignments
              </Typography>
              <Divider sx={{ my: 1 }} />
              <List>
                {dummyVisitors && dummyVisitors.length > 0 ? (
                  dummyVisitors.map((v, idx) => (
                    <ListItem key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {v.first_name} {v.surname}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Invited by: {v.inviterName || v.inviterName} — {v.followup_status || 'Pending follow-up'}
                        </Typography>
                      </Box>
                      <Chip label={v.followup_status || 'Pending'} size="small" color={v.followup_status === 'Completed' ? 'success' : 'warning'} variant="outlined" />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No visitors pending follow-up.</Typography>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Evangelism Contacts */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HeartHandshake size={20} /> Evangelism Contacts
              </Typography>
              <Divider sx={{ my: 1 }} />
              <List>
                {contactsLoading ? (
                  [1, 2].map(i => (
                    <ListItem key={i}><ListItemText primary="Loading…" /></ListItem>
                  ))
                ) : dummyEvangelismContacts && dummyEvangelismContacts.length > 0 ? (
                  dummyEvangelismContacts.map((c, idx) => (
                    <ListItem key={idx}>
                      <ListItemText 
                        primary={`${c.first_name ?? ''} ${c.surname ?? ''}`.trim() || 'Contact'} 
                        secondary={c.outcome || c.status || 'No outcome recorded'} 
                      />
                      <Chip 
                        label={c.status || 'Active'} 
                        size="small" 
                        color={c.status === 'Converted' ? 'success' : 'default'} 
                        variant="outlined" 
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No evangelism contacts for this cell group.</Typography>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Discipleship */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Discipleship Progress</Typography>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="primary">{discipleshipStatus.foundationSchool}</Typography>
                    <Typography variant="caption" color="text.secondary">Foundation School</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="success.main">{discipleshipStatus.baptismReady}</Typography>
                    <Typography variant="caption" color="text.secondary">Baptism Ready</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="info.main">{discipleshipStatus.sentOut}</Typography>
                    <Typography variant="caption" color="text.secondary">Sent Out</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="warning.main">{discipleshipStatus.activeCellMembers}</Typography>
                    <Typography variant="caption" color="text.secondary">Cell Leaders</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="body2">Total Members: <strong>{discipleshipStatus.totalMembers}</strong></Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Group Health */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Group Health Score</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2">Fellowship & Community</Typography>
                    <Typography variant="caption" fontWeight={600}>{groupHealth.fellowship}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={groupHealth.fellowship} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2">Testimonies & Victories</Typography>
                    <Typography variant="caption" fontWeight={600}>{groupHealth.testimonies}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={groupHealth.testimonies} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2">Spiritual Atmosphere</Typography>
                    <Typography variant="caption" fontWeight={600}>{groupHealth.spiritualAtmosphere}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={groupHealth.spiritualAtmosphere} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2">Evangelism Outreach</Typography>
                    <Typography variant="caption" fontWeight={600}>{groupHealth.evangelism}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={groupHealth.evangelism} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2">Discipleship Progress</Typography>
                    <Typography variant="caption" fontWeight={600}>{groupHealth.discipleship}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={groupHealth.discipleship} />
                </Box>
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>Overall Health Score</Typography>
                  <Typography variant="h6" color="primary">
                    {Math.round((groupHealth.fellowship + groupHealth.testimonies + groupHealth.spiritualAtmosphere + groupHealth.evangelism + groupHealth.discipleship) / 5)}/100
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {/* Timothy / Mentorship */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Mentee (Timothy) Progress</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>{timothyProgress.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{timothyProgress.stage}</Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2">Progress</Typography>
                    <Typography variant="caption" fontWeight={600}>{timothyProgress.progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={timothyProgress.progress} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated: {DateTime.fromISO(timothyProgress.lastUpdate).toRelative()}
                  </Typography>
                </Box>
                <Button variant="outlined" fullWidth sx={{ mt: 1 }}>Update Progress</Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BellRing size={20} /> Notifications & Reminders
              </Typography>
              <Divider sx={{ my: 1 }} />
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <AlertCircle size={18} color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${dummyAbsentees.length} members to follow up`}
                    secondary="Absentees from last meeting"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <UserPlus size={18} color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${dummyVisitors.length} visitors need welcome calls`}
                    secondary="Pending visitor follow-up"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Heart size={18} color="error" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${dummyPrayerRequests.length} active prayer requests`}
                    secondary="Remember to pray for these needs"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {dummyEvangelismContacts.length > 0 ? <CheckCircle2 size={18} color="success" /> : <AlertCircle size={18} color="warning" />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${dummyEvangelismContacts.length} active evangelism contacts`}
                    secondary="Continue following up with prospects"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Leadership */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6"><Medal size={20} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Leadership Progress</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>Your Development</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption">Self-Evaluation Status</Typography>
                      <Chip label="Pending" size="small" color="warning" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption">Mentorship Assignment</Typography>
                      <Chip label="Active" size="small" color="success" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption">Peer Evaluation Due</Typography>
                      <Chip label="1 week" size="small" variant="outlined" />
                    </Box>
                  </Stack>
                </Box>
                <Button variant="outlined" fullWidth>Complete Self-Evaluation</Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Cell Health Metrics */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">Cell Health Score</Typography>
              <Divider sx={{ my: 1 }} />
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Fellowship & Community</Typography>
                  <LinearProgress variant="determinate" value={groupHealth.fellowship} sx={{ mb: 1, height: 8 }} />
                  <Typography variant="caption" color="text.secondary">Love, unity, and care among members</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Testimonies & Victories</Typography>
                  <LinearProgress variant="determinate" value={groupHealth.testimonies} sx={{ mb: 1, height: 8 }} />
                  <Typography variant="caption" color="text.secondary">Members sharing faith stories and growth</Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Spiritual Atmosphere</Typography>
                  <LinearProgress variant="determinate" value={groupHealth.spiritualAtmosphere} sx={{ mb: 1, height: 8 }} />
                  <Typography variant="caption" color="text.secondary">Worship, prayer, and Spirit-led meetings</Typography>
                </Box>
                <Chip label={`Overall Score: ${Math.round((groupHealth.fellowship + groupHealth.testimonies + groupHealth.spiritualAtmosphere) / 3)}/100`} color="primary" variant="filled" />
              </Stack>
            </CardContent>
          </Card>

          {/* WBS Cycle (Win-Build-Send) */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">WBS Cycle Progress</Typography>
              <Divider sx={{ my: 1 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="primary">🎯</Typography>
                    <Typography variant="subtitle2" fontWeight={600} mt={1}>Win</Typography>
                    <Typography variant="body2" color="text.secondary">New souls</Typography>
                    <Typography variant="h6" fontWeight={700} mt={1}>7</Typography>
                    <Typography variant="caption" color="text.secondary">visitors this month</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="info.main">📚</Typography>
                    <Typography variant="subtitle2" fontWeight={600} mt={1}>Build</Typography>
                    <Typography variant="body2" color="text.secondary">Discipleship progress</Typography>
                    <Typography variant="h6" fontWeight={700} mt={1}>12</Typography>
                    <Typography variant="caption" color="text.secondary">in Foundation School</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="success.main">✨</Typography>
                    <Typography variant="subtitle2" fontWeight={600} mt={1}>Send</Typography>
                    <Typography variant="body2" color="text.secondary">Leaders raised</Typography>
                    <Typography variant="h6" fontWeight={700} mt={1}>2</Typography>
                    <Typography variant="caption" color="text.secondary">potential leaders</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Recent Prayer Requests */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">Recent Prayer Requests</Typography>
              {prayerLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : (prayerRequests && prayerRequests.length > 0) ? (
                <List dense>
                  {prayerRequests.slice(0, 5).map((prayer, idx) => (
                    <ListItem key={prayer.id || idx}>
                      <ListItemText primary={prayer.category || prayer.request || prayer.title || 'Prayer'} secondary={`${(prayer.description || prayer.request || '').substring(0, 80)}${(prayer.description || prayer.request || '').length > 80 ? '...' : ''}`} />
                      <Chip label={prayer.status || prayer.urgency || 'open'} size="small" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No prayer requests yet</Typography>
              )}
              {prayerRequests.length > 5 && <Button variant="text" size="small" sx={{ mt: 1 }}>View all prayer requests</Button>}
            </CardContent>
          </Card>
          

          {/* Action Buttons */}
          <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<Calendar size={18} />} onClick={() => setReportModalOpen(true)} sx={{ textTransform: 'none' }}>
              Add Meeting Report
            </Button>
            <Button variant="outlined" startIcon={<Plus size={18} />} onClick={() => setVisitorModalOpen(true)} sx={{ textTransform: 'none' }}>
              Add Visitor
            </Button>
            <Button variant="outlined" startIcon={<Heart size={18} />} onClick={() => setPrayerModalOpen(true)} sx={{ textTransform: 'none' }}>
              Prayer Request
            </Button>
            <Button variant="outlined" startIcon={<MessageSquare size={18} />} sx={{ textTransform: 'none' }}>
              Mark Attendance
            </Button>
          </Box>

        {/* Add/Edit Report Modal */}
        <AddEditReportModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          mode="create"
          defaultGroups={cellGroups}
        />

        {/* Add Visitor Modal */}
        <AddVisitorStepper
          open={visitorModalOpen}
          onClose={() => setVisitorModalOpen(false)}
          defaultGroupId={selectedGroupId}
          onGroupIdSelected={setSelectedGroupId}
        />

        {/* Prayer Request Modal */}
        <Dialog open={prayerModalOpen} onClose={() => setPrayerModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Submit Prayer Request</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <PrayerForm onSuccess={() => {
              setPrayerModalOpen(false);
              showSnackbar('Prayer request submitted successfully', 'success');
            }} onClose={() => setPrayerModalOpen(false)} showTitle={false} />
          </DialogContent>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={closeSnackbar}>
          <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </Container>
    </DashboardLayout>
  );
}
