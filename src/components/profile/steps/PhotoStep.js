import React, { useState } from 'react';
import {
  Box, Typography, Stack, Avatar, Button, CircularProgress,
  Alert, Paper
} from '@mui/material';
import { Upload, X, Check } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || '';

export default function PhotoStep({ profile, setProfile, fetchWithAuth }) {
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
        setUploadError('Only JPEG, PNG, and WebP images are allowed');
        return;
      }

      setPhotoFile(file);
      setUploadError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('photo', photoFile);

      const res = await fetch(`${API_URL}/api/members/me/photo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.member);
        setPhotoFile(null);
        setPhotoPreview(null);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        const err = await res.json();
        setUploadError(err.error || 'Failed to upload photo');
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setUploadError('Error uploading photo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Box sx={{ p: 1, bgcolor: '#fef3c7', borderRadius: 2 }}>
          <Upload size={24} color="#b45309" />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Profile Photo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add or update your profile picture
          </Typography>
        </Box>
      </Stack>

      {uploadError && (
        <Alert severity="error" onClose={() => setUploadError(null)} sx={{ mb: 2 }}>
          {uploadError}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert severity="success" icon={<Check size={20} />} sx={{ mb: 2 }}>
          Photo uploaded successfully!
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Current Photo */}
        <Paper sx={{ p: 3, bgcolor: '#f9fafb', borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="subtitle2" fontWeight={700} mb={2}>
            Current Photo
          </Typography>
          <Avatar
            src={profile?.profile_photo || photoPreview}
            sx={{
              width: 150,
              height: 150,
              bgcolor: 'primary.main',
              margin: '0 auto',
              fontSize: 48
            }}
          >
            {(profile?.first_name?.[0] || 'U').toUpperCase()}
          </Avatar>
        </Paper>

        {/* Upload Area */}
        <Paper sx={{ p: 3, bgcolor: '#f0f9ff', border: '2px dashed #0369a1', borderRadius: 2 }}>
          <Stack spacing={2} alignItems="center">
            <Box sx={{ p: 2, bgcolor: '#e0f2fe', borderRadius: '50%' }}>
              <Upload size={32} color="#0369a1" />
            </Box>

            <Box textAlign="center">
              <Typography variant="body1" fontWeight={600} mb={1}>
                Drag and drop your photo here
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                or click the button below
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Supported formats: JPEG, PNG, WebP (Max 5MB)
              </Typography>
            </Box>

            <input
              accept="image/*"
              type="file"
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
              id="photo-input"
            />

            <label htmlFor="photo-input" style={{ display: 'block', width: '100%' }}>
              <Button
                variant="contained"
                component="span"
                startIcon={<Upload size={18} />}
                sx={{ textTransform: 'none' }}
              >
                Choose Photo
              </Button>
            </label>
          </Stack>
        </Paper>

        {/* Preview */}
        {photoPreview && (
          <Paper sx={{ p: 3, bgcolor: '#f9fafb', borderRadius: 2 }}>
            <Stack spacing={2}>
              <Box textAlign="center">
                <Typography variant="subtitle2" fontWeight={700} mb={2}>
                  Preview
                </Typography>
                <Avatar
                  src={photoPreview}
                  sx={{
                    width: 150,
                    height: 150,
                    margin: '0 auto'
                  }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" textAlign="center">
                {photoFile?.name}
              </Typography>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<X size={18} />}
                  fullWidth
                  onClick={() => {
                    setPhotoFile(null);
                    setPhotoPreview(null);
                  }}
                >
                  Remove
                </Button>

                <Button
                  variant="contained"
                  startIcon={uploading ? <CircularProgress size={18} /> : <Upload size={18} />}
                  fullWidth
                  onClick={handlePhotoUpload}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}