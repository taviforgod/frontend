// src/components/AddVisitorStepper.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Modal, Box, Typography, Stepper, Step, StepLabel, Grid, TextField, Button, Autocomplete, IconButton, Snackbar } from '@mui/material';
import { createVisitor } from '../../services/visitorService';
import { getCellGroups } from '../../services/cellGroupService';
import { getMembers } from '../../services/memberService';
import { AuthContext } from '../../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';
import { X } from 'lucide-react'; // added

const steps = ['Personal Info','Contact Info','Assignment & Status'];
const ageGroups = ["Teen", "Young Adult", "Adult", "Elder"];
const churchAffiliations = ["Member", "Non-Member", "Seeker", "Backslider"];
const followUpMethods = ["Call", "Visit", "SMS", "WhatsApp", "Email"];
const followUpStatuses = ["pending", "in_progress", "done"];

const defaultForm = {
  first_name:'', surname:'', contact_primary:'', email:'', home_address:'', date_of_first_visit:'', how_heard:'',
  age_group:'', church_affiliation:'', prayer_requests:'', notes:'', invited_by:'', follow_up_method:'', assigned_member_id:'',
  next_follow_up_date:'', status:'new', follow_up_status:'pending', cell_group_id: ''
};

export default function AddVisitorStepper({
  open = true,
  onClose = () => {},
  initialGroupId = null,
  initialData = null,
  onSubmit = null,
  editMode = false,
  churchId = null
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({ ...defaultForm });
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false); // Snackbar state
  const { fetchWithAuth, user } = useContext(AuthContext);

  // Load initial data when editing
  useEffect(() => {
    if (initialData && editMode) {
      setForm({ ...initialData });
    } else {
      setForm({ ...defaultForm, cell_group_id: initialGroupId || '' });
    }
  }, [editMode, initialData, initialGroupId, open]);

  // Fetch groups and members
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [g, m] = await Promise.all([
          getCellGroups(fetchWithAuth, { limit: 1000 }),
          getMembers(fetchWithAuth, { limit: 1000 })
        ]);
        if (!mounted) return;
        setGroups(Array.isArray(g) ? g : []);
        setMembers(Array.isArray(m) ? m : []);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => { mounted = false; };
  }, [fetchWithAuth]);

  const handleNext = () => setActiveStep(s => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setActiveStep(s => Math.max(s - 1, 0));

  const submit = async (e) => {
    e?.preventDefault?.();
    const payload = { ...form, church_id: churchId || user?.church_id };
    if (!payload.church_id) {
      alert('Church ID is required to create or edit a visitor');
      return;
    }
    try {
      if (editMode && onSubmit) {
        await onSubmit(payload);
      } else {
        await createVisitor(fetchWithAuth, payload);
      }
      setSnackbarOpen(true); // Open snackbar on successful save
      setForm({ ...defaultForm, cell_group_id: initialGroupId || '' }); // Reset form
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to save visitor');
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // member options with unique ids to avoid duplicate-key warnings
  const memberOptions = members.map(m => ({ label: `${m.first_name} ${m.surname}`, value: m.id, email: m.email || '' }));

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{ position:'absolute', top:'5%', left:'50%', transform:'translateX(-50%)', width:'95%', maxWidth:900, bgcolor:'background.paper', p:2 }}>
        {/* Close button */}
        <IconButton
          onClick={() => onClose(false)}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8 }}
          aria-label="close"
        >
          <X />
        </IconButton>

        <Typography variant="h6" gutterBottom>{editMode ? 'Edit Visitor' : 'Add Visitor'}</Typography>
        <Stepper activeStep={activeStep} sx={{ my:2 }}>
          {steps.map(s => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>

        <form onSubmit={submit}>
          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField label="First Name" required fullWidth value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></Grid>
              <Grid item xs={12} md={4}><TextField label="Surname" fullWidth value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} /></Grid>
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterLuxon}>
                  <DatePicker
                    label="Date of First Visit"
                    value={form.date_of_first_visit ? DateTime.fromISO(form.date_of_first_visit) : null}
                    onChange={value => setForm(f => ({ ...f, date_of_first_visit: value ? value.toISODate() : '' }))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        InputLabelProps: { shrink: true },
                      }
                    }}
                    disableFuture
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={4}>
                <Autocomplete options={ageGroups} value={form.age_group || null} onChange={(_, v) => setForm(f => ({ ...f, age_group: v || '' }))} renderInput={params => <TextField {...params} label="Age Group" fullWidth />} freeSolo />
              </Grid>

              <Grid item xs={12} md={4}>
                <Autocomplete options={churchAffiliations} value={form.church_affiliation || null} onChange={(_, v) => setForm(f => ({ ...f, church_affiliation: v || '' }))} renderInput={params => <TextField {...params} label="Church Affiliation" fullWidth />} freeSolo />
              </Grid>

              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={memberOptions}
                  getOptionLabel={(opt) => opt?.label || ''}
                  value={memberOptions.find(opt => opt.value === form.invited_by) || null}
                  onChange={(_, v) => setForm(f => ({ ...f, invited_by: v ? v.value : '' }))}
                  renderInput={params => <TextField {...params} label="Invited By" fullWidth />}
                  isOptionEqualToValue={(a, b) => (a?.value ?? a?.label) === (b?.value ?? b?.label)}
                  renderOption={(props, option) => <li {...props} key={option.value}>{option.label}{option.email ? ` • ${option.email}` : ''}</li>}
                />
              </Grid>

              <Grid item xs={12}><Box sx={{ display:'flex', justifyContent:'flex-end' }}><Button variant="contained" onClick={handleNext}>Next</Button></Box></Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><TextField label="Phone" value={form.contact_primary} onChange={e => setForm(f => ({ ...f, contact_primary: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} md={4}><TextField label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} md={4}><TextField label="Prayer Requests" value={form.prayer_requests} onChange={e => setForm(f => ({ ...f, prayer_requests: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} md={4}><TextField label="Home Address" value={form.home_address} onChange={e => setForm(f => ({ ...f, home_address: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} md={4}><TextField label="How Heard" value={form.how_heard} onChange={e => setForm(f => ({ ...f, how_heard: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12} md={4}><TextField label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} fullWidth /></Grid>
              <Grid item xs={12}><Box sx={{ display:'flex', justifyContent:'space-between' }}><Button onClick={handleBack}>Back</Button><Button variant="contained" onClick={handleNext}>Next</Button></Box></Grid>
            </Grid>
          )}

          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={groups || []}
                  getOptionLabel={g => g?.name || ''}
                  value={groups.find(g => g.id === form.cell_group_id) || null}
                  onChange={(_, v) => setForm(f => ({ ...f, cell_group_id: v ? v.id : '' }))}
                  renderInput={params => <TextField {...params} label="Cell Group" fullWidth />}
                  isOptionEqualToValue={(a,b) => (a?.id ?? a?.name) === (b?.id ?? b?.name)}
                  renderOption={(props, option) => <li {...props} key={option.id}>{option.name}</li>}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterLuxon}>
                  <DatePicker
                    label="Next Follow Up Date"
                    value={form.next_follow_up_date ? DateTime.fromISO(form.next_follow_up_date) : null}
                    onChange={value => setForm(f => ({ ...f, next_follow_up_date: value ? value.toISODate() : '' }))}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        InputLabelProps: { shrink: true },
                      }
                    }}
                    disablePast
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} md={4}><Autocomplete options={followUpMethods} value={form.follow_up_method || null} onChange={(_, v) => setForm(f => ({ ...f, follow_up_method: v || '' }))} renderInput={params => <TextField {...params} label="Follow Up Method" fullWidth />} freeSolo /></Grid>

              <Grid item xs={12} md={4}><Autocomplete options={followUpStatuses} value={form.follow_up_status || null} onChange={(_, v) => setForm(f => ({ ...f, follow_up_status: v || '' }))} renderInput={params => <TextField {...params} label="Follow Up Status" fullWidth />} freeSolo /></Grid>

              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={memberOptions}
                  getOptionLabel={(opt) => opt?.label || ''}
                  value={memberOptions.find(opt => opt.value === form.assigned_member_id) || null}
                  onChange={(_, v) => setForm(f => ({ ...f, assigned_member_id: v ? v.value : '' }))}
                  renderInput={params => <TextField {...params} label="Assigned Member" fullWidth />}
                  isOptionEqualToValue={(a, b) => (a?.value ?? a?.label) === (b?.value ?? b?.label)}
                  renderOption={(props, option) => <li {...props} key={option.value}>{option.label}{option.email ? ` • ${option.email}` : ''}</li>}
                />
              </Grid>

              <Grid item xs={12}><Box sx={{ display:'flex', justifyContent:'space-between' }}>
                <Button onClick={handleBack}>Back</Button>
                <Button variant="contained" onClick={submit}>{editMode ? 'Save Changes' : 'Add Visitor'}</Button>
              </Box></Grid>
            </Grid>
          )}
        </form>

        {/* Snackbar for success message */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message="Visitor saved successfully!"
        />
      </Box>
    </Modal>
  );
}
