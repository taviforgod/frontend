import React, { useEffect, useState, useContext, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Snackbar,
  Alert,
  Grid,
  CircularProgress,
} from "@mui/material";
import { AuthContext } from "../contexts/AuthContext";
import { usePreferenceService } from "../services/preferenceService";
import NotificationContext from "../contexts/NotificationContext";

export default function NotificationPreferencesDashboard() {
  const { fetchWithAuth, ready } = useContext(AuthContext);
  const notifCtx = useContext(NotificationContext);
  const service = usePreferenceService(fetchWithAuth);

  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  // Load preferences once
  useEffect(() => {
    if (!ready || prefs) return; // only fetch once when ready

    let isMounted = true;

    const loadPrefs = async () => {
      setLoading(true);
      try {
        const data = await service.getPreferences();
        if (!isMounted) return;

        setPrefs({
          id: data?.id,
          channels: data?.channels || { in_app: true, email: false, sms: false, whatsapp: false },
          digest_enabled: !!data?.digest_enabled,
          quiet_hours: data?.quiet_hours || { start: "", end: "" },
        });
      } catch (err) {
        console.error("Failed to load preferences:", err);
        if (!isMounted) return;
        setPrefs({
          channels: { in_app: true, email: false, sms: false, whatsapp: false },
          digest_enabled: false,
          quiet_hours: { start: "", end: "" },
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPrefs();
    return () => {
      isMounted = false;
    };
  }, [ready, service]);

  // Toggle channel
  const handleToggleChannel = (channel) => {
    setPrefs((p) => ({
      ...p,
      channels: { ...p.channels, [channel]: !p.channels[channel] },
    }));
  };

  // Debounced save function
  const handleSave = useCallback(async () => {
    if (!prefs || saving) return;
    setSaving(true);
    try {
      const payload = {
        ...prefs,
        quiet_hours: prefs.quiet_hours || { start: "", end: "" },
      };

      if (prefs.id) {
        await service.updatePreferences(payload);
      } else if (typeof service.createPreferences === "function") {
        await service.createPreferences(payload);
      } else {
        await service.updatePreferences(payload); // fallback
      }

      notifCtx?.updateSettings?.(payload);
      notifCtx?.reload?.();

      setSnack({ open: true, message: "Preferences updated", severity: "success" });
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setSnack({ open: true, message: "Failed to save preferences", severity: "error" });
    } finally {
      setSaving(false);
    }
  }, [prefs, service, saving, notifCtx]);

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Paper sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Notification Preferences
      </Typography>

      {["in_app", "email", "sms", "whatsapp"].map((ch) => (
        <FormControlLabel
          key={ch}
          control={
            <Switch
              checked={!!prefs.channels[ch]}
              onChange={() => handleToggleChannel(ch)}
              disabled={saving}
            />
          }
          label={ch.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        />
      ))}

      <FormControlLabel
        control={
          <Switch
            checked={!!prefs.digest_enabled}
            onChange={() => setPrefs((p) => ({ ...p, digest_enabled: !p.digest_enabled }))}
            disabled={saving}
          />
        }
        label="Enable Daily Digest"
      />

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Quiet hours (local)
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Start (HH:MM)"
              placeholder="22:00"
              fullWidth
              value={prefs.quiet_hours?.start || ""}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, quiet_hours: { ...p.quiet_hours, start: e.target.value } }))
              }
              disabled={saving}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="End (HH:MM)"
              placeholder="07:00"
              fullWidth
              value={prefs.quiet_hours?.end || ""}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, quiet_hours: { ...p.quiet_hours, end: e.target.value } }))
              }
              disabled={saving}
            />
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Quiet hours mute desktop notifications locally. Use HH:MM 24-hour format; leave blank to
          disable.
        </Typography>
      </Box>

      <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Preferences"}
      </Button>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
