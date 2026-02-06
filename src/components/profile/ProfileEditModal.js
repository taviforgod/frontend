import React, { useState, useEffect, useContext } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, TextField,
  Grid, Button, CircularProgress, Alert, Avatar, IconButton, Stack,
  Typography, MenuItem, Paper, useMediaQuery
} from '@mui/material';
import { Upload, X, Save, User, Mail, MapPin, Image } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles'; // Add this for breakpoints if needed

const API_URL = process.env.REACT_APP_API_URL || '';

const MENU_ITEMS = [
  { id: 0, label: 'Personal', icon: User },
  { id: 1, label: 'Contact', icon: Mail },
  { id: 2, label: 'Address & Work', icon: MapPin },
  { id: 3, label: 'Photo', icon: Image }
];

function AnimatedTabPanel({ children, value, index }) {
  return (
    <AnimatePresence mode="wait">
      {value === index && (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <Box sx={{ pt: 2 }}>{children}</Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProfileEditModal({ open, onClose, onSuccess }) {
  const { fetchWithAuth } = useContext(AuthContext);
  const { theme } = useContext(ThemeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // Use theme breakpoints for consistency

  // Unified input styles (Monday-like)
  const INPUT_SX = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      background: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : '#fff',
      fontSize: isMobile ? 15 : 16,
      minHeight: isMobile ? 38 : 44,
      '& fieldset': { borderColor: theme.palette.divider },
      '&:hover fieldset': { borderColor: theme.palette.primary.light },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main }
    },
    '& .MuiInputLabel-root': { fontWeight: 700, fontSize: isMobile ? 13 : 15 }
  };

  const CARD_SX = {
    p: isMobile ? 1.5 : 3,
    borderRadius: isMobile ? 2 : 3,
    background: theme.palette.background.paper,
    boxShadow: theme.customShadows?.card || '0 6px 18px rgba(0,0,0,0.06)',
    border: `1px solid ${theme.palette.divider}`,
    mb: isMobile ? 1.5 : 2
  };

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [profile, setProfile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [lookupData, setLookupData] = useState({
    genders: [],
    nationalities: [],
    maritalStatuses: []
  });

  // Load profile data when modal opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileRes = await fetchWithAuth(`${API_URL}/api/members/me`);
        if (!profileRes.ok) {
          setError('Failed to load profile');
          setLoading(false);
          return;
        }
        const profileData = await profileRes.json();
        if (!cancelled) setProfile(profileData);

        const [gRes, nRes, mRes] = await Promise.all([
          fetchWithAuth(`${API_URL}/api/lookups/genders`),
          fetchWithAuth(`${API_URL}/api/lookups/nationalities`),
          fetchWithAuth(`${API_URL}/api/lookups/marital-statuses`)
        ]);

        if (!cancelled) {
          setLookupData({
            genders: gRes.ok ? await gRes.json() : [],
            nationalities: nRes.ok ? await nRes.json() : [],
            maritalStatuses: mRes.ok ? await mRes.json() : []
          });
        }
      } catch (err) {
        console.error('Error loading data:', err);
        if (!cancelled) setError('Error loading profile data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [open, fetchWithAuth]);

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value === '' ? null : value
    }));
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed');
      return;
    }

    setPhotoFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => setPhotoPreview(event.target?.result);
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;

    try {
      setPhotoUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('photo', photoFile);

      const res = await fetch(`${API_URL}/api/members/me/photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.member);
        setPhotoFile(null);
        setPhotoPreview(null);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 1800);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to upload photo');
      }
    } catch (err) {
      console.error('Error uploading photo:', err);
      setError('Error uploading photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      const res = await fetchWithAuth(`${API_URL}/api/members/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 900);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to save profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullScreen={isMobile} // <-- Fullscreen on mobile
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 6,
            background: theme.palette.background.default,
            boxShadow: theme.customShadows?.modal || '0 14px 40px rgba(2,6,23,0.12)'
          }
        }}
      >
        {/* HEADER */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: isMobile ? 1.5 : 3,
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            minHeight: isMobile ? 48 : 64
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={800} color={theme.palette.text.primary} fontSize={isMobile ? 18 : 22}>
              Edit Profile
            </Typography>
            {!isMobile && (
              <Typography variant="body2" color="text.secondary">
                Update your details — we'll save them to your account.
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
              background: theme.palette.action.hover,
              '&:hover': { background: theme.palette.action.selected },
              borderRadius: 2,
              ml: 1
            }}
            aria-label="Close"
            size={isMobile ? 'small' : 'medium'}
          >
            <X size={isMobile ? 20 : 22} />
          </IconButton>
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent
          sx={{
            p: 0,
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            background: theme.palette.background.default,
            minHeight: isMobile ? '100vh' : 520
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={isMobile ? 2 : 4} width="100%" minHeight={isMobile ? 200 : 300}>
              <CircularProgress />
            </Box>
          ) : profile ? (
            <Box sx={{ display: 'flex', width: '100%', flexDirection: isMobile ? 'column' : 'row' }}>
              {/* LEFT SIDEBAR */}
              {!isMobile && (
                <Box
                  sx={{
                    width: 240,
                    borderRight: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.background.paper,
                    display: 'flex',
                    flexDirection: 'column',
                    p: 2
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color={theme.palette.text.disabled} sx={{ mb: 2, px: 1 }}>
                    SECTIONS
                  </Typography>
                  <Stack spacing={1}>
                    {MENU_ITEMS.map((item) => {
                      const Icon = item.icon;
                      const isActive = tabValue === item.id;
                      return (
                        <motion.div key={item.id} whileHover={{ x: 6 }}>
                          <Button
                            fullWidth
                            onClick={() => setTabValue(item.id)}
                            startIcon={<Icon size={18} />}
                            sx={{
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              fontWeight: isActive ? 800 : 700,
                              borderRadius: 2,
                              color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                              background: isActive ? theme.palette.action.selected : 'transparent',
                              p: 1.4,
                              transition: 'all 0.18s ease',
                              '&:hover': {
                                background: isActive ? theme.palette.action.selected : theme.palette.action.hover
                              },
                              borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                              pl: 1.2
                            }}
                          >
                            {item.label}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              {/* MAIN CONTENT */}
              <Box sx={{ flex: 1, p: isMobile ? 1.5 : 3 }}>
                {error && (
                  <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <Alert
                        severity="success"
                        sx={{
                          mb: 2,
                          borderRadius: 2,
                          boxShadow: theme.customShadows?.success || '0 6px 20px rgba(34,197,94,0.08)'
                        }}
                      >
                        Profile updated successfully!
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Paper elevation={0} sx={{ p: 0, borderRadius: 0, background: 'transparent' }}>
                  {/* Mobile: Top Tabs */}
                  {isMobile && (
                    <Stack direction="row" spacing={0.5} sx={{ mb: 1 }}>
                      {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = tabValue === item.id;
                        return (
                          <Button
                            key={item.id}
                            onClick={() => setTabValue(item.id)}
                            startIcon={<Icon size={16} />}
                            sx={{
                              flex: 1,
                              minWidth: 0,
                              fontWeight: isActive ? 800 : 700,
                              color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                              background: isActive ? theme.palette.action.selected : 'transparent',
                              borderRadius: 2,
                              textTransform: 'none',
                              px: 0.25,
                              py: 1,
                              fontSize: 14
                            }}
                          >
                            {item.label}
                          </Button>
                        );
                      })}
                    </Stack>
                  )}

                  {/* PERSONAL */}
                  <AnimatedTabPanel value={tabValue} index={0}>
                    <Paper sx={CARD_SX}>
                      <Grid container spacing={isMobile ? 1 : 2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            value={profile?.first_name || ''}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Surname"
                            value={profile?.surname || ''}
                            onChange={(e) => handleInputChange('surname', e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Date of Birth"
                            type="date"
                            value={profile?.date_of_birth ? profile.date_of_birth.split('T')[0] : ''}
                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                            size="small"
                            variant="outlined"
                            InputLabelProps={{ shrink: true }}
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            label="Gender"
                            value={profile?.gender_id || ''}
                            onChange={(e) => handleInputChange('gender_id', e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={INPUT_SX}
                          >
                            <MenuItem value="">Select Gender</MenuItem>
                            {(lookupData?.genders || []).map(g => (
                              <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            label="Nationality"
                            value={profile?.nationality_id || ''}
                            onChange={(e) => handleInputChange('nationality_id', e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={INPUT_SX}
                          >
                            <MenuItem value="">Select Nationality</MenuItem>
                            {(lookupData?.nationalities || []).map(n => (
                              <MenuItem key={n.id} value={n.id}>{n.name}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            label="Marital Status"
                            value={profile?.marital_status_id || ''}
                            onChange={(e) => handleInputChange('marital_status_id', e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={INPUT_SX}
                          >
                            <MenuItem value="">Select Status</MenuItem>
                            {(lookupData?.maritalStatuses || []).map(m => (
                              <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                            ))}
                          </TextField>
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Number of Children"
                            type="number"
                            value={profile?.num_children ?? ''}
                            onChange={(e) => handleInputChange('num_children', e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={INPUT_SX}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </AnimatedTabPanel>

                  {/* CONTACT */}
                  <AnimatedTabPanel value={tabValue} index={1}>
                    <Paper sx={CARD_SX}>
                      <Grid container spacing={isMobile ? 1 : 2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            type="email"
                            value={profile?.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            size="small"
                            variant="outlined"
                            helperText="Used for login"
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Primary Phone"
                            value={profile?.contact_primary || ''}
                            onChange={(e) => handleInputChange('contact_primary', e.target.value)}
                            size="small"
                            variant="outlined"
                            helperText="Used for login and SMS"
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Secondary Phone"
                            value={profile?.contact_secondary || ''}
                            onChange={(e) => handleInputChange('contact_secondary', e.target.value)}
                            size="small"
                            variant="outlined"
                            helperText="Optional"
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Alert severity="info">
                            Changes to email or phone will update your login credentials.
                          </Alert>
                        </Grid>
                      </Grid>
                    </Paper>
                  </AnimatedTabPanel>

                  {/* ADDRESS & WORK */}
                  <AnimatedTabPanel value={tabValue} index={2}>
                    <Paper sx={CARD_SX}>
                      <Grid container spacing={isMobile ? 1 : 2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" fontWeight={800} mb={1}>
                            Residential Address
                          </Typography>
                          <TextField
                            fullWidth
                            label="Physical Address"
                            value={profile?.physical_address || ''}
                            onChange={(e) => handleInputChange('physical_address', e.target.value)}
                            size="small"
                            variant="outlined"
                            multiline
                            rows={2}
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" fontWeight={800} mb={1}>
                            Work Information
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Profession"
                            value={profile?.profession || ''}
                            onChange={(e) => handleInputChange('profession', e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Occupation"
                            value={profile?.occupation || ''}
                            onChange={(e) => handleInputChange('occupation', e.target.value)}
                            size="small"
                            variant="outlined"
                            sx={INPUT_SX}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Work Address"
                            value={profile?.work_address || ''}
                            onChange={(e) => handleInputChange('work_address', e.target.value)}
                            size="small"
                            variant="outlined"
                            multiline
                            rows={2}
                            sx={INPUT_SX}
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </AnimatedTabPanel>

                  {/* PHOTO */}
                  <AnimatedTabPanel value={tabValue} index={3}>
                    <Paper sx={{ ...CARD_SX, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Update your profile photo
                      </Typography>
                      <Avatar
                        src={photoPreview || profile?.profile_photo}
                        sx={{
                          width: isMobile ? 90 : 120,
                          height: isMobile ? 90 : 120,
                          borderRadius: '20%',
                          margin: '12px auto',
                          boxShadow: theme.customShadows?.avatar || '0 6px 18px rgba(2,6,23,0.08)',
                          bgcolor: theme.palette.primary.main,
                          fontSize: isMobile ? 22 : 28
                        }}
                      >
                        {(profile?.first_name?.[0] || 'U').toUpperCase()}
                      </Avatar>
                      <Box sx={{ width: '100%', mb: 1 }}>
                        <input
                          accept="image/*"
                          type="file"
                          onChange={handlePhotoSelect}
                          style={{ display: 'none' }}
                          id="photo-input-modal"
                        />
                        <label htmlFor="photo-input-modal" style={{ display: 'block', width: '100%' }}>
                          <Button
                            variant="outlined"
                            component="span"
                            fullWidth
                            startIcon={<Upload size={16} />}
                            size="small"
                            sx={{
                              textTransform: 'none',
                              borderRadius: 2,
                              fontWeight: 800,
                              fontSize: isMobile ? 14 : 16
                            }}
                          >
                            Choose Photo
                          </Button>
                        </label>
                      </Box>
                      {photoFile && (
                        <Stack direction="row" spacing={1} sx={{ width: '100%', mt: 1 }}>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            fullWidth
                            startIcon={<X size={16} />}
                            onClick={() => {
                              setPhotoFile(null);
                              setPhotoPreview(null);
                            }}
                            sx={{ textTransform: 'none', borderRadius: 2, fontSize: isMobile ? 14 : 16 }}
                          >
                            Remove
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            fullWidth
                            startIcon={photoUploading ? <CircularProgress size={16} /> : <Upload size={16} />}
                            onClick={handlePhotoUpload}
                            disabled={photoUploading}
                            sx={{ textTransform: 'none', borderRadius: 2, fontSize: isMobile ? 14 : 16 }}
                          >
                            {photoUploading ? 'Uploading...' : 'Upload'}
                          </Button>
                        </Stack>
                      )}
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        Supported formats: JPEG, PNG, WebP — Max 5MB
                      </Typography>
                    </Paper>
                  </AnimatedTabPanel>
                </Paper>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: isMobile ? 2 : 4 }}>
              <Typography>Failed to load profile</Typography>
            </Box>
          )}
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            p: isMobile ? 1.5 : 3,
            borderTop: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            display: 'flex',
            gap: 2
          }}
        >
          <Button
            onClick={onClose}
            sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 700, fontSize: isMobile ? 15 : 16 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <Save size={16} />}
            onClick={handleSaveProfile}
            disabled={saving || loading}
            sx={{
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 700,
              minWidth: isMobile ? 100 : 140,
              fontSize: isMobile ? 15 : 16
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
