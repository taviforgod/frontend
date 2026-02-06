import React, { useState, useEffect } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Alert, CircularProgress, List, ListItem,
  ListItemText, Chip, Divider, FormControl, InputLabel,
  Select, MenuItem, Checkbox, ListItemIcon
} from '@mui/material';
import { PersonAdd, CheckCircle, AutoFixHigh } from '@mui/icons-material';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const GenerateAbsenteeFollowups = ({ onSuccess }) => {
  const { fetchWithAuth, user } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [selectedReports, setSelectedReports] = useState([]);
  const [generatedFollowups, setGeneratedFollowups] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    setGeneratedFollowups([]);
    setError(null);
    setSuccess(false);
    setSelectedReports([]);

    // Fetch recent weekly reports
    try {
      const churchId = user?.church_id;
      const response = await fetchWithAuth(`/api/weekly-reports?limit=50&church_id=${churchId}`);
      const data = await response.json();
      if (response.ok) {
        // Filter to only show reports that have absentees
        // API returns array directly, not wrapped in { reports: ... }
        const reportsWithAbsentees = (data || []).filter(report =>
          report.absentees && Array.isArray(report.absentees) && report.absentees.length > 0
        );
        setWeeklyReports(reportsWithAbsentees);
      }
    } catch (err) {
      console.error('Failed to fetch weekly reports:', err);
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleReportToggle = (reportId) => {
    setSelectedReports(prev =>
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleGenerate = async () => {
    if (selectedReports.length === 0) {
      setError('Please select at least one weekly report');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allGeneratedFollowups = [];

      // Generate followups for each selected report
      for (const reportId of selectedReports) {
        const response = await fetchWithAuth('/api/absentee-followups/generate-from-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weekly_report_id: reportId })
        });

        const data = await response.json();

        if (response.ok) {
          allGeneratedFollowups.push(...(data.followups || []));
        } else {
          throw new Error(data.error || `Failed to generate follow-ups for report ${reportId}`);
        }
      }

      setGeneratedFollowups(allGeneratedFollowups);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to generate follow-ups');
      console.error('Generate followups error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<AutoFixHigh />}
        onClick={handleOpen}
        size="small"
      >
        Generate Follow-ups
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Generate Absentee Follow-ups from Weekly Reports
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select weekly reports to generate follow-up records for absentees.
            Existing follow-ups will be updated with consecutive absence counts.
          </Typography>

          {weeklyReports.length > 0 ? (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select Reports ({selectedReports.length} selected):
              </Typography>
              <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1 }}>
                {weeklyReports.map((report) => (
                  <ListItem key={report.id} dense>
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleReportToggle(report.id)}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2">
                            {report.cell_group_name} - {new Date(report.meeting_date).toLocaleDateString()}
                          </Typography>
                          {report.absentees && report.absentees.length > 0 && (
                            <Chip
                              label={`${report.absentees.length} absentees`}
                              size="small"
                              color="warning"
                            />
                          )}
                        </Box>
                      }
                      secondary={`Topic: ${report.topic || 'No topic'}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Loading weekly reports...
            </Typography>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <CheckCircle sx={{ mr: 1 }} />
              Successfully generated {generatedFollowups.length} follow-up record(s)!
            </Alert>
          )}

          {generatedFollowups.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Generated Follow-ups:
              </Typography>
              <List>
                {generatedFollowups.map((followup, index) => (
                  <React.Fragment key={followup.id || index}>
                    <ListItem>
                      <ListItemText
                        primary={`${followup.first_name} ${followup.surname}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" component="span">
                              {followup.consecutive_absences} consecutive absences
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={followup.priority_level}
                                color={
                                  followup.priority_level === 'urgent' ? 'error' :
                                  followup.priority_level === 'high' ? 'warning' :
                                  followup.priority_level === 'normal' ? 'info' : 'success'
                                }
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                label={followup.status}
                                color={
                                  followup.status === 'pending' ? 'warning' :
                                  followup.status === 'resolved' ? 'success' : 'info'
                                }
                                size="small"
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < generatedFollowups.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}

          {!success && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>What happens:</strong>
              </Typography>
              <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                • System checks for existing follow-ups for absent members<br/>
                • Creates new follow-ups for first-time absentees<br/>
                • Updates consecutive absence counts<br/>
                • Assigns priority levels based on absence patterns<br/>
                • Sets appropriate due dates and follow-up frequencies
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          {!success && (
            <Button
              onClick={handleGenerate}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <PersonAdd />}
            >
              {loading ? 'Generating...' : 'Generate Follow-ups'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default GenerateAbsenteeFollowups;