import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  Modal, Box, Typography, Stepper, Step, StepLabel, TextField, Button,
  Autocomplete, Chip, Grid, Divider, IconButton, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { X } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { getCellMembers } from '../services/cellGroupService';
import {
  createWeeklyReport,
  updateWeeklyReport,
  previewAbsentees as previewAbsenteesService
} from '../services/weeklyReportService';
import { listVisitors as listVisitorsService } from '../services/visitorService';
import { DateTime } from 'luxon';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

// helper: normalize fetchWithAuth
function makeFetcher(fetchWithAuth) {
  if (typeof fetchWithAuth === 'function') return fetchWithAuth;
  if (fetchWithAuth && typeof fetchWithAuth.fetchWithAuth === 'function') return fetchWithAuth.fetchWithAuth;
  if (fetchWithAuth?.value?.fetchWithAuth) return fetchWithAuth.value.fetchWithAuth;
  // fallback
  return async (input, init = {}) => {
    const base = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE || '';
    const url = String(input).startsWith('http') ? input : `${base}${input}`;
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...init, headers });
  };
}

// debounce utility
const debounce = (fn, delay = 350) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

export default function AddEditReportModal({
  open = false,
  onClose = () => {},
  mode = 'create',
  initial = null,
  defaultGroups = []
}) {
  const auth = useContext(AuthContext);
  const fetchWithAuth = auth?.fetchWithAuth;
  const user = auth?.user;
  const fetcher = makeFetcher(fetchWithAuth);
  const steps = [
    'Meeting Info',
    'Attendance & Visitors',
    'Narratives',
    'Metrics'
  ];

  const defaultForm = {
    cell_group_id: '',
    meeting_date: '',
    next_meeting_date: '',
    topic: '',
    attendees: [],
    visitors: [],
    absentees: [],
    absentee_reasons: {},
    testimonies: '',
    prayer_requests: '',
    follow_ups: '',
    challenges: '',
    support_needed: '',
    outreaches_done: 0,
    people_reached: 0,
    souls_saved_outreach: 0,
    souls_saved_meeting: 0,
    first_timers: 0,
    converts_church_attendance: 0,
    converts_baptised: 0,
    converts_started_foundation: 0,
    new_bible_classes_started: 0,
    bible_study_teachers: 0,
    visits_done: 0,
    souls_uploaded_tracker: 0,
    total_church_attendance: 0
  };

  const [form, setForm] = useState({ ...defaultForm });
  const [activeStep, setActiveStep] = useState(0);
  const [members, setMembers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const loadMembersRef = useRef(null);

  // Initialize modal and visitors
  useEffect(() => {
    if (!open) return;

    if (mode === 'edit' && initial) {
      const dateStr = initial.meeting_date ? new Date(initial.meeting_date).toISOString().slice(0, 10) : '';
      setForm({
        ...defaultForm,
        ...initial,
        cell_group_id: initial.cell_group_id || '',
        meeting_date: dateStr,
        next_meeting_date: initial.next_meeting_date
          ? new Date(initial.next_meeting_date).toISOString().slice(0, 10)
          : '',
        topic: initial.topic || initial.topic_taught || '',
        attendees: Array.isArray(initial.attendees)
          ? (initial.attendees.map(a => (a.member_id ? { ...a, id: a.member_id } : a)))
          : [],
        visitors: Array.isArray(initial.visitors)
          ? initial.visitors.map(v => (v.visitor_id ? v.visitor_id : v.id ? v.id : v))
          : [],
        absentees: Array.isArray(initial.absentees) ? initial.absentees : [],
        absentee_reasons: initial.absentee_reasons || {}
      });
    } else {
      setForm({ ...defaultForm });
      setPreviewRows([]);
    }

    (async () => {
      try {
        const v = await listVisitorsService(fetcher);
        setVisitors(Array.isArray(v) ? v : []);
      } catch (err) {
        console.error('Failed to load visitors', err);
      }
    })();
  }, [open, initial, mode]);

  // Debounced member loader
  useEffect(() => {
    if (!loadMembersRef.current) {
      loadMembersRef.current = debounce(async (cellGroupId, attendeeObjs) => {
        if (!cellGroupId) {
          setMembers([]);
          return;
        }
        setLoadingMembers(true);
        try {
          const ms = await getCellMembers(fetcher, cellGroupId);
          setMembers(ms || []);
          if (Array.isArray(attendeeObjs) && attendeeObjs.length) {
            const selected = (ms || []).filter(m => attendeeObjs.some(a => a.id === m.id || a.member_id === m.id));
            setForm(prev => ({ ...prev, attendees: selected }));
          }
        } catch (err) {
          console.error('Failed to load members', err);
        } finally {
          setLoadingMembers(false);
        }
      }, 300);
    }
    loadMembersRef.current(form.cell_group_id, form.attendees);
  }, [form.cell_group_id]);

  function visitorObjectsFromIds() {
    return (form.visitors || []).map(id => visitors.find(v => v.id === id)).filter(Boolean);
  }

  async function handlePreviewAbsentees() {
    if (!form.cell_group_id || !form.meeting_date) return alert('Select cell group and date first');
    setPreviewLoading(true);
    try {
      const attendeeIds = (form.attendees || []).map(a => a.id);
      const rows = await previewAbsenteesService(
        fetcher,
        form.cell_group_id,
        form.meeting_date,
        attendeeIds
      );
      setPreviewRows(rows || []);
    } catch (err) {
      console.error('Preview absentees failed', err);
      alert(err?.message || 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  }

  function acceptPreviewAsAbsentees() {
    const attendeeIds = new Set((form.attendees || []).map(a => a.id));
    const absenteeObjs = (members || [])
      .filter(m => !attendeeIds.has(m.id))
      .map(m => ({
        member_id: m.member_id,  // ✅ CORRECT: use member_id, not id
        reason: form.absentee_reasons[m.member_id] || 'expected',
        followup_action: null,
        created_at: new Date().toISOString()
      }));

    setForm(prev => ({
      ...prev,
      absentees: absenteeObjs,
      absentee_reasons: Object.fromEntries(absenteeObjs.map(a => [a.member_id, a.reason]))
    }));
  }

  function removeAbsentee(memberId) {
    setForm(prev => ({
      ...prev,
      absentees: (prev.absentees || []).filter(a => a.member_id !== memberId),
      absentee_reasons: Object.fromEntries(Object.entries(prev.absentee_reasons || {}).filter(([k]) => Number(k) !== Number(memberId)))
    }));
  }

  async function handleSave(e) {
    e?.preventDefault?.();
    
    if (saving) return;

    try {
      setSaving(true);
      if (!form.cell_group_id) throw new Error('Cell group required');
      if (!form.meeting_date) throw new Error('Meeting date required');

      const validMemberIds = new Set((members || []).map(m => m.id));
      const attendeeIds = (form.attendees || []).map(a => a.id).filter(Boolean);
      const invalid = attendeeIds.some(id => !validMemberIds.has(id));
      if (invalid) throw new Error('One or more selected attendees are invalid for this cell group.');

      const absPayload = (form.absentees || []).map(a => ({
        member_id: a.member_id || null,
        visitor_id: a.visitor_id || null,
        reason: form.absentee_reasons?.[a.member_id] || a.reason || 'unknown',
        followup_action: a.followup_action || null,
        created_at: a.created_at || new Date().toISOString()
      }));

      const totalAttendance = attendeeIds.length + (form.visitors || []).length;
      if (form.first_timers > totalAttendance) {
        throw new Error('First timers cannot exceed total attendance.');
      }

      const payload = {
        church_id: user?.church_id || form.church_id || 1,
        cell_group_id: form.cell_group_id,
        meeting_date: form.meeting_date,
        next_meeting_date: form.next_meeting_date || null,
        topic: form.topic || '',
        attendees: attendeeIds,
        visitors: form.visitors || [],
        absentees: absPayload,
        outreaches_done: Number(form.outreaches_done || 0),
        people_reached: Number(form.people_reached || 0),
        souls_saved_outreach: Number(form.souls_saved_outreach || 0),
        souls_saved_meeting: Number(form.souls_saved_meeting || 0),
        first_timers: Number(form.first_timers || 0),
        converts_church_attendance: Number(form.converts_church_attendance || 0),
        converts_baptised: Number(form.converts_baptised || 0),
        converts_started_foundation: Number(form.converts_started_foundation || 0),
        new_bible_classes_started: Number(form.new_bible_classes_started || 0),
        bible_study_teachers: Number(form.bible_study_teachers || 0),
        visits_done: Number(form.visits_done || 0),
        souls_uploaded_tracker: Number(form.souls_uploaded_tracker || 0),
        total_church_attendance: Number(form.total_church_attendance || 0),
        testimonies: form.testimonies || null,
        prayer_requests: form.prayer_requests || null,
        follow_ups: form.follow_ups || null,
        challenges: form.challenges || null,
        support_needed: form.support_needed || null,
        total_cell_attendance: totalAttendance,
        visitors_count: (form.visitors || []).length,
        absentees_count: absPayload.length
      };

      if (mode === 'edit' && initial?.id) {
        await updateWeeklyReport(fetcher, initial.id, payload);
      } else {
        await createWeeklyReport(fetcher, payload);
      }

      setForm({ ...defaultForm });
      setActiveStep(0);
      setPreviewRows([]);
      setSnackbarMessage('Report saved successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      console.error('Save report failed', err);
      setSnackbarMessage(err?.message || 'Save failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  }

  // Update absentees when attendees change
  useEffect(() => {
    if (activeStep !== 1) return;
    const attendeeIds = new Set((form.attendees || []).map(a => a.id));
    const absenteeObjs = (members || [])
      .filter(m => !attendeeIds.has(m.id))
      .map(m => ({
        member_id: m.member_id,  // ✅ CORRECT: use member_id, not id
        reason: form.absentee_reasons[m.member_id] || '',
        followup_action: null,
        created_at: new Date().toISOString()
      }));
    setForm(prev => ({
      ...prev,
      absentees: absenteeObjs
    }));
  }, [form.attendees, members, activeStep]);

  // Example: format meeting_date for display or conversion
  const formattedDate = form.meeting_date
    ? DateTime.fromISO(form.meeting_date).toLocaleString(DateTime.DATE_MED)
    : '';

  return (
    <Modal open={open} onClose={() => onClose(false)} disableEscapeKeyDown>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '95%',
          maxWidth: 1000,
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 3,
          boxShadow: 24,
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            {mode === 'edit' ? 'Edit Weekly Report' : 'Submit Weekly Report'}
          </Typography>
          <IconButton onClick={() => onClose(false)} size="small">
            <X />
          </IconButton>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ overflowY: 'auto', pr: 1, flexGrow: 1 }}>
          <Stepper
            activeStep={activeStep}
            orientation="horizontal"
            alternativeLabel={false}
            sx={{
              mb: 1,
              px: 0,
              '& .MuiStep-root': { minWidth: 0, px: 0 },
              '& .MuiStepLabel-label': { fontSize: '0.95rem', px: 1 },
              '& .MuiStepConnector-root': { mx: 0.5 },
            }}
          >
            {steps.map((s) => (
              <Step key={s}>
                <StepLabel
                  sx={{
                    minWidth: 0,
                    px: 1,
                    fontSize: '0.95rem',
                    '.MuiStepLabel-label': { fontSize: '0.95rem', px: 1 },
                  }}
                >
                  {s}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          <form onSubmit={handleSave}>
            {/* Step 0: Meeting Info */}
            {activeStep === 0 && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Autocomplete
                      options={defaultGroups}
                      getOptionLabel={o => o.name || ''}
                      value={defaultGroups.find(g => g.id === form.cell_group_id) || null}
                      onChange={(_, v) => setForm(prev => ({ ...prev, cell_group_id: v ? v.id : '' }))}
                      renderInput={(params) => <TextField {...params} label="Cell Group" required />}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterLuxon}>
                      <DatePicker
                        label="Meeting Date"
                        value={form.meeting_date ? DateTime.fromISO(form.meeting_date) : null}
                        onChange={value => setForm(prev => ({
                          ...prev,
                          meeting_date: value ? value.toISODate() : ''
                        }))}
                        renderInput={(params) => <TextField {...params} fullWidth required />}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <LocalizationProvider dateAdapter={AdapterLuxon}>
                      <DatePicker
                        label="Next Meeting Date"
                        value={form.next_meeting_date ? DateTime.fromISO(form.next_meeting_date) : null}
                        onChange={value =>
                          setForm(prev => ({
                            ...prev,
                            next_meeting_date: value ? value.toISODate() : ''
                          }))
                        }
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            InputLabelProps: { shrink: true },
                          }
                        }}
                        disablePast={false}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Topic"
                      value={form.topic}
                      onChange={e => setForm(prev => ({ ...prev, topic: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={() => setActiveStep(1)} variant="contained">
                      Next
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
            {/* Step 1: Attendance & Visitors */}
            {activeStep === 1 && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Attendees</Typography>
                    <Autocomplete
                      multiple
                      options={members}
                      getOptionLabel={m => `${m.first_name || ''} ${m.surname || ''}`.trim()}
                      value={form.attendees}
                      onChange={(_, v) => setForm(prev => ({ ...prev, attendees: v }))}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => (
                        <TextField {...params} label={`Attendees (${form.attendees.length})`} />
                      )}
                    />
                    {loadingMembers && <CircularProgress size={20} />}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Visitors</Typography>
                    <Autocomplete
                      multiple
                      options={visitors}
                      getOptionLabel={v => `${v.first_name || ''} ${v.surname || ''}`.trim()}
                      value={visitorObjectsFromIds()}
                      onChange={(_, selected) =>
                        setForm(prev => ({ ...prev, visitors: selected.map(s => s.id) }))
                      }
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderInput={(params) => <TextField {...params} label="Visitors" />}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Absentee Preview</Typography>
                      <Box>
                        <Button size="small" onClick={handlePreviewAbsentees} disabled={previewLoading}>
                          {previewLoading ? 'Previewing...' : 'Preview Absentees'}
                        </Button>
                        <Button
                          size="small"
                          onClick={acceptPreviewAsAbsentees}
                          disabled={!previewRows.length}
                        >
                          Accept Preview
                        </Button>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {previewRows.length === 0 && !previewLoading && (
                        <Typography variant="body2" color="text.secondary">
                          No absentees found for this selection.
                        </Typography>
                      )}
                      {previewRows.map((r, i) => (
                        <Chip
                          key={i}
                          label={`${r.first_name || ''} ${r.surname || ''} (${r.type || ''})`}
                          size="small"
                        />
                      ))}
                    </Box>
                    {form.absentees.length > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2">Absentees (accepted)</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                          {form.absentees.map((a, idx) => {
                            const name = members.find(m => m.id === a.member_id);
                            return (
                              <Box key={a.member_id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                  label={`${name ? `${name.first_name} ${name.surname}` : (`ID:${a.member_id}`)} — ${form.absentee_reasons[a.member_id] || a.reason || 'unknown'}`}
                                  onDelete={() => removeAbsentee(a.member_id)}
                                  size="small"
                                />
                                <TextField
                                  label="Reason"
                                  size="small"
                                  value={form.absentee_reasons[a.member_id] || ''}
                                  onChange={e => {
                                    const reason = e.target.value;
                                    setForm(prev => ({
                                      ...prev,
                                      absentee_reasons: { ...prev.absentee_reasons, [a.member_id]: reason }
                                    }));
                                  }}
                                  sx={{ minWidth: 200 }}
                                />
                              </Box>
                            );
                          })}
                          {form.absentees.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                              No absentees for this selection.
                            </Typography>
                          )}
                        </Box>
                      </>
                    )}
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button onClick={() => setActiveStep(0)}>Back</Button>
                    <Button onClick={() => setActiveStep(2)} variant="contained">
                      Next
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
            {/* Step 2: Narratives */}
            {activeStep === 2 && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Testimonies"
                      value={form.testimonies}
                      onChange={e => setForm(prev => ({ ...prev, testimonies: e.target.value }))}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Prayer Requests"
                      value={form.prayer_requests}
                      onChange={e => setForm(prev => ({ ...prev, prayer_requests: e.target.value }))}
                      multiline
                      rows={2}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Follow Ups"
                      value={form.follow_ups}
                      onChange={e => setForm(prev => ({ ...prev, follow_ups: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Challenges"
                      value={form.challenges}
                      onChange={e => setForm(prev => ({ ...prev, challenges: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Support Needed"
                      value={form.support_needed}
                      onChange={e => setForm(prev => ({ ...prev, support_needed: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button onClick={() => setActiveStep(1)}>Back</Button>
                    <Button onClick={() => setActiveStep(3)} variant="contained">
                      Next
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
            {/* Step 3: Metrics */}
            {activeStep === 3 && (
              <Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2">Metrics</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Outreaches Done"
                      type="number"
                      fullWidth
                      value={form.outreaches_done}
                      onChange={e =>
                        setForm(prev => ({ ...prev, outreaches_done: Number(e.target.value || 0) }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="People Reached"
                      type="number"
                      fullWidth
                      value={form.people_reached}
                      onChange={e =>
                        setForm(prev => ({ ...prev, people_reached: Number(e.target.value || 0) }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Souls (Outreach)"
                      type="number"
                      fullWidth
                      value={form.souls_saved_outreach}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          souls_saved_outreach: Number(e.target.value || 0)
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Souls (Meeting)"
                      type="number"
                      fullWidth
                      value={form.souls_saved_meeting}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          souls_saved_meeting: Number(e.target.value || 0)
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="First Timers"
                      type="number"
                      fullWidth
                      value={form.first_timers}
                      onChange={e =>
                        setForm(prev => ({ ...prev, first_timers: Number(e.target.value || 0) }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Total Church Attendance"
                      type="number"
                      fullWidth
                      value={form.total_church_attendance}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          total_church_attendance: Number(e.target.value || 0)
                        }))
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Button onClick={() => setActiveStep(2)}>Back</Button>
                    <Button type="submit" variant="contained" disabled={saving}>
                      {saving ? 'Saving...' : 'Save Report'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </form>
        </Box>

        {/* Snackbar */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={4000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={snackbarSeverity}
            sx={{ width: '100%' }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Modal>
  );
}

export async function previewAbsentees(fetcher, cell_group_id, meeting_date, attendeeIds = []) {
  const res = await fetcher('/api/weekly-reports/preview', {
    method: 'POST',
    body: JSON.stringify({
      cell_group_id,
      meeting_date,
      attendee_ids: attendeeIds
    }),
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}