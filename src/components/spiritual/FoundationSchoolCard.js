import React, { useEffect, useState } from 'react';
import {
  Typography, Button, List, ListItem, ListItemText, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Box, Chip, Divider, Stack, Avatar
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import CancelIcon from '@mui/icons-material/Cancel';
import { useForm } from 'react-hook-form';
import { getFoundationByMember, enrollFoundation } from '../../services/foundationService';

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

export default function FoundationSchoolCard({ memberId, refreshKey }) {
  const [enrollments, setEnrollments] = useState([]);
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { level:1, status:'enrolled', notes:'' } });
  const [snack, setSnack] = useState(null);

  useEffect(()=> { load(); }, [memberId, refreshKey]);

  const load = async () => {
    if (!memberId) return;
    try {
      const data = await getFoundationByMember(memberId);
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (e) {
      setSnack({ message: e.message, severity:'error' });
    }
  };

  const onSubmit = async (vals) => {
    try {
      await enrollFoundation({ member_id: memberId, ...vals });
      setOpen(false);
      load();
      setSnack({ message:'Saved', severity: 'success' });
    } catch (e) {
      setSnack({ message: e.message, severity:'error' });
    }
  };

  return (
    <Box
      sx={{
        mt: 2,
        p: 0,
        borderRadius: 0,
        maxWidth: 500
      }}
    >
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
        Foundation School
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb:2 }}>
        {enrollments.length > 0
          ? <>
              Latest: <Chip
                label={`Level ${enrollments[0].level}`}
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
                boxShadow: idx === 0 ? 1 : 0
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
                    {e.notes || new Date(e.enrolled_at).toLocaleDateString()}
                  </Typography>
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
      <Button
        variant="contained"
        onClick={()=> { reset(); setOpen(true); }}
        sx={{ mt: 2, fontWeight: 600 }}
      >
        Enroll / Update
      </Button>

      <Dialog open={open} onClose={()=> setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Enroll / Update Foundation</DialogTitle>
        <DialogContent>
          <form id="foundation-form" onSubmit={handleSubmit(onSubmit)}>
            <TextField label="Level" type="number" fullWidth margin="normal" {...register('level', { valueAsNumber:true })} />
            <TextField select label="Status" fullWidth margin="normal" {...register('status')}>
              <MenuItem value="enrolled">Enrolled</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="dropped">Dropped</MenuItem>
            </TextField>
            <TextField label="Notes" fullWidth multiline minRows={3} margin="normal" {...register('notes')} />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=> setOpen(false)}>Cancel</Button>
          <Button type="submit" form="foundation-form" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
