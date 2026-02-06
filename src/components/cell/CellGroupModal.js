// src/components/CellGroupModal.jsx
import React, { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, TextField, Button, Autocomplete, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { getCellGroupFormLookups, saveCellGroup } from '../../services/cellGroupService';
import { getRoles as fetchRoles } from '../../services/roleService';
import { AuthContext } from '../../contexts/AuthContext';

export default function CellGroupModal({
  open = false,
  onClose = () => {},
  lookups = { zones: [], statuses: [], leaders: [] },
  onSave = async () => {},
  initial = null,
  loading = false,
  ...props
}) {
  const defaultFormValues = {
    id: null,
    name: '',
    leader_id: null,      // use null instead of ''
    role_id: null,        // use null instead of ''
    zone_id: null,
    status_id: null,
    meeting_day: '',
    meeting_time: '',
    meeting_location: '',
    notes: '',
  };

  const [form, setForm] = useState({ ...defaultFormValues, ...initial });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'error' });
  const [localLookups, setLocalLookups] = useState({ roles: [], rolesRaw: [], zones: [], statuses: [], leaders: [], unassignedMembers: [] });
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [localRoles, setLocalRoles] = useState([]);

  const { fetchWithAuth } = useContext(AuthContext);

  // helper to normalize fetchWithAuth (same logic used elsewhere)
  function normalizeFetch(fn) {
    if (typeof fn === 'function') return fn;
    if (fn && typeof fn.fetchWithAuth === 'function') return fn.fetchWithAuth;
    if (fn && typeof fn.value === 'object' && typeof fn.value.fetchWithAuth === 'function') return fn.value.fetchWithAuth;
    return null;
  }
  const fn = normalizeFetch(fetchWithAuth);

  useEffect(() => {
    setForm({ ...defaultFormValues, ...initial });
  }, [initial]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingLookups(true);
      try {
        if (lookups) {
          setLocalLookups({
            roles: lookups.roles || lookups.rolesRaw || [],
            rolesRaw: lookups.rolesRaw || lookups.roles || [],
            zones: lookups.zones || [],
            statuses: lookups.statuses || [],
            leaders: lookups.leaders || [],
            unassignedMembers: lookups.unassignedMembers || []
          });
        } else {
          // pass fetch function to service
          const data = await getCellGroupFormLookups(fn);
          if (!mounted) return;
          setLocalLookups({
            roles: data.roles || data.rolesRaw || [],
            rolesRaw: data.rolesRaw || data.roles || [],
            zones: data.zones || [],
            statuses: data.statuses || [],
            leaders: data.leaders || [],
            unassignedMembers: data.unassignedMembers || []
          });
        }

        // load local roles, pass fn if available
        const r = await fetchRoles(fn);
        if (!mounted) return;
        setLocalRoles(Array.isArray(r) ? r : []);
      } catch (err) {
        console.error('Failed to load lookups', err);
        if (!mounted) return;
        setLocalLookups({ roles: [], rolesRaw: [], zones: [], statuses: [], leaders: [], unassignedMembers: [] });
      } finally {
        if (mounted) setLoadingLookups(false);
      }
    };
    if (open) load();
    return () => { mounted = false; };
  }, [open, lookups, fn]);

  const handleAutocomplete = (k, v, getId = x => x?.id) =>
    setForm(f => ({ ...f, [k]: v ? getId(v) : '' }));

  const handleChange = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e && e.preventDefault && e.preventDefault();

    // ensure `form` exists and contains required fields
    if (!form || typeof form !== 'object') {
      console.error('CellGroupModal: no form state to submit', form);
      // show UI feedback if you have a local snack state
      return;
    }

    // normalize payload (example: convert selected leader object to id)
    const payload = { ...form };
    if (payload.leader_id && typeof payload.leader_id === 'object') {
      payload.leader_id = payload.leader_id.id ?? payload.leader_id.value ?? payload.leader_id;
    }

    try {
      // call onSave with payload so parent receives the data
      if (typeof onSave === 'function') {
        await onSave(payload);
      } else {
        // fallback: call save locally if component handles saving itself
        await saveCellGroup(payload);
      }
    } catch (err) {
      console.error('handleSubmit failed', err);
      throw err;
    }
  }

  const rolesSource = localRoles.length ? localRoles : (localLookups.roles || localLookups.rolesRaw || []);
  // normalize role ids to numbers to avoid type mismatches
  const normalizedRoles = (Array.isArray(rolesSource) ? rolesSource : []).map(r => ({ ...r, id: r?.id != null ? Number(r.id) : null }));

  const zoneValue = localLookups.zones?.find(z => z.id === form.zone_id) || null;
  const statusValue = localLookups.statuses?.find(s => s.id === form.status_id) || null;
  const leaderValue = localLookups.leaders?.find(l => l.id === form.leader_id) || null;
  const roleValue = normalizedRoles.find(r => r.id === (form.role_id != null ? Number(form.role_id) : null)) || null;

  return (
    <>
      <Dialog open={open} onClose={() => !loading && onClose()} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? "Edit Cell Group" : "Create Cell Group"}</DialogTitle>
        <DialogContent>
          {loadingLookups && <Box display="flex" justifyContent="center" sx={{ my: 2 }}><CircularProgress size={28} /></Box>}
          <Box component="form" sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Cell Name" value={form.name} onChange={handleChange('name')} required fullWidth />
            <Autocomplete
              options={localLookups.zones || []}
              getOptionLabel={z => z?.name || ''}
              value={zoneValue}
              onChange={(e, v) => handleAutocomplete('zone_id', v)}
              renderInput={params => <TextField {...params} label="Zone" />}
              fullWidth
            />
            <Autocomplete
              options={localLookups.statuses || []}
              getOptionLabel={s => s?.name || ''}
              value={statusValue}
              onChange={(e, v) => handleAutocomplete('status_id', v)}
              renderInput={params => <TextField {...params} label="Status" />}
              fullWidth
            />
            <Autocomplete
              options={localLookups.leaders || []}
              getOptionLabel={l => l ? `${l.first_name || ''} ${l.surname || ''}`.trim() : ''}
              value={leaderValue}
              onChange={(e, v) => setForm(f => ({ ...f, leader_id: v ? Number(v.id ?? v.member_id) : null }))}
              renderInput={(params) => <TextField {...params} label="Leader" />}
            />
            <Autocomplete
              options={normalizedRoles}
              getOptionLabel={(r) => r?.name || r?.label || ''}
              value={roleValue}
              onChange={(e, v) => setForm(f => ({ ...f, role_id: v ? Number(v.id ?? v.value) : null }))}
              renderInput={(params) => <TextField {...params} label="Default Role" />}
            />
            <Autocomplete
              options={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']}
              getOptionLabel={d => d}
              value={form.meeting_day || null}
              onChange={(e, v) => setForm(f => ({ ...f, meeting_day: v || '' }))}
              renderInput={params => <TextField {...params} label="Meeting Day" />}
              fullWidth
            />
            <TextField label="Meeting Time" type="time" value={form.meeting_time || ''} onChange={handleChange('meeting_time')} fullWidth />
            <TextField label="Location" value={form.meeting_location || ''} onChange={handleChange('meeting_location')} fullWidth />
            <TextField label="Notes" value={form.notes || ''} onChange={handleChange('notes')} multiline fullWidth />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose()} color="secondary">Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}

CellGroupModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  lookups: PropTypes.object,
  initial: PropTypes.object,
  onSave: PropTypes.func,
  loading: PropTypes.bool
};
