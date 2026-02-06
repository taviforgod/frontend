// frontend/src/components/ContactCard.jsx
import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { createContact } from '../services/evangelismService';
import { AuthContext } from '../contexts/AuthContext'; // <-- Add this import
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';

export default function ContactCard({ open, onClose, initial }) {
  const [form, setForm] = useState(initial || { first_name:'', surname:'', phone:'', how_met:'', contact_date: '' });
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  const submit = async () => {
    if (fetchWithAuth) {
      await createContact(fetchWithAuth, form);
    } else {
      await createContact(form);
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initial ? 'Edit Contact' : 'New Contact'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display:'grid', gap:1, width:400 }}>
          <TextField label="First name" value={form.first_name} onChange={e=>setForm(f=>({...f, first_name:e.target.value}))} />
          <TextField label="Surname" value={form.surname} onChange={e=>setForm(f=>({...f, surname:e.target.value}))} />
          <TextField label="Phone" value={form.phone} onChange={e=>setForm(f=>({...f, phone:e.target.value}))} />
          <TextField label="How met" value={form.how_met} onChange={e=>setForm(f=>({...f, how_met:e.target.value}))} />
          <LocalizationProvider dateAdapter={AdapterLuxon}>
            <DatePicker
              label="Date"
              value={form.contact_date ? DateTime.fromISO(form.contact_date) : null}
              onChange={value => setForm(f => ({
                ...f,
                contact_date: value ? value.toISODate() : ''
              }))}
              slotProps={{
                textField: {
                  fullWidth: true,
                  InputLabelProps: { shrink: true },
                }
              }}
              disableFuture
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
