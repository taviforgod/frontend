import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Switch, FormControlLabel, Button, Grid,
  Alert, CircularProgress, Card, CardContent, Divider, Chip
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const NotificationPreferences = () => {
  const { fetchWithAuth } = useAuth();
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/notifications/preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError('Failed to load notification preferences');
      console.error('Load preferences error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (channel, enabled) => {
    setPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: enabled
      }
    }));
  };

  const handleDigestToggle = (enabled) => {
    setPreferences(prev => ({
      ...prev,
      digest_enabled: enabled
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        [field]: value
      }
    }));
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetchWithAuth('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setSuccess('Notification preferences saved successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (err) {
      setError('Failed to save notification preferences');
      console.error('Save preferences error:', err);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setPreferences({
      channels: {
        in_app: true,
        email: true,
        sms: false,
        whatsapp: false
      },
      digest_enabled: true,
      quiet_hours: {
        start: '22:00',
        end: '08:00'
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!preferences) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load notification preferences</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom fontWeight={600}>
        Notification Preferences
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Configure how and when you receive notifications from the church management system.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Notification Channels */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notification Channels
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choose which channels you want to receive notifications through.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.channels?.in_app || false}
                      onChange={(e) => handleChannelToggle('in_app', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">In-App Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications within the application
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.channels?.email || false}
                      onChange={(e) => handleChannelToggle('email', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">Email Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications via email
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.channels?.sms || false}
                      onChange={(e) => handleChannelToggle('sms', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">SMS Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications via text message
                      </Typography>
                    </Box>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.channels?.whatsapp || false}
                      onChange={(e) => handleChannelToggle('whatsapp', e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">WhatsApp Notifications</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive notifications via WhatsApp
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Digest and Quiet Hours */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Digest Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure how you receive grouped notifications.
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.digest_enabled || false}
                    onChange={(e) => handleDigestToggle(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1">Daily Digest</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Receive a daily summary of notifications
                    </Typography>
                  </Box>
                }
              />

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Quiet Hours
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set times when you don't want to receive notifications.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>Start Time</Typography>
                  <input
                    type="time"
                    value={preferences.quiet_hours?.start || '22:00'}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>End Time</Typography>
                  <input
                    type="time"
                    value={preferences.quiet_hours?.end || '08:00'}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Notifications will be paused between {preferences.quiet_hours?.start || '22:00'} and {preferences.quiet_hours?.end || '08:00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={resetToDefaults}
          disabled={saving}
        >
          Reset to Defaults
        </Button>
        <Button
          variant="contained"
          onClick={savePreferences}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </Box>
    </Box>
  );
};

export default NotificationPreferences;