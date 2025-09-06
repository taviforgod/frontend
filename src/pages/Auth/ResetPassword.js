import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Alert } from '@mui/material';
import { resetPassword } from '../../services/authService';

export default function ResetPassword() {
  const [form, setForm] = useState({ token: '', password: '' });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await resetPassword(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={4} boxShadow={3}>
      <Typography variant="h5" mb={2}>Reset Password</Typography>
      {success ? (
        <Alert severity="success">Password reset! You can now log in.</Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          <TextField
            label="Reset Token"
            fullWidth
            margin="normal"
            value={form.token}
            onChange={e => setForm({ ...form, token: e.target.value })}
          />
          <TextField
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
            Reset Password
          </Button>
        </form>
      )}
    </Box>
  );
}