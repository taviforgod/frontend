// src/components/ExitDetailCard.jsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
import { getExit } from '../../services/inactiveExitService';
import { DateTime } from 'luxon';

export default function ExitDetailCard({ id }) {
  const [exit, setExit] = useState(null);

  useEffect(() => {
    if (!id) return;
    getExit(id).then(setExit).catch(console.error);
  }, [id]);

  if (!exit) return null;
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{exit.first_name} {exit.surname}</Typography>
        <Chip label={exit.exit_type} sx={{ mb: 1 }} />
        <Typography variant="body2">
          Exit date: {exit.exit_date ? DateTime.fromISO(exit.exit_date).toLocaleString(DateTime.DATE_MED) : ''}
        </Typography>
        <Typography variant="body2">Processed by: {exit.processed_by_email || '—'}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>{exit.exit_reason}</Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Notes: {exit.notes || '—'}</Typography>
      </CardContent>
    </Card>
  );
}
