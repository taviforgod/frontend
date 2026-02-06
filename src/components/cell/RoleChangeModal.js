import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Autocomplete, TextField, Snackbar, Alert } from '@mui/material';

export default function RoleChangeModal({ open, onClose, member, roles, onChange, loading }) {
  const [role, setRole] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'error' });

  useEffect(() => { setRole(null); }, [open]);

  const handleSubmit = () => {
    if (!role) {
      setSnack({ open: true, message: 'Select role', severity: 'error' });
      return;
    }
    onChange(role);
  };

  return (
    <>
      <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="xs">
        <DialogTitle>Change Role for {member?.first_name} {member?.surname}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Autocomplete
            options={roles}
            getOptionLabel={r => r ? r.description || r.name : ""}
            value={role}
            onChange={(e, v) => setRole(v)}
            renderInput={params => <TextField {...params} label="Role" required />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose()}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}