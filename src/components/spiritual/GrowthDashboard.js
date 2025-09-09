import React from 'react';
import { Box, Typography, Card, CardContent, Grid } from '@mui/material';

export default function GrowthDashboard() {
  return (
    <Box p={2}>
      <Typography variant="h4" mb={2}>Spiritual Growth Dashboard</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography variant="h6">Born Again</Typography><Typography variant="h4">—</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography variant="h6">Baptized</Typography><Typography variant="h4">—</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography variant="h6">Foundation Completed</Typography><Typography variant="h4">—</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6} md={3}><Card><CardContent><Typography variant="h6">Serving</Typography><Typography variant="h4">—</Typography></CardContent></Card></Grid>
      </Grid>
    </Box>
  );
}
