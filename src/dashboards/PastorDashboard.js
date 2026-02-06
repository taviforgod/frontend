import React, { useContext, useMemo, useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip, Divider, Grid, Button,
  List, ListItem, ListItemText, Avatar, IconButton, CircularProgress, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Select, FormControl, InputLabel, Snackbar, Alert, Skeleton, Autocomplete
} from '@mui/material';
import {
  Medal, Users as UsersIcon, TrendingUp, HeartHandshake, FileText, BarChart2, AlertTriangle,
  MessageCircle, DollarSign, UserCheck, PhoneCall, BookOpen, CalendarCheck, Gift
} from 'lucide-react';
import { DateTime } from 'luxon';
import { useNavigate } from 'react-router-dom';

// Services (adjust imports to match your project structure)
import {
  getCellHealthDashboard,
  getConsolidatedReport,
  getAbsenteeTrends,
  getAtRiskMembers,
} from '../services/analyticsService';
import { getCellGroups, getMyCellGroups } from '../services/cellGroupService';
import { listVisitors } from '../services/visitorService';
import { listContacts as listEvangelismContacts } from '../services/evangelismService';

import {
  assignMentor,
  getAssignmentsByMentor,
  createSession,
  getSessionsForAssignment,
  getAssignmentsByMentee,
} from '../services/mentorshipService';

import {
  getMilestoneTemplates,
  getMilestonesByMember,
  assignMilestone,
} from '../services/milestoneService';
import { getLeadershipSummary } from '../services/leadershipService';
import { getCrisisFollowups } from '../services/crisisFollowupService'; 
import { getPrayerRequests } from '../services/prayerService';
import { getMembers } from '../services/memberService';

