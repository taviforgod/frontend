import React, { useContext, useEffect, useState } from 'react';
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
  Avatar,
  LinearProgress,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  IconButton,
  Autocomplete,
  Tooltip
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
  PhoneCall,
  MoreVertical,
  Download,
  FileText,
  Filter,
  Search,
  Send,
  Bell,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  Printer,
  Mail,
  UserPlus,
  Award,
  Target,
  Zap,
  ChevronRight,
  ArrowUpRight,
  HeartHandshake,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { DateTime } from 'luxon';
import DashboardLayout from '../components/DashboardLayout';
import AddEditReportModal from '../components/AddEditReportModal';
import AddVisitorStepper from '../components/visitors/AddVisitorStepper';
import PrayerForm from '../components/prayer/PrayerForm';
import { getMyCellGroups, getCellMembers, getUnassignedMembers, addCellMember, getCellGroupFormLookups } from '../services/cellGroupService';
import { getMeetingScheduleAndAttendance } from '../services/weeklyReportService';
import { listContacts } from '../services/evangelismService';
import { getPrayerRequests } from '../services/prayerService';
import { getFoundationByMember } from '../services/foundationService';
import { getMilestonesByMember } from '../services/milestoneService';
import { getCrisisFollowups } from '../services/crisisFollowupService';

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

