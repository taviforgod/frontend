import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert } from '@mui/material';
import { getMilestoneTemplates, assignMilestone } from '../../services/milestoneService';

export default function AddMilestoneDialog({ open, onClose, memberId, onSuccess }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState('');
  const [snack, setSnack] = useState({ open:false, message:'', severity:'success' });

  useEffect(() => {
    const load = async () => {
      try {
        const t = await getMilestoneTemplates();
        setTemplates(t || []);
      } catch (e) {
        setSnack({ open:true, message: e.message, severity:'error' });
      }
    };
    if (open) {
      setSelected('');
      load();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selected) return setSnack({ open:true, message:'Select a milestone', severity:'warning' });
    try {
      await assignMilestone({ member_id: memberId, template_id: selected });
      setSnack({ open:true, message:'Assigned', severity:'success' });
      onSuccess?.();
    } catch (e) {
      setSnack({ open:true, message: e.message, severity:'error' });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Assign Milestone</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Milestone</InputLabel>
            <Select value={selected} label="Select Milestone" onChange={(e)=> setSelected(e.target.value)}>
              {templates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>Assign</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=> setSnack({...snack, open:false})} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity={snack.severity} onClose={()=> setSnack({...snack, open:false})}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}
