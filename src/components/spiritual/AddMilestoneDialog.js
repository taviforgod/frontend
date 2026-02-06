import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, FormControl, InputLabel,
  Select, MenuItem, Snackbar, Alert, Stack, Typography, Box, IconButton, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { getMilestoneTemplates, assignMilestone } from '../../services/milestoneService';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';

export default function AddMilestoneDialog({ open, onClose, memberId, onSuccess }) {
  const { fetchWithAuth } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext) || {};
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const t = fetchWithAuth
          ? await getMilestoneTemplates(fetchWithAuth)
          : await getMilestoneTemplates();
        setTemplates(t || []);
      } catch (e) {
        setSnack({ open: true, message: e.message, severity: 'error' });
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      setSelected('');
      load();
    }
  }, [open, fetchWithAuth]);

  const handleSubmit = async () => {
    if (!selected) return setSnack({ open: true, message: 'Select a milestone', severity: 'warning' });
    try {
      setLoading(true);
      if (fetchWithAuth) {
        await assignMilestone(fetchWithAuth, { member_id: memberId, template_id: selected });
      } else {
        await assignMilestone({ member_id: memberId, template_id: selected });
      }
      setSnack({ open: true, message: 'Milestone assigned!', severity: 'success' });
      onSuccess?.();
      onClose?.();
    } catch (e) {
      setSnack({ open: true, message: e.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <EmojiEventsIcon color="warning" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>Assign Milestone</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a milestone to assign to this member.
          </Typography>
          <FormControl fullWidth margin="normal" variant="outlined" sx={{ mb: 2 }}>
            <InputLabel id="milestone-select-label">Milestone</InputLabel>
            <Select
              labelId="milestone-select-label"
              value={selected}
              label="Milestone"
              onChange={(e) => setSelected(e.target.value)}
              disabled={loading}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              {templates.length === 0 && !loading && (
                <MenuItem value="" disabled>No milestones available</MenuItem>
              )}
              {templates.map(t => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {loading && (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={28} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              fontWeight: 600,
              borderRadius: 2,
              color: theme?.palette?.mode === 'dark' ? theme.palette.grey[200] : theme.palette.primary.main,
              background: 'none',
              '&:hover': {
                background: theme?.palette?.action?.hover || '#f5f5f5'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !selected}
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              minWidth: 120,
              background: theme?.palette?.primary?.main,
              color: theme?.palette?.primary?.contrastText,
              boxShadow: 'none',
              '&:hover': {
                background: theme?.palette?.primary?.dark
              }
            }}
          >
            {loading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}
