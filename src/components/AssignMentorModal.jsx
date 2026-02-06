import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Button, Typography, Autocomplete, TextField, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { AuthContext } from '../../contexts/AuthContext';
import { getMembers } from '../../services/memberService'; // You need to implement this
import { assignMentor } from '../../services/leadershipService'; // You need to implement this

export default function AssignMentorModal({ open, onClose }) {
  const { fetchWithAuth } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Fetch all members and mentors (filter mentors as needed)
    getMembers(fetchWithAuth)
      .then(data => {
        setMembers(data || []);
        setMentors((data || []).filter(m => m.is_mentor)); // Adjust filter as needed
      })
      .finally(() => setLoading(false));
  }, [open, fetchWithAuth]);

  const handleAssign = async () => {
    if (!selectedMember || !selectedMentor) return;
    setAssigning(true);
    try {
      await assignMentor(fetchWithAuth, selectedMember.id, selectedMentor.id);
      onClose(true); // Optionally pass success
    } catch (err) {
      alert('Failed to assign mentor: ' + err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Assign Mentor
        <IconButton onClick={() => onClose(false)} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Autocomplete
              options={members}
              getOptionLabel={m => `${m.first_name} ${m.surname}`}
              value={selectedMember}
              onChange={(_, v) => setSelectedMember(v)}
              renderInput={params => <TextField {...params} label="Select Member" margin="normal" />}
            />
            <Autocomplete
              options={mentors}
              getOptionLabel={m => `${m.first_name} ${m.surname}`}
              value={selectedMentor}
              onChange={(_, v) => setSelectedMentor(v)}
              renderInput={params => <TextField {...params} label="Select Mentor" margin="normal" />}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancel</Button>
        <Button
          onClick={handleAssign}
          disabled={!selectedMember || !selectedMentor || assigning}
          variant="contained"
        >
          {assigning ? 'Assigning...' : 'Assign Mentor'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}