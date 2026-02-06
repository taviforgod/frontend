// src/components/FollowUpModal.jsx
import React, { useEffect, useState, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Box,
  List, ListItem, ListItemText, Typography, CircularProgress, Snackbar, Alert
} from '@mui/material';
import { getFollowUpsForVisitor, addFollowUp } from '../../services/visitorService';
import { getMembers } from '../../services/memberService';
import { DateTime } from 'luxon';
import { AuthContext } from '../../contexts/AuthContext';

const FollowUpModal = ({ open, visitor, onClose, onSaved, getCurrentDateTime }) => {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ assigned_member_id: null, method: 'Call', notes: '', outcome: '' });
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        setList(await getFollowUpsForVisitor(fetchWithAuth, visitor.id) || []);
        setMembers(await getMembers(fetchWithAuth) || []);
      } catch (err) {
        setSnack({ open: true, message: err.message || 'Failed to load data', severity: 'error' });
      } finally { setLoading(false); }
    })();
  }, [open, visitor, fetchWithAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!visitor || !visitor.id) {
        setSnack({ open: true, message: 'Visitor is missing or invalid.', severity: 'error' });
        setSaving(false);
        return;
      }
      await addFollowUp(fetchWithAuth, {
        ...form,
        visitor_id: visitor.id,
        followup_date: getCurrentDateTime ? getCurrentDateTime() : DateTime.now().toUTC().toISO(),
      });
      setSnack({ open: true, message: 'Follow-up saved', severity: 'success' });
      onSaved();
      onClose();
    } catch (err) {
      setSnack({ open: true, message: err.message || 'Failed to save follow-up', severity: 'error' });
    } finally { setSaving(false); }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Follow-ups — {visitor?.first_name} {visitor?.surname}</DialogTitle>
        <DialogContent>
          {loading ? <Box sx={{ display:'flex', justifyContent:'center', p:2 }}><CircularProgress /></Box> : (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>History</Typography>
              <List dense sx={{ maxHeight: 220, overflow: 'auto', mb: 2 }}>
                {list.length === 0 ? <ListItem><ListItemText primary="No follow-ups yet" /></ListItem> : list.map(f => (
                  <ListItem key={f.id} sx={{ borderBottom: '1px solid #eee' }}>
                    <ListItemText
                      primary={`${new Date(f.followup_date).toLocaleString()} — ${f.method || ''} ${f.outcome ? `(${f.outcome})` : ''}`}
                      secondary={`${f.notes || ''} ${f.assigned_first_name ? `• Assigned: ${f.assigned_first_name} ${f.assigned_surname || ''}` : ''}`}
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2">Add Follow-up</Typography>
              <Box sx={{ display:'flex', gap:1, flexDirection:'column', mt:1 }}>
                <Autocomplete
                  options={members || []}
                  getOptionLabel={m => m ? `${m.first_name} ${m.surname}` : ''}
                  renderInput={(params) => <TextField {...params} label="Assign to member (optional)" />}
                  value={members.find(m => m.id === form.assigned_member_id) || null}
                  onChange={(_, v) => setForm(f => ({ ...f, assigned_member_id: v ? v.id : null }))}
                  isOptionEqualToValue={(a,b)=>a?.id===b?.id}
                />
                <TextField label="Method" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} />
                <TextField label="Outcome" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} />
                <TextField label="Notes" multiline minRows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FollowUpModal;
