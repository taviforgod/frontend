import React, { useEffect, useState, useContext } from 'react';
import {
  Paper,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  Box,
  Stack,
  Chip,
  LinearProgress,
  Avatar,
  Tooltip,
} from '@mui/material';
import { getLeadershipSummary } from '../../services/leadershipService';
import { AuthContext } from '../../contexts/AuthContext';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';

export default function LeaderEvaluationSummary() {
  const [summary, setSummary] = useState([]);
  const { fetchWithAuth } = useContext(AuthContext) || {};

  useEffect(() => {
    getLeadershipSummary(fetchWithAuth)
      .then(data => setSummary(Array.isArray(data) ? data : []))
      .catch(() => setSummary([]));
  }, [fetchWithAuth]);

  return (
    <Paper sx={{ p: 3, mt: 3, borderRadius: 4, background: '#f6f7fb' }}>
      <Card elevation={0} sx={{ borderRadius: 3, background: 'transparent' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: '#222' }}>
            <TrendingUpIcon sx={{ mr: 1, color: '#0073ea' }} />
            Leadership Evaluation Summary
          </Typography>
          <List>
            {summary.length === 0 && (
              <ListItem>
                <Typography variant="body2" color="text.secondary">
                  No evaluation data available.
                </Typography>
              </ListItem>
            )}
            {summary.map(row => (
              <ListItem
                key={row.leader_id}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  bgcolor: '#fff',
                  boxShadow: 1,
                  alignItems: 'flex-start',
                  '&:hover': { boxShadow: 3, bgcolor: '#f0f6ff' },
                  transition: 'all 0.2s',
                }}
              >
                <Avatar sx={{ bgcolor: '#0073ea', mr: 2 }}>
                  {row.name?.[0] || <PersonIcon />}
                </Avatar>
                <Box sx={{ width: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {row.name}
                    </Typography>
                    <Chip
                      label={row.mentorship_given ? 'Mentor' : 'Leader'}
                      color={row.mentorship_given ? 'success' : 'default'}
                      size="small"
                      sx={{ fontWeight: 500, borderRadius: 2 }}
                    />
                  </Stack>
                  <Stack direction="row" spacing={2} mb={1}>
                    <Tooltip title="Attendance Consistency">
                      <Chip
                        icon={<GroupIcon sx={{ color: '#0073ea' }} />}
                        label={`Attendance: ${row.attendance_consistency ?? '—'}%`}
                        size="small"
                        sx={{ bgcolor: '#e3f2fd', color: '#0073ea', fontWeight: 500 }}
                      />
                    </Tooltip>
                    <Tooltip title="Follow-Up Rate">
                      <Chip
                        label={`Follow-Up: ${row.follow_up_rate ?? '—'}%`}
                        size="small"
                        sx={{ bgcolor: '#e8f5e9', color: '#388e3c', fontWeight: 500 }}
                      />
                    </Tooltip>
                    <Tooltip title="Discipleship Progress">
                      <Chip
                        label={`Discipleship: ${row.discipleship_progress ?? '—'}%`}
                        size="small"
                        sx={{ bgcolor: '#fffde7', color: '#fbc02d', fontWeight: 500 }}
                      />
                    </Tooltip>
                    <Tooltip title="Group Growth">
                      <Chip
                        label={`Growth: ${row.group_growth ?? '—'}%`}
                        size="small"
                        sx={{ bgcolor: '#f3e5f5', color: '#8e24aa', fontWeight: 500 }}
                      />
                    </Tooltip>
                  </Stack>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Overall Score:</strong>
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <StarIcon sx={{ color: '#ffb300' }} />
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#222' }}>
                        {row.overall_score ?? '—'}
                      </Typography>
                      <Box sx={{ flex: 1, ml: 2 }}>
                        <LinearProgress
                          variant="determinate"
                          value={Number(row.overall_score) * 20 || 0}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': { bgcolor: '#0073ea' },
                          }}
                        />
                      </Box>
                    </Stack>
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </Paper>
  );
}