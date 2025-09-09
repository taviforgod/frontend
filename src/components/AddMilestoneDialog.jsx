import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert
} from '@mui/material';
import { getMilestoneTemplates } from '../api/milestoneTemplates';
import { assignMilestone } from '../api/milestoneRecords';

export default function AddMilestoneDialog({ open, onClose, memberId, onSuccess }) {
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMilestoneTemplates();
        setTemplates(data);
      } catch {
        setSnackbar({ open: true, message: 'Failed to load templates', severity: 'error' });
      }
    };
    if (open) {
      setSelected('');
      load();
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!selected) {
      return setSnackbar({ open: true, message: 'Please select a milestone', severity: 'warning' });
    }

    try {
      await assignMilestone({ member_id: memberId, template_id: selected });
      setSnackbar({ open: true, message: 'Milestone assigned successfully!', severity: 'success' });
      onSuccess(); // Refresh checklist in parent
      onClose();   // Close dialog
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to assign milestone', severity: 'error' });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Assign Milestone</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Milestone</InputLabel>
            <Select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              label="Select Milestone"
            >
              {templates.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Assign</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
