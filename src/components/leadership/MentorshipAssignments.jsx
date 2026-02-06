import React, { useEffect, useState, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Box,
  CircularProgress,
  Divider,
  Stack,
  Chip,
  Tooltip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getMentorshipAssignments } from '../../services/leadershipService';
import { AuthContext } from '../../contexts/AuthContext';

export default function MentorshipAssignmentsModal({ leaderId, open, onClose }) {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(false);
  const { fetchWithAuth } = useContext(AuthContext);

  useEffect(() => {
    if (!open || !leaderId) return;
    setLoading(true);
    getMentorshipAssignments(fetchWithAuth, leaderId)
      .then((data) => setMentees(data || []))
      .catch((err) => {
        console.error('Failed to fetch mentorship assignments:', err);
        setMentees([]);
      })
      .finally(() => setLoading(false));
  }, [leaderId, open, fetchWithAuth]);

  // Calculate mentorship stats
  const completedCount = mentees.filter((m) => m.completed_at).length;
  const total = mentees.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Badge logic
  let badge = null;
  if (progress === 100 && total > 0) badge = { label: 'Gold', color: '#FFD700', emoji: '🥇' };
  else if (progress >= 50) badge = { label: 'Silver', color: '#C0C0C0', emoji: '🥈' };
  else if (progress >= 25) badge = { label: 'Bronze', color: '#CD7F32', emoji: '🥉' };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Mentorship Assignments
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="subtitle1" fontWeight={600}>
              Progress: {completedCount}/{total} ({progress}%)
            </Typography>
            {badge && (
              <Tooltip title={`${badge.label} Mentor`}>
                <Chip
                  icon={<EmojiEventsIcon sx={{ color: badge.color }} />}
                  label={`${badge.emoji} ${badge.label}`}
                  sx={{
                    bgcolor: '#fffbe6',
                    color: '#333',
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                  size="small"
                />
              </Tooltip>
            )}
          </Stack>
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : mentees.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              No mentorship assignments yet.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {mentees.map((assignment, index) => {
              const initials = `${assignment.mentee_first_name?.[0] || ''}${assignment.mentee_surname?.[0] || ''}`;
              const isCompleted = !!assignment.completed_at;
              return (
                <React.Fragment key={assignment.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0, py: 1, bgcolor: isCompleted ? '#f0f7fa' : undefined }}>
                    <Stack direction="row" spacing={2} alignItems="center" width="100%">
                      <Avatar
                        sx={{
                          bgcolor: isCompleted ? 'success.main' : 'primary.main',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      >
                        {initials.toUpperCase()}
                      </Avatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight={500}>
                            {assignment.mentee_first_name} {assignment.mentee_surname}
                          </Typography>
                        }
                        secondary={
                          <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.5}>
                            <Chip
                              size="small"
                              label={`Started: ${assignment.started_at?.substring(0, 10) || 'N/A'}`}
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={
                                isCompleted
                                  ? `Completed: ${assignment.completed_at.substring(0, 10)}`
                                  : 'In Progress'
                              }
                              color={isCompleted ? 'success' : 'default'}
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`Notes: ${assignment.notes || '—'}`}
                              color="secondary"
                              variant="outlined"
                            />
                          </Stack>
                        }
                      />
                    </Stack>
                  </ListItem>
                  {index !== mentees.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
}
