import React, { useContext, useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Stack,
  Box,
  Chip,
  Typography,
  Slider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { addEvaluation } from '../../services/leadershipService';
import { AuthContext } from '../../contexts/AuthContext';

const ratingMarks = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];

function EvaluationForm({ open, onClose, leader }) {
  const { fetchWithAuth, user } = useContext(AuthContext) || {};
  const [type, setType] = useState('self');
  const [spiritualMaturity, setSpiritualMaturity] = useState(3);
  const [relationalHealth, setRelationalHealth] = useState(3);
  const [discipleship, setDiscipleship] = useState(3);
  const [growthPotential, setGrowthPotential] = useState(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      let defaultType = 'supervisor';
      if (user && leader) {
        if (user.id === leader.id) {
          defaultType = 'self';
        } else if (user.role === 'member') {
          defaultType = 'peer';
        }
      }
      setType(defaultType);
      setSpiritualMaturity(3);
      setRelationalHealth(3);
      setDiscipleship(3);
      setGrowthPotential(3);
      setNotes('');
    }
  }, [open, user, leader]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await addEvaluation(fetchWithAuth, {
        church_id: user.church_id,
        leader_id: leader.member_id,
        evaluator_id: user.id,
        type,
        spiritual_maturity: spiritualMaturity,
        relational_health: relationalHealth,
        discipleship,
        growth_potential: growthPotential,
        notes,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!leader || !user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: 8,
          p: 0,
          background: '#fff',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontWeight: 700,
          fontSize: 22,
          bgcolor: '#f6f7fb',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          pb: 1,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Evaluate {leader.first_name} {leader.surname}
          </Typography>
          <Chip
            label={type.charAt(0).toUpperCase() + type.slice(1)}
            color={type === 'self' ? 'primary' : type === 'peer' ? 'secondary' : 'success'}
            size="small"
            sx={{ mt: 1, fontWeight: 500, borderRadius: 2, textTransform: 'capitalize' }}
          />
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ ml: 2 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#f6f7fb', px: 4, py: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 140, fontWeight: 500 }}>Spiritual Maturity</Typography>
            <Slider
              value={spiritualMaturity}
              min={1}
              max={5}
              step={1}
              marks={ratingMarks}
              onChange={(_, v) => setSpiritualMaturity(Number(v))}
              sx={{ flex: 1 }}
              color="primary"
            />
            <Box sx={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{spiritualMaturity}</Box>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 140, fontWeight: 500 }}>Relational Health</Typography>
            <Slider
              value={relationalHealth}
              min={1}
              max={5}
              step={1}
              marks={ratingMarks}
              onChange={(_, v) => setRelationalHealth(Number(v))}
              sx={{ flex: 1 }}
              color="secondary"
            />
            <Box sx={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{relationalHealth}</Box>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 140, fontWeight: 500 }}>Discipleship</Typography>
            <Slider
              value={discipleship}
              min={1}
              max={5}
              step={1}
              marks={ratingMarks}
              onChange={(_, v) => setDiscipleship(Number(v))}
              sx={{ flex: 1 }}
              color="info"
            />
            <Box sx={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{discipleship}</Box>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography sx={{ minWidth: 140, fontWeight: 500 }}>Growth Potential</Typography>
            <Slider
              value={growthPotential}
              min={1}
              max={5}
              step={1}
              marks={ratingMarks}
              onChange={(_, v) => setGrowthPotential(Number(v))}
              sx={{ flex: 1 }}
              color="success"
            />
            <Box sx={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{growthPotential}</Box>
          </Stack>
          <TextField
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            fullWidth
            margin="normal"
            size="medium"
            multiline
            minRows={3}
            variant="filled"
            sx={{
              bgcolor: '#fff',
              borderRadius: 2,
              '& .MuiFilledInput-root': {
                borderRadius: 2,
                background: '#fff',
              },
            }}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ bgcolor: '#f6f7fb', px: 4, py: 2, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        <Button onClick={onClose} variant="text" sx={{ fontWeight: 600, color: '#888' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            fontWeight: 700,
            borderRadius: 2,
            boxShadow: 'none',
            bgcolor: '#0073ea',
            '&:hover': { bgcolor: '#005bb5' },
            px: 4,
          }}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EvaluationForm;
