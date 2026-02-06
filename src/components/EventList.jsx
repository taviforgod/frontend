// frontend/src/components/EventList.jsx
import React, { useEffect, useMemo, useState, useCallback, useContext } from "react";
import {
  Box, Grid, Card, CardContent, CardActions, Typography, Stack, Chip, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, Checkbox, CircularProgress, Snackbar, Alert, Menu, MenuItem, Divider,
  Pagination, InputAdornment, Tooltip, Select, FormControl, InputLabel, MenuList, FormControlLabel,
  Switch
} from "@mui/material";
import {
  PlusCircle, Users, Mail, Calendar as CalIcon, Edit3, Trash2, Search, MoreHorizontal, DownloadCloud,
  Clock, CheckCircle, XCircle, Calendar
} from "lucide-react";
import {
  listEvents,
  createEvent,
  inviteContactsToEvent,
  updateEvent,
  deleteEvent,
  listContacts,
  // Optional server helpers — these may or may not exist on your backend.
  // If your backend uses different names, replace them accordingly.
  // getEventAttendees,
  // rsvpToEvent,
  // exportAttendeesCSV,
  // scheduleInvites
} from "../services/evangelismService";
import { AuthContext } from "../contexts/AuthContext"; // <-- Add this import
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';

/**
 * Helper: create an .ics file and download it
 * Accepts an event object with title, description, event_date (ISO), location, durationMinutes (optional)
 */
function downloadICS(event) {
  if (!event || !event.event_date) {
    alert("Event date is required to create calendar file.");
    return;
  }
  const uid = `${event.id || Math.random().toString(36).slice(2)}@app`;
  const dtStart = new Date(event.event_date);
  const dtEnd = new Date(dtStart.getTime() + ((event.durationMinutes || 60) * 60000));
  function toICSDate(d) {
    // UTC format: YYYYMMDDTHHMMSSZ
    const z = (n) => String(n).padStart(2, "0");
    return `${d.getUTCFullYear()}${z(d.getUTCMonth()+1)}${z(d.getUTCDate())}T${z(d.getUTCHours())}${z(d.getUTCMinutes())}${z(d.getUTCSeconds())}Z`;
  }
  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//YourApp//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(dtStart)}`,
    `DTEND:${toICSDate(dtEnd)}`,
    `SUMMARY:${(event.title || "").replace(/\n/g, " ")}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, " ")}`,
    `LOCATION:${(event.location || "").replace(/\n/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];
  const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(event.title || "event").replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Helper: convert attendees array to CSV and download client-side (fallback)
 */
function downloadCSV(filename, rows = []) {
  if (!rows || !rows.length) {
    alert("No data to export.");
    return;
  }
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(","),
    ...rows.map(r => keys.map(k => {
      const v = r[k] === null || r[k] === undefined ? "" : String(r[k]);
      // escape quotes
      return `"${v.replace(/"/g, '""')}"`;
    }).join(","))
  ].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatDateTime(dt) {
  if (!dt) return "TBA";
  try {
    const d = new Date(dt);
    return d.toLocaleString();
  } catch {
    return dt;
  }
}

// Helper to combine date and time into ISO string
function combineDateTime(date, time) {
  if (!date || !time) return '';
  return date.set({
    hour: time.hour,
    minute: time.minute,
    second: 0,
    millisecond: 0,
  }).toISO();
}

