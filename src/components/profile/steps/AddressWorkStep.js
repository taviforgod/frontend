import React from 'react';
import { Grid, TextField, Box, Typography, Stack } from '@mui/material';
import { MapPin, Briefcase } from 'lucide-react';

export default function AddressWorkStep({ profile, setProfile }) {
  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value || null
    }));
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Box sx={{ p: 1, bgcolor: '#dcfce7', borderRadius: 2 }}>
          <MapPin size={24} color="#16a34a" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Address & Work Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your residence and employment details
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3}>
        {/* Address Section */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={2}>
            Residential Address
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Physical Address"
            value={profile?.physical_address || ''}
            onChange={(e) => handleChange('physical_address', e.target.value)}
            placeholder="Street address, city, state/province, zip code"
            variant="outlined"
            size="small"
            multiline
            rows={3}
          />
        </Grid>

        {/* Work Section */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" fontWeight={700} color="#1e293b" mb={2}>
            Work Information
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Profession"
            value={profile?.profession || ''}
            onChange={(e) => handleChange('profession', e.target.value)}
            placeholder="e.g., Software Engineer, Teacher, etc."
            variant="outlined"
            size="small"
            helperText="Your professional field"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Occupation"
            value={profile?.occupation || ''}
            onChange={(e) => handleChange('occupation', e.target.value)}
            placeholder="e.g., Developer, Full-time, Freelance"
            variant="outlined"
            size="small"
            helperText="Your specific role/position"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Work Address"
            value={profile?.work_address || ''}
            onChange={(e) => handleChange('work_address', e.target.value)}
            placeholder="Office/workplace street address, city, state/province, zip code"
            variant="outlined"
            size="small"
            multiline
            rows={3}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            This information helps us understand your context and pray for you effectively.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}