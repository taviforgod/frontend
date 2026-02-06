import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { getUrgentCount, getSLA } from '../../services/prayerService';

const formatSeconds = (secs) => {
  if (!secs) return '—';
  const minutes = Math.round(secs / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
};

export default function AdminUrgentWidget() {
  const [urgent, setUrgent] = useState(0);
  const [slaSecs, setSlaSecs] = useState(null);

  const load = async () => {
    try {
      const u = await getUrgentCount();
      setUrgent(u?.urgent_open || 0);
      const s = await getSLA();
      setSlaSecs(Number(s?.avg_first_contact_seconds || 0));
    } catch (err) {
      console.error('Urgent widget load failed', err);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Urgent Open Requests</Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>{urgent}</Typography>
          <Typography variant="caption" color="text.secondary">Requests marked urgent and not yet closed</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} sm={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">Avg time to first contact</Typography>
          <Typography variant="h4" sx={{ mt: 1 }}>{formatSeconds(slaSecs)}</Typography>
          <Typography variant="caption" color="text.secondary">Average time to first follow-up (rounded)</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}
