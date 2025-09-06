import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Avatar, Divider, TextField,
  Button, Grid, Snackbar, Alert, IconButton, LinearProgress
} from '@mui/material';
import { Camera } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile } from '../../services/userService';

const getPasswordStrength = (password) => {
  if (password.length < 6) return { score: 0, label: 'Too short' };
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  let label = ['Weak', 'Fair', 'Good', 'Strong'][score - 1] || 'Weak';
  return { score, label };
};

export default function Profile() {
  const { user, logout, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (avatar) formData.append('avatar', avatar);
    if (newPassword) {
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/profile`, {
        method: 'PUT',
        credentials: 'include', 
        body: formData
      });

      let data;
      try {
        data = await res.json();
      } catch {
        // If response is not JSON, get text for debugging
        const text = await res.text();
        throw new Error(text || 'Unknown error');
      }

      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');

      if (newPassword) {
        setTimeout(() => {
          logout && logout();
          navigate('/login');
        }, 2000);
      } else {
        // Refresh user context with latest profile
        const updatedProfile = await getProfile();
        setUser && setUser(updatedProfile);
        setTimeout(() => {
          setSuccess(false);
        }, 2000);
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setAvatar(null);
    setAvatarPreview(null);
    setCurrentPassword('');
    setNewPassword('');
    setError('');
    setSuccess(false);
    navigate(-1);
  };

  const { score, label } = getPasswordStrength(newPassword);

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            src={avatarPreview || user?.avatar_url}
            sx={{ width: 64, height: 64, mr: 2 }}
          >
            <Camera />
          </Avatar>
          <Button
            variant="outlined"
            component="label"
            size="small"
            sx={{ mr: 2 }}
          >
            Change Avatar
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarChange}
            />
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleSave}
          >
            Save
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Profile Information
        </Typography>
        <TextField
          label="Name"
          fullWidth
          margin="normal"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Current Password"
          type="password"
          fullWidth
          margin="normal"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
        />
        <TextField
          label="New Password"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        <LinearProgress variant="determinate" value={score * 25} sx={{ height: 10, borderRadius: 5, my: 1 }} />
        <Typography variant="caption" color="textSecondary" gutterBottom>
          Password strength: {label}
        </Typography>
        {success && <Alert severity="success">{success}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Button
          variant="contained"
          fullWidth
          onClick={handleSave}
          sx={{ mt: 2 }}
        >
          Update Profile
        </Button>
        <Button
          variant="outlined"
          fullWidth
          onClick={handleCancel}
          sx={{ mt: 1 }}
        >
          Cancel
        </Button>
      </Paper>
    </Box>
  );
}