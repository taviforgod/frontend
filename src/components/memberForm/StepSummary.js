import React from 'react';
import { Box, Typography, Avatar, Grid, Divider } from '@mui/material';

export default function StepSummary({ values, profilePhoto }) {
  // Helper for lookups: show name/label or fallback to ID or '-'
  const showLookup = (field, labelField = 'name') => {
    if (!field) return '-';
    if (typeof field === 'object') return field[labelField] || field.id || '-';
    return field;
  };

  // Get initials for avatar fallback
  const getInitials = () =>
    (values.first_name?.[0] || '') + (values.surname?.[0] || '');

  // Determine photo preview: file, url, or fallback
  let photoSrc = '';
  if (profilePhoto && typeof profilePhoto === 'object' && profilePhoto instanceof File) {
    photoSrc = URL.createObjectURL(profilePhoto);
  } else if (typeof profilePhoto === 'string') {
    photoSrc = profilePhoto;
  } else if (typeof values.profile_photo === 'string') {
    photoSrc = values.profile_photo;
  } else {
    photoSrc = '';
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom component="div">
        Summary
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography component="div"><strong>Title:</strong> {showLookup(values.title)}</Typography>
          <Typography component="div"><strong>First Name:</strong> {values.first_name || '-'}</Typography>
          <Typography component="div"><strong>Surname:</strong> {values.surname || '-'}</Typography>
          <Typography component="div"><strong>Date of Birth:</strong> {values.date_of_birth || '-'}</Typography>
          <Typography component="div"><strong>Gender:</strong> {showLookup(values.gender)}</Typography>
          <Typography component="div"><strong>Nationality:</strong> {showLookup(values.nationality)}</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography component="div"><strong>Email:</strong> {values.email || '-'}</Typography>
          <Typography component="div"><strong>Primary Contact:</strong> {values.contact_primary || '-'}</Typography>
          <Typography component="div"><strong>Secondary Contact:</strong> {values.contact_secondary || '-'}</Typography>
          <Typography component="div"><strong>Physical Address:</strong> {values.physical_address || '-'}</Typography>
          <Typography component="div"><strong>Profession:</strong> {values.profession || '-'}</Typography>
          <Typography component="div"><strong>Occupation:</strong> {values.occupation || '-'}</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography component="div"><strong>Date Joined Church:</strong> {values.date_joined_church || '-'}</Typography>
          <Typography component="div"><strong>Date Born Again:</strong> {values.date_born_again || '-'}</Typography>
          <Typography component="div"><strong>Date Baptized (Immersion):</strong> {values.date_baptized_immersion || '-'}</Typography>
          <Typography component="div"><strong>Baptized in Christ Embassy:</strong> {values.baptized_in_christ_embassy ? 'Yes' : 'No'}</Typography>
          <Typography component="div"><strong>Date Received Holy Ghost:</strong> {values.date_received_holy_ghost || '-'}</Typography>
          <Typography component="div"><strong>Foundation School Grad Date:</strong> {values.foundation_school_grad_date || '-'}</Typography>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography component="div"><strong>Status:</strong> {showLookup(values.status)}</Typography>
          <Typography component="div"><strong>Member Type:</strong> {showLookup(values.member_type)}</Typography>
          <Typography component="div"><strong>RFID Tag:</strong> {values.rfid_tag || '-'}</Typography>
          <Typography component="div"><strong>Marital Status:</strong> {showLookup(values.marital_status)}</Typography>
          <Typography component="div"><strong>Number of Children:</strong> {values.num_children || '-'}</Typography>
          <Typography component="div"><strong>Work Address:</strong> {values.work_address || '-'}</Typography>
        </Grid>

        <Grid item xs={12}>
          <Box mt={2} display="flex" alignItems="center">
            {typeof photoSrc === 'string' && photoSrc ? (
              <>
                <Avatar src={photoSrc} alt="Profile Photo" sx={{ width: 80, height: 80, mr: 2 }} />
                <Typography component="div">Profile Photo Preview</Typography>
              </>
            ) : (
              <>
                <Avatar sx={{ width: 80, height: 80, mr: 2, fontSize: 32 }}>
                  {getInitials() || 'N/A'}
                </Avatar>
                <Typography component="div">No Profile Photo</Typography>
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
