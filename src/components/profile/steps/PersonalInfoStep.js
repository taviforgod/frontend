import React from 'react';
import { Grid, Box, Typography, Stack } from '@mui/material';
import { User } from 'lucide-react';
import { TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTime } from 'luxon';

export default function PersonalInfoStep({ profile, setProfile }) {
  const handleChange = (field, value) => {
    setProfile(prev => ({ ...(prev || {}), [field]: value }));
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Box sx={{ p: 1, bgcolor: '#e0f2fe', borderRadius: 2 }}>
          <User size={24} color="#0369a1" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Personal Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your basic personal details
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="First Name"
            size="small"
            value={profile?.first_name ?? ''}
            onChange={(e) => handleChange('first_name', e.target.value)}
            placeholder="Enter your first name"
            variant="outlined"
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Surname"
            size="small"
            value={profile?.surname ?? ''}
            onChange={(e) => handleChange('surname', e.target.value)}
            placeholder="Enter your surname"
            variant="outlined"
            required
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Date of Birth"
            value={profile?.date_of_birth ? DateTime.fromISO(profile.date_of_birth) : null}
            onChange={(dt) => {
              handleChange('date_of_birth', dt ? dt.toISODate() : '');
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                variant: 'outlined'
              }
            }}
            format="dd MMM yyyy"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Gender"
            select
            value={profile?.gender_id || ''}
            onChange={(e) => handleChange('gender_id', e.target.value)}
            variant="outlined"
            size="small"
            SelectProps={{ native: true }}
          >
            <option value="">Select Gender</option>
            <option value="1">Male</option>
            <option value="2">Female</option>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            These details help us personalize your experience in the church community.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}