export default function EventList() {
  // Events
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");

  // Contacts (for invites)
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", description: "", event_date: "", location: "", durationMinutes: 60 });
  const [createDate, setCreateDate] = useState(null);
  const [createTime, setCreateTime] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editDate, setEditDate] = useState(null);
  const [editTime, setEditTime] = useState(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEvent, setInviteEvent] = useState(null);
  const [inviteSelected, setInviteSelected] = useState(new Set());
  const [inviteLoading, setInviteLoading] = useState(false);
  const [contactQuery, setContactQuery] = useState("");
  const [inviteSchedule, setInviteSchedule] = useState({ sendNow: true, scheduledAt: "" });

  // Attendees & RSVP tracking
  const [attendees, setAttendees] = useState([]); // for currently-open event (attendee objects include contact + rsvp_status)
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // UI helpers
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null, title: "" });

  // Filtering + pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  // menu anchor for per-card options
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuEventId, setMenuEventId] = useState(null);

  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  // load events
  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setEventsError("");
    try {
      const data = fetchWithAuth ? await listEvents(fetchWithAuth) : await listEvents();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setEventsError("Failed to load events");
    } finally {
      setLoadingEvents(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // load contacts (for invite dialog)
  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const data = fetchWithAuth ? await listContacts(fetchWithAuth) : await listContacts();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to load contacts", severity: "error" });
    } finally {
      setLoadingContacts(false);
    }
  }, [fetchWithAuth]);

  // filter events
  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = events.filter((e) => {
      if (!q) return true;
      const hay = `${e.title || ""} ${e.description || ""} ${e.location || ""}`.toLowerCase();
      return hay.includes(q);
    });
    items.sort((a, b) => {
      const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
      const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
      return da - db;
    });
    return items;
  }, [events, search]);

  const pageCount = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pagedEvents = filteredEvents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Create event
  const handleCreate = async () => {
    if (!createForm.title || !createForm.event_date) {
      setSnack({ open: true, message: "Title and date are required", severity: "warning" });
      return;
    }
    setCreateLoading(true);
    try {
      await createEvent(createForm);
      setSnack({ open: true, message: "Event created", severity: "success" });
      setCreateOpen(false);
      setCreateForm({ title: "", description: "", event_date: "", location: "", durationMinutes: 60 });
      await loadEvents();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to create event", severity: "error" });
    } finally {
      setCreateLoading(false);
    }
  };

  // Edit event
  const openEdit = (ev) => {
    setEditForm(ev);
    setEditOpen(true);
  };
  const handleEditSave = async () => {
    if (!editForm?.id) return;
    setEditLoading(true);
    try {
      await updateEvent(editForm.id, editForm);
      setSnack({ open: true, message: "Event updated", severity: "success" });
      setEditOpen(false);
      await loadEvents();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to update event", severity: "error" });
    } finally {
      setEditLoading(false);
    }
  };

  // Delete event
  const confirmDeleteOpen = (id, title) => setConfirmDelete({ open: true, id, title });
  const handleDelete = async () => {
    const { id } = confirmDelete;
    if (!id) return;
    try {
      await deleteEvent(id);
      setSnack({ open: true, message: "Event deleted", severity: "success" });
      setConfirmDelete({ open: false, id: null, title: "" });
      await loadEvents();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to delete", severity: "error" });
    }
  };

  // Invite flow: open invite dialog + load contacts
  const openInvite = async (ev) => {
    setInviteEvent(ev);
    setInviteOpen(true);
    setInviteSelected(new Set());
    setContactQuery("");
    setInviteSchedule({ sendNow: true, scheduledAt: "" });
    await loadContacts();
    // also refresh attendees list for this event
    await loadAttendees(ev.id);
  };

  // load attendees for an event (RSVP tracking)
  const loadAttendees = async (eventId) => {
    setAttendeesLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/attendees`, { credentials: "include" });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        let data = [];
        if (contentType && contentType.includes("application/json")) {
          data = await res.json();
        } else {
          // fallback: try to parse as text or handle as empty
          data = [];
        }
        setAttendees(Array.isArray(data) ? data : []);
      } else {
        // fallback: attendees may be returned on the event object (attendee_ids)
        const ev = events.find((e) => e.id === eventId);
        setAttendees(ev?.attendees || []);
      }
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to load attendees", severity: "error" });
    } finally {
      setAttendeesLoading(false);
    }
  };

  // Toggle select contact in invite dialog
  const toggleInviteSelect = (id) => {
    setInviteSelected((prev) => {
      const s = new Set(prev);
      if (s.has(String(id))) s.delete(String(id)); else s.add(String(id));
      return s;
    });
  };

  // Toggle select all visible
  const toggleSelectAllVisible = (visibleList) => {
    setInviteSelected((prev) => {
      const s = new Set(prev);
      const allVisibleIds = visibleList.map((c) => String(c.id));
      const allSelected = allVisibleIds.every((id) => s.has(id));
      if (allSelected) {
        allVisibleIds.forEach((id) => s.delete(id));
      } else {
        allVisibleIds.forEach((id) => s.add(id));
      }
      return s;
    });
  };

  // Send invites (immediate or scheduled)
  const handleSendInvites = async () => {
    if (!inviteEvent?.id) return;
    const ids = Array.from(inviteSelected).map((x) => (Number.isNaN(Number(x)) ? x : Number(x)));
    if (!ids.length) {
      setSnack({ open: true, message: "Select some contacts", severity: "warning" });
      return;
    }
    setInviteLoading(true);
    try {
      // Preferred: backend has scheduling support. We'll attempt to call inviteContactsToEvent with schedule options.
      // If your backend doesn't support scheduling, it should simply ignore unknown fields and send now.
      await inviteContactsToEvent(inviteEvent.id, ids, {
        via: { sms: true, email: false },
        schedule_at: inviteSchedule.sendNow ? null : inviteSchedule.scheduledAt
      });
      setSnack({ open: true, message: `Invites scheduled/sent to ${ids.length} contact(s)`, severity: "success" });
      setInviteOpen(false);
      setInviteEvent(null);
      setInviteSelected(new Set());
      // refresh attendees
      await loadEvents();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to send invites", severity: "error" });
    } finally {
      setInviteLoading(false);
    }
  };

  // visible contacts in invite dialog (search)
  const visibleContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const hay = `${c.first_name || ""} ${c.surname || ""} ${c.email || ""} ${c.phone || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [contacts, contactQuery]);

  // RSVP update for an attendee (admin action)
  const updateRsvp = async (eventId, attendeeId, status) => {
    try {
      // Attempt server endpoint:
      const res = await fetch(`/api/events/${eventId}/attendees/${attendeeId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        // update local attendees
        setAttendees((prev) => prev.map(a => String(a.id) === String(attendeeId) ? { ...a, rsvp_status: status } : a));
        setSnack({ open: true, message: "RSVP updated", severity: "success" });
      } else {
        throw new Error("Failed to update");
      }
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to update RSVP", severity: "error" });
    }
  };

  // Export attendees: try server export endpoint, otherwise download CSV client-side
  const handleExportAttendees = async (eventId) => {
    try {
      // First try server-side export endpoint if available
      const res = await fetch(`/api/events/${eventId}/export/attendees/csv`, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `event_${eventId}_attendees.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        setSnack({ open: true, message: "Export started", severity: "success" });
        return;
      }
    } catch (err) {
      // fall through to client-side export
      console.warn("Server export failed or not available, falling back to client CSV", err);
    }

    // Client-side fallback: build CSV from attendees
    try {
      // Ensure attendees loaded
      if (!attendees || attendees.length === 0) {
        await loadAttendees(eventId);
      }
      // map attendees to CSV-friendly rows
      const rows = (attendees || []).map(a => ({
        id: a.id,
        first_name: a.first_name || a.contact?.first_name || "",
        surname: a.surname || a.contact?.surname || "",
        phone: a.phone || a.contact?.phone || "",
        email: a.email || a.contact?.email || "",
        rsvp_status: a.rsvp_status || (a.status || "pending")
      }));
      if (!rows.length) {
        setSnack({ open: true, message: "No attendees to export", severity: "info" });
        return;
      }
      downloadCSV(`event_${eventId}_attendees.csv`, rows);
      setSnack({ open: true, message: "Export downloaded", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: "Failed to export attendees", severity: "error" });
    }
  };

  // Per-card menu
  const openMenu = (e, id) => { setMenuAnchor(e.currentTarget); setMenuEventId(id); };
  const closeMenu = () => { setMenuAnchor(null); setMenuEventId(null); };

  // Add-to-calendar action
  const handleAddToCalendar = (ev) => {
    downloadICS(ev);
  };

  // Open attendees drawer/modal for an event
  const openAttendees = async (ev) => {
    await loadAttendees(ev.id);
    setInviteEvent(ev);
    setInviteOpen(true);
  };

  // --- When opening dialogs, sync state ---
  useEffect(() => {
    if (createOpen) {
      setCreateDate(createForm.event_date ? DateTime.fromISO(createForm.event_date) : null);
      setCreateTime(createForm.event_date ? DateTime.fromISO(createForm.event_date) : null);
    }
  }, [createOpen, createForm.event_date]);

  useEffect(() => {
    if (editOpen) {
      setEditDate(editForm.event_date ? DateTime.fromISO(editForm.event_date) : null);
      setEditTime(editForm.event_date ? DateTime.fromISO(editForm.event_date) : null);
    }
  }, [editOpen, editForm.event_date]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5">Events</Typography>
          <TextField
            size="small"
            placeholder="Search events..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={16} /></InputAdornment>) }}
          />
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={loadEvents}>Refresh</Button>
          <Button variant="contained" startIcon={<PlusCircle size={16} />} onClick={() => setCreateOpen(true)}>New Event</Button>
        </Stack>
      </Stack>

      {loadingEvents ? (
        <Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box>
      ) : eventsError ? (
        <Alert severity="error">{eventsError}</Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {pagedEvents.length === 0 && (
              <Grid item xs={12}><Alert severity="info">No events found.</Alert></Grid>
            )}

            {pagedEvents.map((ev) => (
              <Grid item key={ev.id} xs={12} sm={6} md={4} lg={3}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Box>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>{ev.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDateTime(ev.event_date)}</Typography>
                      </Box>
                      <Stack spacing={1} alignItems="flex-end">
                        <Chip icon={<Users size={12} />} label={ev.attendee_count ?? (ev.attendees ? ev.attendees.length : 0)} size="small" />
                        <Chip icon={<CalIcon size={12} />} label={ev.location || "Location TBD"} size="small" />
                      </Stack>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1, minHeight: 44 }}>{ev.description || "No description provided."}</Typography>

                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                      {(ev.tags || []).slice(0, 3).map((t) => <Chip key={t} label={t} size="small" />)}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ justifyContent: "space-between" }}>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" startIcon={<Mail size={14} />} onClick={() => openInvite(ev)}>Invite</Button>
                      <Button size="small" startIcon={<Edit3 size={14} />} onClick={() => openEdit(ev)}>Edit</Button>
                      <Button size="small" color="error" startIcon={<Trash2 size={14} />} onClick={() => confirmDeleteOpen(ev.id, ev.title)}>Delete</Button>
                    </Stack>

                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Export attendees">
                        <IconButton size="small" onClick={() => handleExportAttendees(ev.id)}><DownloadCloud size={16} /></IconButton>
                      </Tooltip>
                      <Tooltip title="Add to calendar">
                        <IconButton size="small" onClick={() => handleAddToCalendar(ev)}><Calendar size={16} /></IconButton>
                      </Tooltip>
                      <IconButton size="small" onClick={(e) => openMenu(e, ev.id)}><MoreHorizontal size={16} /></IconButton>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination count={pageCount} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" fullWidth value={createForm.title} onChange={(e) => setCreateForm(f => ({ ...f, title: e.target.value }))} />
            <LocalizationProvider dateAdapter={AdapterLuxon}>
              <DatePicker
                label="Date"
                value={createDate}
                onChange={date => {
                  setCreateDate(date);
                  setCreateForm(f => ({
                    ...f,
                    event_date: combineDateTime(date, createTime)
                  }));
                }}
                slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
              />
              <TimePicker
                label="Time"
                value={createTime}
                onChange={time => {
                  setCreateTime(time);
                  setCreateForm(f => ({
                    ...f,
                    event_date: combineDateTime(createDate, time)
                  }));
                }}
                slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
              />
            </LocalizationProvider>
            <TextField label="Duration (minutes)" type="number" fullWidth value={createForm.durationMinutes} onChange={(e) => setCreateForm(f => ({ ...f, durationMinutes: Number(e.target.value || 0) }))} />
            <TextField label="Location" fullWidth value={createForm.location} onChange={(e) => setCreateForm(f => ({ ...f, location: e.target.value }))} />
            <TextField label="Description" multiline rows={4} fullWidth value={createForm.description} onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={createLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={createLoading}>{createLoading ? <CircularProgress size={18} /> : "Create"}</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" fullWidth value={editForm.title || ""} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
            <LocalizationProvider dateAdapter={AdapterLuxon}>
              <DatePicker
                label="Date"
                value={editDate}
                onChange={date => {
                  setEditDate(date);
                  setEditForm(f => ({
                    ...f,
                    event_date: combineDateTime(date, editTime)
                  }));
                }}
                slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
              />
              <TimePicker
                label="Time"
                value={editTime}
                onChange={time => {
                  setEditTime(time);
                  setEditForm(f => ({
                    ...f,
                    event_date: combineDateTime(editDate, time)
                  }));
                }}
                slotProps={{ textField: { fullWidth: true, InputLabelProps: { shrink: true } } }}
              />
            </LocalizationProvider>
            <TextField label="Duration (minutes)" type="number" fullWidth value={editForm.durationMinutes || 60} onChange={(e) => setEditForm(f => ({ ...f, durationMinutes: Number(e.target.value || 0) }))} />
            <TextField label="Location" fullWidth value={editForm.location || ""} onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))} />
            <TextField label="Description" multiline rows={4} fullWidth value={editForm.description || ""} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={editLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editLoading}>{editLoading ? <CircularProgress size={18} /> : "Save"}</Button>
        </DialogActions>
      </Dialog>

      {/* Invite / Attendees Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {inviteEvent ? `Invite / Attendees — ${inviteEvent.title}` : "Invite / Attendees"}
        </DialogTitle>

        <DialogContent dividers>
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <TextField size="small" placeholder="Search contacts..." value={contactQuery} onChange={(e) => setContactQuery(e.target.value)} sx={{ flex: 1 }} InputProps={{ startAdornment: (<InputAdornment position="start"><Search size={16} /></InputAdornment>) }} />
            <Button size="small" onClick={() => toggleSelectAllVisible(visibleContacts)}>Toggle all visible</Button>
          </Stack>

          <Stack direction="row" spacing={2} mb={2} alignItems="center">
            <FormControlLabel control={<Switch checked={inviteSchedule.sendNow} onChange={(e) => setInviteSchedule(s => ({ ...s, sendNow: e.target.checked }))} />} label="Send now" />
            {!inviteSchedule.sendNow && (
              <TextField
                size="small"
                label="Schedule at"
                type="datetime-local"
                value={inviteSchedule.scheduledAt}
                onChange={(e) => setInviteSchedule(s => ({ ...s, scheduledAt: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: "flex", gap: 2 }}>
            {/* Left: contact list */}
            <Box sx={{ flex: 1, maxHeight: 420, overflowY: "auto" }}>
              {loadingContacts ? (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
              ) : (
                <List dense>
                  {visibleContacts.map((c) => (
                    <ListItem key={c.id} secondaryAction={<Typography variant="caption" color="text.secondary">{c.phone || c.email || ""}</Typography>}>
                      <ListItemAvatar><Avatar>{(c.first_name || "U").charAt(0)}</Avatar></ListItemAvatar>
                      <ListItemText primary={`${c.first_name} ${c.surname}`} secondary={c.email || c.phone} />
                      <Checkbox edge="end" checked={inviteSelected.has(String(c.id))} onChange={() => toggleInviteSelect(c.id)} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>

            {/* Right: attendees & RSVP management */}
            <Box sx={{ width: 420, maxHeight: 420, overflowY: "auto" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Attendees & RSVPs</Typography>
                <Button size="small" onClick={() => loadAttendees(inviteEvent?.id)}>Refresh</Button>
              </Stack>

              {attendeesLoading ? (
                <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
              ) : attendees.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No attendees yet.</Typography>
              ) : (
                <List dense>
                  {attendees.map((a) => {
                    const id = String(a.id || a.contact_id || a.contact?.id || a.contact_id);
                    const name = a.first_name || a.contact?.first_name || `${a.first_name || ""} ${a.surname || a.contact?.surname || ""}`;
                    const phone = a.phone || a.contact?.phone || "";
                    const email = a.email || a.contact?.email || "";
                    const status = (a.rsvp_status || a.status || "pending");
                    return (
                      <ListItem key={id} secondaryAction={
                        <Stack direction="row" spacing={0.5}>
                          <Button size="small" onClick={() => updateRsvp(inviteEvent.id, id, "accepted")} startIcon={<CheckCircle size={14} />} color={status === "accepted" ? "success" : "inherit"}>Accept</Button>
                          <Button size="small" onClick={() => updateRsvp(inviteEvent.id, id, "declined")} startIcon={<XCircle size={14} />} color={status === "declined" ? "error" : "inherit"}>Decline</Button>
                        </Stack>
                      }>
                        <ListItemAvatar><Avatar>{(name || "U").charAt(0)}</Avatar></ListItemAvatar>
                        <ListItemText primary={name} secondary={`${email || phone} • ${status}`} />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} disabled={inviteLoading}>Close</Button>
          <Button variant="contained" onClick={handleSendInvites} disabled={inviteLoading}>{inviteLoading ? <CircularProgress size={18} /> : `Send (${inviteSelected.size})`}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete */}
      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null, title: "" })}>
        <DialogTitle>Delete event</DialogTitle>
        <DialogContent><Typography>Are you sure you want to delete <b>{confirmDelete.title}</b>?</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, id: null, title: "" })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* per-card menu */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => { const ev = events.find(x => x.id === menuEventId); openInvite(ev); closeMenu(); }}>Invite / Attendees</MenuItem>
        <MenuItem onClick={() => { const ev = events.find(x => x.id === menuEventId); openEdit(ev); closeMenu(); }}>Edit</MenuItem>
        <MenuItem onClick={() => { const ev = events.find(x => x.id === menuEventId); confirmDeleteOpen(ev.id, ev.title); closeMenu(); }}>Delete</MenuItem>
      </Menu>

      <Snackbar open={snack.open} autoHideDuration={4500} onClose={() => setSnack(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