import HealthDashboard from '../components/HealthDashboard';
import { AuthContext } from '../contexts/AuthContext';
import MemberMilestones from '../components/spiritual/MemberMilestones';
import MentorshipCard from '../components/spiritual/MentorshipCard';
import NotificationWidget from '../components/NotificationWidget';
import HeroHeader from '../components/dashboard/HeroHeader';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function PastorDashboard() {
  const { fetchWithAuth } = useContext(AuthContext);
  const navigate = useNavigate();  // Add this line
  
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  // Growth / Milestones
  const [growthSummary, setGrowthSummary] = useState(null);
  const [milestoneTemplates, setMilestoneTemplates] = useState([]);
  const [openAssignMilestone, setOpenAssignMilestone] = useState(false);
  const [assignForm, setAssignForm] = useState({ templateId: '', memberId: '', dueDate: '' });
  const [assigningMilestone, setAssigningMilestone] = useState(false);
  const [openMilestoneDialog, setOpenMilestoneDialog] = useState(false);
  const [milestoneDialogMemberId, setMilestoneDialogMemberId] = useState(null);

  // Mentorship
  const [mentorshipSummary, setMentorshipSummary] = useState(null);
  const [mentorsList, setMentorsList] = useState([]);
  const [openAssignMentor, setOpenAssignMentor] = useState(false);
  const [assignMentorForm, setAssignMentorForm] = useState({ mentorId: '', menteeId: '' });
  const [openAddSession, setOpenAddSession] = useState(false);
  const [addSessionForm, setAddSessionForm] = useState({ assignmentId: '', notes: '', sessionDate: '' });
  const [mentorshipLoading, setMentorshipLoading] = useState(false);
  const [openMentorshipModal, setOpenMentorshipModal] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState(null); // Add this state
  const [openAssignmentDetail, setOpenAssignmentDetail] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Cells / attendance / meetings
  const [cellHealth, setCellHealth] = useState([]);
  const [consolidatedMeetings, setConsolidatedMeetings] = useState([]);
  const [absentees, setAbsentees] = useState([]);
  const [followupPending, setFollowupPending] = useState({});

  // Cell groups widget state
  const [cellGroups, setCellGroups] = useState([]);
  const [cellGroupsLoading, setCellGroupsLoading] = useState(false);

  // New members
  const [membersList, setMembersList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // New widgets state
  const [newVisitors, setNewVisitors] = useState([]);
  const [prayerRequests, setPrayerRequests] = useState(null);
  const [crisisCases, setCrisisCases] = useState([]);
  const [foundationProgress, setFoundationProgress] = useState([]);
  const [leaderEvaluations, setLeaderEvaluations] = useState([]);
  const [evangelismContacts, setEvangelismContacts] = useState([]);
  const [celebrations, setCelebrations] = useState([]);
  const [multiplicationReadiness, setMultiplicationReadiness] = useState([]);
  const [leadershipPipeline, setLeadershipPipeline] = useState([]);

  // snack
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const showSnack = useCallback((message, severity = 'info') => setSnack({ open: true, message, severity }), []);
  const closeSnack = useCallback(() => setSnack(s => ({ ...s, open: false })), []);

  // Lightweight dummy fallback data to ensure dashboard is rich even if APIs are empty / offline
  const FALLBACK = {
    overview: { members_total: 224, active_cells: 14, attendance_pct: 88, new_members: 6, baptisms: 3, giving_summary: { period: 'Nov', amount: 'R18,900' } },
    absentees: [
      { member_id: 'm1', full_name: 'John D', missed_count: 3, cell_name: 'Hope' },
      { member_id: 'm2', full_name: 'Mary M', missed_count: 2, cell_name: 'Light' },
    ],
    newVisitors: [
      { id: 'v1', full_name: 'Paul A', contact: '072-555-0101', visits: 1, follow_up: 'assigned' },
      { id: 'v2', full_name: 'Grace T', contact: '072-555-0202', visits: 2, follow_up: 'pending' },
    ],
    prayerRequests: [
      { id: 'p1', member_name: 'Sibongile', category: 'Family', urgency: 'Urgent', assigned_to: 'Pastor Mike', created_at: new Date().toISOString() },
      { id: 'p2', member_name: 'Lerato', category: 'Health', urgency: 'Medium', assigned_to: 'Zone Leader', created_at: new Date().toISOString() },
    ],
    crisisCases: [
      { id: 'c1', member_name: 'Sipho', type: 'Bereavement', status: 'Open', assigned_to: 'PFCC', opened_on: new Date().toISOString() },
    ],
    foundationProgress: [
      { member_id: 'm10', full_name: 'Thabo M', level: 'Level 2', progress: 60 },
      { member_id: 'm11', full_name: 'Lerato P', level: 'Level 1', progress: 30 },
    ],
    leaderEvaluations: [
      { leader_id: 'l1', leader_name: 'Zanele M', self: 4, peer: 4, supervisor: 5, overall: 4.3 },
      { leader_id: 'l2', leader_name: 'Joseph K', self: 3, peer: 3, supervisor: 4, overall: 3.3 },
    ],
    evangelismContacts: [
      { id: 'e1', name: 'Nandi', encountered_at: 'Mall', status: 'Interested', invited: true },
      { id: 'e2', name: 'Ayo', encountered_at: 'Street', status: 'Contacted', invited: false },
    ],
    celebrations: [
      { id: 'b1', member: 'Lungi N', event: 'Birthday', date: DateTime.local().plus({ days: 2 }).toISODate() },
      { id: 'b2', member: 'Thabo K', event: 'Anniversary', date: DateTime.local().plus({ days: 7 }).toISODate() },
    ],
    multiplicationReadiness: [
      { cellId: 'cell1', cellName: 'Hope', readinessScore: 85, recommendedAction: 'Prepare split' },
      { cellId: 'cell2', cellName: 'Light', readinessScore: 62, recommendedAction: 'Grow team' },
    ],
    leadershipPipeline: [
      { name: 'Thabo', phase: 'Developing', readiness: 7 },
      { name: 'Lerato', phase: 'Emerging', readiness: 4 },
    ],
  };

  useEffect(() => {
    let mounted = true;

    // Debug helper: wrap fetchWithAuth / fetch to log failing responses
    const debugFetchJson = async (url, opts = {}) => {
      try {
        const res = fetchWithAuth ? await fetchWithAuth(url, opts) : await fetch(url, opts);
        if (!res) { console.warn('debugFetchJson: no response for', url); return null; }
        if (!res.ok) {
          let body = null;
          try { body = await res.text(); } catch (e) { body = `<unable to read body: ${e.message}>`; }
          console.warn('debugFetchJson: non-ok response', { url, status: res.status, statusText: res.statusText, body });
          return null;
        }
        try { return await res.json(); } catch (e) { console.warn('debugFetchJson: failed to parse json', url, e); return null; }
      } catch (err) {
        console.error('debugFetchJson error', url, err);
        return null;
      }
    };

    // helper to force fresh server response (cache-buster)
    const freshUrl = (u) => `${u}${u.includes('?') ? '&' : '?'}ts=${Date.now()}`;

    async function loadAll() {
      setLoading(true);
      try {
        // Overview
        try {
          const period = '30d';
          const overviewUrl = `${API_URL}/api/members/overview?period=${encodeURIComponent(period)}`;
          const url = freshUrl(overviewUrl);
          // use debug helper to clearly log non-ok responses / bodies
          const j = await debugFetchJson(url, { credentials: 'include' });
          console.debug('overview payload', j);
          const payload = j?.data ?? j?.overview ?? j ?? {};
          // normalize keys the UI expects
          const mapped = {
            members_total: payload.members_total ?? payload.members ?? payload.total_members ?? 0,
            active_cells: payload.active_cells ?? payload.active_cell_count ?? payload.cells_active ?? 0,
            attendance_pct: payload.attendance_pct ?? payload.attendance_percentage ?? payload.attendance ?? 0,
            new_members: payload.new_members ?? payload.new_members_count ?? payload.recent_members ?? 0,
            baptisms: payload.baptisms ?? payload.baptized ?? payload.baptisms_count ?? 0,
            giving_summary: payload.giving_summary ?? { period: payload.giving_period ?? '', amount: payload.giving_amount ?? 0 }
          };
          if (mounted) setOverview(mapped);
        } catch (e) {
          if (mounted) setOverview(FALLBACK.overview);
        }

        // Milestone templates (force fresh fetch to avoid 304/ETag returning no body)
        try {
          const url = `${API_URL || ''}/api/milestone-templates?ts=${Date.now()}`;
          const res = fetchWithAuth
            ? await fetchWithAuth(url, { method: 'GET', cache: 'no-store', credentials: 'include' })
            : await fetch(url, { method: 'GET', cache: 'no-store', credentials: 'include' });

          let templates = null;
          if (res && res.ok) {
            try { templates = await res.json(); } catch { templates = null; }
          }

          // normalize common shapes: array | { data: [] } | { templates: [] }
          let list = [];
          if (Array.isArray(templates)) list = templates;
          else if (templates && Array.isArray(templates.data)) list = templates.data;
          else if (templates && Array.isArray(templates.templates)) list = templates.templates;

          // map to { id, title } expected by the Select (adjust fields if different)
          list = (list || []).map(t => ({
            id: t.id ?? t.template_id ?? t._id ?? '',
            title: t.name ?? t.title ?? t.label ?? t.name ?? String(t.id ?? '')
          }));

          if (mounted) setMilestoneTemplates(list);
        } catch {
          if (mounted) setMilestoneTemplates([]);
        }

        // Growth summary
        try {
          const res = fetchWithAuth ? await fetchWithAuth(`${API_URL}/api/spiritual_growth/summary`, { credentials: 'include' }) : await fetch(`${API_URL}/api/spiritual_growth/summary`, { credentials: 'include' });
          if (res && res.ok) {
            const j = await res.json();
            if (mounted) setGrowthSummary(j);
          } else {
            if (mounted) setGrowthSummary(FALLBACK.growthSummary || {});
          }
        } catch { if (mounted) setGrowthSummary({}); }

        // Mentorship summary
        try {
          const res = fetchWithAuth
            ? await fetchWithAuth(`${API_URL}/api/mentorship/summary`, { credentials: 'include' })
            : await fetch(`${API_URL}/api/mentorship/summary`, { credentials: 'include' });

          if (res && res.ok) {
            const j = await res.json();
            console.debug('mentorship payload', j);

            const totals = j?.totals || j;
            const stats = j?.stats || j?.statistics || {};

            const recentAssignmentsRaw = j?.recentAssignments || j?.recent_assignments || j?.recent || j?.assignments || [];
            const recentSessionsRaw = j?.recentSessions || j?.recent_sessions || j?.sessions || j?.meeting_sessions || [];

            // helper to build display name from multiple possible shapes (improved)
            const buildNameFromObj = (o) => {
              if (!o) return null;
              if (typeof o === 'string') return o;
              if (o.full_name) return o.full_name;
              if (o.display_name) return o.display_name;
              if (o.name) return o.name;
              // support flattened fields like mentor_first_name / mentee_surname
              const flattenedFirst = o.first_name ?? o.firstName ?? o.given_name;
              const flattenedLast = o.surname ?? o.last_name ?? o.lastName ?? o.family_name;
              if (flattenedFirst || flattenedLast) return [flattenedFirst, flattenedLast].filter(Boolean).join(' ');
              // support direct mentor_first_name / mentee_first_name when object is the assignment
              if (o.mentor_first_name || o.mentor_surname) return [o.mentor_first_name, o.mentor_surname].filter(Boolean).join(' ');
              if (o.mentee_first_name || o.mentee_surname) return [o.mentee_first_name, o.mentee_surname].filter(Boolean).join(' ');
              if (o.email) return o.email;
              if (o.username) return o.username;
              return null;
            };

            // helper: try many possible keys on an assignment item to get person name (now covers flattened fields)
            const extractPersonName = (item, role) => {
              if (!item) return null;
              // 1) explicit string fields
              const direct = [
                `${role}_name`, `${role}Name`, `${role}_full_name`, `${role}FullName`,
                `${role}_display`, `${role}_display_name`, `${role}_displayName`
              ];
              for (const k of direct) {
                if (item[k]) return typeof item[k] === 'string' ? item[k] : buildNameFromObj(item[k]);
              }

              // 2) flattened fields on the assignment row: mentor_first_name, mentee_surname, etc.
              const flatFirst = item[`${role}_first_name`] || item[`${role}FirstName`] || item[`${role}_firstname`];
              const flatLast = item[`${role}_surname`] || item[`${role}_last_name`] || item[`${role}LastName`];
              if (flatFirst || flatLast) return [flatFirst, flatLast].filter(Boolean).join(' ');

              // 3) nested object (item.mentee, item.mentor, item.member, item.person)
              const nests = [role, `${role}_info`, `${role}Info`, 'member', 'person', 'user'];
              for (const n of nests) {
                if (item[n]) {
                  const name = buildNameFromObj(item[n]);
                  if (name) return name;
                }
              }

              // 4) participants array or other combined structures
              if (Array.isArray(item.participants)) {
                const p = item.participants.find(p => p.role === role || (p.role && p.role.toLowerCase().includes(role)));
                if (p) return buildNameFromObj(p);
              }

              // 5) direct top-level mentor/mentee string
              if (typeof item[role] === 'string') return item[role];

              // 6) last resort: use generic fields on assignment (mentor_first_name / mentee_first_name)
              if (item.mentor_first_name || item.mentor_surname || item.mentee_first_name || item.mentee_surname) {
                if (role === 'mentor') return [item.mentor_first_name, item.mentor_surname].filter(Boolean).join(' ') || null;
                if (role === 'mentee') return [item.mentee_first_name, item.mentee_surname].filter(Boolean).join(' ') || null;
              }

              return null;
            };

            // try to get last session date from assignment item or by matching recentSessions (keep as-is, but also check started_at)
            const extractLastSessionDate = (assignment) => {
              const possibleDateKeys = ['last_session_date','lastSessionDate','last_session_at','last_session','last_meeting_date','last_session_iso','last_seen','started_at'];
              for (const k of possibleDateKeys) {
                if (assignment?.[k]) return assignment[k];
              }
              // match by assignment id to recentSessionsRaw
              const aid = assignment?.id ?? assignment?.assignment_id ?? assignment?.assignmentId;
              if (aid) {
                const s = recentSessionsRaw.find(rs => {
                  return rs?.assignment_id === aid || rs?.assignmentId === aid || rs?.assignment === aid || String(rs?.assignment_id) === String(aid) || String(rs?.assignmentId) === String(aid);
                });
                if (s) {
                  return s.session_date ?? s.date ?? s.created_at ?? s.sessionDate ?? null;
                }
              }
              return null;
            };

            const recent = (Array.isArray(recentAssignmentsRaw) ? recentAssignmentsRaw : []).map(a => {
              const mentee_name = extractPersonName(a, 'mentee') || extractPersonName(a, 'member') || extractPersonName(a, 'person') || 'Unknown';
              const mentor_name = extractPersonName(a, 'mentor') || extractPersonName(a, 'leader') || 'Unknown';
              const last_session_iso = extractLastSessionDate(a);
              return {
                id: a?.id ?? a?.assignment_id ?? a?.assignmentId ?? null,
                mentee_name,
                mentor_name,
                last_session_date: last_session_iso, // ISO string or null
                raw: a
              };
            });

            const normalized = {
              active_assignments: totals?.activeAssignments ?? totals?.active_assignments ?? totals?.totalAssignments ?? 0,
              sessions_last_30: totals?.totalSessions ?? stats?.totalSessions ?? stats?.sessions_last_30 ?? Math.round((stats?.avgSessionsPerAssignment ?? 0) * (totals?.totalAssignments ?? 0)),
              recent,
              recentSessions: Array.isArray(recentSessionsRaw) ? recentSessionsRaw : []
            };

            if (mounted) setMentorshipSummary(normalized);
          } else {
            if (mounted) setMentorshipSummary(FALLBACK.mentorshipSummary || {});
          }
        } catch {
          if (mounted) setMentorshipSummary({});
        }

        // Mentors list
        try {
          const res = fetchWithAuth ? await fetchWithAuth(`${API_URL}/api/mentorship/mentors`, { credentials: 'include' }) : await fetch(`${API_URL}/api/mentorship/mentors`, { credentials: 'include' });
          if (res && res.ok) {
            const j = await res.json();
            if (mounted) setMentorsList(j);
          } else {
            if (mounted) setMentorsList([]);
          }
        } catch { if (mounted) setMentorsList([]); }

        // Cell health
        try {
          const ch = await getCellHealthDashboard(fetchWithAuth).catch(() => []);
          if (mounted) setCellHealth(Array.isArray(ch) ? ch : []);
        } catch { if (mounted) setCellHealth([]); }

        // Consolidated meetings
        try {
          const now = new Date();
          const month = now.getMonth() + 1, year = now.getFullYear();

          // try existing service first
          let cons = await getConsolidatedReport(fetchWithAuth, month, year).catch(() => null);

          // if service returned nothing (likely due to 304 / cached response), force a fresh fetch
          if (!cons) {
            const url = `${API_URL}/api/analytics/consolidated?month=${month}&year=${year}&ts=${Date.now()}`;
            const res = fetchWithAuth
              ? await fetchWithAuth(url, { method: 'GET', cache: 'no-store', credentials: 'include' })
              : await fetch(url, { method: 'GET', cache: 'no-store', credentials: 'include' });

            // prefer a successful body; 304 has no body, so still try to parse if ok
            if (res && res.ok) {
              try { cons = await res.json(); } catch { cons = null; }
            } else {
              // debug: log 304 or other statuses
              if (res) console.debug('Consolidated report fetch status', res.status, res.statusText);
            }
          }

          if (mounted) {
            if (cons && Array.isArray(cons.meetings)) setConsolidatedMeetings(cons.meetings);
            else if (Array.isArray(cons)) setConsolidatedMeetings(cons);
            else if (cons && cons.meetings && Array.isArray(cons.meetings)) setConsolidatedMeetings(cons.meetings);
            else setConsolidatedMeetings([]);
          }
        } catch (e) {
          console.warn('Failed to load consolidated meetings', e);
          if (mounted) setConsolidatedMeetings([]);
        }

        // Absentees
        try {
          // Prefer service, but force a fresh request if the service returns nothing (304/cached)
          let abs = await getAbsenteeTrends(fetchWithAuth).catch(() => null);
          if (!abs) {
            const rawUrl = `${API_URL}/api/analytics/absentees?weeks=12`;
            const res = fetchWithAuth
              ? await fetchWithAuth(freshUrl(rawUrl), { method: 'GET', credentials: 'include' })
              : await fetch(freshUrl(rawUrl), { method: 'GET', credentials: 'include' });
            if (res && res.ok) {
              try { abs = await res.json(); } catch { abs = null; }
            } else {
              console.debug('absentees fetch status', res?.status, res?.statusText);
            }
          }
          // Accept multiple response shapes: { at_risk: [] } | { members: [] } | array
          let members = [];
          if (abs?.at_risk && Array.isArray(abs.at_risk)) members = abs.at_risk;
          else if (abs?.members && Array.isArray(abs.members)) members = abs.members;
          else if (Array.isArray(abs)) members = abs;

          const mapped = (members || []).map(m => {
            const full_name = m.full_name
              || [m.first_name, m.surname, m.last_name, m.name].filter(Boolean).join(' ')
              || m.member_name
              || m.display_name
              || `Member ${m.member_id ?? m.id ?? ''}`;
            return {
              member_id: m.member_id ?? m.id ?? null,
              full_name,
              missed_count: Number(m.missed_count ?? m.missed ?? 0),
              cell_name: m.cell_name ?? m.cell ?? m.group_name ?? 'N/A',
              last_missed_date: m.last_missed_date ?? m.last_missed ?? null,
              raw: m
            };
          });

          if (mounted) setAbsentees(mapped.length ? mapped : FALLBACK.absentees);
        } catch {
          if (mounted) setAbsentees(FALLBACK.absentees);
        }

        // --- NEW: load cell groups (top few) ---
        try {
          if (mounted) setCellGroupsLoading(true);
          // Use the service you provided: getCellGroups(fetchWithAuth, params)
          const groups = await getCellGroups(fetchWithAuth, { limit: 6, orderBy: 'member_count', order: 'desc' }).catch(() => null);
          if (mounted) {
            if (!groups) setCellGroups([]);
            else if (Array.isArray(groups)) setCellGroups(groups);
            else if (groups.data && Array.isArray(groups.data)) setCellGroups(groups.data);
            else setCellGroups(Array.isArray(groups) ? groups : []);
          }
        } catch (e) {
          console.warn('Failed to load cell groups', e);
          if (mounted) setCellGroups([]);
        } finally {
          if (mounted) setCellGroupsLoading(false);
        }

        // --- NEW: load or set fallback data for extra widgets ---
        // New visitors
        try {
          let resp = await listVisitors(fetchWithAuth, { recent: true, limit: 6 }).catch(() => null);

          // If service returned nothing (likely 304/cached), force a fresh fetch
          if (!resp) {
            const url = `${API_URL}/api/visitors?recent=true&limit=6`;
            const res = fetchWithAuth
              ? await fetchWithAuth(freshUrl(url), { method: 'GET', credentials: 'include' })
              : await fetch(freshUrl(url), { method: 'GET', credentials: 'include' });
            if (res && res.ok) {
              try { resp = await res.json(); } catch { resp = null; }
            } else {
              console.debug('visitors fetch status', res?.status, res?.statusText);
            }
          }

          // Normalize many possible response shapes into an array
          let items = [];
          if (Array.isArray(resp)) items = resp;
          else if (resp?.data && Array.isArray(resp.data)) items = resp.data;
          else if (resp?.rows && Array.isArray(resp.rows)) items = resp.rows;
          else if (resp?.visitors && Array.isArray(resp.visitors)) items = resp.visitors;
          else if (resp?.results && Array.isArray(resp.results)) items = resp.results;
          else if (resp?.items && Array.isArray(resp.items)) items = resp.items;
          else if (resp?.data?.rows && Array.isArray(resp.data.rows)) items = resp.data.rows;

          // Map to UI-friendly shape
          const mapped = (items || []).map(v => {
            const full_name = v.full_name || [v.first_name, v.surname].filter(Boolean).join(' ') || v.name || v.display_name || `Visitor ${v.id ?? ''}`;
            return {
              id: v.id ?? v.visitor_id ?? v._id ?? null,
              full_name,
              first_name: v.first_name ?? null,
              surname: v.surname ?? v.last_name ?? null,
              contact: v.contact ?? v.phone ?? v.contact_primary ?? null,
              visits: Number(v.visits ?? v.visit_count ?? v.times ?? 1),
              follow_up: v.follow_up ?? v.followup ?? v.status ?? null,
              raw: v
            };
          });

          // Set state: use real API result (even if empty) — do not fall back to dummy unless request failed
          if (mounted) setNewVisitors(Array.isArray(mapped) ? mapped : []);
        } catch (e) {
          console.warn('Failed to load visitors', e);
          if (mounted) setNewVisitors(FALLBACK.newVisitors);
        }

        // Prayer requests
        try {
          // Prefer service helper; it hits /api/prayer?status=open
          let j = await getPrayerRequests(fetchWithAuth, { status: 'open' }).catch(() => null);

          // If service returned nothing (likely 304 / cached), force a fresh fetch against both common endpoints
          if (!j) {
            const tryUrls = [
              `${API_URL}/api/prayer?status=open`,
              `${API_URL}/api/prayer/requests?status=open`
            ];
            for (const u of tryUrls) {
              const res = fetchWithAuth
                ? await fetchWithAuth(freshUrl(u), { method: 'GET', credentials: 'include' })
                : await fetch(freshUrl(u), { method: 'GET', credentials: 'include' });
              if (res && res.ok) {
                try { j = await res.json(); break; } catch { j = null; }
              } else {
                console.debug('prayer fetch', u, 'status', res?.status);
              }
            }
          }

          // Normalize to array shapes: [] | { data: [] } | { requests: [] } | { results: [] }
          let items = [];
          if (Array.isArray(j)) items = j;
          else if (j?.data && Array.isArray(j.data)) items = j.data;
          else if (j?.requests && Array.isArray(j.requests)) items = j.requests;
          else if (j?.results && Array.isArray(j.results)) items = j.results;

          // Map to the UI shape expected by the widget
          const mapped = (items || []).map(p => ({
            id: p.id ?? p.request_id ?? p._id ?? null,
            member_name: p.member_name ?? p.name ?? ((`${p.first_name ?? ''} ${p.surname ?? ''}`).trim() || 'Unknown'),
            category: p.category ?? p.type ?? 'General',
            urgency: p.urgency ?? p.priority ?? 'Normal',
            assigned_to: p.assigned_to ?? p.assignee ?? null,
            created_at: p.created_at ?? p.createdAt ?? p.created_at_iso ?? null,
            raw: p
          }));

          // Use real result (even empty array). Only use FALLBACK when the fetch failed entirely.
          if (mounted) setPrayerRequests(j === null ? FALLBACK.prayerRequests : mapped);
        } catch (e) {
          console.warn('Failed to load prayer requests', e);
          if (mounted) setPrayerRequests(FALLBACK.prayerRequests);
        }

        // Crisis cases (use shared service)
        try {
          const cases = await getCrisisFollowups(fetchWithAuth, { status: 'open' }).catch(() => null);
          if (mounted) {
            if (Array.isArray(cases)) setCrisisCases(cases);
            else if (cases?.data && Array.isArray(cases.data)) setCrisisCases(cases.data);
            else if (cases?.rows && Array.isArray(cases.rows)) setCrisisCases(cases.rows);
            else setCrisisCases(FALLBACK.crisisCases);
          }
        } catch {
          if (mounted) setCrisisCases(FALLBACK.crisisCases);
        }

        // Foundation progress
        try {
          // try normal request first
          let res = fetchWithAuth
            ? await fetchWithAuth(`${API_URL}/api/foundation/progress`, { credentials: 'include' })
            : await fetch(`${API_URL}/api/foundation/progress`, { credentials: 'include' });

          let payload = null;
          if (res && res.ok) {
            payload = await res.json().catch(() => null);
          } else {
            // likely 304 / cached response — force fresh request with cache-buster
            const fres = fetchWithAuth
              ? await fetchWithAuth(freshUrl(`${API_URL}/api/foundation/progress`), { method: 'GET', cache: 'no-store', credentials: 'include' })
              : await fetch(freshUrl(`${API_URL}/api/foundation/progress`), { method: 'GET', cache: 'no-store', credentials: 'include' });
            if (fres && fres.ok) payload = await fres.json().catch(() => null);
          }

          if (mounted) {
            if (payload) setFoundationProgress(normalizeFoundation(payload));
            else setFoundationProgress(FALLBACK.foundationProgress);
          }
        } catch { if (mounted) setFoundationProgress(FALLBACK.foundationProgress); }

        // Leader evaluations
        try {
          // try service first, then force a fresh cache-busted request if it returned nothing (304)
          let summary = await getLeadershipSummary(fetchWithAuth).catch(() => null);
          if (!summary) {
            const url = `${API_URL}/api/leadership/summary`;
            const res = fetchWithAuth
              ? await fetchWithAuth(freshUrl(url), { method: 'GET', credentials: 'include' })
              : await fetch(freshUrl(url), { method: 'GET', credentials: 'include' });
            if (res && res.ok) {
              try { summary = await res.json(); } catch { summary = null; }
            } else {
              console.debug('leadership summary fetch status', res?.status, res?.statusText);
            }
          }

          // normalize to array of evaluation rows
          let evalRows = [];
          if (Array.isArray(summary)) evalRows = summary;
          else if (summary?.recent_evaluations && Array.isArray(summary.recent_evaluations)) evalRows = summary.recent_evaluations;
          else if (summary?.recent_promotions && Array.isArray(summary.recent_promotions)) evalRows = summary.recent_promotions;
          else if (summary?.data && Array.isArray(summary.data)) evalRows = summary.data;
          else evalRows = [];

          const normalizeEval = (it) => {
            if (!it) return null;
            const leaderName =
              it.leader_name ??
              it.name ??
              it.full_name ??
              (it.first_name || it.surname ? `${it.first_name ?? ''} ${it.surname ?? ''}`.trim() : null) ??
              (it.leader_first_name || it.leader_surname ? `${it.leader_first_name ?? ''} ${it.leader_surname ?? ''}`.trim() : null) ??
              null;

            const toNum = (v) => {
              if (v === undefined || v === null) return undefined;
              const n = Number(v);
              return Number.isFinite(n) ? n : undefined;
            };

            // compute overall (explicit or from components)
            let overall = toNum(it.overall ?? it.overall_score ?? it.score ?? it.average ?? it.total_score);
            if (overall === undefined) {
              const components = [
                toNum(it.spiritual_maturity),
                toNum(it.relational_health),
                toNum(it.discipleship),
                toNum(it.growth_potential),
                toNum(it.leadership_qualities)
              ].filter(Number.isFinite);
              if (components.length) {
                overall = Math.round((components.reduce((s, x) => s + x, 0) / components.length) * 10) / 10;
              }
            }

            // explicit ratings if provided
            const selfExplicit = toNum(it.self ?? it.self_score ?? it.self_rating);
            const peerExplicit = toNum(it.peer ?? it.peer_score ?? it.peer_rating);
            const supervisorExplicit = toNum(it.supervisor ?? it.supervisor_score ?? it.supervisor_rating);

            // start with explicit values or placeholder
            let self = selfExplicit !== undefined ? selfExplicit : '—';
            let peer = peerExplicit !== undefined ? peerExplicit : '—';
            let supervisor = supervisorExplicit !== undefined ? supervisorExplicit : '—';

            // map evaluator "type" to the appropriate slot when explicit slot missing
            const role = String(it.type ?? it.evaluator_role ?? it.evaluator_type ?? it.type_name ?? '').toLowerCase();
            if (role) {
              if (role.includes('supervisor') && supervisor === '—') supervisor = overall ?? '—';
              else if (role.includes('self') && self === '—') self = overall ?? '—';
              else if (role.includes('peer') && peer === '—') peer = overall ?? '—';
            }

            return {
              id: it.id ?? it.evaluation_id ?? it.leader_id ?? `${leaderName ?? 'ev'}-${Math.random().toString(36).slice(2,7)}`,
              leader_id: it.leader_id ?? it.leader ?? null,
              leader_name: leaderName ?? `Leader ${it.leader_id ?? it.id ?? ''}`,
              overall: overall ?? '—',
              self,
              peer,
              supervisor,
              raw: it
            };
          };

          const normalized = (evalRows || []).map(normalizeEval).filter(Boolean);
          if (normalized.length) setLeaderEvaluations(normalized);
          else setLeaderEvaluations(FALLBACK.leaderEvaluations);
        } catch {
          if (mounted) setLeaderEvaluations(FALLBACK.leaderEvaluations);
        }

        // Evangelism contacts
        try {
          const contacts = await listEvangelismContacts(fetchWithAuth, { limit: 6 }).catch(() => null);
          if (mounted) {
            if (Array.isArray(contacts)) setEvangelismContacts(contacts);
            else if (contacts?.data && Array.isArray(contacts.data)) setEvangelismContacts(contacts.data);
            else setEvangelismContacts(FALLBACK.evangelismContacts);
          }
        } catch { if (mounted) setEvangelismContacts(FALLBACK.evangelismContacts); }

        // Celebrations / birthdays
        try {
          const range = 7;
          const url = `${API_URL}/api/members/celebrations?range=${range}`;
          const res = fetchWithAuth
            ? await fetchWithAuth(freshUrl(url), { method: 'GET', cache: 'no-store', credentials: 'include' })
            : await fetch(freshUrl(url), { method: 'GET', cache: 'no-store', credentials: 'include' });

          let payload = null;
          if (res && res.ok) {
            try { payload = await res.json(); } catch (e) { payload = null; }
          }

          console.debug('celebrations payload', payload);

          let mapped = [];
          if (payload) {
            const birthdays = Array.isArray(payload.birthdays) ? payload.birthdays : [];
            const anniversaries = Array.isArray(payload.anniversaries) ? payload.anniversaries : [];

            mapped = [
              ...birthdays.map((it, idx) => ({
                id: it.id ?? it.member_id ?? `b-${idx}`,
                member: it.first_name ? `${it.first_name} ${it.surname ?? ''}`.trim() : (it.member ?? it.full_name ?? 'Unknown'),
                event: it.event ?? 'Birthday',
                // prefer explicit computed date, fall back to stored dob
                date: it.date ?? it.next_date ?? it.date_of_birth ?? it.dateOfBirth ?? null,
                daysAway: it.daysAway ?? it.days_away ?? null,
                raw: it
              })),
              ...anniversaries.map((it, idx) => ({
                id: it.id ?? it.member_id ?? `a-${idx}`,
                member: it.first_name ? `${it.first_name} ${it.surname ?? ''}`.trim() : (it.member ?? it.full_name ?? 'Unknown'),
                event: it.event ?? 'Anniversary',
                date: it.date ?? it.next_date ?? it.date_joined_church ?? it.joined ?? null,
                daysAway: it.daysAway ?? it.days_away ?? null,
                raw: it
              }))
            ];
          }

          if (mounted) setCelebrations(mapped.length ? mapped : FALLBACK.celebrations);
        } catch (err) {
          if (mounted) setCelebrations(FALLBACK.celebrations);
        }

        // Multiplication readiness
        try {
          const res = fetchWithAuth ? await fetchWithAuth(`${API_URL}/api/cell-groups/multiplication/readiness`, { credentials: 'include' }) : await fetch(`${API_URL}/api/cell-groups/multiplication/readiness`, { credentials: 'include' });
           if (res && res.ok) {
             const j = await res.json();
             if (mounted) setMultiplicationReadiness(Array.isArray(j) ? j : []);
           } else { if (mounted) setMultiplicationReadiness(FALLBACK.multiplicationReadiness); }
         } catch { if (mounted) setMultiplicationReadiness(FALLBACK.multiplicationReadiness); }

        // Leadership pipeline
        try {
          const res = fetchWithAuth ? await fetchWithAuth(`${API_URL}/api/leadership/pipeline`, { credentials: 'include' }) : await fetch(`${API_URL}/api/leadership/pipeline`, { credentials: 'include' });
          if (res && res.ok) {
            const j = await res.json();
            if (mounted) setLeadershipPipeline(Array.isArray(j) ? j : []);
          } else { if (mounted) setLeadershipPipeline(FALLBACK.leadershipPipeline); }
        } catch { if (mounted) setLeadershipPipeline(FALLBACK.leadershipPipeline); }
      } catch (err) {
        console.error('Dashboard load error', err);
        if (mounted) showSnack('Failed to load some dashboard data', 'warning');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();
    return () => { mounted = false; };
  }, [fetchWithAuth, showSnack]);

  // Load members for autocomplete dropdowns
  useEffect(() => {
    const loadMembers = async () => {
      if (!fetchWithAuth) return;
      try {
        setMembersLoading(true);
        const members = await getMembers(fetchWithAuth);
        
        // Normalize response (handle various shapes)
        let memberList = [];
        if (Array.isArray(members)) {
          memberList = members;
        } else if (members?.data && Array.isArray(members.data)) {
          memberList = members.data;
        } else if (members?.members && Array.isArray(members.members)) {
          memberList = members.members;
        }
        
        if (memberList.length > 0) {
          setMembersList(memberList);
        }
      } catch (err) {
        console.warn('Failed to load members for autocomplete', err);
        // Leave membersList empty on error - autocomplete will show "No options"
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [fetchWithAuth]);

  // Common helpers
  const assignFollowup = useCallback(async (memberId) => {
    if (!memberId) return;
    setFollowupPending(p => ({ ...p, [memberId]: true }));
    try {
      const opts = { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ member_id: memberId }) };
      const res = fetchWithAuth ? await fetchWithAuth(`${API_URL}/api/followups/assign`, opts) : await fetch(`${API_URL}/api/followups/assign`, opts);
      if (!res || !res.ok) throw new Error('Assign follow-up failed');
      showSnack('Follow-up assigned', 'success');

      // optimistic refresh of absentees
      const abs = await getAbsenteeTrends(fetchWithAuth).catch(() => null);
      if (abs?.at_risk) setAbsentees(abs.at_risk);
    } catch (e) {
      console.error(e);
      showSnack(e?.message || 'Failed to assign follow-up', 'error');
    } finally {
      setFollowupPending(p => { const cp = { ...p }; delete cp[memberId]; return cp; });
    }
  }, [fetchWithAuth, showSnack]);

  // Assign milestone (simplified)
  const handleAssignMilestone = useCallback(async () => {
    if (!assignForm.templateId || !assignForm.memberId) return showSnack('Select template and member', 'warning');
    setAssigningMilestone(true);
    try {
      await assignMilestone(fetchWithAuth, { template_id: assignForm.templateId, member_id: assignForm.memberId, due_date: assignForm.dueDate || null }).catch(() => null);
      showSnack('Milestone assigned', 'success');
      setOpenAssignMilestone(false);
    } catch (e) {
      console.error(e);
      showSnack('Failed to assign milestone', 'error');
    } finally { setAssigningMilestone(false); }
  }, [assignForm, fetchWithAuth, showSnack]);

  // Helper: open tel: or whatsapp if leader contact exists
  const contactLeader = useCallback((group) => {
    const phone = group.leader_contact || group.leader?.contact_primary || group.leader?.contact || null;
    const email = group.leader_email || group.leader?.email || null;
    if (phone) {
      // normalize digits for whatsapp if needed
      const digits = String(phone).replace(/[^\d+]/g, '');
      // show both options in snack if no UI modal
      showSnack(`Call: tel:${digits} · WhatsApp: https://wa.me/${digits.replace('+','')}`, 'info');
      // optionally: window.open(`tel:${digits}`);
    } else if (email) {
      showSnack(`Email: mailto:${email}`, 'info');
    } else {
      showSnack('No contact available for this leader', 'warning');
    }
  }, [showSnack]);

  const healthChipColor = useCallback((status) => {
    if (!status) return 'default';
    const s = String(status).toLowerCase();
    if (s.includes('healthy') || s.includes('green')) return 'success';
    if (s.includes('risk') || s.includes('at risk') || s.includes('red')) return 'error';
    return 'warning';
  }, []);

  const CellHealthItem = useMemo(() => {
    return React.memo(function Inner({ ch }) {
      return (
        <ListItem key={ch.cellId} secondaryAction={
          <Stack direction="row" spacing={1}>
            <Tooltip title="Open cell"><IconButton size="small" onClick={() => window.location.href = `/cell-groups/${ch.cellId}`}><UsersIcon size={14} /></IconButton></Tooltip>
            <Button size="small" onClick={() => window.location.href = `/leaders/${ch.leader?.id}`}>Leader</Button>
          </Stack>
        }>
          <Avatar sx={{ mr: 1 }}>{(ch.cellName || 'C').charAt(0)}</Avatar>
          <ListItemText primary={`${ch.cellName} (${ch.zone ?? 'N/A'})`} secondary={`Leader: ${ch.leader?.first_name ?? 'N/A'} • Status: ${ch.status ?? 'Unknown'}`} />
          <Chip label={ch.status} color={healthChipColor(ch.status)} size="small" />
        </ListItem>
      );
    });
  }, [healthChipColor]);

  const AbsenteeItem = useMemo(() => {
    return React.memo(function Inner({ a }) {
      const pending = Boolean(followupPending[a.member_id]);
      return (
        <ListItem key={a.member_id} secondaryAction={
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => assignFollowup(a.member_id)} disabled={pending}>{pending ? <CircularProgress size={16} /> : 'Assign Follow-up'}</Button>
            <Button size="small" onClick={() => window.location.href = `/members/${a.member_id}`}>Open</Button>
          </Stack>
        }>
          <ListItemText primary={a.full_name} secondary={`Missed: ${a.missed_count ?? 0} • Cell: ${a.cell_name ?? 'N/A'}`} />
        </ListItem>
      );
    });
  }, [followupPending, assignFollowup]);

  const ConsolidatedMeetingItem = useMemo(() => {
    return React.memo(function Inner({ m }) {
      return (
        <ListItem key={m.id} secondaryAction={<Button size="small" onClick={() => window.location.href = `/meetings/${m.id}`}>Open</Button>}>
          <ListItemText
            primary={`${m.topic ?? 'TBD'} — ${m.session_date ? DateTime.fromISO(m.session_date).toLocaleString(DateTime.DATETIME_MED) : 'N/A'}`}
            secondary={`${m.cell_name ?? m.zone ?? 'N/A'} • RSVP: ${m.rsvp_count ?? 0}`}
          />
        </ListItem>
      );
    });
  }, []);

  // Zone / Cell summary widget uses getCellGroups service
  const ZoneCellSummary = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6"><UsersIcon size={18} style={{ marginRight: 8 }} aria-hidden /> Zone / Cell Summary</Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={() => window.location.href = '/cell-groups'}>Open Cells</Button>
            <Button size="small" onClick={async () => {
              setCellGroupsLoading(true);
              try {
                const groups = await getCellGroups(fetchWithAuth, { limit: 6, orderBy: 'member_count', order: 'desc' });
                if (Array.isArray(groups)) setCellGroups(groups);
                else if (groups?.data) setCellGroups(groups.data);
                else setCellGroups([]);
                showSnack('Cell groups refreshed', 'success');
              } catch (e) {
                console.warn('Refresh failed', e);
                showSnack('Refresh failed', 'error');
              } finally {
                setCellGroupsLoading(false);
              }
            }}>Refresh</Button>
          </Stack>
        </Box>

        <Divider sx={{ my: 1 }} />

        {cellGroupsLoading ? (
          <Stack spacing={1}>
            <Skeleton width="100%" height={40} />
            <Skeleton width="100%" height={40} />
            <Skeleton width="100%" height={40} />
          </Stack>
        ) : (
          <>
            {cellGroups && cellGroups.length ? (
              <List dense>
                {cellGroups.map((g, idx) => (
                  <ListItem
                    key={g.id ?? `cell-${idx}`}
                    secondaryAction={
                      <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={() => window.location.href = `/cell-groups/${g.id}`}>Open</Button>
                        <Button size="small" onClick={() => contactLeader(g)}>Contact</Button>
                      </Stack>
                    }
                  >
                    <Avatar sx={{ mr: 1 }} aria-hidden>{(g.name || 'C')[0]}</Avatar>
                    <ListItemText
                      primary={`${g.name} ${g.zone_name ? `• ${g.zone_name}` : ''}`}
                      secondary={`Members: ${g.member_count ?? g.members_count ?? g.members_count ?? '—'} • Leader: ${g.leader_first_name ? `${g.leader_first_name} ${g.leader_surname || ''}` : (g.leader?.first_name || '—')} • Status: ${g.status_name ?? g.status ?? '—'}`}
                    />
                    <Chip
                      label={g.is_ready_for_multiplication ? 'Ready' : '—'}
                      color={g.is_ready_for_multiplication ? 'success' : 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">No cell groups found</Typography>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  // NewVisitorsWidget unchanged but wired to newVisitors state
  const NewVisitorsWidget = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6"><UserCheck size={16} style={{ marginRight: 8 }} aria-hidden /> New Visitors</Typography>
          <Button size="small" onClick={() => window.location.href = '/visitors'}>Open Visitors</Button>
        </Box>
        <Divider sx={{ my: 1 }} />
        {loading ? (
          <Stack spacing={1}><Skeleton width="100%" height={40} /><Skeleton width="100%" height={40} /></Stack>
        ) : (
          <List dense>
            {(newVisitors && newVisitors.length ? newVisitors : FALLBACK.newVisitors).slice(0, 6).map((v, idx) => {
              const displayName = [v.first_name, v.surname].filter(Boolean).join(' ') || v.full_name || v.name || 'Visitor';
              return (
                <ListItem key={v.id ?? `visitor-${idx}`} secondaryAction={<Button size="small" onClick={() => window.location.href = `/visitors/${v.id}`}>Open</Button>}>
                  <Avatar sx={{ mr: 1 }}>{(displayName || 'V').charAt(0)}</Avatar>
                  <ListItemText primary={displayName} secondary={`Visits: ${v.visits ?? 1} • Follow-up: ${v.follow_up ?? 'pending'}`} />
                  <Button size="small" onClick={() => showSnack(`Call ${displayName} at ${v.contact || 'N/A'}`, 'info')} aria-label={`Call visitor ${displayName}`}>Call</Button>
                </ListItem>
              );
            })}
            {!newVisitors.length && !FALLBACK.newVisitors.length && <ListItem><ListItemText primary="No recent visitors" /></ListItem>}
          </List>
        )}
      </CardContent>
    </Card>
  );

  // (Other widget components remain same as previously implemented in your dashboard)
  // For brevity we reuse existing components (PrayerRequestsWidget, CrisisWidget, etc.) that read from state variables defined above.

  const PrayerRequestsWidget = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6"><MessageCircle size={16} style={{ marginRight: 8 }} aria-hidden /> Prayer & Counseling</Typography>
          <Button size="small" onClick={() => window.location.href = '/prayer'}>Open</Button>
        </Box>
        <Divider sx={{ my: 1 }} />
        {loading ? <Stack spacing={1}><Skeleton height={36} /><Skeleton height={36} /></Stack> : (
          <List dense>
            {(() => {
              // show FALLBACK when not loaded (null) OR when the API returned an empty array
              const displayPrayerRequests = (prayerRequests === null || (Array.isArray(prayerRequests) && prayerRequests.length === 0))
                ? FALLBACK.prayerRequests
                : (prayerRequests || []);
              return displayPrayerRequests.slice(0, 6).map((p, idx) => (
                <ListItem key={p.id ?? `pr-${idx}`} secondaryAction={<Stack direction="row" spacing={1}><Button size="small" onClick={() => showSnack(`Assigned to ${p.assigned_to}`, 'info')}>Assign</Button><Button size="small" onClick={() => window.location.href = `/prayer/${p.id}`}>Open</Button></Stack>}>
                  <ListItemText primary={`${p.member_name}`} secondary={`${p.category} • ${p.urgency} • ${DateTime.fromISO(p.created_at).toLocaleString(DateTime.DATETIME_SHORT)}`} />
                </ListItem>
              ));
            })()}
            {!prayerRequests?.length && !FALLBACK.prayerRequests.length && <ListItem><ListItemText primary="No open prayer requests" /></ListItem>}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const CrisisWidget = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6"><AlertTriangle size={16} style={{ marginRight: 8 }} aria-hidden /> Crisis & Care Cases</Typography>
          <Button size="small" onClick={() => window.location.href = '/crisis'}>Open</Button>
        </Box>
        <Divider sx={{ my: 1 }} />
        {loading ? <Skeleton width="100%" height={80} /> : (
          <List dense>
            {(crisisCases && crisisCases.length ? crisisCases : FALLBACK.crisisCases).map((c, idx) => (
              <ListItem key={c.id ?? `crisis-${idx}`} secondaryAction={<Button size="small" onClick={() => window.location.href = `/crisis/${c.id}`}>Open</Button>}>
                <ListItemText primary={`${c.member_name} — ${c.type}`} secondary={`Status: ${c.status} • Assigned: ${c.assigned_to}`} />
              </ListItem>
            ))}
            {!crisisCases.length && !FALLBACK.crisisCases.length && <ListItem><ListItemText primary="No open crisis cases" /></ListItem>}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const LeaderEvaluationsWidget = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6"><TrendingUp size={16} style={{ marginRight: 8 }} aria-hidden /> Leader Evaluations</Typography>
          <Button size="small" onClick={() => window.location.href = '/leaders/evaluations'}>Open</Button>
        </Box>
        <Divider sx={{ my: 1 }} />
        {loading ? <Skeleton height={100} /> : (
          <List dense>
            {(leaderEvaluations && leaderEvaluations.length ? leaderEvaluations : FALLBACK.leaderEvaluations).map((ev, idx) => (
              <ListItem key={ev.leader_id ?? `leader-${idx}`} secondaryAction={<Button size="small" onClick={() => window.location.href = `/leaders/${ev.leader_id}`}>Open</Button>}>
                <ListItemText primary={ev.leader_name} secondary={`Overall: ${ev.overall} • Self: ${ev.self} • Peer: ${ev.peer} • Supervisor: ${ev.supervisor}`} />
              </ListItem>
            ))}
            {!leaderEvaluations.length && !FALLBACK.leaderEvaluations.length && <ListItem><ListItemText primary="No recent evaluations" /></ListItem>}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const EvangelismWidget = () => {
    // Deduplicate contacts by ID and name
    const seen = new Set();
    const deduplicatedContacts = (evangelismContacts && evangelismContacts.length ? evangelismContacts : FALLBACK.evangelismContacts).filter(ec => {
      const key = ec.id || ec.name || ec.full_name || `${ec.first_name}-${ec.surname}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6"><PhoneCall size={16} style={{ marginRight: 8 }} aria-hidden /> Evangelism Contacts</Typography>
            <Button size="small" onClick={() => window.location.href = '/evangelism'}>Open</Button>
          </Box>
          <Divider sx={{ my: 1 }} />
          {loading ? <Skeleton height={120} /> : (
            <List dense>
              {deduplicatedContacts.map((ec, idx) => {
                const displayName = [ec.first_name, ec.surname].filter(Boolean).join(' ')
                  || ec.full_name
                  || ec.name
                  || `${ec.first_name || ''} ${ec.surname || ''}`.trim()
                  || 'Contact';

                const displayEncounter = ec.encountered_at
                  ?? ec.area
                  ?? (ec.contact_date ? DateTime.fromISO(ec.contact_date).toLocaleString(DateTime.DATE_SHORT) : null)
                  ?? ec.how_met
                  ?? '—';

                const invitedFlag = Boolean(ec.invited || ec.invited_to_event || ec.invited_at);
                const invitedText = invitedFlag ? 'Yes' : 'No';

                return (
                  <ListItem key={ec.id ?? `ev-${idx}`} secondaryAction={<Button size="small" onClick={() => showSnack(`Follow-up scheduled for ${displayName}`, 'success')}>Follow-up</Button>}>
                    <ListItemText
                      primary={displayName}
                      secondary={`${displayEncounter} • Status: ${ec.status ?? '—'} • Invited: ${invitedText}`}
                    />
                  </ListItem>
                );
              })}
              {!deduplicatedContacts.length && (
                <ListItem><ListItemText primary="No recent evangelism contacts" /></ListItem>
              )}
            </List>
          )}
        </CardContent>
      </Card>
    );
  };

  const CelebrationsWidget = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6"><Gift size={16} style={{ marginRight: 8 }} aria-hidden /> Celebrations & Birthdays</Typography>
          <Button size="small" onClick={() => window.location.href = '/members/celebrations'}>Open</Button>
        </Box>
        <Divider sx={{ my: 1 }} />
        {loading ? <Skeleton height={80} /> : (
          <Stack spacing={1}>
            {(celebrations && celebrations.length ? celebrations : FALLBACK.celebrations).map((c, idx) => (
              <Chip key={c.id ?? `celebration-${idx}`} label={`${c.member} — ${c.event} (${DateTime.fromISO(c.date).toLocaleString(DateTime.DATE_MED)})`} />
            ))}
            {!celebrations.length && !FALLBACK.celebrations.length && <Typography variant="body2">No upcoming celebrations</Typography>}
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  const MultiplicationWidget = () => (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6"><TrendingUp size={16} style={{ marginRight: 8 }} aria-hidden /> Multiplication Readiness</Typography>
          <Button size="small" onClick={() => window.location.href = '/cells/multiplication'}>Open</Button>
        </Box>
        <Divider sx={{ my: 1 }} />
        {loading ? <Skeleton height={120} /> : (
          <List dense>
            {(multiplicationReadiness && multiplicationReadiness.length ? multiplicationReadiness : FALLBACK.multiplicationReadiness).map((m, idx) => (
              <ListItem key={m.cellId ?? `mult-${idx}`} secondaryAction={<Button size="small" onClick={() => showSnack(`${m.recommendedAction} for ${m.cellName}`, 'info')}>Action</Button>}>
                <ListItemText primary={m.cellName} secondary={`Readiness: ${m.readinessScore}% • ${m.recommendedAction}`} />
              </ListItem>
            ))}
            {!multiplicationReadiness.length && !FALLBACK.multiplicationReadiness.length && <ListItem><ListItemText primary="No readiness data" /></ListItem>}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const LeadershipPipelineWidget = () => {
    const MAX_PIPELINE_ROWS = 6; // adjust as needed
    const normalized = normalizeLeadershipPipeline(leadershipPipeline && leadershipPipeline.length ? leadershipPipeline : FALLBACK.leadershipPipeline);

    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6"><HeartHandshake size={16} style={{ marginRight: 8 }} aria-hidden /> Leadership Pipeline</Typography>
            <Button size="small" onClick={() => window.location.href = '/leadership/pipeline'}>Open</Button>
          </Box>
          <Divider sx={{ my: 1 }} />
          {loading ? (
            <Skeleton height={120} />
          ) : (
            <List dense>
              {normalized.slice(0, MAX_PIPELINE_ROWS).map((lp, idx) => (
                <ListItem
                  key={(lp.id ?? `${lp.name ?? 'lp'}-${idx}`)}
                  secondaryAction={
                    <Chip
                      label={`Readiness: ${lp.readiness}/10`}
                      color={lp.readiness > 6 ? 'success' : 'warning'}
                    />
                  }
                >
                  <ListItemText primary={lp.name} secondary={`Phase: ${lp.phase}`} />
                </ListItem>
              ))}
              {!normalized.length && (
                <ListItem>
                  <ListItemText primary="No pipeline data" />
                </ListItem>
              )}
            </List>
          )}
        </CardContent>
      </Card>
    );
  };

  // Add this INSIDE the component, before the return statement
  const exportToCSV = useCallback((data, filename) => {
    if (!Array.isArray(data) || data.length === 0) {
      showSnack('No data to export', 'warning');
      return;
    }

    // Get all unique keys from data
    const keys = Array.from(new Set(data.flatMap(Object.keys)));
    
    // Create CSV header
    const header = keys.join(',');
    
    // Create CSV rows
    const rows = data.map(item =>
      keys.map(key => {
        const val = item[key];
        // Escape quotes and wrap in quotes if contains comma
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') ? `"${str}"` : str;
      }).join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    showSnack(`Exported ${filename}`, 'success');
  }, [showSnack]);

  // Layout: arrange widgets into a rich, modern pastor dashboard
  return (
    <Box sx={{ p: 3 }}>
      <HeroHeader
        title="Pastor’s Dashboard"
        subtitle="Leadership overview and ministry insights"
        icon={<Medal size={22} />}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6"><UsersIcon size={18} style={{ marginRight: 8 }} /> Church Overview</Typography>
              <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                {loading ? (
                  <>
                    <Skeleton width={120} height={32} />
                    <Skeleton width={140} height={32} />
                    <Skeleton width={160} height={32} />
                  </>
                ) : (
                  <>
                    <Chip label={`Members: ${overview?.members_total ?? FALLBACK.overview.members_total}`} color="primary" />
                    <Chip label={`Active Cells: ${overview?.active_cells ?? FALLBACK.overview.active_cells}`} color="success" />
                    <Chip label={`Attendance: ${overview?.attendance_pct ?? FALLBACK.overview.attendance_pct}%`} color="info" />
                    <Chip label={`New Members: ${overview?.new_members ?? FALLBACK.overview.new_members}`} />
                    <Chip label={`Baptisms: ${overview?.baptisms ?? FALLBACK.overview.baptisms}`} color="success" />
                    <Chip label={`Giving (${overview?.giving_summary?.period ?? FALLBACK.overview.giving_summary.period}): ${overview?.giving_summary?.amount ?? FALLBACK.overview.giving_summary.amount}`} icon={<DollarSign size={14} />} />
                  </>
                )}
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button 
                  variant="outlined" 
                  onClick={() => exportToCSV(consolidatedMeetings, `meetings_week_${DateTime.local().toISODate()}.csv`)} 
                  startIcon={<FileText size={16} />}
                  disabled={loading}
                >
                  Export Week
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => exportToCSV(consolidatedMeetings, `meetings_month_${DateTime.local().toISODate()}.csv`)} 
                  startIcon={<BarChart2 size={16} />}
                  disabled={loading}
                >
                  Export Month
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Stack spacing={2}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6"><BookOpen size={18} style={{ marginRight: 8 }} /> Growth & Foundation</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => setOpenAssignMilestone(true)}>Manage Milestones</Button>
                    <Button size="small" onClick={() => window.location.href = '/foundation'}>Open Foundation</Button>
                  </Stack>
                </Box>
                <Divider sx={{ my: 1 }} />
                {loading ? (
                  <Stack spacing={1}><Skeleton /><Skeleton /><Skeleton /></Stack>
                ) : (
                  <>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Chip label={`Born Again: ${growthSummary?.counts?.born_again ?? '—'}`} />
                      <Chip label={`Baptized: ${growthSummary?.counts?.baptized ?? '—'}`} color="success" />
                      <Chip label={`Foundation Completed: ${growthSummary?.counts?.foundation_completed ?? '—'}`} color="secondary" />
                    </Stack>

                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2">Foundation School Progress (Top)</Typography>
                      <List dense>
                        {(foundationProgress && foundationProgress.length ? foundationProgress : FALLBACK.foundationProgress).slice(0, 4).map((f, idx) => {
                          // aggregated class/level row from API
                          if (f && (f.level !== undefined || f.class_name)) {
                            const title = f.class_name ?? `Level ${f.level}`;
                            const secondary = `Enrolled: ${f.total_enrolled ?? f.enrolled ?? 0} • Completed: ${f.completed_count ?? 0}`;
                            return (
                              <ListItem key={f.class_id ?? `fp-${idx}`} secondaryAction={<Button size="small" onClick={() => window.location.href = '/foundation'}>Open</Button>}>
                                <ListItemText primary={title} secondary={secondary} />
                              </ListItem>
                            );
                          }
                          // fallback: member-shaped row
                          return (
                            <ListItem key={f.member_id ?? `fp-${idx}`} secondaryAction={<Button size="small" onClick={() => window.location.href = `/members/${f.member_id}`}>Open</Button>}>
                              <ListItemText primary={f.full_name ?? f.name ?? 'Unknown'} secondary={`${f.level ? `${f.level} • ` : ''}${f.progress ? `Progress: ${f.progress}%` : ''}`} />
                            </ListItem>
                          );
                        })}
                      </List>
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6"><UsersIcon size={16} style={{ marginRight: 8 }} /> Mentorship</Typography>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="contained" onClick={() => setOpenMentorshipModal(true)}>
                      Manage Mentorship
                    </Button>
                    <Button size="small" onClick={() => navigate('/mentorship')}>Open All</Button>
                  </Stack>
                </Box>
                <Divider sx={{ my: 1 }} />
                {loading ? <Skeleton height={80} /> : (
                  <>
                    <Typography variant="body2">Active assignments: <b>{mentorshipSummary?.active_assignments ?? 0}</b> • Sessions (30d): <b>{mentorshipSummary?.sessions_last_30 ?? 0}</b></Typography>
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2">Recent assignments</Typography>
                      <List dense>
                        {(mentorshipSummary?.recent || []).slice(0, 4).map(a => (
                          <ListItem 
                            key={a.id} 
                            secondaryAction={
                              <Button 
                                size="small" 
                                onClick={() => {
                                  setSelectedAssignment(a);
                                  setOpenAssignmentDetail(true);
                                }}
                              >
                                Open
                              </Button>
                            }
                          >
                            <ListItemText 
                              primary={`${a.mentee_name} → ${a.mentor_name}`} 
                              secondary={`Last session: ${a.last_session_date ? DateTime.fromISO(a.last_session_date).toLocaleString(DateTime.DATE_MED) : 'N/A'}`} 
                            />
                          </ListItem>
                        ))}
                          {!mentorshipSummary?.recent?.length && <ListItem><ListItemText primary="No recent assignments" /></ListItem>}
                        </List>
                      </Box>
                  </>
                )}
              </CardContent>
            </Card>

            <NewVisitorsWidget />
          </Stack>
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack spacing={2}>
            <ZoneCellSummary />

            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6"><AlertTriangle size={16} style={{ marginRight: 8 }} aria-hidden /> Attendance & Absentees</Typography>
                  <Button size="small" onClick={() => window.location.href = '/attendance'}>Open</Button>
                </Box>
                <Divider sx={{ my: 1 }} />
                <List dense>
                  {loading ? (
                    <>
                      <Skeleton height={36} />
                      <Skeleton height={36} />
                    </>
                  ) : (absentees && absentees.length ? absentees : FALLBACK.absentees).slice(0, 6).map(a => <AbsenteeItem key={a.member_id} a={a} />)}
                </List>
              </CardContent>
            </Card>

            <PrayerRequestsWidget />
            <CrisisWidget />
            <NotificationWidget 
              role="pastor"
              limit={6}
              onViewAll={() => navigate('/notifications')}
            />
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            <LeaderEvaluationsWidget />
            <MultiplicationWidget />
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <EvangelismWidget />
          <CelebrationsWidget />
        </Grid>

        <Grid item xs={12} md={4}>
          <LeadershipPipelineWidget />
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6">Consolidated Meetings</Typography>
              <Divider sx={{ my: 1 }} />
              <List dense>
                                                             {loading ? <Skeleton height={120} /> : (consolidatedMeetings && consolidatedMeetings.length ? consolidatedMeetings : []).slice(0, 6).map((m, idx) => <ConsolidatedMeetingItem key={m.id ?? `meeting-${idx}`} m={m} />)}
                {!loading && (!consolidatedMeetings || consolidatedMeetings.length === 0) && <ListItem><ListItemText primary="No upcoming meetings" /></ListItem>}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Cell Health widget removed */}
      </Grid>

      {/* Dialogs for milestone/mentorship (kept same as before) */}
      <Dialog open={openAssignMilestone} onClose={() => setOpenAssignMilestone(false)} fullWidth maxWidth="sm">
        <DialogTitle>Assign Milestone</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              options={membersList}
              getOptionLabel={(option) => `${option.full_name || `${option.first_name ?? ''} ${option.surname ?? ''}`.trim()} (${option.id})`}
              value={membersList.find(m => m.id === assignForm.memberId) || null}
              onChange={(e, value) => setAssignForm(f => ({ ...f, memberId: value?.id || '' }))}
              loading={membersLoading}
              renderInput={(params) => <TextField {...params} label="Select Member" placeholder="Search members..." />}
              noOptionsText="No members found"
            />
            
            {assignForm.memberId && (
              <MemberMilestones 
                memberId={assignForm.memberId} 
                refreshKey={openAssignMilestone}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignMilestone(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openMentorshipModal} onClose={() => {
  setOpenMentorshipModal(false);
  setSelectedMenteeId(null);
}} fullWidth maxWidth="md">
        <DialogTitle>Mentorship Management</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Autocomplete
              options={membersList}
              getOptionLabel={(option) => option.full_name || `${option.first_name ?? ''} ${option.surname ?? ''}`.trim() || 'Unknown'}
              value={membersList.find(m => m.id === selectedMenteeId) || null}
              onChange={(e, value) => setSelectedMenteeId(value?.id || null)}
              loading={membersLoading}
              renderInput={(params) => <TextField {...params} label="Select Mentee" placeholder="Search members..." />}
              noOptionsText="No members found"
            />
            
            {selectedMenteeId && (
              <MentorshipCard menteeId={selectedMenteeId} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
      setOpenMentorshipModal(false);
      setSelectedMenteeId(null);
    }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAssignmentDetail} onClose={() => {
  setOpenAssignmentDetail(false);
  setSelectedAssignment(null);
}} fullWidth maxWidth="md">
        <DialogTitle>Assignment Details</DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {selectedAssignment.mentee_name?.[0] || 'M'}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedAssignment.mentee_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Mentee</Typography>
                  </Box>
                </Stack>
                
                <Box sx={{ my: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">↓ Mentored by ↓</Typography>
                </Box>
                
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    {selectedAssignment.mentor_name?.[0] || 'M'}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedAssignment.mentor_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Mentor</Typography>
                  </Box>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" mb={2}>Sessions Taken</Typography>
                {selectedAssignment.raw?.sessions && Array.isArray(selectedAssignment.raw.sessions) && selectedAssignment.raw.sessions.length > 0 ? (
                  <List sx={{ bgcolor: 'background.default', borderRadius: 1 }}>
                    {selectedAssignment.raw.sessions.map((session, idx) => (
                      <ListItem key={session.id ?? `session-${idx}`} divider={idx < selectedAssignment.raw.sessions.length - 1}>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip 
                                label={new Date(session.session_date || session.date).toLocaleString()} 
                                size="small" 
                                color="primary" 
                                variant="outlined"
                              />
                              <Typography variant="body2" color="text.secondary">
                                {session.duration_minutes ?? 30} min
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            session.notes ? (
                              <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }} color="text.secondary">
                                Notes: {session.notes}
                              </Typography>
                            ) : null
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      No sessions recorded yet
                    </Typography>
                  </Box>
                )}
              </Box>

              {selectedAssignment.last_session_date && (
                <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Session: <b>{DateTime.fromISO(selectedAssignment.last_session_date).toLocaleString(DateTime.DATETIME_MED)}</b>
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
      setOpenAssignmentDetail(false);
      setSelectedAssignment(null);
    }}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={closeSnack}>
        <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: '100%' }}>{snack.message}</Alert>
      </Snackbar>

      {loading && <Box sx={{ position: 'fixed', right: 24, bottom: 24 }}
>
        <CircularProgress size={24} />
      </Box>}
    </Box>
  );
}

// normalize foundation progress response to a consistent array of items
function normalizeFoundation(items) {
  if (!items) return [];
  // sometimes backend returns object with rows/data
  if (items.rows && Array.isArray(items.rows)) items = items.rows;
  if (items.data && Array.isArray(items.data)) items = items.data;
  if (!Array.isArray(items)) return [];

  const map = new Map();
  for (const r of items) {
    const key = r.class_id ?? r.level ?? r.id;
    const classId = r.class_id ?? r.level ?? r.id;
    const className = r.class_name ?? r.level_name ?? r.title;
    const level = r.level ?? r.level_id ?? r.phase;

    // count enrolled and completed
    const enrolled = (r.total_enrolled ?? r.enrolled ?? 0) + (r.extra_enrolled ?? 0);
    const completed = (r.completed_count ?? 0) + (r.extra_completed ?? 0);

    if (!map.has(key)) {

      map.set(key, {
        type: 'class',
        class_id: classId,
        class_name: className || (level ? `Level ${level}` : ''),
        level,
        total_enrolled: enrolled,
        completed_count: completed,
        raw: r
      });
    } else {
      const cur = map.get(key);
      cur.total_enrolled = (cur.total_enrolled || 0) + enrolled;
      cur.completed_count = (cur.completed_count || 0) + completed;
          
        
      cur.raw = Array.isArray(cur.raw) ? cur.raw.concat(r) : [cur.raw, r];
    }
  }

  const classes = Array.from(map.values()).map(c => {
    const pct = c.total_enrolled ? Math.round((c.completed_count / c.total_enrolled) * 100) : (c.completion_pct ?? 0);
    return { ...c, completion_pct: pct };
  });

  // sort: highest enrolled first, then by level
  classes.sort((a, b) => (b.total_enrolled || 0) - (a.total_enrolled || 0) || (a.level ?? 0) - (b.level ?? 0));

  return classes;
}

// normalize various pipeline response shapes into stable items
function normalizeLeadershipPipeline(items) {
  if (!items) return [];
  // sometimes backend returns object with rows/data
  if (items.rows && Array.isArray(items.rows)) items = items.rows;
  if (items.data && Array.isArray(items.data)) items = items.data;
  if (!Array.isArray(items)) return [];

  return items.map((it, idx) => {
    // determine a display name from many possible shapes
    const name =
      it.name ??
      it.member_name ??
      it.full_name ??
      (it.first_name || it.surname ? `${it.first_name ?? ''} ${it.surname ?? ''}`.trim() : null) ??
      (it.leader_first_name || it.leader_surname ? `${it.leader_first_name ?? ''} ${it.leader_surname ?? ''}`.trim() : null) ??
      `Person ${idx + 1}`;

    const phase = it.phase ?? it.phase_name ?? it.stage ?? it.title ?? 'Unknown phase';
    // accept readiness as number or string; coerce to number and clamp 0-10
    let readiness = Number(it.readiness ?? it.readiness_score ?? it.score ?? it.readiness_pct ?? 0);
    if (!Number.isFinite(readiness)) readiness = 0;
    // if readiness looks like percent (0-100), scale to 0-10
    if (readiness > 10) readiness = Math.round(Math.max(0, Math.min(10, readiness / 10)));
    readiness = Math.max(0, Math.min(10, Math.round(readiness)));

    return {
      id: it.id ?? it.pipeline_id ?? `lp-${idx}`,
      name,
      phase,
      readiness,
      raw: it
    };
  });
}
