// frontend/components/VisitorsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Paper, Typography, TextField, Button, List, ListItem, Box,
  Autocomplete, Alert, Stepper, Step, StepLabel, Card,
  CardContent, Modal, Chip, MenuItem, Grid
} from '@mui/material';
import {
  listVisitors as getVisitors,
  addVisitor,
  updateVisitor,
  deleteVisitor,
  setFollowUpStatus,
  convertVisitorToMember
} from '../services/visitorNameService';
import { getCellGroups } from '../services/cellModuleService';
import { getMembers } from '../services/memberService';

const steps = ['Personal Info', 'Contact Info', 'Assignment & Status'];

export default function VisitorsPage() {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const emptyForm = {
    first_name: '',
    surname: '',
    contact_primary: '',
    contact_secondary: '',
    email: '',
    home_address: '',
    date_of_first_visit: '',
    how_heard: '',
    age_group: '',
    church_affiliation: '',
    prayer_requests: '',
    notes: '',
    invited_by: '',
    follow_up_method: '',
    member_id: '',
    next_follow_up_date: '',
    status: 'new',
    follow_up_status: 'pending',
    cell_group_id: ''
  };

  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    (async () => {
      try {
        const [v, g, m] = await Promise.all([getVisitors(), getCellGroups(), getMembers()]);
        setItems(v || []);
        setGroups(g || []);
        setMembers(m || []);
      } catch {
        setError('Failed to load visitors');
      }
    })();
  }, []);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000); // 4 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  const filtered = items
    .filter(v => v.status !== 'converted') // Exclude converted visitors
    .filter(v => {
      const name = `${v.first_name} ${v.surname}`.toLowerCase();
      return name.includes(term.toLowerCase());
    });

  const reset = () => setForm({ ...emptyForm });

  const openEdit = (visitor) => {
    setForm({
      first_name: visitor.first_name || '',
      surname: visitor.surname || '',
      phone: visitor.phone || '',
      whatsapp: visitor.whatsapp || '',
      email: visitor.email || '',
      home_address: visitor.home_address || '',
      date_of_first_visit: visitor.date_of_first_visit || '',
      how_heard: visitor.how_heard || '',
      age_group: visitor.age_group || '',
      church_affiliation: visitor.church_affiliation || '',
      prayer_requests: visitor.prayer_requests || '',
      notes: visitor.notes || '',
      invited_by: visitor.invited_by || '',
      follow_up_method: visitor.follow_up_method || '',
      member_id: visitor.member_id || '',
      next_follow_up_date: visitor.next_follow_up_date || '',
      status: visitor.status || 'new',
      follow_up_status: visitor.follow_up_status || 'pending',
      cell_group_id: visitor.cell_group_id || ''
    });
    setEditing(true);
    setOpen(true);
    setActiveStep(0);
  };

  const handleNext = () => setActiveStep((s) => s + 1);
  const handleBack = () => setActiveStep((s) => s - 1);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateVisitor(form);
      } else {
        await addVisitor(form);
      }
      const v = await getVisitors();
      setItems(v || []);
      setOpen(false);
      reset();
      setEditing(false);
      setActiveStep(0);
    } catch {
      setError(editing ? 'Failed to update visitor' : 'Failed to add visitor');
    }
  };

  const statusColor = (s) =>
    s === 'converted' ? 'success' :
      s === 'followed_up' ? 'info' : 'default';

  const fuColor = (s) =>
    s === 'done' ? 'success' :
      s === 'in_progress' ? 'warning' : 'default';

  return (
    <Box sx={{ p: 2, mt: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Visitors</Typography>

      <Card sx={{ mb: 3, width: '100%' }}>
        <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search name..."
            value={term}
            onChange={e => setTerm(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <Button
            variant="contained"
            onClick={() => { setOpen(true); setActiveStep(0); reset(); setEditing(false); }}
          >
            Add Visitor
          </Button>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <List>
        {filtered.map((v, i) => (
          <ListItem key={i} disableGutters sx={{ mb: 2 }}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {[v.first_name, v.surname].filter(Boolean).join(' ')}
                </Typography>
                <Typography variant="body2">{v.phone || '-'} &nbsp; {v.email || ''}</Typography>
                <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`status: ${v.status}`} color={statusColor(v.status)} size="small" />
                  <Chip label={`follow-up: ${v.follow_up_status}`} color={fuColor(v.follow_up_status)} size="small" />
                </Box>
                {v.notes && <Typography variant="body2" sx={{ mt: 1 }}><strong>Notes:</strong> {v.notes}</Typography>}
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button size="small" onClick={async () => {
                    const next = v.follow_up_status === 'pending' ? 'in_progress' :
                      v.follow_up_status === 'in_progress' ? 'done' : 'pending';
                    await setFollowUpStatus(v.id, next);
                    const items = await getVisitors();
                    setItems(items || []);
                  }}>Toggle Follow-up</Button>
                  <Button size="small" onClick={async () => {
                    await convertVisitorToMember({ id: v.id });
                    const items = await getVisitors();
                    setItems(items || []);
                  }}>Convert → Member</Button>
                  <Button size="small" color="error" onClick={async () => {
                    await deleteVisitor({ id: v.id });
                    const items = await getVisitors();
                    setItems(items || []);
                  }}>Delete</Button>
                  <Button size="small" onClick={() => openEdit(v)}>Edit</Button>
                </Box>
              </CardContent>
            </Card>
          </ListItem>
        ))}
        {filtered.length === 0 && <Typography color="text.secondary">No visitors.</Typography>}
      </List>

      <Modal open={open} onClose={() => { setOpen(false); setEditing(false); setActiveStep(0); }}>
        <Box sx={{ position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', width: '95%', maxWidth: 900, bgcolor: 'background.paper', p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>{editing ? 'Edit Visitor' : 'Add Visitor'}</Typography>
          <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
            {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
          </Stepper>
          <form onSubmit={submit}>
            {activeStep === 0 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField label="First Name" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} required fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Surname" value={form.surname} onChange={e => setForm(p => ({ ...p, surname: e.target.value }))} fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Date of First Visit"
                    type="date"
                    value={form.date_of_first_visit || ''}
                    onChange={e => setForm(p => ({ ...p, date_of_first_visit: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Age Group"
                    value={form.age_group || ''}
                    onChange={e => setForm(p => ({ ...p, age_group: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="Teen">Teen</MenuItem>
                    <MenuItem value="Young Adult">Young Adult</MenuItem>
                    <MenuItem value="Adult">Adult</MenuItem>
                    <MenuItem value="Elder">Elder</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Church Affiliation"
                    value={form.church_affiliation || ''}
                    onChange={e => setForm(p => ({ ...p, church_affiliation: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="Member">Member</MenuItem>
                    <MenuItem value="Non-Member">Non-Member</MenuItem>
                    <MenuItem value="Seeker">Seeker</MenuItem>
                    <MenuItem value="Backslider">Backslider</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="How Heard"
                    value={form.how_heard || ''}
                    onChange={e => setForm(p => ({ ...p, how_heard: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="Friend">Friend</MenuItem>
                    <MenuItem value="Church">Church</MenuItem>
                    <MenuItem value="Outreach">Outreach</MenuItem>
                    <MenuItem value="Online">Online</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                    <Button variant="contained" onClick={handleNext}>Next</Button>
                  </Box>
                </Grid>
              </Grid>
            )}
            {activeStep === 1 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField label="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="WhatsApp" value={form.whatsapp || ''} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Home Address" value={form.home_address || ''} onChange={e => setForm(p => ({ ...p, home_address: e.target.value }))} fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Prayer Requests" value={form.prayer_requests || ''} onChange={e => setForm(p => ({ ...p, prayer_requests: e.target.value }))} fullWidth />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                    <Button variant="outlined" onClick={handleBack}>Back</Button>
                    <Button variant="contained" onClick={handleNext}>Next</Button>
                  </Box>
                </Grid>
              </Grid>
            )}
            {activeStep === 2 && (
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={groups}
                    getOptionLabel={(option) => option.name || ''}
                    value={groups.find(g => g.id === form.cell_group_id) || null}
                    onChange={(_, value) => setForm(p => ({ ...p, cell_group_id: value?.id || '' }))}
                    renderInput={(params) => <TextField {...params} label="Cell Group (optional)" fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={members}
                    getOptionLabel={m => `${m.first_name} ${m.surname}`.trim()}
                    value={members.find(m => m.id === form.invited_by) || null}
                    onChange={(_, value) => setForm(p => ({ ...p, invited_by: value?.id || '' }))}
                    renderInput={params => <TextField {...params} label="Invited By" fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Follow Up Method"
                    value={form.follow_up_method || ''}
                    onChange={e => setForm(p => ({ ...p, follow_up_method: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="Visit">Visit</MenuItem>
                    <MenuItem value="Call">Call</MenuItem>
                    <MenuItem value="WhatsApp">WhatsApp</MenuItem>
                    <MenuItem value="Coffee Meetup">Coffee Meetup</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    options={members}
                    getOptionLabel={m => `${m.first_name} ${m.surname}`.trim()}
                    value={members.find(m => m.id === form.member_id) || null}
                    onChange={(_, value) => setForm(p => ({ ...p, member_id: value?.id || '' }))}
                    renderInput={params => <TextField {...params} label="Assigned Member" fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Next Follow Up Date"
                    type="date"
                    value={form.next_follow_up_date || ''}
                    onChange={e => setForm(p => ({ ...p, next_follow_up_date: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Status"
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="followed_up">Followed Up</MenuItem>
                    <MenuItem value="converted">Converted</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    label="Follow Up Status"
                    value={form.follow_up_status}
                    onChange={e => setForm(p => ({ ...p, follow_up_status: e.target.value }))}
                    fullWidth
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="done">Done</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }}>
                    <Button variant="outlined" onClick={handleBack}>Back</Button>
                    <Button variant="contained" type="submit">{editing ? 'Update' : 'Save'}</Button>
                  </Box>
                </Grid>
              </Grid>
            )}
          </form>
        </Box>
      </Modal>
    </Box>
  );
}
