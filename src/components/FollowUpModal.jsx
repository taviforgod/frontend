// components/FollowUpModal.jsx
import React, { useState, useEffect, useContext } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  List,
  ListItem,
  Typography,
  Autocomplete
} from "@mui/material";
import { getFollowUpsForVisitor, createFollowUp } from "../services/followupService";
import { AuthContext } from "../contexts/AuthContext"; // <-- Add this import
import { DateTime } from 'luxon';

export default function FollowUpModal({ open, visitor, onClose, members = [] }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ method: "call", notes: "", outcome: "", assigned_member_id: null });
  const [saving, setSaving] = useState(false);
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  useEffect(() => {
    if (!visitor || !open) return;
    (async () => {
      const f = fetchWithAuth
        ? await getFollowUpsForVisitor(fetchWithAuth, visitor.id)
        : await getFollowUpsForVisitor(visitor.id);
      setItems(f || []);
    })();
  }, [visitor, open, fetchWithAuth]);

  const add = async () => {
    if (!visitor) return;
    setSaving(true);
    try {
      if (fetchWithAuth) {
        await createFollowUp(fetchWithAuth, { visitor_id: visitor.id, ...form });
      } else {
        await createFollowUp({ visitor_id: visitor.id, ...form });
      }
      const f = fetchWithAuth
        ? await getFollowUpsForVisitor(fetchWithAuth, visitor.id)
        : await getFollowUpsForVisitor(visitor.id);
      setItems(f || []);
      setForm({ method: "call", notes: "", outcome: "", assigned_member_id: null });
      onClose(true);
    } catch (err) {
      console.error('add followup error', err);
      onClose(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} fullWidth maxWidth="sm">
      <DialogTitle>Follow-ups for {visitor?.first_name} {visitor?.surname}</DialogTitle>
      <DialogContent>
        <List>
          {items.map(i => (
            <ListItem key={i.id}>
              <Stack>
                <Typography variant="body2">
                  {DateTime.fromISO(i.followup_date).toLocaleString(DateTime.DATETIME_MED)} — {i.method}
                </Typography>
                <Typography variant="body2">{i.notes}</Typography>
              </Stack>
            </ListItem>
          ))}
        </List>

        <Autocomplete
          options={members}
          getOptionLabel={m => m ? `${m.first_name} ${m.surname}` : ''}
          renderInput={(params) => <TextField {...params} label="Assign to member (optional)" margin="dense" />}
          value={members.find(m => m.id === form.assigned_member_id) || null}
          onChange={(_, v) => setForm(f => ({ ...f, assigned_member_id: v ? v.id : null }))}
          isOptionEqualToValue={(a,b)=>a?.id===b?.id}
          sx={{ mb: 2 }}
        />

        <TextField
          select
          label="Method"
          value={form.method}
          onChange={(e)=> setForm({...form, method: e.target.value})}
          fullWidth
          margin="dense"
        >
          <MenuItem value="call">Phone Call</MenuItem>
          <MenuItem value="visit">Home Visit</MenuItem>
          <MenuItem value="sms">SMS</MenuItem>
        </TextField>

        <TextField
          label="Notes"
          multiline
          rows={3}
          value={form.notes}
          onChange={(e)=> setForm({...form, notes: e.target.value})}
          fullWidth
          margin="dense"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Close</Button>
        <Button variant="contained" onClick={add} disabled={saving || !form.notes}>
          {saving ? 'Saving...' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
