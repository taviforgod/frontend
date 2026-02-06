import React, { useEffect, useState, useContext } from 'react';
import {
  Typography, Button, List, ListItem, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Box, Chip, Divider, Stack, Avatar
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import CancelIcon from '@mui/icons-material/Cancel';
import { useForm } from 'react-hook-form';
import { AuthContext } from '../../contexts/AuthContext';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const levelColors = [
  'grey.400', // Level 0 (unlikely)
  'primary.main',
  'success.main',
  'warning.main',
  'info.main',
  'secondary.main',
  'error.main'
];

const statusIcons = {
  enrolled: <SchoolIcon color="primary" fontSize="small" />,
  in_progress: <HourglassBottomIcon color="warning" fontSize="small" />,
  completed: <CheckCircleIcon color="success" fontSize="small" />,
  dropped: <CancelIcon color="error" fontSize="small" />
};

function getActiveEnrollment(enrollments) {
  return enrollments.find(e => e.status === 'enrolled' || e.status === 'in_progress');
}

export default function FoundationSchoolCard({ memberId, refreshKey }) {
  const [enrollments, setEnrollments] = useState([]);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      class_id: '',
      status: 'enrolled',
      current_module: 1,
      attendance_percentage: 0
    }
  });
  const [snack, setSnack] = useState(null);
  const { fetchWithAuth } = useContext(AuthContext);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(()=> { load(); }, [memberId, refreshKey]);
  useEffect(() => {
    if (!open) return;
    if (!fetchWithAuth) {
      setClasses([]);
      return;
    }
    fetchWithAuth('/api/foundation-school/classes')
      .then(res => res.ok ? res.json() : [])
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]));
  }, [fetchWithAuth, open]);
  
  const load = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
      const res = await fetchWithAuth(`/api/foundation-school/enrollments?member_id=${encodeURIComponent(memberId)}`);
      const data = res.ok ? await res.json() : [];
      const list = Array.isArray(data) ? data : [];
      const filtered = list
        .sort((a, b) => new Date(b.enrollment_date || 0) - new Date(a.enrollment_date || 0));
      setEnrollments(filtered);
    } catch (e) {
      setSnack({ message: e.message, severity:'error' });
    }
    setLoading(false);
  };

  // Prevent duplicate active enrollments for a member
  const onSubmit = async (vals) => {
    const isEditing = Boolean(editingId);
    const duplicateActive = enrollments.some(
      e =>
        e.id !== editingId &&
        (e.status === 'enrolled' || e.status === 'in_progress') &&
        (vals.status === 'enrolled' || vals.status === 'in_progress')
    );
    if (duplicateActive) {
      setSnack({ message: 'Already enrolled or in progress.', severity: 'error' });
      return;
    }
    try {
      if (!fetchWithAuth) throw new Error('fetchWithAuth is required');

      if (editingId) {
        await fetchWithAuth(`/api/foundation-school/enrollments/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_module: Number(vals.current_module || 1),
            attendance_percentage: Number(vals.attendance_percentage || 0),
            status: vals.status
          })
        });
      } else {
        await fetchWithAuth('/api/foundation-school/enrollments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: memberId,
            class_id: vals.class_id
          })
        });
      }
      setOpen(false);
      setEditingId(null);
      load();
      setSnack({ message: isEditing ? 'Updated' : 'Saved', severity: 'success' });
    } catch (e) {
      setSnack({ message: e.message, severity:'error' });
    }
  };

  // Modern card style
  return (
    <Box
      sx={{
        mt: 3,
        p: 0,
        borderRadius: 4,
        maxWidth: 540,
        mx: 'auto',
        background: theme => theme.palette.mode === 'dark' ? '#23272f' : '#fff',
        boxShadow: 3,
        overflow: 'hidden'
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 3, pt: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
          Foundation School
        </Typography>
        <Button
          variant="contained"
          onClick={() => {
            const active = getActiveEnrollment(enrollments);
            if (active) {
              reset({
                class_id: active.class_id || '',
                status: active.status ?? 'enrolled',
                current_module: active.current_module || 1,
                attendance_percentage: active.attendance_percentage || 0
              });
              setEditingId(active.id);
            } else {
              reset();
              setEditingId(null);
            }
            setOpen(true);
          }}
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            background: theme => theme.palette.primary.main,
            color: theme => theme.palette.primary.contrastText,
            boxShadow: 'none',
            textTransform: 'none',
            px: 3,
            py: 1,
            '&:hover': { background: theme => theme.palette.primary.dark }
          }}
        >
          Enroll / Update
        </Button>
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}>
          {enrollments.length > 0
            ? <>
                Latest: <Chip
                  label={enrollments[0].class_name || `Class ${enrollments[0].class_id || ''}`}
                  sx={{
                    bgcolor: levelColors[enrollments[0].level] || 'primary.main',
                    color: 'white',
                    fontWeight: 700,
                    mr: 1
                  }}
                  size="small"
                />
                <b style={{ textTransform: 'capitalize' }}>{enrollments[0].status.replace('_', ' ')}</b>
              </>
            : 'Not enrolled'}
        </Typography>

        <List dense>
          {enrollments.map((e, idx) => (
            <React.Fragment key={e.id}>
              <ListItem
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  bgcolor: idx === 0 ? 'rgba(33,150,243,0.08)' : 'transparent',
                  border: idx === 0 ? '1px solid #90caf9' : 'none',
                  boxShadow: idx === 0 ? 1 : 0,
                  transition: 'background 0.2s'
                }}
                alignItems="flex-start"
              >
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                  <Avatar
                    sx={{
                      bgcolor: levelColors[e.level] || 'primary.main',
                      width: 36,
                      height: 36,
                      fontWeight: 700
                    }}
                  >
                    {e.level}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight={600} sx={{ fontSize: 16 }}>
                      Level {e.level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 13 }}>
                    {e.enrollment_date ? new Date(e.enrollment_date).toLocaleDateString() : 'Enrolled'}
                  </Typography>
                    {e.class_id && classes.find(c=>c.id===e.class_id) && (
                      <Chip
                        label={`Class: ${classes.find(c=>c.id===e.class_id).name}`}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    )}
                    {typeof e.current_module !== 'undefined' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Module {e.current_module || 1} of 8
                      </Typography>
                    )}
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    {statusIcons[e.status] || null}
                    <Typography sx={{ textTransform: 'capitalize', fontWeight: 500, fontSize: 14 }}>
                      {e.status.replace('_', ' ')}
                    </Typography>
                  </Stack>
                </Stack>
              </ListItem>
              {idx < enrollments.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Box>
      <Dialog open={open} onClose={()=> setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Enroll / Update Foundation</DialogTitle>
        <DialogContent>
          <form id="foundation-form" onSubmit={handleSubmit(onSubmit)}>
            {!editingId && (
              <TextField
                select
                label="Class"
                fullWidth
                margin="normal"
                {...register('class_id', { required: true })}
                defaultValue=""
              >
                {classes.length === 0 ? (
                  <MenuItem value="" disabled>No classes available</MenuItem>
                ) : (
                  classes.map(c => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}{c.start_date ? ` (${c.start_date})` : ''}
                    </MenuItem>
                  ))
                )}
              </TextField>
            )}

            <TextField
              select
              label="Status"
              fullWidth
              margin="normal"
              {...register('status')}
              defaultValue="enrolled"
            >
              <MenuItem value="enrolled">Enrolled</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="dropped">Dropped</MenuItem>
            </TextField>

            <TextField
              label="Current Module"
              type="number"
              fullWidth
              margin="normal"
              {...register('current_module', { valueAsNumber:true, min:1, max:8 })}
              InputProps={{ inputProps: { min: 1, max: 8 } }}
            />

            <TextField
              label="Attendance Percentage"
              type="number"
              fullWidth
              margin="normal"
              {...register('attendance_percentage', { valueAsNumber:true, min:0, max:100 })}
              InputProps={{ inputProps: { min: 0, max: 100 } }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setOpen(false)} sx={{ fontWeight: 600, borderRadius: 2 }}>Cancel</Button>
          <Button
            type="submit"
            form="foundation-form"
            variant="contained"
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              minWidth: 120,
              background: theme => theme.palette.primary.main,
              color: theme => theme.palette.primary.contrastText,
              boxShadow: 'none',
              '&:hover': {
                background: theme => theme.palette.primary.dark
              }
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {snack && (
        <Snackbar
          open={!!snack}
          autoHideDuration={3000}
          onClose={() => setSnack(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snack.severity}
            onClose={() => setSnack(null)}
            sx={{ width: '100%' }}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
