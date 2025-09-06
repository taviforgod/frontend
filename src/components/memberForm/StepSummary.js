import React from 'react';
import { Box, Typography, Avatar, Grid, Divider } from '@mui/material';

export default function StepSummary({ values, profilePhoto }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Summary</Typography>
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Typography><strong>Title:</strong> {values.title || '-'}</Typography>
          <Typography><strong>First Name:</strong> {values.first_name || '-'}</Typography>
          <Typography><strong>Surname:</strong> {values.surname || '-'}</Typography>
          <Typography><strong>Date of Birth:</strong> {values.date_of_birth || '-'}</Typography>
          <Typography><strong>Gender:</strong> {values.gender || '-'}</Typography>
          <Typography><strong>Nationality:</strong> {values.nationality || '-'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography><strong>Email:</strong> {values.email || '-'}</Typography>
          <Typography><strong>Primary Contact:</strong> {values.contact_primary || '-'}</Typography>
          <Typography><strong>Secondary Contact:</strong> {values.contact_secondary || '-'}</Typography>
          <Typography><strong>Physical Address:</strong> {values.physical_address || '-'}</Typography>
          <Typography><strong>Profession:</strong> {values.profession || '-'}</Typography>
          <Typography><strong>Occupation:</strong> {values.occupation || '-'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography><strong>Date Joined Church:</strong> {values.date_joined_church || '-'}</Typography>
          <Typography><strong>Date Born Again:</strong> {values.date_born_again || '-'}</Typography>
          <Typography><strong>Date Baptized (Immersion):</strong> {values.date_baptized_immersion || '-'}</Typography>
          <Typography><strong>Baptized in Christ Embassy:</strong> {values.baptized_in_christ_embassy ? 'Yes' : 'No'}</Typography>
          <Typography><strong>Date Received Holy Ghost:</strong> {values.date_received_holy_ghost || '-'}</Typography>
          <Typography><strong>Foundation School Grad Date:</strong> {values.foundation_school_grad_date || '-'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography><strong>Status:</strong> {values.status || '-'}</Typography>
          <Typography><strong>Member Type:</strong> {values.member_type || '-'}</Typography>
          <Typography><strong>RFID Tag:</strong> {values.rfid_tag || '-'}</Typography>
          <Typography><strong>Marital Status:</strong> {values.marital_status || '-'}</Typography>
          <Typography><strong>Number of Children:</strong> {values.num_children || '-'}</Typography>
          <Typography><strong>Work Address:</strong> {values.work_address || '-'}</Typography>
        </Grid>
        <Grid item xs={12}>
          {profilePhoto && (
            <Box mt={2} display="flex" alignItems="center">
              <Avatar src={URL.createObjectURL(profilePhoto)} alt="Profile Photo" sx={{ width: 80, height: 80, mr: 2 }} />
              <Typography>Profile Photo Preview</Typography>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}