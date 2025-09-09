import React from 'react';
import { Box, Typography, Card, CardContent, Stack, Chip, Divider } from '@mui/material';
import { User, Calendar, BookOpen, HeartHandshake } from 'lucide-react';

export default function MemberDashboard() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        <User size={32} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        Member Dashboard
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">My Profile</Typography>
          <Stack direction="row" spacing={2} mt={1}>
            <Chip label="Born Again" color="success" />
            <Chip label="Baptized" color="info" />
            <Chip label="Foundation School: Level 2" color="secondary" />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            <Calendar size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Upcoming Cell Meetings
          </Typography>
          <ul>
            <li>Friday, 7pm - Cell Alpha</li>
            <li>Next Week: Special Outreach</li>
          </ul>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">
            <BookOpen size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Discipleship Progress
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="body2">Mentorship: <b>Assigned</b></Typography>
          <Typography variant="body2">Foundation School: <b>Level 2</b></Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6">
            <HeartHandshake size={18} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Prayer Requests
          </Typography>
          <ul>
            <li>For my exams (pending)</li>
            <li>Thanksgiving for new job (answered)</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
}