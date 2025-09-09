import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Autocomplete, Avatar, Stack, Divider, Chip, IconButton, Tooltip, ListItemSecondaryAction, Collapse
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { assignMentor, getAssignmentsByMentor, createSession, removeAssignment, removeSession } from '../../services/mentorshipService';
import { getMembers } from '../../services/memberService';
import { UserPlus, CalendarPlus, Trash2, ChevronDown, ChevronUp, Trash } from 'lucide-react';

export default function MentorshipCard({ mentorId }) {
  const [assignments, setAssignments] = useState([]);
  const [openAssign, setOpenAssign] = useState(false);
  const [openSession, setOpenSession] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [members, setMembers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const { register, handleSubmit, reset, control } = useForm();

  useEffect(() => { load(); }, [mentorId]);
  useEffect(() => { loadMembers(); }, []);

  const load = async () => {
    if (!mentorId) return;
    try {
      const data = await getAssignmentsByMentor(mentorId);
      setAssignments(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMembers = async () => {
    try {
      const data = await getMembers();
      setMembers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const onAssign = async (vals) => {
    if (!mentorId) {
      alert('Mentor ID is missing!');
      return;
    }
    if (!vals.mentee || !vals.mentee.id) {
      alert('Please select a mentee.');
      return;
    }
    try {
      await assignMentor({ mentor_id: mentorId, mentee_id: vals.mentee.id, notes: vals.notes });
      setOpenAssign(false);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddSession = (assignment) => {
    setSelectedAssignment(assignment);
    reset({ session_date: new Date().toISOString().slice(0, 16), duration_minutes: 30, notes: '' });
    setOpenSession(true);
  };

  const onCreateSession = async (vals) => {
    try {
      await createSession({
        assignment_id: selectedAssignment.id,
        session_date: vals.session_date,
        duration_minutes: vals.duration_minutes,
        notes: vals.notes
      });
      setOpenSession(false);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  // Remove mentee (assignment)
  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Remove this mentee from your assignments?')) return;
    try {
      await removeAssignment(assignmentId);
      load();
    } catch (e) {
      alert('Failed to remove mentee.');
    }
  };

  // Remove session (optional)
  const handleRemoveSession = async (sessionId) => {
    if (!window.confirm('Remove this session?')) return;
    try {
      await removeSession(sessionId);
      load();
    } catch (e) {
      alert('Failed to remove session.');
    }
  };

  // Helper to count sessions for each assignment
  const getSessionCount = (assignment) => Array.isArray(assignment.sessions) ? assignment.sessions.length : 0;

  // Toggle expand for sessions
  const handleExpandClick = (assignmentId) => {
    setExpanded(prev => ({ ...prev, [assignmentId]: !prev[assignmentId] }));
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
            <UserPlus size={20} />
          </Avatar>
          <Typography variant="h6" fontWeight={600}>Mentorship</Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<UserPlus size={18} />}
          onClick={() => setOpenAssign(true)}
          sx={{ borderRadius: 2, boxShadow: 1 }}
        >
          Assign Mentor
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Assignments: <b>{assignments.length}</b>
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <List sx={{ mb: 2 }}>
        {assignments.length === 0 && (
          <Typography color="text.secondary" sx={{ px: 2, py: 1 }}>
            No mentees assigned yet.
          </Typography>
        )}
        {assignments.map(a => {
          const mentee = members.find(m => m.id === a.mentee_id);
          const menteeName = mentee
            ? `${mentee.first_name} ${mentee.surname || mentee.last_name || ''}`
            : `ID: ${a.mentee_id}`;
          const sessionCount = getSessionCount(a);

          return (
            <Box
              key={a.id}
              sx={{
                mb: 1,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.8)',
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 4 }
              }}
            >
              <ListItem
                alignItems="flex-start"
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Add Session">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CalendarPlus size={16} />}
                        onClick={() => openAddSession(a)}
                        sx={{ borderRadius: 2 }}
                      >
                        Add Session
                      </Button>
                    </Tooltip>
                    <Tooltip title="Remove Mentee">
                      <IconButton color="error" onClick={() => handleRemoveAssignment(a.id)}>
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={expanded[a.id] ? "Hide Sessions" : "Show Sessions"}>
                      <IconButton onClick={() => handleExpandClick(a.id)}>
                        {expanded[a.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              >
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          bgcolor: 'secondary.main',
                          fontSize: 14,
                          mt: 0.5 
                        }}
                      >
                        {menteeName[0]}
                      </Avatar>
                      <Typography fontWeight={500}>{menteeName}</Typography>
                      <Chip
                        label={`Sessions: ${sessionCount}`}
                        size="small"
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {a.notes
                        ? a.notes
                        : `Started: ${new Date(a.started_at).toLocaleDateString()}`}
                    </Typography>
                  }
                />
              </ListItem>
              <Collapse in={expanded[a.id]} timeout="auto" unmountOnExit>
                <Box sx={{ pl: 7, pr: 2, pb: 1 }}>
                  {Array.isArray(a.sessions) && a.sessions.length > 0 ? (
                    a.sessions.map(session => (
                      <Stack key={session.id} direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Chip
                          label={new Date(session.session_date).toLocaleString()}
                          size="small"
                          color="primary"
                        />
                        <Typography variant="body2" sx={{ fontSize: 13 }}>
                          {session.duration_minutes} min
                        </Typography>
                        {session.notes && (
                          <Typography variant="body2" sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>
                            {session.notes}
                          </Typography>
                        )}
                        <Tooltip title="Remove Session">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveSession(session.id)}
                          >
                            <Trash size={16} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                      No sessions yet.
                    </Typography>
                  )}
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </List>

      {/* Assign Mentor Dialog */}
      <Dialog open={openAssign} onClose={() => setOpenAssign(false)} fullWidth>
        <DialogTitle>Assign Mentor</DialogTitle>
        <DialogContent>
          <form id="assign-form" onSubmit={handleSubmit(onAssign)}>
            <Controller
              name="mentee"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={members}
                  getOptionLabel={(option) => option ? `${option.first_name} ${option.surname}` : ''}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  onChange={(_, value) => field.onChange(value)}
                  renderInput={(params) => <TextField {...params} label="Select Mentee" margin="normal" fullWidth />}
                />
              )}
            />
            <TextField label="Notes" fullWidth margin="normal" {...register('notes')} />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssign(false)}>Cancel</Button>
          <Button type="submit" form="assign-form" variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>

      {/* Add Session Dialog */}
      <Dialog open={openSession} onClose={() => setOpenSession(false)} fullWidth>
        <DialogTitle>Add Session</DialogTitle>
        <DialogContent>
          <form id="session-form" onSubmit={handleSubmit(onCreateSession)}>
            <TextField
              label="Session Date"
              type="datetime-local"
              fullWidth
              margin="normal"
              {...register('session_date')}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Duration (minutes)"
              type="number"
              fullWidth
              margin="normal"
              {...register('duration_minutes')}
            />
            <TextField
              label="Notes"
              fullWidth
              multiline
              minRows={3}
              margin="normal"
              {...register('notes')}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSession(false)}>Cancel</Button>
          <Button type="submit" form="session-form" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
