import React, { useContext } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AuthContext } from '../contexts/AuthContext'; // <-- Add this import

export default function ExportsPage() {
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth if needed

  // Example export handler using fetchWithAuth
  const handleExportVisitors = async () => {
    try {
      let res;
      if (fetchWithAuth) {
        res = await fetchWithAuth('/api/visitors/export', { method: 'GET' });
      } else {
        res = await fetch('/api/visitors/export', { method: 'GET' });
      }
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'visitors.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Export failed');
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5">Exports</Typography>
      <Button variant="contained" onClick={handleExportVisitors}>
        Export Visitors CSV
      </Button>
    </Box>
  );
}
