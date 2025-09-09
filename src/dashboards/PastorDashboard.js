import React from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip, Divider } from '@mui/material';
import { Users, TrendingUp, Medal, HeartHandshake, FileText } from 'lucide-react';

export default function PastorDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        <Medal size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Pastor’s Dashboard
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            <Users size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Church Overview
          </Typography>
          <Stack direction="row" spacing={2} mt={1}>
            <Chip label="Members: 250" color="primary" />
            <Chip label="Active Cells: 18" color="success" />
            <Chip label="Attendance: 82%" color="info" />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            <TrendingUp size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Growth Metrics
          </Typography>
          <Stack direction="row" spacing={2} mt={1}>
            <Chip label="New Members: 12" color="info" />
            <Chip label="Baptisms: 3" color="success" />
            <Chip label="Foundation School: 9 completed" color="secondary" />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            <Medal size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Leadership Health
          </Typography>
          <ul>
            <li>2 cell leaders inactive</li>
            <li>Mentorship: 80% completion</li>
          </ul>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            <HeartHandshake size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Pastoral Care
          </Typography>
          <ul>
            <li>3 crisis cases open</li>
            <li>7 prayer requests pending</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">
            <FileText size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Reports & Notifications
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">Weekly Reports: <b>All submitted</b></Typography>
          <Typography variant="body2">Urgent Alerts: <b>1</b></Typography>
        </CardContent>
      </Card>
    </Box>
  );
}