export default function ModernDashboard() {
  const { fetchWithAuth, user } = useContext(AuthContext);
  const theme = useTheme();

  // State
  const [cellGroup, setCellGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [totalMembers, setTotalMembers] = useState(0);  // Includes cell leader
  const [meetings, setMeetings] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [absentees, setAbsentees] = useState([]);  // Members who were absent from last meeting
  const [activities, setActivities] = useState([]);
  const [evangelismContacts, setEvangelismContacts] = useState([]);
  const [followUpTasks, setFollowUpTasks] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState([]);
  const [discipleshipData, setDiscipleshipData] = useState({
    foundationSchool: { completed: 0, total: 0 },
    baptismReady: { completed: 0, total: 0 },
    leaderTraining: { completed: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [cellGroups, setCellGroups] = useState([]);
  const [unassignedMembers, setUnassignedMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberRole, setMemberRole] = useState('');
  const [roleOptions, setRoleOptions] = useState([]);
  const [addingMember, setAddingMember] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  
  // Crisis Care data
  const [crisisCases, setCrisisCases] = useState([]);
  const [crisesStats, setCrisisStats] = useState({ active: 0, inProgress: 0, resolved: 0 });
  
  // Giving & Finance data
  const [givingData, setGivingData] = useState({ total: 0, contributors: 0, average: 0 });
  
  // Wellness & Personal Growth data
  const [wellnessData, setWellnessData] = useState({
    spiritual: 0,
    physical: 0,
    mental: 0,
    leadership: 0
  });
  
  // Celebrations data
  const [celebrations, setCelebrations] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  
  // Dialog states for new tabs
  const [crisisDialogOpen, setCrisisDialogOpen] = useState(false);
  const [celebrationDialogOpen, setCelebrationDialogOpen] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || '';

  // Load groups and members
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        // Load cell groups - getMyCellGroups returns array with upcoming_meetings and members already included
        const groupsRaw = await getMyCellGroups(fetchWithAuth).catch(err => {
          console.error('getMyCellGroups failed:', err);
          return null;
        });
        
        if (!groupsRaw) {
          if (mounted) {
            setMembers([]);
            setCellGroups([]);
            setLoading(false);
          }
          return;
        }

        const groupsArr = Array.isArray(groupsRaw) ? groupsRaw : [groupsRaw];

        // Find user's cell group (as leader or member)
        const currentMemberId = user?.member_id ?? user?.memberId ?? user?.id;
        const preferred = groupsArr.find(g => {
          const leaderId = g?.leader?.id || g?.leader_id;
          return leaderId && currentMemberId && String(leaderId) === String(currentMemberId);
        }) || groupsArr[0] || null;

        if (!preferred) {
          if (mounted) {
            setMembers([]);
            setCellGroups(groupsArr);
            setLoading(false);
          }
          return;
        }

        const chosenGroupId = preferred.id;
        
        if (mounted) {
          setCellGroup(preferred);
          setCellGroups(groupsArr);
          setSelectedGroupId(chosenGroupId);
        }

        // Members are already in cellGroup from getMyCellGroups
        let membersList = preferred.members || [];
        
        // Load full member details if not complete
        if (chosenGroupId) {
          try {
            const membersResp = await getCellMembers(fetchWithAuth, chosenGroupId, true).catch(() => null);
            if (membersResp) {
              let fullMembersList = [];
              if (Array.isArray(membersResp)) fullMembersList = membersResp;
              else if (membersResp?.data && Array.isArray(membersResp.data)) fullMembersList = membersResp.data;
              else if (membersResp?.rows && Array.isArray(membersResp.rows)) fullMembersList = membersResp.rows;
              
              if (fullMembersList.length > 0) {
                membersList = fullMembersList;
              }
            }
          } catch (err) {
            console.warn('Failed to load full member details:', err);
          }
        }

        // Map members - exclude the cell leader if they're in the members list
        const leaderId = preferred?.leader?.id || preferred?.leader_id;
        
        const mapped = membersList
          .filter(m => {
            // Filter out the leader from the members list - check member_id FIRST (not id which is junction table id)
            const memberId = m.member_id || m.id;
            const leaderIdStr = String(leaderId || '').trim();
            const memberIdStr = String(memberId || '').trim();
            return leaderIdStr && memberIdStr && leaderIdStr !== memberIdStr;
          })
          .map(m => {
            // Handle cell_members response from API
            const memberId = m.member_id || m.id;  // Check member_id FIRST
            const firstName = m.first_name;
            const surname = m.surname;
            const fullName = [firstName, surname].filter(Boolean).join(' ') || 'Member';
            
            return {
              id: memberId,
              first_name: firstName,
              surname: surname,
              name: fullName,
              status: m.status || m.role || 'Member',
              milestone: m.milestone || 'Active',
              phone: m.phone || m.contact_primary || m.contact || null,
              email: m.email || m.email_address || null
            };
          });

        // Load meeting schedule and attendance - with proper field mapping
        const meetingsResp = await getMeetingScheduleAndAttendance(fetchWithAuth, chosenGroupId).catch(err => {
          console.warn('getMeetingScheduleAndAttendance failed:', err);
          return null;
        });

        let meetingsList = [];
        if (meetingsResp) {
          const rawMeetings = Array.isArray(meetingsResp) ? meetingsResp : (meetingsResp.rows || meetingsResp.data || []);
          meetingsList = rawMeetings.map(m => {
            return {
              id: m.id,
              date: m.meeting_date || m.date,
              topic: m.topic || m.agenda || m.title || 'Cell Meeting',
              agenda: m.topic || m.agenda || m.title || 'Cell Meeting',
              attendance: m.total_attendance || m.total_cell_attendance || m.attendance || 0,
              total: m.expected_members || m.total || totalMembers || 15,
              next_meeting_date: m.next_meeting_date
            };
          });
        }

        // Load absentees from the last meeting
        let absenteesList = [];
        if (meetingsList.length > 0) {
          try {
            const lastMeeting = meetingsList[0];
            const absentResp = await fetch(`${API_URL}/api/weekly-reports/${lastMeeting.id}`, {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
            }).catch(() => null);

            if (absentResp && absentResp.ok) {
              const reportData = await absentResp.json().catch(() => null);
              if (reportData && reportData.absentees) {
                absenteesList = Array.isArray(reportData.absentees) ? reportData.absentees : [];
              }
            }
          } catch (err) {
            console.warn('Failed to load absentees:', err);
          }
        }

        // Generate activities based on actual meetings and events
        const generatedActivities = [];
        
        // Add recent meetings with attendance
        if (meetingsList.length > 0) {
          meetingsList.slice(0, 3).forEach((meeting, idx) => {
            generatedActivities.push({
              id: `meeting_${idx}`,
              type: 'meeting',
              description: `${meeting.agenda || 'Cell Meeting'} - Attendance: ${meeting.attendance}/${meeting.total}`,
              member: 'Cell Group',
              timestamp: meeting.date,
              icon: Calendar,
              color: 'info'
            });
          });
        }

        // Add member info
        if (mapped.length > 0) {
          generatedActivities.push({
            id: 'members',
            type: 'member_join',
            description: `Cell has ${mapped.length} active members`,
            member: cellGroup?.name || 'Cell Group',
            timestamp: DateTime.now().minus({ hours: 1 }).toISO(),
            icon: Users,
            color: 'primary'
          });
        }

        // Add prayer requests info if available
        if (prayerRequests.length > 0) {
          generatedActivities.push({
            id: 'prayers',
            type: 'prayer',
            description: `${prayerRequests.length} active prayer requests in the group`,
            member: 'Cell Members',
            timestamp: DateTime.now().minus({ hours: 2 }).toISO(),
            icon: Heart,
            color: 'error'
          });
        }

        // Add visitor info if available
        if (visitors.length > 0) {
          generatedActivities.push({
            id: 'visitors',
            type: 'visitor',
            description: `${visitors.length} new visitor(s) needing follow-up`,
            member: 'Cell Group',
            timestamp: DateTime.now().minus({ hours: 3 }).toISO(),
            icon: UserPlus,
            color: 'warning'
          });
        }

        // Add absentees info if available
        if (absenteesList.length > 0) {
          generatedActivities.push({
            id: 'absentees',
            type: 'absentee',
            description: `${absenteesList.length} member(s) absent from last meeting`,
            member: 'Cell Group',
            timestamp: DateTime.now().minus({ hours: 4 }).toISO(),
            icon: AlertCircle,
            color: 'error'
          });
        }

        // Sort by timestamp (most recent first)
        generatedActivities.sort((a, b) => {
          const timeA = DateTime.fromISO(a.timestamp).toMillis();
          const timeB = DateTime.fromISO(b.timestamp).toMillis();
          return timeB - timeA;
        });

        // Load visitors
        let visitorsData = [];
        try {
          const visitorsResp = await fetchWithAuth(`/api/visitors?cell_group_id=${chosenGroupId}`);
          if (visitorsResp.ok) {
            const visitorsJson = await visitorsResp.json();
            visitorsData = Array.isArray(visitorsJson) ? visitorsJson : (visitorsJson?.data || visitorsJson?.rows || []);
          }
        } catch (err) {
          console.warn('Failed to load visitors:', err);
        }

        // Map visitors data and filter to only those invited by cell members
        const memberNames = new Set(mapped.map(m => m.name?.toLowerCase()));
        const mappedVisitors = visitorsData
          .filter(v => {
            // Only include visitors invited by cell members (not system visitors)
            const invitedByName = (v.invited_by_name || '').toLowerCase();
            return memberNames.has(invitedByName) || (v.invited_by_id && mapped.some(m => m.id === v.invited_by_id));
          })
          .map(v => ({
            id: v.id,
            first_name: v.first_name,
            surname: v.surname,
            name: `${v.first_name} ${v.surname}`,
            invitedBy: v.invited_by_name || mapped[0]?.name || 'Cell Leader',
            invited_by_id: v.invited_by_id,
            followup_status: v.followup_status || 'Pending',
            invited_date: v.invited_date || DateTime.now().toFormat('yyyy-MM-dd'),
            phone: v.phone || v.contact_primary || null,
            email: v.email || v.email_address || null
          }));

        // Generate follow-up tasks
        const tasks = mapped.slice(0, 3).map((m, idx) => ({
          id: idx + 1,
          member: m.name,
          task: idx === 0 ? 'Missed last meeting' : idx === 1 ? 'Follow-up on Foundation School progress' : 'Check-in conversation',
          priority: idx === 0 ? 'High' : idx === 1 ? 'Medium' : 'Low',
          dueDate: DateTime.now().plus({ days: idx === 0 ? 2 : idx === 1 ? 7 : 14 }).toFormat('yyyy-MM-dd')
        }));

        // Load discipleship data for members
        let discipleshipStats = {
          foundationSchool: { completed: 0, total: 0 },
          baptismReady: { completed: 0, total: 0 },
          leaderTraining: { completed: 0, total: 0 }
        };

        try {
          for (const member of mapped) {
            try {
              const foundationData = await getFoundationByMember(fetchWithAuth, member.id).catch(() => null);
              if (foundationData) {
                discipleshipStats.foundationSchool.total += 1;
                if (foundationData.is_completed || foundationData.completed_date) {
                  discipleshipStats.foundationSchool.completed += 1;
                }
              }

              const milestonesData = await getMilestonesByMember(fetchWithAuth, member.id).catch(() => null);
              if (milestonesData && Array.isArray(milestonesData)) {
                const baptismMilestone = milestonesData.find(m => m.milestone_name?.toLowerCase().includes('baptism'));
                if (baptismMilestone) {
                  discipleshipStats.baptismReady.total += 1;
                  if (baptismMilestone.is_completed || baptismMilestone.completed_date) {
                    discipleshipStats.baptismReady.completed += 1;
                  }
                }

                const leaderMilestone = milestonesData.find(m => m.milestone_name?.toLowerCase().includes('leader'));
                if (leaderMilestone) {
                  discipleshipStats.leaderTraining.total += 1;
                  if (leaderMilestone.is_completed || leaderMilestone.completed_date) {
                    discipleshipStats.leaderTraining.completed += 1;
                  }
                }
              }
            } catch (err) {
              console.warn(`Failed to load discipleship data for member ${member.id}:`, err);
            }
          }
        } catch (err) {
          console.warn('Failed to load discipleship data:', err);
        }

        if (mounted) {
          setMembers(mapped);
          setTotalMembers(mapped.length + (preferred?.leader ? 1 : 0));  // Include cell leader
          setMeetings(meetingsList.slice(0, 3));
          setAbsentees(absenteesList);  // Set absentees from last meeting
          setActivities(generatedActivities);
          setFollowUpTasks(tasks);
          setVisitors(mappedVisitors);
          setDiscipleshipData(discipleshipStats);  // Set actual discipleship data
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        if (mounted) setMembers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (fetchWithAuth) loadData();
    return () => { mounted = false; };
  }, [fetchWithAuth, user]);

  // Load prayer requests - note: these are church-wide, we'll show them for reference
  useEffect(() => {
    let mounted = true;
    async function loadPrayers() {
      if (!fetchWithAuth) return;
      try {
        // Get all church prayers (note: not filtered by cell group)
        const prayers = await getPrayerRequests(fetchWithAuth, { limit: 100 }).catch(() => []);
        const allPrayers = Array.isArray(prayers) ? prayers : (prayers?.data || prayers?.rows || []);
        
        // Filter to prayers related to this cell group members
        const cellMemberIds = members.map(m => m.id);
        const cellLeaderId = cellGroup?.leader?.id;
        
        const relevantPrayers = allPrayers.filter(p => {
          const createdById = p.created_by_member_id || p.created_by;
          return cellMemberIds.includes(createdById) || createdById === cellLeaderId;
        });
        
        if (mounted) setPrayerRequests(relevantPrayers.slice(0, 20));
      } catch (err) {
        console.error('Failed to load prayer requests', err);
        if (mounted) setPrayerRequests([]);
      }
    }
    loadPrayers();
    return () => { mounted = false; };
  }, [selectedGroupId, members, cellGroup, fetchWithAuth]);

  // Load evangelism contacts
  useEffect(() => {
    let mounted = true;
    async function loadContacts() {
      if (!selectedGroupId || !fetchWithAuth) return;
      try {
        const resp = await listContacts(fetchWithAuth, { cell_group_id: selectedGroupId, status: 'Active' }).catch(() => []);
        const contacts = Array.isArray(resp) ? resp : (resp?.rows || resp?.data || []);
        // Deduplicate contacts by id or normalized name (first+surname or full_name)
        const seen = new Set();
        const deduped = [];
        for (const c of contacts) {
          const key = c.id || c.full_name || `${(c.first_name || '').trim().toLowerCase()}-${(c.surname || '').trim().toLowerCase()}`;
          if (!key) continue;
          if (seen.has(key)) continue;
          seen.add(key);
          deduped.push(c);
        }
        if (mounted) setEvangelismContacts(deduped.slice(0, 5));
      } catch (err) {
        console.error('Failed to load evangelism contacts', err);
        if (mounted) setEvangelismContacts([]);
      }
    }
    loadContacts();
    return () => { mounted = false; };
  }, [selectedGroupId, fetchWithAuth]);

  // Load crisis followups
  useEffect(() => {
    let mounted = true;
    async function loadCrisis() {
      if (!selectedGroupId || !fetchWithAuth) return;
      try {
        const resp = await getCrisisFollowups(fetchWithAuth, { cell_group_id: selectedGroupId }).catch(() => []);
        const cases = Array.isArray(resp) ? resp : (resp?.data || resp?.rows || []);
        
        if (mounted) {
          setCrisisCases(cases);
          
          // Calculate stats
          const stats = {
            active: cases.filter(c => c.status === 'open' || c.status === 'active').length,
            inProgress: cases.filter(c => c.status === 'in_progress').length,
            resolved: cases.filter(c => c.status === 'closed' || c.status === 'resolved').length
          };
          setCrisisStats(stats);
        }
      } catch (err) {
        console.warn('Failed to load crisis cases:', err);
        if (mounted) {
          setCrisisCases([]);
          setCrisisStats({ active: 0, inProgress: 0, resolved: 0 });
        }
      }
    }
    loadCrisis();
    return () => { mounted = false; };
  }, [selectedGroupId, fetchWithAuth]);

  // Load giving/finance data - calculate from meetings with offering data
  useEffect(() => {
    let mounted = true;
    async function loadGiving() {
      if (!fetchWithAuth) return;
      try {
        // Calculate from meetings that have offering data
        let totalGiving = 0;
        let givingMembers = new Set();
        
        // Try to get offering data from weekly reports if available
        if (meetings && meetings.length > 0) {
          meetings.forEach(meeting => {
            if (meeting.offering && meeting.offering > 0) {
              totalGiving += meeting.offering;
            }
          });
        }
        
        if (mounted) {
          setGivingData({
            total: totalGiving,
            contributors: givingMembers.size || members.length,
            average: members.length > 0 ? totalGiving / members.length : 0
          });
        }
      } catch (err) {
        console.warn('Failed to load giving data:', err);
        if (mounted) {
          setGivingData({ total: 0, contributors: 0, average: 0 });
        }
      }
    }
    loadGiving();
    return () => { mounted = false; };
  }, [members, meetings, fetchWithAuth]);

  // Load wellness and personal growth data - calculate from discipleship data
  useEffect(() => {
    let mounted = true;
    async function loadWellness() {
      if (!fetchWithAuth) return;
      try {
        // Calculate wellness scores based on discipleship progress
        const spiritualPct = discipleshipData.foundationSchool.total > 0
          ? (discipleshipData.foundationSchool.completed / discipleshipData.foundationSchool.total) * 100
          : 0;
        
        const leadershipPct = discipleshipData.leaderTraining.total > 0
          ? (discipleshipData.leaderTraining.completed / discipleshipData.leaderTraining.total) * 100
          : 0;
        
        const baptismPct = discipleshipData.baptismReady.total > 0
          ? (discipleshipData.baptismReady.completed / discipleshipData.baptismReady.total) * 100
          : 0;
        
        if (mounted) {
          setWellnessData({
            spiritual: Math.round(spiritualPct),
            physical: Math.round(baptismPct * 0.8), // Proxy for physical (assuming baptism participation)
            mental: Math.round(Math.min(100, (prayerRequests.length > 0 ? 60 : 75))), // Mental wellness based on prayers
            leadership: Math.round(leadershipPct)
          });
        }
      } catch (err) {
        console.warn('Failed to load wellness data:', err);
        if (mounted) {
          setWellnessData({ spiritual: 0, physical: 0, mental: 0, leadership: 0 });
        }
      }
    }
    loadWellness();
    return () => { mounted = false; };
  }, [discipleshipData, prayerRequests, fetchWithAuth]);

  // Load unassigned members and roles when add member dialog opens
  useEffect(() => {
    let mounted = true;
    async function loadUnassignedMembers() {
      if (!addMemberDialogOpen || !fetchWithAuth) return;
      try {
        const resp = await getUnassignedMembers(fetchWithAuth).catch(() => []);
        const membersList = Array.isArray(resp) ? resp : (resp?.rows || resp?.data || []);
        if (mounted) setUnassignedMembers(membersList);

        // Load form lookups for roles
        const lookupsResp = await getCellGroupFormLookups(fetchWithAuth).catch(() => null);
        if (lookupsResp && lookupsResp.roles) {
          const roles = Array.isArray(lookupsResp.roles) ? lookupsResp.roles : [];
          if (mounted) setRoleOptions(roles);
        }
      } catch (err) {
        console.error('Failed to load unassigned members or roles', err);
        if (mounted) {
          setUnassignedMembers([]);
          setRoleOptions([]);
        }
      }
    }
    loadUnassignedMembers();
    return () => { mounted = false; };
  }, [addMemberDialogOpen, fetchWithAuth]);

  // Handle adding a member to the cell group
  const handleAddMember = async () => {
    if (!selectedMember || !selectedGroupId) return;
    setAddingMember(true);
    try {
      await addCellMember(fetchWithAuth, {
        cell_group_id: selectedGroupId,
        member_id: selectedMember.id || selectedMember.member_id,
        role_id: memberRole || null
      });
      showSnackbar(`${selectedMember.first_name} ${selectedMember.surname} added successfully`, 'success');
      
      // Reload members
      const memResp = await getCellMembers(fetchWithAuth, selectedGroupId, true);
      let list = [];
      if (Array.isArray(memResp)) list = memResp;
      else if (memResp?.data && Array.isArray(memResp.data)) list = memResp.data;
      else if (memResp?.rows && Array.isArray(memResp.rows)) list = memResp.rows;
      
      // Filter out leader from members list (match initial load behavior)
      const leaderId = cellGroup?.leader?.id || cellGroup?.leader_id;
      const mapped = (list || [])
        .filter(m => {
          const memberId = m.member_id || m.id;  // Check member_id FIRST
          const leaderIdStr = String(leaderId || '').trim();
          const memberIdStr = String(memberId || '').trim();
          return leaderIdStr && memberIdStr && leaderIdStr !== memberIdStr;  // Exclude cell leader
        })
        .map(m => ({
          id: m.member_id || m.id,  // Check member_id FIRST
          first_name: m.first_name,
          surname: m.surname,
          name: [m.first_name, m.surname].filter(Boolean).join(' ') || 'Member',
          status: m.status || m.role || 'Member',
          milestone: m.milestone || 'Active',
          phone: m.phone || m.contact_primary || null,
          email: m.email || m.email_address || null
        }));
      setMembers(mapped);
      setTotalMembers(mapped.length + (cellGroup?.leader ? 1 : 0));  // Include cell leader
      
      // Close dialog and reset
      setAddMemberDialogOpen(false);
      setSelectedMember(null);
      setMemberRole('');
    } catch (err) {
      console.error('Failed to add member:', err);
      showSnackbar('Failed to add member. Please try again.', 'error');
    } finally {
      setAddingMember(false);
    }
  };

  const handleCallMember = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleMessageMember = (phone) => {
    if (phone) {
      window.location.href = `sms:${phone}`;
    }
  };

  const handleMoreMemberOptions = (member) => {
    showSnackbar(`${member.name} - Phone: ${member.phone || 'N/A'}, Email: ${member.email || 'N/A'}`, 'info');
  };

  const handleVisitorFollowUp = (visitor) => {
    // Mark visitor follow-up as completed
    showSnackbar(`Follow-up started for ${visitor.name}. Contact them at ${visitor.phone || visitor.email || 'N/A'}`, 'success');
  };

  const handleCallVisitor = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleMessageVisitor = (phone) => {
    if (phone) {
      window.location.href = `sms:${phone}`;
    }
  };

  const handleEmailVisitor = (email) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleReportCrisis = () => {
    setCrisisDialogOpen(true);
  };

  const handleAddCelebration = () => {
    setCelebrationDialogOpen(true);
  };

  const handleExportGiving = () => {
    // Export giving data as CSV
    const headers = ['Date', 'Member', 'Amount', 'Category'];
    const csvContent = [
      headers.join(','),
      `${DateTime.now().toFormat('yyyy-MM-dd')},Total Giving,GH₵ ${givingData.total.toFixed(2)},Monthly`
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `giving-report-${DateTime.now().toFormat('yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showSnackbar('Giving report exported successfully', 'success');
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <DashboardLayout hideUserMenu showAppBar={false}>
        <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
      </DashboardLayout>
    );
  }

  // Mock stats
  const stats = [
    { label: 'Total Members', value: totalMembers || 15, change: '+2 this month', icon: Users, color: 'primary' },
    { label: 'Weekly Meetings', value: meetings.length || 12, change: '4 scheduled', icon: Calendar, color: 'primary' },
    { label: 'Engagement', value: '85%', change: '+5% vs last week', icon: TrendingUp, color: 'success' },
    { label: 'Prayer Requests', value: prayerRequests.length || 8, change: '3 new today', icon: Heart, color: 'error' }
  ];

  return (
    <DashboardLayout hideUserMenu showAppBar={false}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Hero Header */}
        <Box sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`, color: 'white', borderRadius: 2, p: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ p: 1, background: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                  <Users size={24} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  Cell Leader Dashboard
                </Typography>
              </Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                {cellGroup?.name || 'Light Cell Group'} • {cellGroup?.meeting_day || 'Wednesday'}
                {cellGroup?.meeting_time && ` at ${cellGroup.meeting_time}`}
              </Typography>
              {cellGroup?.leader && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      background: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.4)'
                    }}
                  >
                    {cellGroup.leader.first_name?.charAt(0)}{cellGroup.leader.surname?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block' }}>Cell Leader</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {cellGroup.leader.first_name} {cellGroup.leader.surname}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
            <Box sx={{ background: 'rgba(255,255,255,0.1)', borderRadius: 1, p: 2, textAlign: 'right' }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>Health Score</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>78/100</Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{
                background: `linear-gradient(135deg, ${alpha(theme.palette[stat.color].main, 0.1)}, ${alpha(theme.palette[stat.color].light, 0.05)})`,
                backdropFilter: 'blur(8px)',
                border: `1px solid ${alpha(theme.palette[stat.color].main, 0.12)}`,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {stat.label}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', my: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.success.main, fontWeight: 600 }}>
                        {stat.change}
                      </Typography>
                    </Box>
                    <Box sx={{ color: theme.palette[stat.color].main }}>
                      <stat.icon size={24} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Reports & Analytics Bar */}
        <Card sx={{ mb: 3, boxShadow: 1 }}>
          <CardContent sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart3 size={20} color={theme.palette.primary.main} />
                <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Reports & Analytics</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Filter size={16} />}
                  onClick={() => setFilterDialogOpen(true)}
                >
                  Filter
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Download size={16} />}
                  onClick={() => setExportDialogOpen(true)}
                >
                  Export
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PieChart size={16} />}
                  sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.purple?.main || theme.palette.primary.dark})` }}
                  onClick={() => setAnalyticsModalOpen(true)}
                  title="View detailed analytics and reports for this cell group"
                >
                  View Analytics
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Overview" id="tab-0" />
            <Tab label="Members" id="tab-1" />
            <Tab label="Follow-Up" id="tab-2" />
            <Tab label="Reports" id="tab-3" />
            <Tab label="Crisis Care" id="tab-4" />
            <Tab label="Giving & Finance" id="tab-5" />
            <Tab label="Personal Growth" id="tab-6" />
            <Tab label="Celebrations" id="tab-7" />
          </Tabs>
        </Box>

        {/* OVERVIEW TAB */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* Quick Actions */}
            <Grid item xs={12} lg={3}>
              <Card sx={{ height: '100%', boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Zap size={20} color={theme.palette.warning.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Quick Actions</Typography>
                    </Box>
                  }
                  subheader="Common tasks"
                />
                <Divider />
                <CardContent sx={{ pt: 2 }}>
                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Calendar size={16} />}
                      onClick={() => setReportModalOpen(true)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Add Meeting Report
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Plus size={16} />}
                      onClick={() => setVisitorModalOpen(true)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Add New Visitor
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Heart size={16} />}
                      onClick={() => setPrayerModalOpen(true)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Prayer Request
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CheckCircle2 size={16} />}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Mark Attendance
                    </Button>
                    <Divider sx={{ my: 1 }} />
                    <Button
                      fullWidth
                      variant="text"
                      startIcon={<FileText size={16} />}
                      size="small"
                    >
                      View All Reports
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Activities */}
            <Grid item xs={12} lg={9}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Activity size={20} color={theme.palette.success.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Recent Activities</Typography>
                    </Box>
                  }
                  subheader="Latest updates from your cell group"
                  action={<MoreVertical size={18} />}
                />
                <Divider />
                <CardContent>
                  <List>
                    {activities && activities.length > 0 ? activities.map((activity, idx) => (
                      <Box key={activity.id}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ background: alpha(theme.palette[activity.color].main, 0.2), color: theme.palette[activity.color].main }}>
                              <activity.icon size={20} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={activity.description}
                            secondary={
                              `by ${activity.member} • ${
                                activity.timestamp 
                                  ? DateTime.fromISO(activity.timestamp).toRelative() 
                                  : activity.time || 'Recently'
                              }`
                            }
                          />
                        </ListItem>
                        {idx < activities.length - 1 && <Divider />}
                      </Box>
                    )) : (
                      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No activities yet</Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Meetings */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Calendar size={20} color={theme.palette.info.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Upcoming Meetings</Typography>
                    </Box>
                  }
                  action={<Button size="small" endIcon={<ChevronRight size={16} />}>View All</Button>}
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    {meetings.length > 0 ? meetings.map((meeting, idx) => (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Paper sx={{
                          p: 2,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: theme.palette.info.main,
                            boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.2)}`
                          }
                        }}>
                          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                            <Calendar size={16} color={theme.palette.info.main} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                              {meeting.date ? DateTime.fromISO(meeting.date).toFormat('MMM dd, yyyy') : 'TBA'}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ mb: 2 }}>
                            {meeting.agenda || 'Cell Meeting'}
                          </Typography>
                          <LinearProgress variant="determinate" value={((meeting.attendance || 0) / (meeting.total || 15)) * 100} sx={{ mb: 1 }} />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Attendance: {meeting.attendance || 0}/{meeting.total || 15}
                          </Typography>
                        </Paper>
                      </Grid>
                    )) : (
                      <Grid item xs={12}>
                        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No meetings scheduled</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* MEMBERS TAB */}
        <TabPanel value={activeTab} index={1}>
          <Card sx={{ boxShadow: 1 }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Users size={20} color={theme.palette.primary.main} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Cell Members ({members.length})</Typography>
                </Box>
              }
              subheader="Manage and track your cell group members"
              action={
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    placeholder="Search members..."
                    size="small"
                    variant="outlined"
                    InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8 }} /> }}
                  />
                  <Button variant="contained" startIcon={<Plus size={16} />} onClick={() => setAddMemberDialogOpen(true)}>Add Member</Button>
                </Box>
              }
            />
            <Divider />
            <CardContent>
              <List>
                {members && members.length > 0 ? members.map((member, idx) => (
                  <Box key={member.id || idx}>
                    <ListItem sx={{
                      py: 2,
                      px: 0,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.03) }
                    }}>
                      <ListItemAvatar>
                        <Avatar sx={{ background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})` }}>
                          {(member.first_name?.[0] || member.name?.split(' ')?.[0]?.[0] || 'M').toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography sx={{ fontWeight: 600 }}>{member.name || 'Member'}</Typography>}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                            {member.status && <Chip label={member.status} size="small" variant="filled" sx={{ borderRadius: '20px' }} />}
                            {member.milestone && <Chip label={member.milestone} size="small" variant="filled" sx={{ borderRadius: '20px' }} />}
                          </Box>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {member.phone && (
                          <Tooltip title={`Call ${member.phone}`}>
                            <Box>
                              <Button 
                                size="small" 
                                variant="text" 
                                startIcon={<PhoneCall size={14} />}
                                onClick={() => handleCallMember(member.phone)}
                              />
                            </Box>
                          </Tooltip>
                        )}
                        <Tooltip title="Send Message">
                          <Box>
                            <Button 
                              size="small" 
                              variant="text" 
                              startIcon={<MessageSquare size={14} />}
                              onClick={() => handleMessageMember(member.phone)}
                              disabled={!member.phone}
                            />
                          </Box>
                        </Tooltip>
                        <Tooltip title="More Options">
                          <Box>
                            <Button 
                              size="small" 
                              variant="text" 
                              startIcon={<MoreVertical size={14} />}
                              onClick={() => handleMoreMemberOptions(member)}
                            />
                          </Box>
                        </Tooltip>
                      </Box>
                    </ListItem>
                    {idx < members.length - 1 && <Divider />}
                  </Box>
                )) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No members found</Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </TabPanel>

        {/* FOLLOW-UP TAB */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            {/* Absentees from Last Meeting */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AlertCircle size={20} color={theme.palette.error.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Absentees</Typography>
                    </Box>
                  }
                  subheader="Members absent from last meeting"
                />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    {absentees && absentees.length > 0 ? absentees.map((absentee, idx) => {
                      // Find member details from members list
                      const memberDetails = members.find(m => m.id === absentee.member_id);
                      const name = memberDetails?.name || absentee.member_name || 'Unknown Member';
                      return (
                        <Paper key={idx} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box>
                              <Typography sx={{ fontWeight: 600 }}>{name}</Typography>
                              {absentee.reason && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                  Reason: {absentee.reason}
                                </Typography>
                              )}
                            </Box>
                            <Chip 
                              label="Absent" 
                              size="small" 
                              color="error" 
                              variant="filled"
                            />
                          </Box>
                          {absentee.followup_action && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                              Follow-up: {absentee.followup_action}
                            </Typography>
                          )}
                        </Paper>
                      );
                    }) : (
                      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No absentees from last meeting</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Visitor Follow-Up */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UserPlus size={20} color={theme.palette.secondary.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Visitor Follow-Up</Typography>
                    </Box>
                  }
                  subheader="New visitors requiring attention"
                />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    {visitors && visitors.length > 0 ? visitors.map((visitor) => (
                      <Paper key={visitor.id} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600 }}>
                              {visitor.first_name && visitor.surname 
                                ? `${visitor.first_name} ${visitor.surname}` 
                                : visitor.name || 'Visitor'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              Invited by: {visitor.invitedBy || visitor.invited_by_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                              {visitor.invited_date || visitor.date}
                            </Typography>
                          </Box>
                          <Chip 
                            label={visitor.followup_status || visitor.status || 'Pending'} 
                            size="small" 
                            color={visitor.followup_status === 'Completed' || visitor.status === 'Completed' ? 'success' : 'warning'}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                          {visitor.phone && (
                            <Tooltip title={`Call ${visitor.phone}`}>
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<PhoneCall size={14} />}
                                onClick={() => handleCallVisitor(visitor.phone)}
                              />
                            </Tooltip>
                          )}
                          {visitor.phone && (
                            <Tooltip title="Send SMS">
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<MessageSquare size={14} />}
                                onClick={() => handleMessageVisitor(visitor.phone)}
                              />
                            </Tooltip>
                          )}
                          {visitor.email && (
                            <Tooltip title={`Email ${visitor.email}`}>
                              <Button
                                size="small"
                                variant="text"
                                startIcon={<Mail size={14} />}
                                onClick={() => handleEmailVisitor(visitor.email)}
                              />
                            </Tooltip>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{ ml: 'auto', textTransform: 'none', borderRadius: '20px' }}
                            onClick={() => handleVisitorFollowUp(visitor)}
                          >
                            Start Follow-up
                          </Button>
                        </Box>
                      </Paper>
                    )) : (
                      <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No visitors pending follow-up</Typography>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Priority Tasks */}
            <Grid item xs={12} lg={6}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AlertCircle size={20} color={theme.palette.warning.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Priority Tasks</Typography>
                    </Box>
                  }
                  subheader="Member care and action items"
                />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    {followUpTasks.map((task) => (
                      <Paper key={task.id} sx={{ p: 2, border: `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600 }}>{task.member}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                              {task.task}
                            </Typography>
                          </Box>
                          <Chip
                            label={task.priority}
                            size="small"
                            color={task.priority === 'High' ? 'error' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            <Clock size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                            Due: {task.dueDate}
                          </Typography>
                          <Button size="small" startIcon={<CheckCircle2 size={14} />}>Complete</Button>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                  <Button variant="outlined" fullWidth sx={{ mt: 2 }} startIcon={<Plus size={16} />}>
                    Add Follow-Up Task
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* Discipleship Progress */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Target size={20} color={theme.palette.success.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Discipleship Tracking</Typography>
                    </Box>
                  }
                  subheader="Monitor spiritual growth and milestones"
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={3}>
                    {[
                      { label: 'Foundation School', value: discipleshipData.foundationSchool.completed, total: discipleshipData.foundationSchool.total || totalMembers, icon: BookOpen },
                      { label: 'Baptism Ready', value: discipleshipData.baptismReady.completed, total: discipleshipData.baptismReady.total || totalMembers, icon: Heart },
                      { label: 'Leader Training', value: discipleshipData.leaderTraining.completed, total: discipleshipData.leaderTraining.total || totalMembers, icon: Award }
                    ].map((item, idx) => (
                      <Grid item xs={12} md={4} key={idx}>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.value}/{item.total || 0}</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={item.total > 0 ? (item.value / item.total) * 100 : 0} 
                            sx={{ mb: 2 }} 
                          />
                          <Button variant="outlined" size="small" fullWidth startIcon={<item.icon size={14} />}>View Details</Button>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* REPORTS TAB */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            {[
              { label: 'Attendance Report', desc: 'Weekly meeting attendance trends', icon: Calendar, color: 'primary' },
              { label: 'Discipleship Progress', desc: 'Track member growth and milestones', icon: Target, color: 'secondary' },
              { label: 'Group Health Score', desc: 'Overall cell group health metrics', icon: Heart, color: 'error' },
              { label: 'Visitor Tracking', desc: 'New visitors and follow-up rates', icon: UserPlus, color: 'warning' },
              { label: 'Monthly Summary', desc: 'Comprehensive monthly activity', icon: BarChart3, color: 'info' },
              { label: 'Custom Report', desc: 'Build your own custom report', icon: Sparkles, color: 'success' }
            ].map((report, idx) => (
              <Grid item xs={12} md={6} lg={4} key={idx}>
                <Card sx={{
                  boxShadow: 1,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-4px)'
                  }
                }}>
                  <CardHeader
                    avatar={
                      <Avatar sx={{ background: alpha(theme.palette[report.color].main, 0.2) }}>
                        <report.icon size={20} color={theme.palette[report.color].main} />
                      </Avatar>
                    }
                    action={<Button size="small" variant="text" startIcon={<Download size={14} />} />}
                  />
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{report.label}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>{report.desc}</Typography>
                    <Button variant="contained" fullWidth startIcon={<FileText size={16} />}>
                      {report.label === 'Custom Report' ? 'Create Custom' : 'Generate Report'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* CRISIS CARE TAB */}
        <TabPanel value={activeTab} index={4}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AlertCircle size={20} color={theme.palette.error.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Crisis Care Management</Typography>
                    </Box>
                  }
                  subheader="Track and manage crisis situations for members"
                  action={
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<Plus size={16} />}
                      onClick={handleReportCrisis}
                    >
                      Report Crisis
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Active Cases', value: crisesStats.active, color: 'error', icon: AlertCircle },
                      { label: 'In Progress', value: crisesStats.inProgress, color: 'warning', icon: Clock },
                      { label: 'Resolved', value: crisesStats.resolved, color: 'success', icon: CheckCircle2 }
                    ].map((stat, idx) => (
                      <Grid item xs={12} md={4} key={idx}>
                        <Paper sx={{ p: 2, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                          <stat.icon size={28} color={theme.palette[stat.color]?.main} style={{ marginBottom: 8 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{stat.value}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title="Recent Crisis Cases"
                  subheader="Latest cases requiring pastoral care"
                />
                <Divider />
                <CardContent>
                  {crisisCases.length > 0 ? (
                    <List disablePadding>
                      {crisisCases.slice(0, 5).map((crisis, idx) => (
                        <ListItem key={idx} sx={{ borderBottom: idx < crisisCases.length - 1 ? `1px solid ${theme.palette.divider}` : 'none', py: 2 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ background: alpha(theme.palette.error.main, 0.2) }}>
                              <AlertCircle size={20} color={theme.palette.error.main} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={crisis.member_name || 'Member'}
                            secondary={`${crisis.category || 'Crisis'} • ${crisis.status?.toUpperCase() || 'OPEN'}`}
                          />
                          <Chip
                            label={crisis.urgency?.toUpperCase() || 'NORMAL'}
                            size="small"
                            color={crisis.urgency === 'urgent' ? 'error' : 'default'}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                      No active crisis cases. All members are doing well!
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* GIVING & FINANCE TAB */}
        <TabPanel value={activeTab} index={5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Heart size={20} color={theme.palette.success.main} />
                      <Typography variant="h6">Total Giving</Typography>
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    GH₵ {givingData.total.toFixed(2)}

                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    This month
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={givingData.total > 500 ? Math.min((givingData.total / 500) * 100, 100) : 0}
                    sx={{ mt: 2, mb: 1, height: 6, borderRadius: 3 }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {givingData.total > 0 ? Math.round((givingData.total / 500) * 100) : 0}% of monthly goal
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Users size={20} color={theme.palette.info.main} />
                      <Typography variant="h6">Contributors</Typography>
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {givingData.contributors}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Members contributing
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUp size={20} color={theme.palette.warning.main} />
                      <Typography variant="h6">Avg per Member</Typography>
                    </Box>
                  }
                />
                <Divider />
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    GH₵ {givingData.average.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Average contribution
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title="Giving Trends"
                  subheader="Monthly giving patterns"
                  action={
                    <Button variant="outlined" size="small" startIcon={<Download size={14} />} onClick={handleExportGiving}>
                      Export
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {givingData.total > 0 ? `Total giving tracked: GH₵ ${givingData.total.toFixed(2)}` : 'Giving data will appear here as members contribute'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* PERSONAL GROWTH & WELLNESS TAB */}
        <TabPanel value={activeTab} index={6}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Sparkles size={20} color={theme.palette.secondary.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Personal Growth & Wellness</Typography>
                    </Box>
                  }
                  subheader="Member development and well-being tracking"
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Spiritual Health', pct: wellnessData.spiritual, icon: BookOpen, color: 'primary' },
                      { label: 'Physical Wellness', pct: wellnessData.physical, icon: Heart, color: 'error' },
                      { label: 'Mental Wellness', pct: wellnessData.mental, icon: Sparkles, color: 'info' },
                      { label: 'Leadership Dev.', pct: wellnessData.leadership, icon: Award, color: 'warning' }
                    ].map((metric, idx) => (
                      <Grid item xs={12} md={6} key={idx}>
                        <Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <metric.icon size={20} color={theme.palette[metric.color]?.main} />
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{metric.label}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{metric.pct}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={metric.pct}
                            color={metric.color}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader title="Spiritual Disciplines" />
                <Divider />
                <CardContent>
                  <List disablePadding>
                    {[
                      { activity: 'Bible Reading', members: 3, goal: 5 },
                      { activity: 'Prayer Group', members: 4, goal: 5 },
                      { activity: 'Fasting', members: 1, goal: 5 }
                    ].map((item, idx) => (
                      <ListItem key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                        <ListItemText
                          primary={item.activity}
                          secondary={`${item.members}/${item.goal} participating`}
                        />
                        <Chip
                          label={`${Math.round((item.members / item.goal) * 100)}%`}
                          size="small"
                          color={item.members === item.goal ? 'success' : 'default'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader title="Development Programs" />
                <Divider />
                <CardContent>
                  <Stack spacing={2}>
                    {[
                      { name: 'Foundation School', enrolled: discipleshipData.foundationSchool.total, completed: discipleshipData.foundationSchool.completed },
                      { name: 'Leader Training', enrolled: discipleshipData.leaderTraining.total, completed: discipleshipData.leaderTraining.completed },
                      { name: 'Baptism Prep', enrolled: discipleshipData.baptismReady.total, completed: discipleshipData.baptismReady.completed }
                    ].map((prog, idx) => (
                      <Box key={idx}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{prog.name}</Typography>
                          <Typography variant="caption">{prog.completed}/{prog.enrolled} completed</Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={prog.enrolled > 0 ? (prog.completed / prog.enrolled) * 100 : 0}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* CELEBRATIONS TAB */}
        <TabPanel value={activeTab} index={7}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Award size={20} color={theme.palette.secondary.main} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Celebrations & Milestones</Typography>
                    </Box>
                  }
                  subheader="Celebrate member achievements and growth"
                  action={
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Plus size={16} />}
                      onClick={handleAddCelebration}
                    >
                      Add Celebration
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Birthdays This Month', value: 0, icon: Calendar, color: 'warning' },
                      { label: 'Anniversaries', value: 0, icon: Heart, color: 'error' },
                      { label: 'Milestones Achieved', value: 0, icon: Award, color: 'success' },
                      { label: 'Upcoming Events', value: 0, icon: CheckCircle2, color: 'info' }
                    ].map((item, idx) => (
                      <Grid item xs={6} md={3} key={idx}>
                        <Paper sx={{ p: 2, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                          <item.icon size={24} color={theme.palette[item.color]?.main} style={{ marginBottom: 8 }} />
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>{item.value}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {item.label}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title="Recent Celebrations"
                  subheader="Moments to remember and celebrate"
                />
                <Divider />
                <CardContent>
                  <List disablePadding>
                    {[
                      { member: 'Group Celebration', date: 'Last month', type: 'Group Event', icon: Users },
                      { member: 'Member Milestone', date: '2 weeks ago', type: 'Achievement', icon: Award }
                    ].map((item, idx) => (
                      <ListItem key={idx} sx={{ borderBottom: idx < 1 ? `1px solid ${theme.palette.divider}` : 'none', py: 2 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ background: alpha(theme.palette.primary.main, 0.2) }}>
                            <item.icon size={20} color={theme.palette.primary.main} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={item.member}
                          secondary={`${item.type} • ${item.date}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card sx={{ boxShadow: 1 }}>
                <CardHeader
                  title="Upcoming Events"
                  subheader="Mark your calendar"
                />
                <Divider />
                <CardContent>
                  <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                    No upcoming celebrations scheduled. Plan something special for your group!
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Modals */}
        <AddEditReportModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          mode="create"
          defaultGroups={cellGroups}
        />

        <AddVisitorStepper
          open={visitorModalOpen}
          onClose={() => setVisitorModalOpen(false)}
          defaultGroupId={selectedGroupId}
          onGroupIdSelected={setSelectedGroupId}
        />

        <Dialog open={prayerModalOpen} onClose={() => setPrayerModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Submit Prayer Request</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <PrayerForm onSuccess={() => {
              setPrayerModalOpen(false);
              showSnackbar('Prayer request submitted successfully', 'success');
            }} onClose={() => setPrayerModalOpen(false)} showTitle={false} />
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialogOpen} onClose={() => setAddMemberDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Member to Cell Group</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <Autocomplete
                options={unassignedMembers}
                getOptionLabel={(option) => `${option.first_name} ${option.surname}`}
                value={selectedMember}
                onChange={(_, value) => setSelectedMember(value)}
                renderInput={(params) => <TextField {...params} label="Select Member" />}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  label="Role"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {roleOptions.map((role) => (
                    <MenuItem key={role.id || role} value={role.id || role}>
                      {role.name || role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setAddMemberDialogOpen(false);
              setSelectedMember(null);
              setMemberRole('');
            }}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleAddMember}
              disabled={!selectedMember || addingMember}
            >
              {addingMember ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Filter Dialog */}
        <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Filter Reports</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select label="Report Type">
                  <MenuItem value="attendance">Attendance Report</MenuItem>
                  <MenuItem value="discipleship">Discipleship Progress</MenuItem>
                  <MenuItem value="health">Group Health</MenuItem>
                  <MenuItem value="visitors">Visitor Follow-up</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select label="Date Range">
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="quarter">Last Quarter</MenuItem>
                  <MenuItem value="year">Last Year</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFilterDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setFilterDialogOpen(false)}>Apply Filters</Button>
          </DialogActions>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Export Report</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>Choose export format</Typography>
            <Grid container spacing={2}>
              {[
                { icon: FileSpreadsheet, label: 'Excel', color: 'success' },
                { icon: FileText, label: 'PDF', color: 'info' },
                { icon: Printer, label: 'Print', color: 'primary' },
                { icon: Mail, label: 'Email', color: 'secondary' }
              ].map((option, idx) => (
                <Grid item xs={6} key={idx}>
                  <Paper sx={{
                    p: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      boxShadow: 1
                    }
                  }}>
                    <option.icon size={24} color={(theme.palette[option.color] && theme.palette[option.color].main) ? theme.palette[option.color].main : theme.palette.primary.main} style={{ marginBottom: 8 }} />
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>{option.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setExportDialogOpen(false)}>Export</Button>
          </DialogActions>
        </Dialog>

        {/* Crisis Report Dialog */}
        <Dialog open={crisisDialogOpen} onClose={() => setCrisisDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Report Crisis Situation</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Document a crisis situation requiring pastoral care
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Member Name"
                placeholder="Enter member name"
              />
              <TextField
                fullWidth
                label="Crisis Category"
                select
              >
                <MenuItem value="health">Health Crisis</MenuItem>
                <MenuItem value="financial">Financial Crisis</MenuItem>
                <MenuItem value="family">Family Crisis</MenuItem>
                <MenuItem value="emotional">Emotional/Mental</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Urgency Level"
                select
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </TextField>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Describe the situation..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCrisisDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setCrisisDialogOpen(false);
                showSnackbar('Crisis case reported successfully', 'success');
              }}
            >
              Report Crisis
            </Button>
          </DialogActions>
        </Dialog>

        {/* Celebration Dialog */}
        <Dialog open={celebrationDialogOpen} onClose={() => setCelebrationDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Celebration</DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Celebrate member achievements and milestones
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Member Name"
                placeholder="Enter member name"
              />
              <TextField
                fullWidth
                label="Celebration Type"
                select
              >
                <MenuItem value="birthday">Birthday</MenuItem>
                <MenuItem value="anniversary">Anniversary</MenuItem>
                <MenuItem value="baptism">Baptism</MenuItem>
                <MenuItem value="milestone">Milestone Achievement</MenuItem>
                <MenuItem value="promotion">Promotion/New Role</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
              <TextField
                fullWidth
                type="date"
                label="Date"
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                placeholder="What are we celebrating?"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCelebrationDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => {
                setCelebrationDialogOpen(false);
                showSnackbar('Celebration added successfully', 'success');
              }}
            >
              Add Celebration
            </Button>
          </DialogActions>
        </Dialog>

        {/* Analytics Modal */}
        <Dialog open={analyticsModalOpen} onClose={() => setAnalyticsModalOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart3 size={24} color={theme.palette.primary.main} />
            <span>{cellGroup?.name || 'Cell Group'} - Analytics Dashboard</span>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* Attendance Stats */}
              <Grid item xs={12} md={6}>
                <Card sx={{ boxShadow: 1 }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <UserCheck size={20} color={theme.palette.info.main} />
                        <span>Attendance Trend</span>
                      </Box>
                    }
                    subheader={`Last ${meetings.length} meetings`}
                  />
                  <Divider />
                  <CardContent>
                    <Stack spacing={2}>
                      {meetings.slice(0, 5).map((meeting, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {meeting.date ? DateTime.fromISO(meeting.date).toFormat('MMM dd') : 'TBA'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min((meeting.attendance / meeting.total) * 100, 100)}
                              sx={{ width: 150, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                              {meeting.attendance}/{meeting.total}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Discipleship Progress */}
              <Grid item xs={12} md={6}>
                <Card sx={{ boxShadow: 1 }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Award size={20} color={theme.palette.warning.main} />
                        <span>Discipleship Progress</span>
                      </Box>
                    }
                    subheader={`${totalMembers} members tracked`}
                  />
                  <Divider />
                  <CardContent>
                    <Stack spacing={2}>
                      {[
                        { label: 'Foundation School', data: discipleshipData.foundationSchool, color: 'primary' },
                        { label: 'Baptism Ready', data: discipleshipData.baptismReady, color: 'success' },
                        { label: 'Leader Training', data: discipleshipData.leaderTraining, color: 'warning' }
                      ].map((item, idx) => (
                        <Box key={idx}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.data.completed}/{item.data.total}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={item.data.total > 0 ? (item.data.completed / item.data.total) * 100 : 0}
                            color={item.color}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              {/* Key Metrics */}
              <Grid item xs={12}>
                <Card sx={{ boxShadow: 1 }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp size={20} color={theme.palette.success.main} />
                        <span>Key Metrics</span>
                      </Box>
                    }
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      {[
                        {
                          label: 'Engagement Rate',
                          value: meetings.length > 0
                            ? Math.round((meetings.reduce((sum, m) => sum + (m.attendance / m.total), 0) / meetings.length) * 100)
                            : 0,
                          icon: TrendingUp,
                          color: 'success',
                          suffix: '%',
                          description: meetings.length > 0 
                            ? `Avg from ${meetings.slice(0, 3).length} recent meetings`
                            : 'No meetings yet'
                        },
                        {
                          label: 'Total Members',
                          value: totalMembers,
                          icon: Users,
                          color: 'info',
                          description: `${members.length} + 1 leader`
                        },
                        {
                          label: 'Active Visitors',
                          value: visitors.filter(v => !v.follow_up_completed).length,
                          icon: Activity,
                          color: 'warning',
                          description: `${visitors.filter(v => v.follow_up_completed).length} completed follow-ups`
                        },
                        {
                          label: 'Prayer Requests',
                          value: prayerRequests.length,
                          icon: Heart,
                          color: 'secondary',
                          description: prayerRequests.length > 0
                            ? `${prayerRequests.filter(p => !p.prayed_for).length} awaiting prayer`
                            : 'None yet'
                        }
                      ].map((metric, idx) => (
                        <Grid item xs={6} md={3} key={idx}>
                          <Paper sx={{ p: 2, textAlign: 'center', border: `1px solid ${theme.palette.divider}` }}>
                            <metric.icon size={28} color={theme.palette[metric.color]?.main || theme.palette.primary.main} style={{ marginBottom: 8 }} />
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                              {metric.value}{metric.suffix || ''}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                              {metric.label}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                              {metric.description}
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Activities */}
              <Grid item xs={12}>
                <Card sx={{ boxShadow: 1 }}>
                  <CardHeader
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Activity size={20} color={theme.palette.secondary.main} />
                        <span>Recent Activities</span>
                      </Box>
                    }
                    subheader="Last 5 activities"
                  />
                  <Divider />
                  <CardContent>
                    <List disablePadding>
                      {activities.slice(0, 5).map((activity, idx) => (
                        <ListItem key={idx} sx={{ display: 'flex', gap: 2, pb: 1.5 }}>
                          <Box sx={{
                            p: 1,
                            borderRadius: '50%',
                            bgcolor: alpha(theme.palette[activity.color || 'primary'].main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 40,
                            height: 40
                          }}>
                            {activity.icon === 'Users' && <Users size={20} color={theme.palette[activity.color || 'primary'].main} />}
                            {activity.icon === 'Heart' && <Heart size={20} color={theme.palette[activity.color || 'primary'].main} />}
                            {activity.icon === 'Activity' && <Activity size={20} color={theme.palette[activity.color || 'primary'].main} />}
                            {activity.icon === 'AlertCircle' && <AlertCircle size={20} color={theme.palette[activity.color || 'primary'].main} />}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{activity.title}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {activity.timestamp ? DateTime.fromISO(activity.timestamp).toRelative() : activity.timestamp}
                            </Typography>
                          </Box>
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setAnalyticsModalOpen(false)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<Download size={16} />}
              onClick={() => {
                const doc = `${cellGroup?.name} - Analytics Report\n\n`;
                console.log('Download report for:', cellGroup?.name);
                setSnackbar({ open: true, message: 'Report download initiated', severity: 'success' });
              }}
            >
              Download Report
            </Button>
          </DialogActions>
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
