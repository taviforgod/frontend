// components/MentorAssignCard.jsx
import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Autocomplete, List, ListItem, ListItemText, Stack } from '@mui/material';
import { getMembers } from '../services/memberService';
import { assignMentor, getAssignmentsByMentor } from '../services/mentorshipService';
import { AuthContext } from '../contexts/AuthContext'; // <-- Add this import

export default function MentorAssignCard({ mentorId }) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedMentee, setSelectedMentee] = useState(null);
  const [notes, setNotes] = useState('');
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  useEffect(() => { loadMembers(); loadAssignments(); }, [mentorId]);

  async function loadMembers() {
    try { 
      const m = fetchWithAuth ? await getMembers(fetchWithAuth) : await getMembers();
      setMembers(m || []); 
    } catch(e){ 
      console.error(e); 
    }
  }
  async function loadAssignments() {
    if (!mentorId) return;
    try { 
      const res = fetchWithAuth ? await getAssignmentsByMentor(fetchWithAuth, mentorId) : await getAssignmentsByMentor(mentorId);
      setAssignments(res || []); 
    } catch(e){ 
      console.error(e); 
    }
  }

  async function onAssign() {
    if (!mentorId) return alert('Missing mentor id');
    if (!selectedMentee || !selectedMentee.id) return alert('Select a mentee');
    try {
      if (fetchWithAuth) {
        await assignMentor(fetchWithAuth, { mentor_id: mentorId, mentee_id: selectedMentee.id, notes });
      } else {
        await assignMentor({ mentor_id: mentorId, mentee_id: selectedMentee.id, notes });
      }
      setOpen(false); setSelectedMentee(null); setNotes('');
      loadAssignments();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Assign failed');
    }
  }

  return (
    <Box sx={{ mt:2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Mentor Assignments</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Assign Mentee</Button>
      </Stack>

      <List dense>
        {assignments.length === 0 && <ListItem><ListItemText primary="No mentees yet." /></ListItem>}
        {assignments.map(a => (
          <ListItem key={a.id}>
            <ListItemText
              primary={a.mentee_name || `Mentee ID: ${a.mentee_id}`}
              secondary={a.notes ? a.notes : `Started: ${new Date(a.started_at).toLocaleDateString()}`}
            />
          </ListItem>
        ))}
      </List>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>Assign a Mentee</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={members}
            getOptionLabel={(o) => o ? `${o.first_name} ${o.last_name || o.surname || ''}` : ''}
            onChange={(_, v) => setSelectedMentee(v)}
            renderInput={(params) => <TextField {...params} label="Select Mentee" margin="normal" fullWidth />}
          />
          <TextField label="Notes (optional)" fullWidth margin="normal" value={notes} onChange={(e)=>setNotes(e.target.value)} multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={onAssign}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
