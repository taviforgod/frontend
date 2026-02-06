// frontend/src/pages/EvangelismDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import { Tabs, Tab, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, Stepper, Step, StepLabel, MenuItem, IconButton, AppBar, Toolbar, Typography } from '@mui/material';
import ContactList from '../components/ContactList';
import ContactKanban from '../components/ContactKanban';
import ContactMap from '../components/ContactMap';
import EventList from '../components/EventList';
import { createContact } from '../services/evangelismService';
import { getCellGroups } from '../services/cellGroupService';

import {getMembers } from '../services/memberService';
import { AuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';

const steps = [
  'Basic Info',
  'Contact Details',
  'Evangelism Details',
  'Assignment'
];

const howHeardOptions = [
  'Street',
  'Church',
  'Referral',
  'Event',
  'Social Media',
  'Other'
];

const statusOptions = [
  'new',
  'follow-up',
  'interested',
  'converted',
  'visitor',
  'member'
];

export default function EvangelismDashboard() {
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));
  const notifications = useNotifications();

  // Add Contact Modal state
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    first_name: '',
    surname: '',
    phone: '',
    email: '',
    area: ''
  });
  const [activeStep, setActiveStep] = useState(0);
  const [cellGroups, setCellGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const { fetchWithAuth } = useContext(AuthContext);

  useEffect(() => {
    if (addContactOpen) {
      (async () => {
        try {
          // provide a safe fallback if the context doesn't expose fetchWithAuth
          const fetcher = typeof fetchWithAuth === 'function'
            ? fetchWithAuth
            : async (input, init = {}) => {
                const base = process.env.REACT_APP_API_BASE || '';
                const url = String(input).startsWith('http') ? input : `${base}${input}`;
                const token = localStorage.getItem('token');
                const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
                if (token) headers.Authorization = `Bearer ${token}`;
                const res = await fetch(url, { ...init, headers });
                if (!res.ok) throw new Error(await res.text());
                return res.json();
              };

          const groups = await getCellGroups(fetcher);
          setCellGroups(Array.isArray(groups) ? groups : []);
          const members = await getMembers(fetcher);
          setUsers(Array.isArray(members) ? members : []);
        } catch (err) {
          console.error('Failed to fetch cell groups or members', err);
          setCellGroups([]);
          setUsers([]);
        }
      })();
    }
  }, [addContactOpen, fetchWithAuth]);

  const handleClose = () => {
    setAddContactOpen(false);
    setActiveStep(0);
    setContactForm({ first_name: '', surname: '', phone: '', email: '', area: '' });
  };

  const handleNext = () => {
    setActiveStep(s => s + 1);
  };

  const handleBack = () => {
    setActiveStep(s => s - 1);
  };

  const handleAddContact = async () => {
    const payload = {
      ...contactForm,
      assigned_cell_group_id: contactForm.assigned_cell_group?.id || null,
      assigned_to_user_id: contactForm.assigned_to_user?.id || null
    };
    delete payload.assigned_cell_group;
    delete payload.assigned_to_user;
    // pass the same safe fetcher to the service if it accepts it (fallback if not used)
    const fetcher = typeof fetchWithAuth === 'function'
      ? fetchWithAuth
      : async (input, init = {}) => {
          const base = process.env.REACT_APP_API_BASE || '';
          const url = String(input).startsWith('http') ? input : `${base}${input}`;
          const token = localStorage.getItem('token');
          const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch(url, { ...init, headers });
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        };
    await createContact(fetcher, payload);
    handleClose();
  };

  // Step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField label="First Name" fullWidth sx={{ mb: 2 }} value={contactForm.first_name} onChange={e=>setContactForm(f=>({...f, first_name:e.target.value}))} />
            <TextField label="Surname" fullWidth sx={{ mb: 2 }} value={contactForm.surname} onChange={e=>setContactForm(f=>({...f, surname:e.target.value}))} />
            <TextField
              select
              label="Status"
              fullWidth
              sx={{ mb: 2 }}
              value={contactForm.status || ''}
              onChange={e=>setContactForm(f=>({...f, status:e.target.value}))}
            >
              {statusOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
          </>
        );
      case 1:
        return (
          <>
            <TextField label="Phone" fullWidth sx={{ mb: 2 }} value={contactForm.phone} onChange={e=>setContactForm(f=>({...f, phone:e.target.value}))} />
            <TextField label="Whatsapp" fullWidth sx={{ mb: 2 }} value={contactForm.whatsapp} onChange={e=>setContactForm(f=>({...f, whatsapp:e.target.value}))} />
            <TextField label="Email" fullWidth sx={{ mb: 2 }} value={contactForm.email} onChange={e=>setContactForm(f=>({...f, email:e.target.value}))} />
            <TextField label="Area" fullWidth sx={{ mb: 2 }} value={contactForm.area} onChange={e=>setContactForm(f=>({...f, area:e.target.value}))} />
          </>
        );
      case 2:
        return (
          <>
            <LocalizationProvider dateAdapter={AdapterLuxon}>
              <DatePicker
                label="Contact Date"
                value={contactForm.contact_date ? DateTime.fromISO(contactForm.contact_date) : null}
                onChange={date => setContactForm(f => ({ ...f, contact_date: date ? date.toISODate() : '' }))}
                slotProps={{ textField: { fullWidth: true, sx: { mb: 2 }, InputLabelProps: { shrink: true } } }}
              />
            </LocalizationProvider>
            <Autocomplete
              options={users}
              getOptionLabel={u => (u.first_name ? u.first_name : '') + ' ' + (u.surname ? u.surname : '')}
              value={contactForm.contacted_by_user}
              onChange={(_, v) => setContactForm(f => ({ ...f, contacted_by_user: v }))}
              renderInput={params => <TextField {...params} label="Contacted By" sx={{ mb: 2 }} fullWidth />}
            />
            <TextField
              select
              label="How Heard"
              fullWidth
              sx={{ mb: 2 }}
              value={contactForm.how_heard || ''}
              onChange={e=>setContactForm(f=>({...f, how_heard:e.target.value}))}
            >
              {howHeardOptions.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
            <TextField label="Response" fullWidth sx={{ mb: 2 }} value={contactForm.response} onChange={e=>setContactForm(f=>({...f, response:e.target.value}))} />
            <TextField label="Notes" fullWidth sx={{ mb: 2 }} value={contactForm.notes} onChange={e=>setContactForm(f=>({...f, notes:e.target.value}))} />
          </>
        );
      case 3:
        return (
          <>
            <Autocomplete
              options={cellGroups}
              getOptionLabel={g => g.name}
              value={contactForm.assigned_cell_group}
              onChange={(_, v) => setContactForm(f => ({ ...f, assigned_cell_group: v }))}
              renderInput={params => <TextField {...params} label="Assigned Cell Group" sx={{ mb: 2 }} fullWidth />}
            />
            <LocalizationProvider dateAdapter={AdapterLuxon}>
              <DatePicker
                label="Next Follow Up Date"
                value={contactForm.next_follow_up_date ? DateTime.fromISO(contactForm.next_follow_up_date) : null}
                onChange={date => setContactForm(f => ({ ...f, next_follow_up_date: date ? date.toISODate() : '' }))}
                slotProps={{ textField: { fullWidth: true, sx: { mb: 2 }, InputLabelProps: { shrink: true } } }}
              />
            </LocalizationProvider>
            <Autocomplete
              options={users}
              getOptionLabel={u => (u.first_name ? u.first_name : '') + ' ' + (u.surname ? u.surname : '')}
              value={contactForm.assigned_to_user}
              onChange={(_, v) => setContactForm(f => ({ ...f, assigned_to_user: v }))}
              renderInput={params => <TextField {...params} label="Assigned To" sx={{ mb: 2 }} fullWidth />}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', flexDirection: isSm ? 'column' : 'row', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          variant={isSm ? "scrollable" : "standard"}
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ width: isSm ? '100%' : 'auto' }}
        >
          <Tab label="List" />
          <Tab label="Kanban" />
          <Tab label="Map" />
          <Tab label="Events" />
        </Tabs>
        <Box sx={{ width: isSm ? '100%' : 'auto', display: 'flex', justifyContent: isSm ? 'stretch' : 'flex-end' }}>
          <Button fullWidth={isSm} variant="contained" onClick={() => setAddContactOpen(true)}>
            Add Contact
          </Button>
        </Box>
      </Box>
      {tab === 0 && <ContactList />}
      {tab === 1 && <ContactKanban />}
      {tab === 2 && <ContactMap />}
      {tab === 3 && <EventList />}

      {/* Multi-step Add Contact Modal */}
      <Dialog
        open={addContactOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isSm}
        scroll="paper"
      >
        {isSm ? (
          <AppBar position="sticky" color="primary" elevation={1}>
            <Toolbar>
              <Typography sx={{ flex: 1 }} variant="h6">Add Contact</Typography>
              <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
                ✕
              </IconButton>
            </Toolbar>
          </AppBar>
        ) : (
          <DialogTitle>Add Contact</DialogTitle>
        )}

        <DialogContent sx={{ pt: isSm ? 2 : 1 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }} orientation={isSm ? "vertical" : "horizontal"} nonLinear={false}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}
        </DialogContent>

        <DialogActions sx={{ flexDirection: isSm ? 'column' : 'row', gap: 1, p: 2 }}>
          <Button fullWidth={isSm} onClick={handleClose}>Cancel</Button>
          {activeStep > 0 && <Button fullWidth={isSm} onClick={handleBack}>Back</Button>}
          {activeStep < steps.length - 1 ? (
            <Button fullWidth={isSm} variant="contained" onClick={handleNext}>Next</Button>
          ) : (
            <Button fullWidth={isSm} variant="contained" onClick={handleAddContact}>Add</Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
