import React, { useContext, useState } from "react";
import {
  Box, Paper, Typography, Switch, FormControlLabel, Button, Select, MenuItem,
  TextField, InputLabel
} from "@mui/material";
import NotificationContext from "../contexts/NotificationContext";

const notificationTypes = [
  { value: null, label: "All Types" },
  { value: "system", label: "System" },
  { value: "reminder", label: "Reminders" },
  { value: "message", label: "Messages" },
  { value: "digest", label: "Digest" }
];

// BUILT-IN TONES (add more or allow upload)
const tones = [
  { value: "/notification.mp3", label: "Default" },
  { value: "/sounds/chime.mp3", label: "Chime" },
  { value: "/sounds/alert.wav", label: "Alert" }
];

export default function NotificationAdvancedSettings() {
  const { settings, updateSettings, reload } = useContext(NotificationContext);
  const [local, setLocal] = useState(settings);

  const [customToneUrl, setCustomToneUrl] = useState(local.tone?.startsWith("/") ? "" : local.tone || "");

  // Quiet hours structure: { start: "22:00", end: "07:00" }
  const handleChange = (key, value) => {
    setLocal(l => ({ ...l, [key]: value }));
    updateSettings({ [key]: value });
  };

  const handleToneChange = (v) => {
    handleChange('tone', v.target.value);
    setCustomToneUrl("");
  };

  const handleCustomToneUrl = (e) => {
    setCustomToneUrl(e.target.value);
    handleChange('tone', e.target.value);
  };

  return (
    <Paper sx={{ p: 3, mt: 4, maxWidth: 520 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Advanced Notification Settings</Typography>
      {/* Sound and desktop */}
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
        label="Show desktop popups"
      />
      {/* Tones */}
      <Box sx={{ mt: 2 }}>
        <InputLabel>Choose notification tone:</InputLabel>
        <Select
          value={local.tone || ""}
          onChange={handleToneChange}
          fullWidth
        >
          {tones.map(t =>
            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
          )}
          <MenuItem value="">Custom URL...</MenuItem>
        </Select>
        {local.tone === "" &&
          <TextField
            label="Custom Tone URL"
            value={customToneUrl}
            onChange={handleCustomToneUrl}
            fullWidth
            sx={{ mt: 1 }}
          />
        }
        {local.tone && (
          <Button
            onClick={() => {
              const audio = new Audio(local.tone);
              audio.play();
            }}
            sx={{ mt: 1 }}
            variant="outlined"
            size="small"
          >Test Tone</Button>
        )}
      </Box>
      {/* Quiet hours */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1">Quiet Hours (no notifications):</Typography>
        <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
          <TextField
            label="Start Time"
            type="time"
            value={local.quiet_hours?.start || ""}
            onChange={e => {
              handleChange("quiet_hours", { ...local.quiet_hours, start: e.target.value });
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
          />
          <TextField
            label="End Time"
            type="time"
            value={local.quiet_hours?.end || ""}
            onChange={e => {
              handleChange("quiet_hours", { ...local.quiet_hours, end: e.target.value });
            }}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Notifications will be muted between these times (local time zone).
        </Typography>
      </Box>
      {/* Filter */}
      <Box sx={{ mt: 3 }}>
        <InputLabel>Filter notifications by type:</InputLabel>
        <Select
          value={local.filter ?? ""}
          onChange={e => handleChange('filter', e.target.value || null)}
          fullWidth
        >
          {notificationTypes.map(opt =>
            <MenuItem value={opt.value || ""} key={opt.value}>{opt.label}</MenuItem>
          )}
        </Select>
      </Box>
      {/* Save & Reload */}
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