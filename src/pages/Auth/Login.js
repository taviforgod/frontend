import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/authService';
import { AuthContext } from '../../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.identifier, form.password);
      // After login, fetch profile and update context
      const res = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/users/profile`,
        { credentials: 'include' }
      );
      if (res.ok) {
        const user = await res.json();
        setUser(user);
        navigate('/dashboard');
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={4} boxShadow={3}>
      <Typography variant="h5" mb={2}>Sign In</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Email or Phone"
          fullWidth
          margin="normal"
          value={form.identifier}
          onChange={e => setForm({ ...form, identifier: e.target.value })}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Login</Button>
      </form>
      <Button onClick={() => navigate('/forgot-password')} sx={{ mt: 1 }}>Forgot Password?</Button>
      <Button onClick={() => navigate('/register')} sx={{ mt: 1 }}>Don't have an account? Register</Button>
    </Box>
  );
}