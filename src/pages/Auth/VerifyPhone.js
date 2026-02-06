import React, { useState, useEffect, useContext } from 'react';
import { Box, Button, Typography, Alert, Snackbar } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyEmail } from '../../services/authService';
import OTPInput from '../../components/OTPInput';
import logo from '../../assets/logo.png';
import { AuthContext } from '../../contexts/AuthContext';

export default function VerifyEmail() {
  const [code, setCode] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { fetchWithAuth } = useContext(AuthContext);

  const userId = location.state?.userId;
  const identifier = location.state?.identifier;
  const verificationSent = !!location.state?.verificationSent;

  // Redirect to register if userId missing
  useEffect(() => {
    if (!userId) navigate('/register');
  }, [userId, navigate]);

  // Submit verification code
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSnackbar({ open: false });

    if (!userId || !code) {
      setSnackbar({ open: true, message: 'Please enter the verification code', severity: 'error' });
      return;
    }

    try {
      await verifyEmail(fetchWithAuth || null, userId, code);
      navigate('/login', { state: { message: 'Email verified successfully. You can now login.' } });
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || 'Verification failed', severity: 'error' });
    }
  };

  // Resend verification code
  const handleResend = async () => {
    if (!userId) return;
    setSending(true);
    setSnackbar({ open: false });

    try {
      const body = { userId, method: 'email' };
      const res = fetchWithAuth
        ? await fetchWithAuth('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Failed to resend verification code');

      setSnackbar({
        open: true,
        message: `Verification code resent to ${identifier || 'your email'}.`,
        severity: 'info',
      });
    } catch (err) {
      setSnackbar({ open: true, message: err?.message || 'Failed to resend code', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((s) => ({ ...s, open: false }));
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', p: 2 }}
    >
      <Box mb={2}>
        <img src={logo} alt="Logo" style={{ width: 120, height: 'auto' }} />
      </Box>

      <Box
        maxWidth={400}
        width="100%"
        p={4}
        boxShadow={3}
        borderRadius={2}
        sx={{ backgroundColor: 'white' }}
      >
        <Typography variant="h5" mb={2} align="center">
          Verify Your Email
        </Typography>
        <Typography mb={2} color="textSecondary" align="center">
          Enter the verification code sent to <strong>{identifier || 'your email'}</strong>.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box display="flex" justifyContent="center" mb={3}>
            <OTPInput value={code} onChange={setCode} length={6} />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={code.length !== 6}
          >
            Verify Email
          </Button>

          <Button fullWidth sx={{ mt: 1 }} disabled={sending} onClick={handleResend}>
            {sending ? 'Resending...' : verificationSent ? 'Resend Code' : 'Send Verification Code'}
          </Button>
        </form>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
