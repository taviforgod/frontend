import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Autocomplete,
  InputAdornment,
  IconButton,
  LinearProgress,
  Fade,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';
import { getChurchesPublic } from '../../services/publicLookups';
import { AuthContext } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';

export default function Register({ modal = false, onClose = () => {}, onSwitchToLogin = () => {} }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    church_id: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [churches, setChurches] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const { fetchWithAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const closeAfterSuccess = () => { onClose && onClose(); };

  // Load churches
  useEffect(() => {
    getChurchesPublic()
      .then((data) => setChurches(data || []))
      .catch(() => setChurches([]));
  }, []);

  const getStrength = (pwd) => {
    if (!pwd) return { label: '', score: 0, color: 'inherit' };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 0:
      case 1:
        return { label: 'Weak', score: 25, color: 'error' };
      case 2:
        return { label: 'Fair', score: 50, color: 'warning' };
      case 3:
        return { label: 'Good', score: 75, color: 'info' };
      case 4:
        return { label: 'Strong', score: 100, color: 'success' };
      default:
        return { label: '', score: 0, color: 'inherit' };
    }
  };

  const strength = getStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setVerificationSent(false);

    if (!form.church_id) {
      setError('Please select a church.');
      return;
    }
    if (!form.email && !form.phone) {
      setError('Please provide either an email or phone number.');
      return;
    }

    try {
      const res = await register(form);
      if (res && res.userId) {
        setMessage(res.message || 'Registration successful!');
        setVerificationSent(res.verificationSent || false);
        // Close parent modal if present (so the user sees verify page cleanly)
        if (modal && typeof onClose === 'function') onClose();
        if (form.phone) {
          navigate('/verify-phone', {
            state: { userId: res.userId, identifier: form.phone },
          });
        } else if (form.email) {
          navigate('/verify-email', {
            state: { userId: res.userId, identifier: form.email },
          });
        }
      } else {
        setError('Registration succeeded but user ID missing');
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    }
  };

  const handleResend = async () => {
    try {
      if (!form.email && !form.phone) return;

      const endpoint = form.email
        ? `/api/auth/resend-verification/email`
        : `/api/auth/resend-verification/phone`;

      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: form.email || form.phone }),
      });

      if (res.ok) {
        setMessage('Verification code resent. Please check your email/phone.');
      } else {
        setError('Failed to resend verification code.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to resend verification code.');
    }
  };

  const compactForm = (
    <Box display="flex" justifyContent="center" width="100%">
      <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 640, p: { xs: 2, sm: 4 }, borderRadius: 2, boxShadow: 3, bgcolor: 'background.paper' }}>
        <Typography variant="h5" mb={2} align="center">
          Register
        </Typography>

        <TextField
          label="Name"
          fullWidth
          margin="normal"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <TextField
          label="Email (optional)"
          fullWidth
          margin="normal"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <TextField
          label="Phone (optional)"
          fullWidth
          margin="normal"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Typography variant="caption" color="text.secondary">
          You must provide at least an email or phone number.
        </Typography>

        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          fullWidth
          margin="normal"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword((prev) => !prev)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Fade in={!!form.password}>
          <Box mt={1}>
            <LinearProgress
              variant="determinate"
              value={strength.score}
              color={strength.color}
              sx={{ height: 6, borderRadius: 1 }}
            />
            <Typography variant="caption" color={strength.color}>
              {strength.label}
            </Typography>
          </Box>
        </Fade>

        <Autocomplete
          options={churches}
          getOptionLabel={(option) => option.name || ''}
          value={churches.find((c) => c.id === form.church_id) || null}
          onChange={(_, value) => setForm({ ...form, church_id: value ? value.id : '' })}
          renderInput={(params) => (
            <TextField {...params} label="Church" margin="normal" fullWidth required />
          )}
        />

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {message && <Alert severity={verificationSent ? 'info' : 'success'} sx={{ mt: 2 }}>{message}</Alert>}

        <Button type="submit" variant="contained" fullWidth color="secondary" sx={{ mt: 2 }}>
          Register
        </Button>

        {verificationSent && (
          <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={handleResend}>
            Resend Verification Email/Code
          </Button>
        )}

        <Button onClick={() => { if (modal) onSwitchToLogin(); else navigate('/login'); }} sx={{ mt: 1 }} fullWidth>
          Already have an account? Login
        </Button>
      </Box>
    </Box>
  );

  if (modal) return compactForm;

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
        <img src={logo} alt="Logo" style={{ width: 120, objectFit: 'contain' }} />
      </Box>

      {compactForm}
    </Box>
  );
}
