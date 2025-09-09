import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, Autocomplete } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';
import { getChurches } from '../../services/lookupService';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [churches, setChurches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getChurches().then(setChurches);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
      if (res && res.id) {
        if (form.phone) {
          navigate('/verify-phone', { state: { userId: res.id } });
        } else {
          navigate('/login');
        }
      } else {
        setError('Registration succeeded but user ID missing');
      }
    } catch (err) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8} p={4} boxShadow={3}>
      <Typography variant="h5" mb={2}>Register</Typography>
      <form onSubmit={handleSubmit}>
        <TextField label="Name" fullWidth margin="normal"
          value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <TextField label="Email (optional)" fullWidth margin="normal"
          value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <TextField label="Phone (optional)" fullWidth margin="normal"
          value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
        <Typography variant="caption" color="textSecondary">
          You must provide at least an email or phone number.
        </Typography>
        <TextField label="Password" type="password" fullWidth margin="normal"
          value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
        <Autocomplete
          options={churches}
          getOptionLabel={option => option.name || ''}
          value={churches.find(c => c.id === form.church_id) || null}
          onChange={(_, value) => setForm({ ...form, church_id: value ? value.id : '' })}
          renderInput={params => (
            <TextField {...params} label="Church" margin="normal" fullWidth required />
          )}
        />
        {error && <Alert severity="error">{error}</Alert>}
        <Button type="submit" variant="contained" fullWidth sx={{mt:2}}>Register</Button>
      </form>
      <Button onClick={()=>navigate('/login')} sx={{mt:1}}>Already have an account? Login</Button>
    </Box>
  );
}