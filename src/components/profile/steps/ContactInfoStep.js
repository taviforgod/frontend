import React, { useState } from 'react';
import { Grid, TextField, Box, Typography, Stack, Alert } from '@mui/material';
import { Phone, Mail } from 'lucide-react';

export default function ContactInfoStep({ profile, setProfile }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value || null
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 7 && re.test(phone);
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Box sx={{ p: 1, bgcolor: '#fce7f3', borderRadius: 2 }}>
          <Phone size={24} color="#be185d" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Contact Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            How we can reach you
          </Typography>
        </Box>
      </Stack>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={profile?.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="your.email@example.com"
            variant="outlined"
            size="small"
            error={!!errors.email}
            helperText={errors.email || 'Used for login and notifications'}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Primary Phone"
            value={profile?.contact_primary || ''}
            onChange={(e) => handleChange('contact_primary', e.target.value)}
            placeholder="+1 (555) 000-0000"
            variant="outlined"
            size="small"
            error={!!errors.contact_primary}
            helperText={errors.contact_primary || 'Primary contact number'}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Secondary Phone"
            value={profile?.contact_secondary || ''}
            onChange={(e) => handleChange('contact_secondary', e.target.value)}
            placeholder="+1 (555) 000-0000"
            variant="outlined"
            size="small"
            helperText="Optional"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            Keep your contact information up to date so we can reach you with important updates and events.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}