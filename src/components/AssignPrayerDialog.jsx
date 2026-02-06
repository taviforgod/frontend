import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress, Select, MenuItem, Typography } from '@mui/material';
import { getRoles } from '../api/leadershipService';
import { assignPrayer } from '../api/prayerService';

export default function AssignPrayerDialog({ open, onClose, fetchWithAuth, prayerId, onAssigned }) {
  const [leaders, setLeaders] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getRoles(fetchWithAuth);
        const active = Array.isArray(data) ? data.filter(d => d.active !== false) : [];
        setLeaders(active);
      } catch (err) {
        setError('Failed to load leaders');
      } finally { setLoading(false); }
    })();
  }, [open, fetchWithAuth]);

  const handleAssign = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');
    try {
      await assignPrayer(fetchWithAuth, prayerId, Number(selected));
      onAssigned?.();
      onClose();
    } catch (err) {
      if (err.status === 403) setError('Only active leaders can be assigned.');
      else setError(err.message || 'Assign failed');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={!!open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign Prayer Follow-Up</DialogTitle>
      <DialogContent>
        {loading && <CircularProgress />}
        {error && <Typography color="error">{error}</Typography>}
        <Select fullWidth value={selected} onChange={(e) => setSelected(e.target.value)} sx={{ mt:2 }}>
          <MenuItem value="">Select a leader</MenuItem>
          {leaders.map(l => (
            <MenuItem key={l.member_id} value={l.member_id}>{l.first_name} {l.surname} — {l.role}</MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleAssign} disabled={!selected || loading}>Assign</Button>
      </DialogActions>
    </Dialog>
  );
}
