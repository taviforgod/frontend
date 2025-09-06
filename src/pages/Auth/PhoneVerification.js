import React, { useState } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import OTPInput from '../../components/OTPInput';
import { verifyPhone } from '../../services/authService';
import { useLocation, useNavigate } from 'react-router-dom';

export default function PhoneVerification() {
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;

  const handleVerify = async () => {
    if (!userId) {
      setStatus('error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    try {
      const res = await verifyPhone(userId, otp); // <-- get response from backend
      if (res.token) {
        localStorage.setItem('token', res.token); // <-- save token
      }
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch {
      setStatus('error');
      setTimeout(() => navigate('/login'), 1500);
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={4} boxShadow={3}>
      <Typography variant="h6" mb={2}>Verify your phone</Typography>
      <OTPInput value={otp} onChange={setOtp} />
      <Button onClick={handleVerify} sx={{mt:2}}>Verify</Button>
      {status === 'success' && (
        <Alert severity="success">Phone verified! Redirecting to dashboard…</Alert>
      )}
      {status === 'error' && (
        <Alert severity="error">Invalid code or missing user ID. Redirecting to login…</Alert>
      )}
    </Box>
  );
}