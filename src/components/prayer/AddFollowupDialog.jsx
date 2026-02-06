import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Snackbar, Alert, MenuItem, Stack, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { addFollowup } from '../../services/prayerService.js';
import { AuthContext } from '../../contexts/AuthContext.js';
import { motion } from 'framer-motion';

const methodOptions = [
  { value: 'phone', label: 'Phone Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'visit', label: 'Visit' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
  { value: 'other', label: 'Other' },
];

/**
 * Props:
 * - open
 * - prayer
 * - onClose()
 * - onAdded()
 *
 * Preserves the original API and behavior.
 */

export default function AddFollowupDialog({ open, prayer, onClose, onAdded }) {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [note, setNote] = useState('');
  const [method, setMethod] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!open) return;
    setNote('');
    setMethod('phone');
  }, [open]);

  if (!prayer) return null;

  const handleAdd = async () => {
    if (!note.trim()) return setSnack({ open: true, message: 'Note required', severity: 'error' });
    setLoading(true);
    try {
      await addFollowup(fetchWithAuth, prayer.id, { note, method });
      setSnack({ open: true, message: 'Follow-up added', severity: 'success' });
      setLoading(false);
      onAdded && onAdded();
      onClose && onClose();
    } catch (err) {
      console.error('add followup failed', err);
      setSnack({ open: true, message: err?.message || 'Failed', severity: 'error' });
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}>
          <DialogTitle>
            Add Follow-up
            <IconButton aria-label="close" sx={{ position: 'absolute', right: 8, top: 8 }} onClick={onClose}><CloseIcon /></IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Stack direction="row" spacing={1} mb={2}>
              {methodOptions.map(opt => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  color={method === opt.value ? 'primary' : 'default'}
                  variant={method === opt.value ? 'filled' : 'outlined'}
                  clickable
                  onClick={() => setMethod(opt.value)}
                  sx={{ fontWeight: 500 }}
                />
              ))}
            </Stack>
            <TextField
              select
              label="Method"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2, display: 'none' }} // hide dropdown, use chips above
            >
              {methodOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>
            <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} fullWidth multiline minRows={4} />
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleAdd} disabled={loading}>{loading ? 'Adding...' : 'Add Follow-up'}</Button>
          </DialogActions>
        </motion.div>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}
