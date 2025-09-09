import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function Onboard() {
  const navigate = useNavigate();
  return (
    <Box maxWidth={500} mx="auto" mt={8} p={4} boxShadow={3} textAlign="center">
      <Typography variant="h4" mb={2}>Welcome!</Typography>
      <Typography mb={3}>
        Your account was created. Please verify your phone number and complete your profile.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/verify-phone')}>
        Verify Phone
      </Button>
    </Box>
  );
}