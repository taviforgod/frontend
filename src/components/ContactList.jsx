// frontend/src/components/ContactList.jsx
import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Typography,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Autocomplete,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { Repeat, Check, Edit, Trash2 } from 'lucide-react';
import {
  listContacts,
  assignBulk,
  convertToVisitor,
  importContactsCSV,
  exportContactsCSV,
  exportContactsExcel,
  markAttended,
  updateContact,
  deleteContact
} from '../services/evangelismService';
import { getMembers } from '../services/memberService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';

export default function ContactList() {
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const auth = useContext(AuthContext);
  const fetchWithAuth = typeof auth?.fetchWithAuth === "function" ? auth.fetchWithAuth : undefined;

  const [contacts, setContacts] = useState([]);
  const [term, setTerm] = useState('');
  const [selected, setSelected] = useState([]);
  const [file, setFile] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [users, setUsers] = useState([]);
  const [assignUser, setAssignUser] = useState(null);
  const [editStep, setEditStep] = useState(0);

  // Defensive dedupe: prefer phone > email > name+area. If multiple entries for same person,
  // keep the entry with higher status priority (member>visitor>converted>interested>follow-up>new)
  // and then the most recent contact_date.
  const uniqueContacts = useMemo(() => {
    if (!Array.isArray(contacts) || contacts.length === 0) return [];

    const normalizePhone = (p = '') => (String(p || '') || '').replace(/\D/g, '').replace(/^\+/, '');
    const keyFor = (c) => {
      const phone = normalizePhone(c.phone || c.whatsapp);
      if (phone) return `p:${phone}`;
      if (c.email) return `e:${String(c.email).toLowerCase().trim()}`;
      const name = `${(c.first_name||'').toLowerCase().trim()} ${(c.surname||'').toLowerCase().trim()}`.trim();
      const area = (c.area || '').toLowerCase().trim();
      return `n:${name}|${area}`;
    };

    const statusPriority = {
      member: 6,
      visitor: 5,
      converted: 5,
      interested: 4,
      'follow-up': 3,
      'follow_up': 3,
      new: 1
    };

    const map = new Map();
    contacts.forEach(c => {
      try {
        const key = keyFor(c);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, c);
          return;
        }

        const a = existing;
        const b = c;
        const ap = statusPriority[(a.status||'').toLowerCase()] || 0;
        const bp = statusPriority[(b.status||'').toLowerCase()] || 0;

        if (bp > ap) {
          map.set(key, b);
          return;
        }
        if (bp < ap) return;

        // tie-breaker = most recent contact_date
        const at = a.contact_date ? Date.parse(a.contact_date) : 0;
        const bt = b.contact_date ? Date.parse(b.contact_date) : 0;
        if (bt > at) map.set(key, b);
      } catch (e) {
        // on any error fallback: seed by id
        const k = `id:${c.id}`;
        if (!map.get(k)) map.set(k, c);
      }
    });

    const out = Array.from(map.values());
    if (out.length !== contacts.length) console.warn('ContactList: deduped evangelism contacts', { before: contacts.length, after: out.length });
    return out;
  }, [contacts]);

  const editSteps = [
    'Basic Info',
    'Contact Details',
    'Evangelism Details',
    'Assignment'
  ];

  // Load contacts
  const load = async () => {
    try {
      const data = await listContacts(fetchWithAuth, { q: term });
      setContacts(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
    getMembers(fetchWithAuth).then(setUsers).catch(e => console.error(e));
  }, []);
  
  // Reload list when a contact is created elsewhere in the UI
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('evangelism:contact:added', handler);
    return () => window.removeEventListener('evangelism:contact:added', handler);
  }, []);

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  // Bulk assign
  const handleAssign = async () => {
    if (!assignUser || !assignUser.id) return alert('Select a user to assign');
    await assignBulk(selected, Number(assignUser.id), fetchWithAuth);
    await load();
    setSelected([]);
    setAssignUser(null);
  };

  // Convert to visitor
  const handleConvert = async (id) => {
    if (!window.confirm('Convert to visitor?')) return;
    await convertToVisitor(id, fetchWithAuth);
    await load();
  };

  // Mark attended
  const handleMarkAttended = async (id) => {
    if (!window.confirm('Mark attended and create visitor?')) return;
    await markAttended(id, { createVisitor: true, autoConvertToMember: false }, fetchWithAuth);
    await load();
  };

  // Edit handlers
  const handleEditOpen = (contact) => {
    setEditForm(contact);
    setEditOpen(true);
  };
  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });
  const handleEditNext = () => setEditStep(s => s + 1);
  const handleEditBack = () => setEditStep(s => s - 1);
  const handleEditSave = async () => {
    await updateContact(editForm.id, editForm, fetchWithAuth);
    setEditOpen(false);
    setEditStep(0);
    await load();
  };

  // Delete contact
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    await deleteContact(id, fetchWithAuth);
    await load();
  };

  // CSV Import / Export
  const handleImport = async () => {
    if (!file) return alert('Choose a CSV file first');
    await importContactsCSV(file, fetchWithAuth);
    await load();
    setFile(null);
  };
  const handleExportCSV = async () => {
    const blob = await exportContactsCSV(fetchWithAuth);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contacts.csv'; a.click();
    window.URL.revokeObjectURL(url);
  };
  const handleExportExcel = async () => {
    const blob = await exportContactsExcel(fetchWithAuth);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'contacts.xlsx'; a.click();
    window.URL.revokeObjectURL(url);
  };

  const howMetOptions = ['Street', 'Church', 'Referral', 'Event', 'Social Media', 'Other'];
  const statusOptions = ['new', 'follow-up', 'interested', 'converted', 'visitor', 'member'];

  const renderEditStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField label="First Name" name="first_name" fullWidth sx={{ mb: 2 }} value={editForm.first_name || ''} onChange={handleEditChange} />
            <TextField label="Surname" name="surname" fullWidth sx={{ mb: 2 }} value={editForm.surname || ''} onChange={handleEditChange} />
            <TextField select label="Status" name="status" fullWidth sx={{ mb: 2 }} value={editForm.status || ''} onChange={handleEditChange}>
              {statusOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
          </>
        );
      case 1:
        return (
          <>
            <TextField label="Phone" name="phone" fullWidth sx={{ mb: 2 }} value={editForm.phone || ''} onChange={handleEditChange} />
            <TextField label="Whatsapp" name="whatsapp" fullWidth sx={{ mb: 2 }} value={editForm.whatsapp || ''} onChange={handleEditChange} />
            <TextField label="Email" name="email" fullWidth sx={{ mb: 2 }} value={editForm.email || ''} onChange={handleEditChange} />
            <TextField label="Area" name="area" fullWidth sx={{ mb: 2 }} value={editForm.area || ''} onChange={handleEditChange} />
          </>
        );
      case 2:
        return (
          <>
            <LocalizationProvider dateAdapter={AdapterLuxon}>
              <DatePicker
                label="Contact Date"
                value={editForm.contact_date ? DateTime.fromISO(editForm.contact_date) : null}
                onChange={value => setEditForm(f => ({ ...f, contact_date: value ? value.toISODate() : '' }))}
                slotProps={{ textField: { fullWidth: true, sx: { mb: 2 }, InputLabelProps: { shrink: true } } }}
                disableFuture
              />
            </LocalizationProvider>
            <TextField select label="How Met" name="how_met" fullWidth sx={{ mb: 2 }} value={editForm.how_met || ''} onChange={handleEditChange}>
              {howMetOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField label="Response" name="response" fullWidth sx={{ mb: 2 }} value={editForm.response || ''} onChange={handleEditChange} />
            <TextField label="Notes" name="notes" fullWidth sx={{ mb: 2 }} value={editForm.notes || ''} onChange={handleEditChange} />
          </>
        );
      case 3:
        return (
          <LocalizationProvider dateAdapter={AdapterLuxon}>
            <DatePicker
              label="Next Follow Up Date"
              value={editForm.next_follow_up_date ? DateTime.fromISO(editForm.next_follow_up_date) : null}
              onChange={value => setEditForm(f => ({ ...f, next_follow_up_date: value ? value.toISODate() : '' }))}
              slotProps={{ textField: { fullWidth: true, sx: { mb: 2 }, InputLabelProps: { shrink: true } } }}
              disablePast
            />
          </LocalizationProvider>
        );
      default: return null;
    }
  };

  return (
    <Box sx={{ p: isSm ? 1 : 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Evangelism Contacts</Typography>

      <Stack direction={isSm ? "column" : "row"} spacing={1} sx={{ mb: 1 }} alignItems="stretch">
        <TextField placeholder="Search name or phone" value={term} onChange={e => setTerm(e.target.value)} size="small" fullWidth={isSm} />
        <Button variant="outlined" onClick={load} size="small" sx={{ whiteSpace: 'nowrap' }}>Search</Button>

        <Autocomplete
          options={users}
          getOptionLabel={u => `${u.first_name || ''} ${u.surname || ''}`.trim()}
          value={assignUser}
          onChange={(_, v) => setAssignUser(v)}
          sx={{ minWidth: isSm ? '100%' : 240 }}
          renderInput={params => <TextField {...params} label="Assign User" size="small" />}
          fullWidth={isSm}
        />

        <Button variant="contained" disabled={!selected.length || !assignUser} onClick={handleAssign} size="small" sx={{ minWidth: 160 }}>
          Assign Selected ({selected.length})
        </Button>

        <Stack direction={isSm ? 'column' : 'row'} spacing={1} sx={{ ml: isSm ? 0 : 1 }}>
          <Button size="small" onClick={handleExportCSV}>Export CSV</Button>
          <Button size="small" onClick={handleExportExcel}>Export Excel</Button>
          <label>
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            <Button size="small" component="span">Choose CSV</Button>
          </label>
          <Button size="small" onClick={handleImport}>Import CSV</Button>
        </Stack>
      </Stack>

      {isSm ? (
        <List disablePadding>
          {uniqueContacts.map(c => {
            const initials = ((c.first_name || '?').charAt(0) + (c.surname || '?').charAt(0)).toUpperCase();
            return (
              <React.Fragment key={c.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar>
                      <Checkbox checked={selected.includes(c.id)} onChange={() => toggle(c.id)} />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={`${c.first_name || ''} ${c.surname || ''}`.trim() || '—'}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">{c.phone || c.whatsapp || '-'}</Typography>
                        {" — "}
                        <Typography component="span" variant="caption" color="text.secondary">
                          {c.status || 'new'} • {c.how_met || '-'} • {c.contact_date ? new Date(c.contact_date).toLocaleDateString() : '-'}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Box sx={{ px: 2, pb: 1, pt: 0, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Tooltip title="Convert to Visitor"><IconButton size="small" onClick={() => handleConvert(c.id)}><Repeat size={16} /></IconButton></Tooltip>
                  <Tooltip title="Mark Attended"><IconButton size="small" onClick={() => handleMarkAttended(c.id)}><Check size={16} /></IconButton></Tooltip>
                  <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditOpen(c)}><Edit size={16} /></IconButton></Tooltip>
                  <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><Trash2 size={16} /></IconButton></Tooltip>
                </Box>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>How Met</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uniqueContacts.map(c => (
              <TableRow key={c.id}>
                <TableCell><Checkbox checked={selected.includes(c.id)} onChange={() => toggle(c.id)} /></TableCell>
                <TableCell>{c.first_name} {c.surname}</TableCell>
                <TableCell>{c.phone || c.whatsapp || '-'}</TableCell>
                <TableCell>{c.status || 'new'}</TableCell>
                <TableCell>{c.how_met}</TableCell>
                <TableCell>{c.contact_date ? new Date(c.contact_date).toLocaleDateString() : '-'}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => handleConvert(c.id)}>Convert → Visitor</Button>
                    <Button size="small" onClick={() => handleMarkAttended(c.id)}>Mark Attended</Button>
                    <Button size="small" onClick={() => handleEditOpen(c)}>Edit</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(c.id)}>Delete</Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editOpen} onClose={() => { setEditOpen(false); setEditStep(0); }} fullScreen={isSm} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Contact</DialogTitle>
        <DialogContent>
          <Stepper activeStep={editStep} sx={{ mb: 3 }} orientation={isSm ? "vertical" : "horizontal"}>
            {editSteps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          {renderEditStepContent(editStep)}
        </DialogContent>
        <DialogActions sx={{ flexDirection: isSm ? 'column' : 'row', gap: 1, p: 2 }}>
          <Button fullWidth={isSm} onClick={() => { setEditOpen(false); setEditStep(0); }}>Cancel</Button>
          {editStep > 0 && <Button fullWidth={isSm} onClick={handleEditBack}>Back</Button>}
          {editStep < editSteps.length - 1
            ? <Button fullWidth={isSm} variant="contained" onClick={handleEditNext}>Next</Button>
            : <Button fullWidth={isSm} variant="contained" onClick={handleEditSave}>Save</Button>}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
