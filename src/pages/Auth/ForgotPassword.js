import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { forgotPassword } from '../../services/authService';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset link');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={4} boxShadow={3}>
      <Typography variant="h5" mb={2}>Forgot Password</Typography>
      {sent ? (
        <Alert severity="success">Reset link sent! Please check your email.</Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Send Reset Link
          </Button>
        </form>
      )}
    </Box>
  );
}