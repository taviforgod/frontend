// src/components/InactiveExitForm.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Grid, FormControlLabel, Checkbox, DialogContentText
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { createExit, updateExit, getExit } from '../../services/inactiveExitService';
import { searchMembers, getMemberById, getMembers } from '../../services/memberService';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';
import { AuthContext } from '../../contexts/AuthContext';

const exitTypes = ['inactive', 'resigned', 'moved', 'transferred', 'deceased'];

export default function InactiveExitForm({ open, onClose, onSaved, editId, memberId }) {

  const { fetchWithAuth, ready } = useContext(AuthContext) || {};

  const [form, setForm] = useState({
    member_id: memberId || '',
    exit_type: 'inactive',
    exit_reason: '',
    exit_date: new Date().toISOString().slice(0, 10),
    notes: '',
    is_suggestion: true
  });

  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Autocomplete state
  const [memberQuery, setMemberQuery] = useState('');
  const [memberOptions, setMemberOptions] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);

  // ---------------------------------------------------------
  // LOAD EXIT (EDIT MODE) - wait for auth readiness and pass fetchWithAuth
  // ---------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    if (editId) {
      // wait until AuthContext is ready
      if (!ready || typeof fetchWithAuth !== 'function') return;

      (async () => {
        setLoading(true);
        try {
          const r = await getExit(fetchWithAuth, editId); // pass fetchWithAuth first
          if (!mounted) return;
          setForm({
            member_id: r.member_id,
            exit_type: r.exit_type,
            exit_reason: r.exit_reason,
            exit_date: r.exit_date ? r.exit_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
            notes: r.notes || '',
            is_suggestion: typeof r.is_suggestion === 'boolean' ? r.is_suggestion : true
          });
        } catch (err) {
          console.error('failed to load exit', err);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    } else {
      setForm(s => ({ ...s, member_id: memberId || s.member_id }));
    }

    return () => { mounted = false; };
  }, [editId, open, memberId, fetchWithAuth, ready]);

  // ---------------------------------------------------------
  // LOAD SELECTED MEMBER DETAILS
  // ---------------------------------------------------------
  useEffect(() => {
    if (!form.member_id) {
      setSelectedMember(null);
      return;
    }
    if (!ready || typeof fetchWithAuth !== "function") return;

    let mounted = true;
    (async () => {
      try {
        // fetch member details using new signature (fetchWithAuth first)
        const m = await getMemberById(fetchWithAuth, form.member_id);

        if (!mounted) return;

        if (m) {
          setSelectedMember({
            id: m.id,
            first_name: m.first_name,
            surname: m.surname,
            // normalize possible number fields
            member_no: m.member_no || m.member_number || m.membership_no || ''
          });
        } else {
          setSelectedMember({ id: form.member_id, display: String(form.member_id) });
        }
      } catch (err) {
        console.error('failed to load member', err);
        if (mounted) setSelectedMember({ id: form.member_id, display: String(form.member_id) });
      }
    })();

    return () => { mounted = false; };
  }, [form.member_id, fetchWithAuth, ready]);

  // ---------------------------------------------------------
  // MEMBER SEARCH (DEBOUNCED)
  // ---------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const t = setTimeout(async () => {
      if (!memberQuery) {
        setMemberOptions([]);
        return;
      }
      if (!ready || typeof fetchWithAuth !== "function") return;

      try {
        const res = await searchMembers(fetchWithAuth, memberQuery);
        if (!mounted) return;
        setMemberOptions(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('member search error', err);
      }
    }, 300);

    return () => { mounted = false; clearTimeout(t); };
  }, [memberQuery, fetchWithAuth, ready]);

  // ---------------------------------------------------------
  // FETCH MEMBERS ON FOCUS (SMALL LIST)
  // ---------------------------------------------------------
  const fetchMembersOnFocus = async () => {
    if (!ready || typeof fetchWithAuth !== "function") return;
    try {
      const res = await getMembers(fetchWithAuth);
      setMemberOptions(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('getMembers failed', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(s => ({ ...s, [name]: type === 'checkbox' ? checked : value }));
  };

  const attemptSave = async () => {
    if (!form.is_suggestion) {
      setConfirmOpen(true);
      return;
    }
    await doSave();
  };

  const doSave = async () => {
    if (!ready || typeof fetchWithAuth !== 'function') {
      alert('Not authenticated yet. Please try again shortly.');
      return;
    }

    try {
      setLoading(true);

      if (editId) {
        // pass fetchWithAuth first
        const res = await updateExit(fetchWithAuth, editId, form);
        onSaved && onSaved(res);
      } else {
        const res = await createExit(fetchWithAuth, form);
        onSaved && onSaved(res);
      }

      setConfirmOpen(false);
      onClose();

    } catch (err) {
      alert(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;


  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? 'Edit Exit' : 'Record Inactive Exit'}</DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>

            {/* MEMBER AUTOCOMPLETE */}
            <Grid item xs={12}>
              <Autocomplete
                options={memberOptions}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  if (option.first_name) {
                    const no = option.member_no || option.member_number || option.membership_no || '';
                    return `${option.first_name} ${option.surname || ''}${no ? ` (${no})` : ''}`;
                  }
                  return option.display || String(option.id);
                }}
                value={selectedMember ?? null}
                onChange={(e, v) => {
                  setSelectedMember(v);
                  setForm(f => ({ ...f, member_id: v ? v.id : '' }));
                }}
                inputValue={memberQuery ?? ''}
                onInputChange={(e, v) => setMemberQuery(v ?? '')}
                onFocus={() => { if (!memberOptions.length) fetchMembersOnFocus(); }}
                renderInput={(params) => <TextField {...params} label="Member" required fullWidth />}
                isOptionEqualToValue={(option, value) =>
                  (option?.id ?? option?.display) === (value?.id ?? value?.display)
                }
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Exit Type"
                name="exit_type"
                value={form.exit_type}
                onChange={handleChange}
                fullWidth
              >
                {exitTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterLuxon}>
                <DatePicker
                  label="Exit Date"
                  value={form.exit_date ? DateTime.fromISO(form.exit_date) : null}
                  onChange={date =>
                    setForm(f => ({ ...f, exit_date: date ? date.toISODate() : '' }))
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      InputLabelProps: { shrink: true }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Reason"
                name="exit_reason"
                value={form.exit_reason}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={<Checkbox checked={form.is_suggestion} name="is_suggestion" onChange={handleChange} />}
                label="Is Suggestion"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>

          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={attemptSave} disabled={loading}>
            {loading ? 'Saving...' : (editId ? 'Save' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>


      {/* CONFIRMATION DIALOG */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to proceed? This will mark the member as exited.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={doSave} variant="contained">OK</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
