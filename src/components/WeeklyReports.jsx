import React, { useEffect, useMemo, useState, useContext, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box, Typography, Button, TextField, Card, CardContent, Grid, IconButton, Paper, List, ListItem, ListItemText,
  Divider, Snackbar, Alert, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, Fab,
  Tabs, Tab, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil, Trash2, FileDown, FileSpreadsheet, Plus, DownloadCloud, RefreshCcw, BarChart2
} from 'lucide-react';
import PersonAddAltIcon from '@mui/icons-material/PersonAdd';

import AddEditReportModal from './AddEditReportModal';

import {
  getWeeklyReports,
  deleteWeeklyReport,
  exportWeeklyReportsCSV,
  exportWeeklyReportsExcel,
  getLeaderboards,
  getTopCellForWeek,
  getBottomCellForWeek
} from '../services/weeklyReportService';
import { getCellGroups, getCellMembers } from '../services/cellGroupService';
import {
  listVisitors as getVisitors,
  updateVisitor as updateVisitorService,
  convertVisitor as convertVisitorService
} from '../services/visitorService';

/**
 * Modernized WeeklyReports component with Analytics controls
 */

function getWeekRangeLabel(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return ''; // Defensive: skip invalid dates
  const day = date.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function WeeklyReports() {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:900px)');
  const auth = useContext(AuthContext);
  const { fetchWithAuth } = auth || {};

  // safe fetcher fallback if AuthContext doesn't provide one
  const fetcher = typeof fetchWithAuth === 'function'
    ? fetchWithAuth
    : async (input, init = {}) => {
      const base = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';
      const url = String(input).startsWith('http') ? input : `${base}${input}`;
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { ...init, headers });
      if (!res.ok) throw new Error(await res.text().catch(() => 'Request failed'));
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) return res.json();
      if (ct.includes('application/octet-stream') || ct.includes('application/pdf') || ct.includes('spreadsheet') || ct.includes('sheet')) return res.blob();
      return null;
    };

  // data state
  const [groups, setGroups] = useState([]);
  const [reports, setReports] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  // UI state
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalInitial, setModalInitial] = useState(null);

  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, report: null });

  const [selectedWeekLabel, setSelectedWeekLabel] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const [search, setSearch] = useState('');
  const searchRef = useRef('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [tabIndex, setTabIndex] = useState(0);

  // Analytics dialog state
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsParams, setAnalyticsParams] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 84); // default ~12 weeks
    return {
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
      limit: 10,
      meeting_date: end.toISOString().slice(0, 10)
    };
  });
  const [analyticsResults, setAnalyticsResults] = useState({
    mostAttendance: [],
    mostVisitors: [],
    mostAbsentees: [],
    mostSouls: [],
    topCell: null,
    bottomCell: null
  });

  // initial load (groups, reports, visitors, members)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const g = await getCellGroups(fetcher);
        setGroups(g || []);
        const churchId = auth?.user?.church_id || (g[0] && g[0].church_id) || 1;
        const cellGroupId = g && g[0] && g[0].id;
        const r = await getWeeklyReports(fetcher, { church_id: churchId, cell_group_id: cellGroupId });

        const filtered = Array.isArray(r.rows) ? r.rows.filter(rep => !rep.is_deleted) : [];
        setReports(filtered);
        const v = await getVisitors(fetcher);
        if (!mounted) return;
        setVisitors(v || []);

        // load members for name lookups (sequentially to avoid flood)
        let membersAcc = [];
        for (const grp of g || []) {
          try {
            const ms = await getCellMembers(fetcher, grp.id);
            membersAcc = membersAcc.concat(ms || []);
          } catch (err) {
            // swallow, continue
          }
        }
        const uniqMembers = Object.values(membersAcc.reduce((acc, m) => { acc[m.id] = acc[m.id] || m; return acc; }, {}));
        setAllMembers(uniqMembers);
      } catch (err) {
        setSnack({ open: true, message: 'Failed to load data', severity: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // weekGroups map: label -> [reports]
  const weekGroups = useMemo(() => {
    const arr = Array.isArray(reports) ? reports : [];
    const map = {};
    arr.forEach(r => {
      if (!r.meeting_date) return;
      const label = getWeekRangeLabel(r.meeting_date);
      map[label] = map[label] || [];
      map[label].push(r);
    });
    return map;
  }, [reports]);

  const weekLabels = useMemo(() => {
    const labels = Object.keys(weekGroups).sort((a, b) => {
      const aEndStr = a.split('–')[1];
      const bEndStr = b.split('–')[1];
      const aEnd = aEndStr ? new Date(aEndStr) : new Date(0);
      const bEnd = bEndStr ? new Date(bEndStr) : new Date(0);
      return bEnd - aEnd;
    });
    return labels;
  }, [weekGroups]);

  // 🔥 CENTRALIZED: Keep selected week/report always valid after any mutation
  useEffect(() => {
    if (!reports.length) {
      setSelectedWeekLabel('');
      setSelectedReport(null);
      return;
    }

    // Weeks sorted latest first
    const labels = weekLabels;
    // If no week or it was deleted, pick first
    let nextWeekLabel = selectedWeekLabel;
    if (!labels.includes(selectedWeekLabel)) {
      nextWeekLabel = labels[0] || '';
    }
    // Get reports for this week
    const wReports = nextWeekLabel ? weekGroups[nextWeekLabel] || [] : [];
    let nextReport = selectedReport;
    if (!nextReport || !wReports.some(r => r.id === nextReport.id)) {
      nextReport = wReports[0] || null;
    }
    setSelectedWeekLabel(nextWeekLabel);
    setSelectedReport(nextReport);
    // eslint-disable-next-line
  }, [reports, weekLabels, weekGroups]);

  // search debounce
  useEffect(() => {
    searchRef.current = search;
    const id = setTimeout(() => setDebouncedSearch(searchRef.current.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  // safe apply reports + pick sane selected week/report
  const applyReports = (newReports) => {
    try {
      const arr = Array.isArray(newReports) ? newReports : [];
      setReports(arr);

      // rebuild week groups locally (same logic as weekGroups useMemo)
      const map = {};
      arr.forEach(r => {
        if (!r?.meeting_date) return;
        const label = getWeekRangeLabel(r.meeting_date);
        map[label] = map[label] || [];
        map[label].push(r);
      });
      const labels = Object.keys(map).sort((a, b) => {
        const aEndStr = a.split('–')[1];
        const bEndStr = b.split('–')[1];
        const aEnd = aEndStr ? new Date(aEndStr) : new Date(0);
        const bEnd = bEndStr ? new Date(bEndStr) : new Date(0);
        return bEnd - aEnd;
      });

      // choose week: prefer current selectedWeekLabel if still present, else first label
      const nextWeek = (selectedWeekLabel && labels.includes(selectedWeekLabel)) ? selectedWeekLabel : (labels[0] || '');
      setSelectedWeekLabel(nextWeek);

      // choose report: prefer currently selectedReport id if still present, else first of week
      const wReports = nextWeek ? (map[nextWeek] || []) : arr;
      const nextReport = (selectedReport && wReports.some(rr => rr.id === selectedReport.id)) ? selectedReport : (wReports[0] || null);
      setSelectedReport(nextReport);
    } catch (err) {
      // fallback: ensure UI has valid empty values
      setReports([]);
      setSelectedWeekLabel('');
      setSelectedReport(null);
    }
  };

  // when modal closes: optionally refresh (use safe updater)
  const handleModalClose = async (refresh = false) => {
    setOpenModal(false);
    setModalInitial(null);
    if (!refresh) return;
    try {
      const cellGroupId = groups && groups[0] && groups[0].id;
      const rr = await getWeeklyReports(fetcher, { cell_group_id: cellGroupId });

      // normalize incoming reports to an array (accept different response shapes)
      let incoming = null;
      if (Array.isArray(rr?.rows)) incoming = rr.rows;
      else if (Array.isArray(rr)) incoming = rr;
      else if (rr && rr.id) incoming = [rr];
      else incoming = null;

      if (incoming && incoming.length > 0) {
        // Merge incoming items into existing reports to avoid wiping local list
        const map = {};
        // keep existing
        (reports || []).forEach(r => { if (r && (r.id !== undefined && r.id !== null)) map[String(r.id)] = r; });
        // overwrite / add incoming
        incoming.forEach(r => { if (r && (r.id !== undefined && r.id !== null)) map[String(r.id)] = r; });

        applyReports(Object.values(map));
      } else {
        // unexpected shape: keep previous reports
        applyReports(reports || []);
      }
    } catch (err) {
      // don't break the UI — show a transient error and keep previous state
      setSnack({ open: true, message: 'Failed to refresh reports', severity: 'warning' });
      applyReports(reports || []);
    }
  };

  // open create/edit modal helpers
  const openCreateModal = () => {
    setModalMode('create');
    setModalInitial(null);
    setOpenModal(true);
  };
  const openEditModal = (report) => {
    setModalMode('edit');
    setModalInitial(report);
    setOpenModal(true);
  };

  // delete
  async function handleDeleteConfirmed() {
    const r = confirmDelete.report;
    if (!r) return setConfirmDelete({ open: false, report: null });
    try {
      await deleteWeeklyReport(fetcher, r.id);
      setReports(prev => prev.filter(rep => rep.id !== r.id));
      setSnack({ open: true, message: 'Deleted successfully', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: 'Delete failed', severity: 'error' });
    } finally {
      setConfirmDelete({ open: false, report: null });
    }
  }

  // normalize export result to a Blob (accept string or Blob)
  function normalizeToBlob(result, mime = 'text/csv') {
    if (!result) return null;
    if (result instanceof Blob) return result;
    if (typeof result === 'string') return new Blob([result], { type: mime + ';charset=utf-8' });
    if (result instanceof ArrayBuffer) return new Blob([result], { type: mime });
    return null;
  }

  // export helpers
  async function handleExportCSV(report) {
    try {
      const res = await exportWeeklyReportsCSV(fetcher, report.id);
      const blob = normalizeToBlob(res, 'text/csv');
      if (!blob) throw new Error('Invalid CSV response');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly_report_${report.id}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnack({ open: true, message: 'Export failed', severity: 'error' });
    }
  }

  async function handleExportXlsx(report) {
    try {
      const res = await exportWeeklyReportsExcel(fetcher, report.id);
      const blob = normalizeToBlob(res, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      if (!blob) throw new Error('Invalid XLSX response');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly_report_${report.id}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setSnack({ open: true, message: 'Export failed', severity: 'error' });
    }
  }

  // visitor actions
  async function toggleVisitorFollowUp(visitor) {
    try {
      const next = visitor.follow_up_status === 'pending' ? 'in_progress' : visitor.follow_up_status === 'in_progress' ? 'done' : 'pending';
      await updateVisitorService(fetcher, visitor.id, { follow_up_status: next });
      const v = await getVisitors(fetcher);
      setVisitors(v || []);
      setSnack({ open: true, message: 'Visitor follow-up updated', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: 'Update failed', severity: 'error' });
    }
  }

  async function convertVisitorToMember(visitor) {
    try {
      await convertVisitorService(fetcher, visitor.id);
      const v = await getVisitors(fetcher);
      setVisitors(v || []);
      setSnack({ open: true, message: 'Visitor converted', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: 'Convert failed', severity: 'error' });
    }
  }

  // filtered reports for the selected week + search term
  const filteredReports = useMemo(() => {
    const base = selectedWeekLabel ? (weekGroups[selectedWeekLabel] || []) : reports;
    const arr = Array.isArray(base) ? base : [];
    if (!debouncedSearch) return arr;
    const q = debouncedSearch.toLowerCase();
    return arr.filter(r => {
      const title = `${r.cell_group || r.cell_group_name || ''} ${r.topic || r.topic_taught || ''} ${r.leader || r.leader_name || ''}`.toLowerCase();
      return title.includes(q);
    });
  }, [selectedWeekLabel, weekGroups, reports, debouncedSearch]);

  // Helper to get member names by ID
  function getMemberName(id, allMembers) {
    if (!id) return '';
    const m = allMembers.find(mem => Number(mem.id) === Number(id));
    return m ? `${m.first_name} ${m.surname}` : String(id);
  }

  // Helper to get visitor names by ID
  function getVisitorName(id, visitors) {
    if (!id) return '';
    const v = visitors.find(vis => Number(vis.id) === Number(id));
    return v ? `${v.first_name} ${v.surname}` : String(id);
  }

  // Analytics loaders
  async function loadLeaderboards() {
    const churchId = (groups && groups[0] && groups[0].church_id) || (reports && reports[0] && reports[0].church_id) || null;
    if (!churchId) {
      setSnack({ open: true, message: 'No church_id available for analytics', severity: 'warning' });
      return;
    }
    setAnalyticsLoading(true);
    try {
      const boards = await getLeaderboards(fetcher, churchId, analyticsParams.start_date, analyticsParams.end_date, analyticsParams.limit);
      setAnalyticsResults(prev => ({ ...prev, ...boards }));
      setSnack({ open: true, message: 'Leaderboards loaded', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: 'Failed to load leaderboards', severity: 'error' });
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function loadWeekTopBottom() {
    const churchId = (groups && groups[0] && groups[0].church_id) || (reports && reports[0] && reports[0].church_id) || null;
    if (!churchId) {
      setSnack({ open: true, message: 'No church_id available for analytics', severity: 'warning' });
      return;
    }
    setAnalyticsLoading(true);
    try {
      const top = await getTopCellForWeek(fetcher, churchId, analyticsParams.meeting_date);
      const bottom = await getBottomCellForWeek(fetcher, churchId, analyticsParams.meeting_date);
      setAnalyticsResults(prev => ({ ...prev, topCell: top, bottomCell: bottom }));
      setSnack({ open: true, message: 'Week leaders loaded', severity: 'success' });
    } catch (err) {
      setSnack({ open: true, message: 'Failed to load week leaders', severity: 'error' });
    } finally {
      setAnalyticsLoading(false);
    }
  }

  // preview render
  function renderPreview() {
    if (!selectedReport) return <Typography color="text.secondary">No report selected</Typography>;
    const r = selectedReport;

    // Support both legacy fields and JSONB shapes:
    const attendeeIds = Array.isArray(r.attendee_ids)
      ? r.attendee_ids
      : Array.isArray(r.attendees)
        ? r.attendees.map(a => (a && (a.member_id || a.id)) ? (a.member_id || a.id) : null).filter(Boolean)
        : [];

    const absenteeIds = Array.isArray(r.absentee_ids)
      ? r.absentee_ids
      : Array.isArray(r.absentees)
        ? r.absentees.map(a => a && a.member_id ? a.member_id : null).filter(Boolean)
        : [];

    const visitorIds = Array.isArray(r.visitor_ids)
      ? r.visitor_ids
      : Array.isArray(r.visitors)
        ? r.visitors.map(v => v && (v.visitor_id || v.id) ? (v.visitor_id || v.id) : null).filter(Boolean)
        : [];

    // Names
    const attendeeNames = attendeeIds.map(id => getMemberName(id, allMembers));
    const absenteeNames = absenteeIds.map(id => getMemberName(id, allMembers));
    const visitorNames = visitorIds.map(id => getVisitorName(id, visitors));

    const toArray = (val) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.split('\n').map(s => s.trim()).filter(Boolean);
      return [String(val)];
    };

    const tabularFields = [
      { label: 'Testimonies', value: toArray(r.testimonies) },
      { label: 'Prayer Requests', value: toArray(r.prayer_requests) },
      { label: 'Follow Ups', value: toArray(r.follow_ups) },
      { label: 'Challenges', value: toArray(r.challenges) },
      { label: 'Support Needed', value: toArray(r.support_needed) },
    ];

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">{r.cell_name}</Typography>
            <Typography variant="body2" color="text.secondary" noWrap>{r.topic || r.topic_taught}</Typography>
            <Typography variant="caption" color="text.secondary">{r.meeting_date}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Tooltip title="Export CSV"><IconButton size="small" onClick={() => handleExportCSV(r)}><FileDown size={16} /></IconButton></Tooltip>
            <Tooltip title="Export XLSX"><IconButton size="small" onClick={() => handleExportXlsx(r)}><FileSpreadsheet size={16} /></IconButton></Tooltip>
            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditModal(r)}><Pencil size={16} /></IconButton></Tooltip>
          </Box>
        </Box>
        <Divider sx={{ my: 1 }} />

        {/* Inline stats row */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Chip label={`Total Attendance: ${r.total_cell_attendance ?? attendeeIds.length}`} color="primary" />
          <Chip label={`Absentees: ${r.absentees_count ?? absenteeIds.length}`} color={absenteeIds.length ? "warning" : "default"} />
          <Chip label={`Attendees: ${attendeeIds.length}`} color={attendeeIds.length ? "success" : "default"} />
          <Chip label={`Visitors: ${r.visitors_count ?? visitorIds.length}`} color={visitorIds.length ? "info" : "default"} icon={<PersonAddAltIcon />} />
          <Chip label={`First Timers: ${r.first_timers ?? 0}`} />
          <Chip label={`Souls Saved (Outreach): ${r.souls_saved_outreach ?? 0}`} />
          <Chip label={`Souls Saved (Meeting): ${r.souls_saved_meeting ?? 0}`} />
        </Box>

        {/* Inline lists */}
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
          <Box>
            <Typography variant="subtitle2">Attendees</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {attendeeNames.map((n, i) => <Chip key={i} label={n} size="small" />)}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2">Absentees</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {absenteeNames.map((n, i) => <Chip key={i} label={n} size="small" color="warning" />)}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle2">Visitors</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {visitorNames.map((n, i) => <Chip key={i} label={n} size="small" icon={<PersonAddAltIcon />} />)}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tabs for narrative fields */}
        <Tabs
          value={tabIndex}
          onChange={(_, idx) => setTabIndex(idx)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          {tabularFields.map((f) => (
            <Tab key={f.label} label={f.label} />
          ))}
        </Tabs>
        <Box sx={{ minHeight: 80 }}>
          {tabularFields.map((f, idx) => (
            tabIndex === idx && (
              <Box key={f.label}>
                {f.value.length === 0
                  ? <Typography color="text.secondary">None</Typography>
                  : (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {f.value.map((item, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>{item}</li>
                      ))}
                    </ul>
                  )
                }
              </Box>
            )
          ))}
        </Box>
      </Box>
    );
  }

  // small helper to present counts gently
  const renderStatChip = (label, value, color = 'default') => (
    <Chip label={`${label}: ${value}`} size="small" color={color} sx={{ mr: 0.5 }} />
  );

  // Analytics dialog UI
  function AnalyticsDialog() {
    return (
      <Dialog open={analyticsOpen} onClose={() => setAnalyticsOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>
          Analytics & Leaderboards
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Start Date"
                type="date"
                value={analyticsParams.start_date}
                onChange={e => setAnalyticsParams(p => ({ ...p, start_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="End Date"
                type="date"
                value={analyticsParams.end_date}
                onChange={e => setAnalyticsParams(p => ({ ...p, end_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={8} sm={4} md={3}>
              <TextField
                label="Limit"
                type="number"
                value={analyticsParams.limit}
                onChange={e => setAnalyticsParams(p => ({ ...p, limit: Number(e.target.value || 10) }))}
                fullWidth
              />
            </Grid>
            <Grid item xs={4} sm={2} md={3} sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<BarChart2 />}
                onClick={loadLeaderboards}
                disabled={analyticsLoading}
              >
                {analyticsLoading ? <CircularProgress size={18} /> : 'Load Leaderboards'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  // reset to defaults
                  const end = new Date();
                  const start = new Date(); start.setDate(end.getDate() - 84);
                  setAnalyticsParams({
                    start_date: start.toISOString().slice(0, 10),
                    end_date: end.toISOString().slice(0, 10),
                    limit: 10,
                    meeting_date: end.toISOString().slice(0, 10)
                  });
                  setAnalyticsResults({
                    mostAttendance: [], mostVisitors: [], mostAbsentees: [], mostSouls: [], topCell: null, bottomCell: null
                  });
                }}
              >
                Reset
              </Button>
            </Grid>

            {/* Week-specific controls */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Meeting Date (week)"
                type="date"
                value={analyticsParams.meeting_date}
                onChange={e => setAnalyticsParams(p => ({ ...p, meeting_date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={loadWeekTopBottom} disabled={analyticsLoading}>
                {analyticsLoading ? <CircularProgress size={18} /> : 'Load Top / Bottom'}
              </Button>
              <Button variant="outlined" onClick={() => { setAnalyticsResults(prev => ({ ...prev, topCell: null, bottomCell: null })); }}>
                Clear
              </Button>
            </Grid>

            {/* Results: Leaderboards */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 1 }}>Leaderboards (range)</Typography>
              {analyticsLoading && <Typography variant="body2">Loading...</Typography>}
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Most Attendance</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cell Group</TableCell>
                        <TableCell align="right">Attendance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsResults.mostAttendance.map(row => (
                        <TableRow key={String(row.cell_group_id) + row.cell_group_name}>
                          <TableCell>{row.cell_group_name || row.cell_group_id}</TableCell>
                          <TableCell align="right">{row.total_attendance ?? row.total_attendance}</TableCell>
                        </TableRow>
                      ))}
                      {analyticsResults.mostAttendance.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2}>No data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Most Visitors</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cell Group</TableCell>
                        <TableCell align="right">Visitors</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsResults.mostVisitors.map(row => (
                        <TableRow key={String(row.cell_group_id) + row.cell_group_name}>
                          <TableCell>{row.cell_group_name || row.cell_group_id}</TableCell>
                          <TableCell align="right">{row.total_visitors ?? row.total_visitors}</TableCell>
                        </TableRow>
                      ))}
                      {analyticsResults.mostVisitors.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2}>No data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Most Absentees</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cell Group</TableCell>
                        <TableCell align="right">Absentees</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsResults.mostAbsentees.map(row => (
                        <TableRow key={String(row.cell_group_id) + row.cell_group_name}>
                          <TableCell>{row.cell_group_name || row.cell_group_id}</TableCell>
                          <TableCell align="right">{row.total_absentees ?? row.total_absentees}</TableCell>
                        </TableRow>
                      ))}
                      {analyticsResults.mostAbsentees.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2}>No data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Most Souls Saved</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cell Group</TableCell>
                        <TableCell align="right">Souls</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsResults.mostSouls.map(row => (
                        <TableRow key={String(row.cell_group_id) + row.cell_group_name}>
                          <TableCell>{row.cell_group_name || row.cell_group_id}</TableCell>
                          <TableCell align="right">{row.total_souls ?? row.total_souls}</TableCell>
                        </TableRow>
                      ))}
                      {analyticsResults.mostSouls.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2}>No data</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </Grid>

            {/* Results: Week top/bottom */}
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Top / Bottom for {analyticsParams.meeting_date}</Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="subtitle2">Top Cell</Typography>
                    {analyticsResults.topCell ? (
                      <Box>
                        <Typography>{analyticsResults.topCell.cell_group_name}</Typography>
                        <Typography variant="caption">Attendance: {analyticsResults.topCell.total_cell_attendance}</Typography>
                      </Box>
                    ) : <Typography color="text.secondary">No data</Typography>}
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ p: 1 }}>
                    <Typography variant="subtitle2">Bottom Cell</Typography>
                    {analyticsResults.bottomCell ? (
                      <Box>
                        <Typography>{analyticsResults.bottomCell.cell_group_name}</Typography>
                        <Typography variant="caption">Attendance: {analyticsResults.bottomCell.total_cell_attendance}</Typography>
                      </Box>
                    ) : <Typography color="text.secondary">No data</Typography>}
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalyticsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, background: theme.palette.background.default, minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography variant="h4">Weekly Cell Leader Reports</Typography>

        <TextField
          size="small"
          placeholder="Search by cell, topic or leader..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: isMobile ? '100%' : 360, ml: 'auto' }}
        />

        {!isMobile && (
          <>
            <Button variant="contained" startIcon={<Plus size={14} />} onClick={openCreateModal}>
              Add Weekly Report
            </Button>
            <Button variant="outlined" startIcon={<BarChart2 />} onClick={() => setAnalyticsOpen(true)}>
              Analytics
            </Button>
          </>
        )}

        <Tooltip title="Refresh">
          <IconButton onClick={async () => {
            try {
              setLoading(true);
              const cellGroupId = groups && groups[0] && groups[0].id;
              const [r, v] = await Promise.all([
                getWeeklyReports(fetcher, { cell_group_id: cellGroupId }),
                getVisitors(fetcher)
              ]);
              setReports(Array.isArray(r.rows) ? r.rows : []);
              setVisitors(v || []);
              setSnack({ open: true, message: 'Refreshed', severity: 'success' });
            } catch (err) {
              setSnack({ open: true, message: 'Refresh failed', severity: 'error' });
            } finally {
              setLoading(false);
            }
          }}>
            <RefreshCcw size={18} />
          </IconButton>
        </Tooltip>
      </Box>

      <Grid container spacing={2}>
        {/* Weeks column */}
        <Grid item xs={12} md={3}>
          <Paper sx={{
            p: 1,
            height: isMobile ? 'auto' : '72vh',
            overflowY: 'auto',
            position: isMobile ? 'relative' : 'sticky',
            top: isMobile ? 'auto' : 80
          }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Weeks</Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {weekLabels.length === 0 && (
                <Typography variant="body2" color="text.secondary">No weekly reports yet</Typography>
              )}

              <AnimatePresence initial={false}>
                {weekLabels.map((label) => {
                  const isSelected = selectedWeekLabel === label;
                  return (
                    <motion.div key={label} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                      <Button
                        fullWidth
                        variant={isSelected ? 'contained' : 'outlined'}
                        onClick={() => setSelectedWeekLabel(label)}
                        sx={{
                          justifyContent: 'flex-start',
                          textTransform: 'none',
                          py: 1,
                          borderRadius: 2
                        }}
                      >
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{label.split('–')[0]}</Typography>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                        </Box>
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Box>
          </Paper>
        </Grid>

        {/* Reports list */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: isMobile ? 'auto' : '72vh', overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1">Reports</Typography>
              <Chip label={`${filteredReports.length} total`} size="small" />
            </Box>

            <List sx={{ p: 0 }}>
              <AnimatePresence>
                {Array.isArray(filteredReports) && filteredReports.length === 0 && (
                  <motion.div key="emptyReports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Typography variant="body2" color="text.secondary">No reports for this week</Typography>
                  </motion.div>
                )}

                {Array.isArray(filteredReports) && filteredReports.map((r) => {
                  const attendance = r.total_cell_attendance ?? (Array.isArray(r.attendee_ids) ? r.attendee_ids.length : (Array.isArray(r.attendees) ? r.attendees.length : 0));
                  const visitorsCount = Array.isArray(r.visitor_ids) ? r.visitor_ids.length : (Array.isArray(r.visitors) ? r.visitors.length : (r.visitors_count ?? 0));
                  const absCount = Array.isArray(r.absentee_ids) ? r.absentee_ids.length : (Array.isArray(r.absentees) ? r.absentees.length : (r.absentees_count ?? 0));
                  const isSelected = selectedReport?.id === r.id;

                  return (
                    <motion.div key={r.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                      <ListItem
                        button
                        selected={isSelected}
                        onClick={() => setSelectedReport(r)}
                        sx={{ borderRadius: 2, mb: 1.2, p: 0 }}
                      >
                        <Card variant="outlined" sx={{
                          width: '100%',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          px: 1,
                          py: 1
                        }}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body1" sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.cell_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {r.leader || r.leader_name} — {r.meeting_date}
                            </Typography>

                            <Box sx={{ mt: 0.6, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {renderStatChip('Attendance', attendance, 'primary')}
                              {renderStatChip('Visitors', visitorsCount, visitorsCount > 0 ? 'primary' : 'default')}
                              {renderStatChip('Absentees', absCount, absCount > 0 ? 'warning' : 'default')}
                            </Box>
                          </Box>

                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', ml: 1 }}>
                            <Tooltip title="Export CSV"><IconButton size="small" onClick={() => handleExportCSV(r)}><FileDown size={16} /></IconButton></Tooltip>
                            <Tooltip title="Export XLSX"><IconButton size="small" onClick={() => handleExportXlsx(r)}><FileSpreadsheet size={16} /></IconButton></Tooltip>
                            <Tooltip title="Edit"><IconButton size="small" onClick={() => openEditModal(r)}><Pencil size={16} /></IconButton></Tooltip>
                            <Tooltip title="Delete"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setConfirmDelete({ open: true, report: r }) }}><Trash2 size={16} /></IconButton></Tooltip>
                          </Box>
                        </Card>
                      </ListItem>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </List>
          </Paper>
        </Grid>

        {/* Preview panel */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, minHeight: isMobile ? 'auto' : '72vh', overflowY: 'auto' }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Preview</Typography>
            {renderPreview()}
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Add button for mobile */}
      {isMobile && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ position: 'fixed', right: 16, bottom: 20, zIndex: 2200 }}>
          <Fab color="primary" onClick={openCreateModal} size="medium">
            <Plus size={18} />
          </Fab>
        </motion.div>
      )}

      <AddEditReportModal
        open={openModal}
        onClose={handleModalClose}
        mode={modalMode}
        initial={modalInitial}
        defaultGroups={groups}
      />

      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, report: null })}>
        <DialogTitle>Delete Weekly Report?</DialogTitle>
        <DialogContent>Are you sure you want to delete this report? This action cannot be undone.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, report: null })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirmed}>Delete</Button>
        </DialogActions>
      </Dialog>

      {AnalyticsDialog()}

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}