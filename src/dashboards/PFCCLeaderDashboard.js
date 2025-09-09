import React from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip, Divider } from '@mui/material';
import { Users, TrendingUp, AlertTriangle, BookOpen, FileText } from 'lucide-react';

export default function PFCCLeaderDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        <Users size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        PFCC Zone Overview
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Zone Stats</Typography>
          <Stack direction="row" spacing={3} mt={1}>
            <Chip label="Cells: 5" color="primary" />
            <Chip label="Members: 48" color="success" />
            <Chip label="Growth: +7%" color="info" />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            <AlertTriangle size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Cells at Risk
          </Typography>
          <ul>
            <li>Cell Alpha: Low attendance</li>
            <li>Cell Delta: No multiplication in 6 months</li>
          </ul>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            <TrendingUp size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Quick Stats
          </Typography>
          <Stack direction="row" spacing={2} mt={1}>
            <Chip label="New Visitors: 4" color="info" />
            <Chip label="Baptisms: 2" color="success" />
            <Chip label="Foundation School: 6 enrolled" color="secondary" />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">
            <FileText size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Reports
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">Weekly Reports: <b>2 overdue</b></Typography>
          <Typography variant="body2">Monthly Summary: <b>Due in 5 days</b></Typography>
        </CardContent>
      </Card>
    </Box>
  );
}