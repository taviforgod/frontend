import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent,
  Alert, CircularProgress, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem
} from '@mui/material';
import {
  PlayArrow, Schedule, CrisisAlert, Assignment,
  School, Refresh, CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const AutomatedReminders = () => {
  const { fetchWithAuth } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    type: null,
    title: '',
    description: ''
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/automated-reminders/status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError('Failed to load automated reminders status');
      console.error('Load status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const reminderTypes = [
    {
      id: 'followup',
      title: 'Follow-up Reminders',
      description: 'Weekly reminders for members who haven\'t been contacted in 30+ days',
      icon: <Schedule sx={{ fontSize: 40, color: 'primary.main' }} />,
      schedule: 'Every Monday 10:00 AM',
      color: 'primary'
    },
    {
      id: 'crisis',
      title: 'Crisis Alerts',
      description: 'Immediate notifications for crisis situations requiring pastoral care',
      icon: <CrisisAlert sx={{ fontSize: 40, color: 'error.main' }} />,
      schedule: 'Every 4 hours (8 AM - 6 PM)',
      color: 'error'
    },
    {
      id: 'reports',
      title: 'Report Reminders',
      description: 'Reminders for pending weekly and monthly report submissions',
      icon: <Assignment sx={{ fontSize: 40, color: 'warning.main' }} />,
      schedule: 'Every Friday 5:00 PM',
      color: 'warning'
    },
    {
      id: 'foundation',
      title: 'Foundation School',
      description: 'Monthly progress updates for foundation school students',
      icon: <School sx={{ fontSize: 40, color: 'success.main' }} />,
      schedule: '15th of every month 9:00 AM',
      color: 'success'
    }
  ];

  const handleTrigger = (type) => {
    const reminderType = reminderTypes.find(r => r.id === type);
    setConfirmDialog({
      open: true,
      type,
      title: `Trigger ${reminderType.title}`,
      description: `This will immediately run the ${reminderType.title.toLowerCase()} process. Are you sure?`
    });
  };

  const executeTrigger = async () => {
    const { type } = confirmDialog;

    try {
      setTriggering(prev => ({ ...prev, [type]: true }));
      setConfirmDialog({ open: false, type: null, title: '', description: '' });
      setError(null);

      // For demo purposes, using church_id = 1. In production, get from user context
      const response = await fetchWithAuth(`/api/automated-reminders/trigger/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ church_id: 1 })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message);
        setTimeout(() => setSuccess(null), 5000);
      } else {
        throw new Error('Failed to trigger automated reminders');
      }
    } catch (err) {
      setError(`Failed to trigger ${type} reminders`);
      console.error('Trigger error:', err);
    } finally {
      setTriggering(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleTriggerAll = () => {
    setConfirmDialog({
      open: true,
      type: 'all',
      title: 'Trigger All Automated Reminders',
      description: 'This will run all automated reminder processes immediately. This may take a few minutes. Are you sure?'
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Automated Reminders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage automated reminder systems for church operations and member care.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlayArrow />}
          onClick={handleTriggerAll}
          size="large"
        >
          Run All Reminders
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          <CheckCircle sx={{ mr: 1 }} />
          {success}
        </Alert>
      )}

      {status && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>System Status:</strong> {status.status} - {status.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {reminderTypes.map((reminder) => (
          <Grid item xs={12} md={6} key={reminder.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  {reminder.icon}
                  <Box ml={2}>
                    <Typography variant="h6" fontWeight={600}>
                      {reminder.title}
                    </Typography>
                    <Chip
                      label={reminder.schedule}
                      size="small"
                      color={reminder.color}
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                  {reminder.description}
                </Typography>

                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrow />}
                    onClick={() => handleTrigger(reminder.id)}
                    disabled={triggering[reminder.id]}
                    fullWidth
                  >
                    {triggering[reminder.id] ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        Running...
                      </>
                    ) : (
                      'Run Now'
                    )}
                  </Button>
                  <Button
                    variant="text"
                    startIcon={<Refresh />}
                    onClick={loadStatus}
                    size="small"
                  >
                    Refresh
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* System Information */}
      <Paper sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          System Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These automated reminders run on scheduled intervals to ensure timely communication
          and follow-up within your church community.
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="primary">
              Available Reminder Types:
            </Typography>
            <Box component="ul" sx={{ pl: 2, mt: 1 }}>
              {status?.available_types?.map(type => (
                <li key={type}>
                  <Typography variant="body2">{type}</Typography>
                </li>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="primary">
              Scheduling:
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              • Follow-up reminders: Weekly (Mondays)
              <br />
              • Crisis alerts: Continuous monitoring
              <br />
              • Report reminders: Weekly (Fridays)
              <br />
              • Foundation school: Monthly (15th)
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, type: null, title: '', description: '' })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.description}</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmDialog({ open: false, type: null, title: '', description: '' })}
          >
            Cancel
          </Button>
          <Button
            onClick={executeTrigger}
            variant="contained"
            disabled={triggering[confirmDialog.type]}
          >
            {triggering[confirmDialog.type] ? 'Running...' : 'Execute'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutomatedReminders;