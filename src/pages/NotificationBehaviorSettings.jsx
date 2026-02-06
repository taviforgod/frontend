import React, { useContext, useState, useEffect } from "react";
import {
  Box, Paper, Typography, Switch, FormControlLabel, Button, Select, MenuItem, Alert, Chip
} from "@mui/material";
import NotificationContext from "../contexts/NotificationContext";

const notificationTypes = [
  { value: null, label: "All Types" },
  { value: "system", label: "System" },
  { value: "reminder", label: "Reminders" },
  { value: "message", label: "Messages" },
  { value: "digest", label: "Digest" }
];

export default function NotificationBehaviorSettings() {
  const { settings, updateSettings, reload, requestNotificationPermission } = useContext(NotificationContext);
  const [local, setLocal] = useState(settings);
  const [permissionStatus, setPermissionStatus] = useState('default');

  // keep local state in sync if settings change elsewhere
  useEffect(() => {
    setLocal(settings || {});
  }, [settings]);

  // Check notification permission status
  useEffect(() => {
    if (window.Notification) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const handleChange = (key, value) => {
    setLocal(l => ({ ...l, [key]: value }));
    updateSettings({ [key]: value });
  };

  return (
    <Paper sx={{ p: 3, mt: 4, maxWidth: 500 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Notification Behavior Settings</Typography>

      <FormControlLabel
        control={
          <Switch checked={!!local.sound} onChange={e => handleChange('sound', e.target.checked)} />
        }
        label="Play sound on notification"
      />

      <FormControlLabel
        control={
          <Switch checked={!!local.desktop} onChange={e => handleChange('desktop', e.target.checked)} />
        }
        label="Show desktop popup"
      />

      {/* Browser Notification Permission Status */}
      <Box sx={{ mt: 2, mb: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Browser Notification Permission:
          <Chip
            size="small"
            label={permissionStatus === 'granted' ? 'Granted' : permissionStatus === 'denied' ? 'Denied' : 'Not Set'}
            color={permissionStatus === 'granted' ? 'success' : permissionStatus === 'denied' ? 'error' : 'warning'}
            sx={{ ml: 1 }}
          />
        </Typography>

        {permissionStatus !== 'granted' && (
          <Alert severity="info" sx={{ mt: 1 }}>
            To receive desktop notifications, you need to grant permission to this website.
            <Button
              size="small"
              variant="outlined"
              sx={{ mt: 1, ml: 1 }}
              onClick={async () => {
                const granted = await requestNotificationPermission();
                if (granted) {
                  setPermissionStatus('granted');
                } else {
                  setPermissionStatus('denied');
                }
              }}
            >
              Request Permission
            </Button>
          </Alert>
        )}

        {permissionStatus === 'denied' && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            Browser notifications are blocked. Please enable them in your browser settings and refresh the page.
          </Alert>
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Filter notifications by type:</Typography>
        <Select
          value={local.filter ?? ""}
          onChange={e => handleChange('filter', e.target.value || null)}
          fullWidth
        >
          {notificationTypes.map(opt =>
            <MenuItem value={opt.value ?? ""} key={String(opt.value)}>{opt.label}</MenuItem>
          )}
        </Select>
      </Box>

      <Button
        variant="contained"
        sx={{ mt: 3 }}
        onClick={() => { reload(); alert("Settings saved!"); }}
      >
        Save & Reload Notifications
      </Button>
    </Paper>
  );
}