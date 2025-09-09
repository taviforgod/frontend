import React from 'react';
import { Box, Typography, Button, Card, CardContent, Stack, Chip, Divider } from '@mui/material';
import { Users, CalendarCheck, UserPlus, BellRing, Medal } from 'lucide-react';

export default function CellLeaderDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        <Users size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        My Cell Group
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Group Members</Typography>
          {/* Replace with dynamic member list */}
          <Stack direction="row" spacing={1} mt={1}>
            <Chip label="John Doe" color="primary" />
            <Chip label="Jane Smith" color="primary" />
            <Chip label="Samuel Lee" color="primary" />
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2} mb={3}>
        <Button variant="contained" startIcon={<CalendarCheck />}>Add Meeting Report</Button>
        <Button variant="outlined" startIcon={<UserPlus />}>Add Visitor</Button>
        <Button variant="outlined" startIcon={<BellRing />}>Mark Attendance</Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Reminders</Typography>
          <ul>
            <li>3 absentees to follow up</li>
            <li>2 new visitors need welcome call</li>
            <li>Birthday: Jane Smith (Tomorrow)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">
            <Medal size={20} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Leadership Progress
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">Mentorship: <b>In Progress</b></Typography>
          <Typography variant="body2">Self-Evaluation: <b>Pending</b></Typography>
        </CardContent>
      </Card>
    </Box>
  );
}