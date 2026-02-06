import React, { useState, useContext } from 'react';
import {
  Typography, TextField, MenuItem, FormControlLabel, Switch, Button, IconButton,
  Grid, Divider, Stack
} from '@mui/material';
import { X } from 'lucide-react';
import { createPrayerRequest } from '../../services/prayerService.js';
import { AuthContext } from '../../contexts/AuthContext.js';
import { ThemeContext } from '../../contexts/ThemeContext.js';

export default function PrayerForm({ memberId = null, onSuccess = () => {}, onClose, showTitle = true }) {
  const { fetchWithAuth, user } = useContext(AuthContext) || {};
  const { theme } = useContext(ThemeContext);
  const [form, setForm] = useState({
    category: 'prayer',
    sub_category: '',
    urgency: 'normal',
    preferred_contact_method: 'phone',
    contact_details: '',
    description: '',
    confidentiality: true,
    anonymous: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastSubmitted, setLastSubmitted] = useState('');

  const handleChange = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target ? e.target.value : e }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.description.trim() === lastSubmitted.trim()) {
      setError('You have already submitted this message.');
      return;
    }
    setLoading(true);
    try {
      // Send the form as is - backend will handle anonymous logic
      const payload = {
        ...form,
        // Don't send member_id - backend will use authenticated user and handle anonymous flag
      };
      if (fetchWithAuth) {
        await createPrayerRequest(fetchWithAuth, payload);
      } else {
        await createPrayerRequest(payload);
      }
      setLastSubmitted(form.description.trim());
      setLoading(false);
      onSuccess && onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err?.message || 'Submit failed');
    }
  };

  const INPUT_SX = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
      fontWeight: 600,
      fontSize: 16,
      minHeight: 44,
      '& fieldset': { borderColor: theme.palette.divider },
      '&:hover fieldset': { borderColor: theme.palette.primary.light },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
    },
    '& .MuiInputLabel-root': { fontWeight: 700, fontSize: 15 }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600, margin: '40px auto', position: 'relative' }}>
      {onClose && (
        <IconButton
          aria-label="Close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 2,
            background: theme.palette.action.hover,
            '&:hover': { background: theme.palette.action.selected }
          }}
        >
          <X size={20} />
        </IconButton>
      )}
      {showTitle && (
        <Typography
          variant="h5"
          mb={2}
          fontWeight={800}
          color="primary.main"
          sx={{ letterSpacing: 0.2, textAlign: 'center' }}
        >
          Submit Prayer / Counseling Request
        </Typography>
      )}

      <Divider sx={{ mb: 3 }} />

      {error && (
        <Typography color="error" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Category"
            value={form.category}
            onChange={handleChange('category')}
            fullWidth
            size="small"
            sx={INPUT_SX}
          >
            <MenuItem value="prayer">Prayer</MenuItem>
            <MenuItem value="counseling">Counseling</MenuItem>
            <MenuItem value="both">Both</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Sub category (optional)"
            value={form.sub_category}
            onChange={handleChange('sub_category')}
            fullWidth
            size="small"
            sx={INPUT_SX}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Urgency"
            value={form.urgency}
            onChange={handleChange('urgency')}
            fullWidth
            size="small"
            sx={INPUT_SX}
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="normal">Normal</MenuItem>
            <MenuItem value="urgent">Urgent</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            select
            label="Preferred Contact Method"
            value={form.preferred_contact_method}
            onChange={handleChange('preferred_contact_method')}
            fullWidth
            size="small"
            sx={INPUT_SX}
          >
            <MenuItem value="phone">Phone</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="in_person">In person</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={8}>
          <TextField
            label="Contact details (phone/email)"
            value={form.contact_details}
            onChange={handleChange('contact_details')}
            fullWidth
            size="small"
            sx={INPUT_SX}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControlLabel
            control={
              <Switch
                checked={form.anonymous}
                onChange={(e) => setForm(f => ({ ...f, anonymous: e.target.checked, confidentiality: e.target.checked }))}
                color="primary"
              />
            }
            label={
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                Submit anonymously
              </Typography>
            }
            sx={{ ml: 0 }}
          />
        </Grid>
      </Grid>

      <TextField
        label="Description *"
        value={form.description}
        onChange={handleChange('description')}
        multiline
        rows={5}
        required
        fullWidth
        size="small"
        sx={INPUT_SX}
      />

      <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 1 }}>
        <Button
          variant="contained"
          type="submit"
          disabled={loading}
          sx={{
            borderRadius: 2,
            minWidth: 140,
            fontWeight: 800,
            fontSize: 16,
            background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            boxShadow: '0 6px 20px rgba(16,24,40,0.08)'
          }}
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </Button>
      </Stack>
    </form>
  );
}
