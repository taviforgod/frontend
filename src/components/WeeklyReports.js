// frontend/src/components/WeeklyReports.jsx
import React, { useEffect, useState } from 'react';
import {
  Typography, Button, TextField, Autocomplete, Chip, Modal, Box, Alert, Divider,
  Card, CardContent, Grid, IconButton, Tooltip, Stepper, Step, StepLabel, Paper,
  List, ListItem, ListItemText, ListItemSecondaryAction, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Pencil, Trash2, FileDown, FileSpreadsheet, Check, X } from 'lucide-react';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { FilterList } from '@mui/icons-material';
import { useTheme } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';

import {
  getCellGroups, getCellGroupMembers, getLastWeeklyReport,
  getWeeklyReports, createWeeklyReport,
  deleteWeeklyReport,
  exportWeeklyReportsCSV, exportWeeklyReportsExcel,
  updateWeeklyReport,
} from '../services/cellModuleService';
import { listVisitors as getVisitors, setFollowUpStatus, convertVisitorToMember } from '../services/visitorNameService';

function getWeekRange(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0 (Sun) - 6 (Sat)
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday,
    end: sunday,
    label: `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}–${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  };
}

export default function WeeklyReports() {
  const theme = useTheme();

  const [groups, setGroups] = useState([]);
  const [reports, setReports] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [members, setMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Meeting Info', 'Attendance', 'Details'];

  const [reportToDelete, setReportToDelete] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const [fields, setFields] = useState({
    attendees: [],
    absentees: [],
    absenteeReasons: {},
    visitor_ids: [],
    date_of_meeting: '',
    topic_taught: '',
    leader_id: '',
  });

  const attendance = Array.isArray(fields.attendees) ? fields.attendees.length : 0;

  // Follow-up modal state
  const [followUpModal, setFollowUpModal] = useState({ open: false, member: null });
  const [flaggedVisitor, setFlaggedVisitor] = useState(null);

  // Load initial data
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [g, r, v] = await Promise.all([
          getCellGroups(),
          getWeeklyReports(),
          getVisitors()
        ]);
        if (!mounted) return;
        setGroups(g || []);
        setReports(r || []);
        setVisitors(v || []);

        let allMems = [];
        for (const grp of g || []) {
          const groupMembers = await getCellGroupMembers(grp.id);
          allMems = allMems.concat(groupMembers || []);
        }
        const uniqueMembers = Object.values(
          allMems.reduce((acc, m) => {
            acc[m.id] = m;
            return acc;
          }, {})
        );
        setAllMembers(uniqueMembers);

      } catch (e) {
        console.error('Failed to load initial data', e);
        if (mounted) setError('Failed to load initial data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!fields.cell_group_id) {
      setMembers([]);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const gms = await getCellGroupMembers(fields.cell_group_id);
        if (!mounted) return;
        setMembers(gms || []);
        try {
          const last = await getLastWeeklyReport(fields.cell_group_id);
          if (last && Array.isArray(last.attendees) && last.attendees.length) {
            setFields(prev => ({
              ...prev,
              attendees: gms.filter(m => last.attendees.includes(m.id))
            }));
          }
        } catch (err) {}
      } catch (err) {
        console.error('Failed to load group members', err);
      }
    })();
    return () => { mounted = false; };
  }, [fields.cell_group_id]);

  useEffect(() => {
    const selectedGroup = groups.find(g => g.id === fields.cell_group_id);
    if (selectedGroup && selectedGroup.leader_id) {
      setFields(prev => ({ ...prev, leader_id: selectedGroup.leader_id }));
    }
  }, [fields.cell_group_id, groups]);

  // Group reports by week range
  const weekGroups = {};
  (reports || []).forEach(r => {
    if (!r.date_of_meeting) return;
    const week = getWeekRange(r.date_of_meeting);
    if (!weekGroups[week.label]) weekGroups[week.label] = [];
    weekGroups[week.label].push(r);
  });
  const weekLabels = Object.keys(weekGroups);

  // Reports for selected week
  const reportsForWeek = selectedWeek
    ? weekGroups[selectedWeek] || []
    : reports || [];

  // PATCH: absentee names from member objects
  const absenteeNames = (members || [])
    .filter(m => !fields.attendees.some(a => a.id === m.id))
    .map(m => `${m.first_name} ${m.surname}`.trim());

  // Submission handler
  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const attendee_ids = fields.attendees.map(m => m.id);
      const attendee_names = fields.attendees.map(m => `${m.first_name} ${m.surname}`.trim());

      const payload = {
        cell_group_id: fields.cell_group_id,
        date_of_meeting: fields.date_of_meeting,
        topic_taught: fields.topic_taught,
        attendees: attendee_ids,
        attendee_names,
        visitors: fields.visitor_ids,
        testimonies: fields.testimonies,
        prayer_requests: fields.prayer_requests,
        follow_ups: fields.follow_ups,
        challenges: fields.challenges,
        support_needed: fields.support_needed,
        attendance: attendance,
        leader_id: fields.leader_id,
        absentees: fields.absentees,
        absenteeReasons: fields.absenteeReasons
      };

      if (!payload.leader_id) {
        setError('No leader assigned to this cell group.');
        setLoading(false);
        return;
      }

      if (editOpen && selectedReport) {
        // Update existing report
        await updateWeeklyReport(selectedReport.id, payload);
      } else {
        // Create new report
        await createWeeklyReport(payload);
      }

      const rr = await getWeeklyReports();
      setReports(rr || []);
      handleClose();
    } catch (err) {
      console.error('create/update WeeklyReport failed', err);
      setError(err?.message || 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  async function handleDeleteConfirmed() {
    try {
      await deleteWeeklyReport(reportToDelete.id);
      const rr = await getWeeklyReports();
      setReports(rr || []);
      setSnackbar({ open: true, message: 'Report deleted successfully.', severity: 'success' });
    } catch (err) {
      console.error('delete failed', err);
      setSnackbar({ open: true, message: 'Failed to delete report.', severity: 'error' });
    } finally {
      setConfirmOpen(false);
      setReportToDelete(null);
    }
  }

  function handleDelete(report) {
    setReportToDelete(report);
    setConfirmOpen(true);
  }

  function handleEdit(report) {
    setSelectedReport(report);
    setEditOpen(true);
    setOpen(true);

    // Format date for input type="date"
    let dateStr = '';
    if (report.date_of_meeting) {
      const d = new Date(report.date_of_meeting);
      dateStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    }

    setFields({
      cell_group_id: report.cell_group_id || '',
      date_of_meeting: dateStr,
      topic_taught: report.topic_taught || '',
      leader_id: report.leader_id || '',
      attendees: allMembers.filter(m =>
        Array.isArray(report.attendees)
          ? report.attendees.includes(m.id)
          : (Array.isArray(report.attendee_names) && report.attendee_names.includes(`${m.first_name} ${m.surname}`))
      ),
      absentees: Array.isArray(report.absentees) ? report.absentees : [],
      absenteeReasons: report.absenteeReasons || {},
      visitor_ids: Array.isArray(report.visitors) ? report.visitors : [],
      testimonies: report.testimonies || '',
      prayer_requests: report.prayer_requests || '',
      follow_ups: report.follow_ups || '',
      challenges: report.challenges || '',
      support_needed: report.support_needed || '',
    });
    setActiveStep(0);
  }

  async function handleExportCSV(report) {
    try {
      const blob = await exportWeeklyReportsCSV(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "weekly_report.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('export csv failed', err);
      setError('Export failed');
    }
  }

  async function handleExportExcel(report) {
    try {
      const blob = await exportWeeklyReportsExcel(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "weekly_report.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('export excel failed', err);
      setError('Export failed');
    }
  }

  const handleNext = () => setActiveStep(s => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep(s => Math.max(s - 1, 0));
  const handleOpen = () => { setOpen(true); setActiveStep(0); };
  const handleClose = () => {
    setOpen(false);
    setEditOpen(false);
    setSelectedReport(null);
    setActiveStep(0);
    setFields({
      attendees: [],
      absentees: [],
      absenteeReasons: {},
      visitor_ids: [],
      date_of_meeting: '',
      topic_taught: '',
      leader_id: '',
    });
    setError('');
  };

  useEffect(() => {
    const absentees = (members || [])
      .filter(m => !fields.attendees.some(a => a.id === m.id))
      .map(m => m.id);
    setFields(prev => ({ ...prev, absentees }));
  }, [fields.attendees, members]);

  const absenteeThreshold = 3;

  // --- Performance helpers ---
  // Example: growth = more attendees than previous week, decline = less, stable = same
  function getPerformance(report, prevReport) {
    if (!prevReport) return "stable";
    if ((report.attendance || 0) > (prevReport.attendance || 0)) return "growing";
    if ((report.attendance || 0) < (prevReport.attendance || 0)) return "declining";
    return "stable";
  }

  // Find previous week's report for a cell group
  function getPrevReport(currentReport) {
    const all = (reports || []).filter(r =>
      r.cell_group_id === currentReport.cell_group_id &&
      r.id !== currentReport.id
    );
    // Find the most recent report before this one
    return all
      .filter(r => new Date(r.date_of_meeting) < new Date(currentReport.date_of_meeting))
      .sort((a, b) => new Date(b.date_of_meeting) - new Date(a.date_of_meeting))[0];
  }

  // Find top and lowest performing cell for the selected week
  let topCell = null, lowCell = null;
  if (reportsForWeek.length > 0) {
    const sorted = [...reportsForWeek].sort((a, b) => (b.attendance || 0) - (a.attendance || 0));
    topCell = sorted[0];
    lowCell = sorted[sorted.length - 1];
  }

  // --- End helpers ---

  // Add these two functions:
  function handleFollowUpClick(member) {
    setFollowUpModal({ open: true, member });
  }

  function handleCloseFollowUp() {
    setFollowUpModal({ open: false, member: null });
  }

  function handleFollowUpDone() {
    setFollowUpModal({ open: false, member: null });
    // Optionally, you can add logic here to mark the follow-up as done in your backend or state
  }

  // Helper to count visits for a visitor
  function getVisitCount(visitorId, cellGroupId) {
    return reports.filter(r =>
      r.cell_group_id === cellGroupId &&
      Array.isArray(r.visitors) &&
      r.visitors.includes(visitorId)
    ).length;
  }

  // Find the latest week label (most recent week)
  const latestWeekLabel = weekLabels.length > 0
    ? weekLabels
        .map(label => ({
          label,
          // Parse the end date from the label: "Aug 5–Aug 11, 2025"
          end: new Date(label.split('–')[1])
        }))
        .sort((a, b) => b.end - a.end)[0].label
    : "";

  // Use latestWeekLabel for the banner if no week is selected
  const bannerWeekLabel = selectedWeek || latestWeekLabel;

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>
      {/* Week Banner / Ribbon */}
      {bannerWeekLabel && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            borderRadius: 2,
            background: theme.palette.primary.light,
            color: theme.palette.primary.contrastText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 400,
              color: theme.palette.primary.contrastText // Make label theme aware
            }}
          >
            Week: {bannerWeekLabel}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {topCell && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EmojiEventsIcon sx={{ color: theme.palette.success.main, fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: theme.palette.success.main }}>
                  Top Cell: {topCell.cell_group}
                </Typography>
              </Box>
            )}
            {lowCell && lowCell !== topCell && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowDownwardIcon sx={{ color: theme.palette.error.main, fontSize: 22 }} />
                <Typography variant="body2" sx={{ color: theme.palette.error.main }}>
                  Lowest: {lowCell.cell_group}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Typography variant="h4" sx={{ mb: 4, fontWeight: 400, color: "#2d3748" }}>
        Weekly Cell Leader Reports
      </Typography>

      {/* Top Card: Search, Filters, Add */}
      <Card
        sx={{
          mb: 3,
          width: "100%",
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          background: theme.palette.background.paper,
          boxShadow: "none"
        }}
      >
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            placeholder="Search by cell group, leader, or topic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            size="small"
            InputProps={{
              style: {
                background: theme.palette.background.paper,
                color: theme.palette.text.primary
              }
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              background: theme.palette.background.paper,
              '&:hover': { background: theme.palette.action.hover }
            }}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<Pencil size={18} />}
            onClick={handleOpen}
            sx={{
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': { background: theme.palette.primary.dark }
            }}
          >
            Add Weekly Report
          </Button>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {/* Panel 1: Weekly Ranges */}
        <Grid item xs={12} md={2}>
          <Paper
            variant="outlined"
            sx={{
              height: '70vh',
              overflowY: 'auto',
              p: 1,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper, // theme aware
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 400, mb: 2, color: theme.palette.text.primary }}>Weeks</Typography>
            <ToggleButtonGroup
              orientation="vertical"
              value={selectedWeek}
              exclusive
              onChange={(_, val) => { setSelectedWeek(val); setSelectedReport(null); }}
              sx={{ width: '100%' }}
            >
              {weekLabels.map((label, idx) => {
                // Parse the week label to get the month and week number
                // Example label: "Aug 5–Aug 11, 2025"
                const [start, rest] = label.split('–');
                const startDate = new Date(`${start}, ${rest.split(', ')[1]}`);
                const weekOfMonth = Math.ceil(startDate.getDate() / 7);

                return (
                  <ToggleButton
                    key={label}
                    value={label}
                    sx={{
                      justifyContent: "flex-start",
                      borderRadius: 4,
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: 15,
                      mb: 1,
                      color: selectedWeek === label
                        ? theme.palette.primary.contrastText
                        : theme.palette.text.primary,
                      backgroundColor: selectedWeek === label
                        ? theme.palette.primary.main
                        : theme.palette.background.paper,
                      borderColor: selectedWeek === label
                        ? theme.palette.primary.main
                        : theme.palette.divider,
                      '&:hover': {
                        backgroundColor: selectedWeek === label
                          ? theme.palette.primary.dark
                          : theme.palette.action.hover,
                        borderColor: theme.palette.primary.main,
                      },
                      transition: "all 0.15s",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      py: 1.2,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: "inherit", lineHeight: 1 }}>
                      Week {weekOfMonth}
                    </Typography>
                    <Box sx={{ height: 6 }} /> {/* Adds space between week and date */}
                    <Typography variant="body2" sx={{ fontWeight: 400, color: "inherit", fontSize: 13 }}>
                      {label}
                    </Typography>
                  </ToggleButton>
                );
              })}
            </ToggleButtonGroup>
            {weekLabels.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: "center", mt: 4 }}>
                No weeks found.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Panel 2: Report List */}
        <Grid item xs={12} md={4}>
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              border: theme => `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backgroundColor: theme => theme.palette.background.paper,
              boxShadow: "none",
              height: '70vh',
              overflowY: 'auto',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 400,
                mb: 2,
                fontFamily: theme => theme.typography.fontFamily,
                color: theme => theme.palette.text.primary
              }}
            >
              Reports
            </Typography>
            <List>
              {(reportsForWeek || []).map((r, i) => {
                const absenteesCount = Array.isArray(r.absentees) ? r.absentees.length : 0;
                const visitorsCount = r.visitors_count || (Array.isArray(r.visitors) ? r.visitors.length : 0);
                const highAbsentees = absenteesCount > 5;
                const prevReport = getPrevReport(r);
                const perf = getPerformance(r, prevReport);

                return (
                  <ListItem
                    key={r.id || i}
                    button
                    selected={selectedReport?.id === r.id}
                    onClick={() => setSelectedReport(r)}
                    sx={{
                      mb: 1.5,
                      borderRadius: 'none',
                      border: 'none',
                      backgroundColor: theme =>
                        selectedReport?.id === r.id
                          ? theme.palette.action.selected
                          : theme.palette.background.paper,
                      boxShadow: "none",
                      alignItems: 'center',
                      fontFamily: theme => theme.typography.fontFamily,
                      transition: 'background 0.2s, border-color 0.2s',
                      '&:hover': {
                        backgroundColor: theme => theme.palette.action.hover,
                        borderColor: theme => theme.palette.primary.main,
                        boxShadow: "none",
                        border: 'none',
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {/* Top cell indicator */}
                          {topCell && r.id === topCell.id && (
                            <Tooltip title="Top Cell (Highest Attendance)">
                              <span>
                                <EmojiEventsIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                              </span>
                            </Tooltip>
                          )}
                          {/* Lowest cell indicator */}
                          {lowCell && r.id === lowCell.id && lowCell !== topCell && (
                            <Tooltip title="Lowest Performing Cell">
                              <span>
                                <ArrowDownwardIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                              </span>
                            </Tooltip>
                          )}
                          {/* Performance arrow */}
                          {perf === "growing" && (
                            <Tooltip title="Growing Attendance">
                              <span>
                                <ArrowUpwardIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
                              </span>
                            </Tooltip>
                          )}
                          {perf === "declining" && (
                            <Tooltip title="Declining Attendance">
                              <span>
                                <ArrowDownwardIcon sx={{ color: theme.palette.error.main, fontSize: 20 }} />
                              </span>
                            </Tooltip>
                          )}
                          {perf === "stable" && (
                            <Tooltip title="Stable Attendance">
                              <span>
                                <TrendingFlatIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                              </span>
                            </Tooltip>
                          )}
                          {/* High absentees */}
                          {highAbsentees && (
                            <Tooltip title="High Absentees">
                              <span>
                                <WarningAmberIcon sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                              </span>
                            </Tooltip>
                          )}
                          {/* Visitors */}
                          {visitorsCount > 0 && (
                            <Tooltip title={`Visitors: ${visitorsCount}`}>
                              <span>
                                <PersonAddAltIcon sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                              </span>
                            </Tooltip>
                          )}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 400,
                                color: theme => theme.palette.text.primary
                              }}
                            >
                              {r.cell_group} — {r.leader}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 400,
                                color: theme => theme.palette.text.secondary
                              }}
                            >
                              Topic: <span style={{ fontWeight: 400 }}>{r.topic_taught || '-'}</span>
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1, fontSize: 15, color: theme => theme.palette.text.secondary, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
                            Attendance: <b>{Array.isArray(r.attendee_names) ? r.attendee_names.length : (r.attendance || 0)}</b>
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
                            Visitors: <b>{Array.isArray(r.visitors) ? r.visitors.length : (r.visitors_count || 0)}</b>
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme => theme.palette.text.secondary }}>
                            Absentees: <b>{Array.isArray(r.absentees) ? r.absentees.length : 0}</b>
                          </Typography>
                          {/* High Absentees pill if you want to keep it */}
                          {highAbsentees && (
                            <Chip
                              label="High Absentees"
                              variant="outlined"
                              color="error"
                              size="small"
                              sx={{
                                mt: 0,
                                fontWeight: 600,
                                fontSize: 13,
                                borderRadius: '4px',
                                height: 24,
                                alignSelf: 'flex-start',
                                letterSpacing: 0.5,
                                borderColor: theme => theme.palette.error.main,
                                color: theme => theme.palette.error.main,
                                backgroundColor: 'transparent',
                              }}
                            />
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
              {(reportsForWeek.length === 0 && !loading) && (
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography color="text.secondary" sx={{ textAlign: "center", width: '100%', fontFamily: theme => theme.typography.fontFamily, fontWeight: 400 }}>
                        No reports for this week.
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Panel 3: Preview */}
        <Grid item xs={12} md={6}>
          {selectedReport ? (
            <Box sx={{
              p: 4,
              minHeight: '70vh',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper, // theme aware
              boxShadow: "none",
            }}>
              <Typography variant="h5" sx={{ fontWeight: 400, mb: 2, color: 'primary.main' }}>
                {selectedReport.cell_group} — {selectedReport.leader}
              </Typography>
              {/* Inline date and topic, formatted date */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
                  Date:{" "}
                  {selectedReport.date_of_meeting
                    ? new Date(selectedReport.date_of_meeting).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : '-'}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 400 }}>
                  Topic: {selectedReport.topic_taught || '-'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              {/* Removed totals (Attendance, Visitors, Absentees) */}
              {Array.isArray(selectedReport.attendee_names) && selectedReport.attendee_names.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 400, mb: 1 }}>
                    Attendees
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, borderRadius: 1 }}>
                    {selectedReport.attendee_names.map((name, idx) => (
                      <Chip key={idx} label={name} size="small" variant="outlined" sx={{ backgroundColor: 'transparent' }} />
                    ))}
                  </Box>
                </Box>
              )}
              {Array.isArray(selectedReport.absentees) && selectedReport.absentees.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 400, mb: 1 }}>
                    Absentees
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, borderRadius: 1 }}>
                    {selectedReport.absentees.map((id, idx) => {
                      const m = allMembers.find(mem => mem.id === id);
                      const absCount = getConsecutiveAbsences(id, reports, selectedReport.cell_group_id);
                      return (
                        <Chip
                          key={id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {m ? `${m.first_name} ${m.surname}` : id}
                              {absCount >= 3 && (
                                <WarningAmberIcon sx={{ color: theme.palette.warning.main, fontSize: 18 }} />
                              )}
                            </Box>
                          }
                          size="small"
                          color={absCount >= 3 ? "error" : "warning"}
                          variant="outlined"
                          sx={{
                            backgroundColor: 'transparent',
                            borderColor: absCount >= 3 ? theme.palette.error.main : undefined,
                            color: absCount >= 3 ? theme.palette.error.main : undefined,
                            fontWeight: absCount >= 3 ? 700 : 400,
                            cursor: absCount >= 3 ? 'pointer' : 'default'
                          }}
                          onClick={absCount >= 3 ? () => handleFollowUpClick(m) : undefined}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
              {Array.isArray(selectedReport.visitors) && selectedReport.visitors.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                    Visitors
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, borderRadius: 1 }}>
                    {selectedReport.visitors.map((id, idx) => {
                      const v = visitors.find(vis => vis.id === id);
                      // Use the new getVisitCount
                      const repeatCount = getVisitCount(id, selectedReport.cell_group_id);
                      const isRepeat = repeatCount > 1;
                      return (
                        <Chip
                          key={id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {v ? `${v.first_name} ${v.surname}` : id}
                              {isRepeat && (
                                <WarningAmberIcon sx={{ color: theme.palette.warning.main, fontSize: 18 }} />
                              )}
                            </Box>
                          }
                          size="small"
                          color={isRepeat ? "warning" : "info"}
                          variant="outlined"
                          sx={{
                            backgroundColor: 'transparent',
                            borderColor: isRepeat ? theme.palette.warning.main : undefined,
                            color: isRepeat ? theme.palette.warning.main : undefined,
                            fontWeight: isRepeat ? 700 : 400,
                            cursor: isRepeat ? 'pointer' : 'default'
                          }}
                          onClick={isRepeat ? () => setFlaggedVisitor(v) : undefined}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                {selectedReport.prayer_requests && (
                  <Box sx={{ flex: 1, minWidth: 220, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>Prayer Requests: </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>{selectedReport.prayer_requests}</Typography>
                  </Box>
                )}
                {selectedReport.follow_ups && (
                  <Box sx={{ flex: 1, minWidth: 220, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>Follow Ups: </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>{selectedReport.follow_ups}</Typography>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                {selectedReport.testimonies && (
                  <Box sx={{ flex: 1, minWidth: 220, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>Testimonies: </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>{selectedReport.testimonies}</Typography>
                  </Box>
                )}
                {selectedReport.challenges && (
                  <Box sx={{ flex: 1, minWidth: 220, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>Challenges: </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>{selectedReport.challenges}</Typography>
                  </Box>
                )}
              </Box>
              {selectedReport.support_needed && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>Support Needed: </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 400, display: 'inline' }}>{selectedReport.support_needed}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 2 }}>
                <Tooltip title="Edit">
                  <IconButton size="large" onClick={() => handleEdit(selectedReport)}><Pencil size={22} /></IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="large" color="error" onClick={() => handleDelete(selectedReport)}><Trash2 size={22} /></IconButton>
                </Tooltip>
                <Tooltip title="Export CSV">
                  <IconButton size="large" onClick={() => handleExportCSV(selectedReport)}><FileDown size={22} /></IconButton>
                </Tooltip>
                <Tooltip title="Export Excel">
                  <IconButton size="large" onClick={() => handleExportExcel(selectedReport)}><FileSpreadsheet size={22} /></IconButton>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary" sx={{ fontSize: 20 }}>
                Select a report from the list to preview details.
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Modal for Add / Edit */}
      <Modal open={open || editOpen} onClose={handleClose}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95%',
          maxWidth: 900,
          bgcolor: 'background.paper',
          p: 4,
          borderRadius: 1,
          boxShadow: 24
        }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">{editOpen ? 'Edit Weekly Report' : 'Submit Weekly Report'}</Typography>
            <IconButton aria-label="Close" onClick={handleClose}><Trash2 /></IconButton>
          </Box>
          <Stepper activeStep={activeStep} sx={{ mb: 2 }}>{steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}</Stepper>

          <form onSubmit={handleSubmit}>
            {activeStep === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Autocomplete
                  options={groups.map(g => ({ label: g.name, id: g.id }))}
                  getOptionLabel={o => o.label || ''}
                  value={groups.map(g => ({ label: g.name, id: g.id })).find(g => g.id === fields.cell_group_id) || null}
                  onChange={(_, v) => setFields(prev => ({ ...prev, cell_group_id: v ? v.id : '' }))}
                  renderInput={(p) => <TextField {...p} label="Cell Group" required />}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Date"
                    type="date"
                    value={fields.date_of_meeting}
                    onChange={e => setFields(prev => ({ ...prev, date_of_meeting: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    required
                    sx={{ flex: 1 }}
                  />

                  <TextField
                    label="Topic Taught"
                    value={fields.topic_taught}
                    onChange={e => setFields(prev => ({ ...prev, topic_taught: e.target.value }))}
                    sx={{ flex: 1 }}
                  />
                </Box>

                {/* Leader info - always show autoloaded leader */}
                {(() => {
                  const selectedGroup = groups.find(g => g.id === fields.cell_group_id);
                  return (
                    <TextField
                      label="Leader"
                      value={selectedGroup?.leader || ""}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      margin="normal"
                    />
                  );
                })()}

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                  <Button variant="contained" onClick={handleNext}>Next</Button>
                </Box>
              </Box>
            )}

            {activeStep === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'nowrap', overflowX: 'auto' }}>
                  {/* Attendees */}
                  <Box sx={{ flex: 1, minWidth: 220 }}>
                    <Typography variant="body2" sx={{ fontWeight: 400, mb: .5 }}>Attendees</Typography>
                    <Autocomplete
                      multiple
                      options={members}
                      getOptionLabel={m => `${m.first_name} ${m.surname}`.trim()}
                      value={fields.attendees}
                      onChange={(_, v) => setFields(prev => ({ ...prev, attendees: v }))}
                      renderInput={(p) => <TextField {...p} label={`Attendees (${fields.attendees.length})`} placeholder="Select attendees" />}
                    />
                  </Box>

                  {/* Absentees */}
                  <Box sx={{ flex: 1, minWidth: 220 }}>
                    <Typography variant="body2" sx={{ fontWeight: 400, mb: .5 }}>Absentees</Typography>
                    {fields.absentees.map((id, idx) => {
                      const m = members.find(mem => mem.id === id);
                      return (
                        <Box key={id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Chip label={m ? `${m.first_name} ${m.surname}` : id} sx={{ mr: 1 }} variant="outlined" />
                          <TextField
                            size="small"
                            label="Reason"
                            value={fields.absenteeReasons?.[id] || ''}
                            onChange={e => setFields(prev => ({
                              ...prev,
                              absenteeReasons: { ...prev.absenteeReasons, [id]: e.target.value }
                            }))}
                            sx={{ minWidth: 120 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Visitors */}
                  <Box sx={{ flex: 1, minWidth: 220 }}>
                    <Typography variant="body2" sx={{ fontWeight: 400, mb: .5 }}>Visitors</Typography>
                    <Autocomplete
                      multiple
                      disableCloseOnSelect
                      options={visitors.filter(v => v.status !== 'converted')}
                      getOptionLabel={v => `${v.first_name} ${v.surname}`.trim()}
                      value={visitors.filter(v => fields.visitor_ids.includes(v.id))}
                      onChange={(_, selected) => setFields(prev => ({ ...prev, visitor_ids: selected.map(v => v.id) }))}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={params => <TextField {...params} label="Visitors" placeholder="Select visitors" />}
                      filterSelectedOptions
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                  <Button variant="outlined" onClick={handleBack}>Back</Button>
                  <Button variant="contained" onClick={handleNext}>Next</Button>
                </Box>
              </Box>
            )}

            {activeStep === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField label="Testimonies" value={fields.testimonies} onChange={e => setFields(p => ({ ...p, testimonies: e.target.value }))} />
                <TextField label="Prayer Requests" value={fields.prayer_requests} onChange={e => setFields(p => ({ ...p, prayer_requests: e.target.value }))} />
                <TextField label="Follow Ups" value={fields.follow_ups} onChange={e => setFields(p => ({ ...p, follow_ups: e.target.value }))} />
                <TextField label="Challenges" value={fields.challenges} onChange={e => setFields(p => ({ ...p, challenges: e.target.value }))} />
                <TextField label="Support Needed" value={fields.support_needed} onChange={e => setFields(p => ({ ...p, support_needed: e.target.value }))} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                  <Button variant="outlined" onClick={handleBack}>Back</Button>
                  <Button type="submit" variant="contained" disabled={loading}>
                    {editOpen ? 'Update Report' : 'Save Report'}
                  </Button>
                </Box>
              </Box>
            )}
          </form>
        </Box>
      </Modal>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Weekly Report?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this report? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirmed}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Alert */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Follow Up Dialog */}
      <Dialog open={followUpModal.open} onClose={handleCloseFollowUp}>
        <DialogTitle sx={{ color: theme.palette.text.primary, background: theme.palette.background.paper }}>
          Follow Up
        </DialogTitle>
        <DialogContent sx={{ background: theme.palette.background.paper }}>
          {followUpModal.member && (
            <Typography sx={{ color: theme.palette.text.primary }}>
              Follow up with {followUpModal.member.first_name} {followUpModal.member.surname} for 3+ consecutive absences.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ background: theme.palette.background.paper }}>
          <Tooltip title="Close">
            <IconButton
              onClick={handleCloseFollowUp}
              sx={{ background: "transparent", color: theme.palette.text.secondary, p: 0.5 }}
              size="small"
            >
              <X size={20} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Mark Followup Done">
            <IconButton
              onClick={handleFollowUpDone}
              sx={{ background: "transparent", color: theme.palette.success.main, p: 0.5 }}
              size="small"
            >
              <Check size={20} />
            </IconButton>
          </Tooltip>
        </DialogActions>
      </Dialog>

      {/* Repeat Visitor Dialog */}
      <Dialog open={!!flaggedVisitor} onClose={() => setFlaggedVisitor(null)}>
        <DialogTitle>Repeat Visitor</DialogTitle>
        <DialogContent>
          <Typography>
            {flaggedVisitor && `${flaggedVisitor.first_name} ${flaggedVisitor.surname} has visited more than once.`}
          </Typography>
          {flaggedVisitor && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`Status: ${flaggedVisitor.status}`}
                color={
                  flaggedVisitor.status === 'converted'
                    ? 'success'
                    : flaggedVisitor.status === 'followed_up'
                    ? 'info'
                    : 'default'
                }
                size="small"
              />
              <Chip
                label={`Follow-up: ${flaggedVisitor.follow_up_status}`}
                color={
                  flaggedVisitor.follow_up_status === 'done'
                    ? 'success'
                    : flaggedVisitor.follow_up_status === 'in_progress'
                    ? 'warning'
                    : 'default'
                }
                size="small"
              />
            </Box>
          )}
          <Typography sx={{ mt: 2 }}>
            Would you like to follow up or convert to member?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={async () => {
              if (flaggedVisitor) {
                const next =
                  flaggedVisitor.follow_up_status === 'pending'
                    ? 'in_progress'
                    : flaggedVisitor.follow_up_status === 'in_progress'
                    ? 'done'
                    : 'pending';
                await setFollowUpStatus(flaggedVisitor.id, next);
                // Refresh visitor status in modal
                const updated = visitors.find(v => v.id === flaggedVisitor.id);
                if (updated) {
                  setFlaggedVisitor({ ...updated, follow_up_status: next });
                }
              }
            }}
            color="primary"
          >
            Toggle Follow Up
          </Button>
          <Button
            onClick={async () => {
              try {
                await convertVisitorToMember({ id: flaggedVisitor.id });
                const updatedVisitors = await getVisitors();
                setVisitors(updatedVisitors || []);
                const updated = updatedVisitors.find(v => v.id === flaggedVisitor.id);
                if (updated) setFlaggedVisitor(updated);
              } catch (err) {
                // handle error
              }
            }}
            color="secondary"
          >
            Convert to Member
          </Button>
          <Button onClick={() => setFlaggedVisitor(null)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// Helper to get consecutive absences for a member in a cell group
function getConsecutiveAbsences(memberId, reports, cellGroupId) {
  const sorted = (reports || [])
    .filter(r => r.cell_group_id === cellGroupId)
    .sort((a, b) => new Date(b.date_of_meeting) - new Date(a.date_of_meeting));
  let count = 0;
  for (const r of sorted) {
    if (Array.isArray(r.absentees) && r.absentees.includes(memberId)) {
      count++;
    } else {
      break;
    }
  }
  return count;
}
