import React, { useState, useContext, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, IconButton, Snackbar, Alert, Box, Typography, Stack, Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AuthContext } from '../../contexts/AuthContext.js';
import { closePrayer } from '../../services/prayerService.js';
import { motion } from 'framer-motion';

const outcomeOptions = [
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Referred', label: 'Referred' },
  { value: 'Unable to Contact', label: 'Unable to Contact' },
  { value: 'Other', label: 'Other' },
];

/**
 * Props:
 * - open (bool)
 * - prayer (object) -- the prayer to close
 * - onClose() called when dialog should close
 * - onClosed(response) called after successful close
 *
 * Keeps original behaviour and prop names.
 */

export default function CloseRequestDialog({ open, prayer, onClose, onClosed }) {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [outcome, setOutcome] = useState('Resolved');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!open) return;
    setOutcome('Resolved');
    setNotes('');
  }, [open]);

  if (!prayer) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = { outcome, resolution_notes: notes };
      const res = await closePrayer(fetchWithAuth, prayer.id, payload);
      setSnack({ open: true, message: 'Request closed', severity: 'success' });
      setLoading(false);
      onClosed && onClosed(res);
    } catch (err) {
      console.error('Failed to close request', err);
      setSnack({ open: true, message: err?.message || 'Failed to close request', severity: 'error' });
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }}>
          <DialogTitle>
            Close Request {prayer.request_no || `#${prayer.id}`}
            <IconButton aria-label="close" sx={{ position: 'absolute', right: 8, top: 8 }} onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Category: {prayer.category} — {prayer.sub_category || '-'}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Urgency: {prayer.urgency}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Member: {prayer.first_name ? `${prayer.first_name} ${prayer.surname}` : 'Anonymous'}</Typography>
            </Box>

            <Stack direction="row" spacing={1} mb={2}>
              {outcomeOptions.map(opt => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  color={outcome === opt.value ? 'primary' : 'default'}
                  variant={outcome === opt.value ? 'filled' : 'outlined'}
                  clickable
                  onClick={() => setOutcome(opt.value)}
                  sx={{ fontWeight: 500 }}
                />
              ))}
            </Stack>
            <TextField
              select
              label="Outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2, display: 'none' }} // hide dropdown, use chips above
            >
              {outcomeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </TextField>
            <TextField
              label="Resolution notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              minRows={4}
              placeholder="Add details: who was contacted, next steps, referrals, etc."
            />
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={loading}>{loading ? 'Closing...' : 'Close Request'}</Button>
          </DialogActions>
        </motion.div>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
