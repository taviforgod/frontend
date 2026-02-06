import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';
import { getDepartments, assignDepartment } from '../../services/memberService';

export default function AssignDepartmentDialog({ open, onClose, memberId, onSuccess, onOptimisticAdd, onOptimisticCommit, onOptimisticRollback }) {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [role, setRole] = useState('');

  useEffect(() => {
    if (!open) return;
    setSelectedDept(null);
    setRole('');
    (async () => {
      if (!fetchWithAuth) return;
      setLoading(true);
      try {
        const depts = await getDepartments(fetchWithAuth);
        setDepartments(depts || []);
      } catch (err) {
        console.error('Failed to load departments', err);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, fetchWithAuth]);

  const handleSubmit = async () => {
    if (!selectedDept) return;

    const tempId = `temp-dept-${Date.now()}`;
    const optimistic = {
      id: tempId,
      department_id: selectedDept.id,
      department_name: selectedDept.name,
      role: role || 'Member',
      assigned_at: new Date().toISOString(),
      _optimistic: true,
    };

    if (typeof onOptimisticAdd === 'function') {
      try {
        onOptimisticAdd(optimistic);
      } catch (e) {
        // ignore
      }
    }

    try {
      const created = await assignDepartment(fetchWithAuth, memberId, { department_id: selectedDept.id, role });
      if (typeof onOptimisticCommit === 'function') {
        onOptimisticCommit(tempId, created);
      } else if (typeof onSuccess === 'function') {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Assign department failed', err);
      if (typeof onOptimisticRollback === 'function') {
        onOptimisticRollback(tempId, err);
      }
      alert(err.message || 'Failed to assign department');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Assign to Department</DialogTitle>
      <DialogContent>
        {loading ? <CircularProgress size={20} /> : (
          <TextField
            select
            fullWidth
            label="Department"
            value={selectedDept?.id || ''}
            onChange={(e) => setSelectedDept(departments.find(d => d.id === Number(e.target.value)))}
            sx={{ mb: 2 }}
          >
            {departments.map(d => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          fullWidth
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          helperText="Optional role/title in the department"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!selectedDept}>Assign</Button>
      </DialogActions>
    </Dialog>
  );
}