import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Snackbar, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, List, ListItem, ListItemText, Avatar, Divider,
  LinearProgress, Stepper, Step, StepLabel, CardHeader
} from '@mui/material';
import {
  Assessment, TrendingUp, TrendingDown, TrendingFlat,
  ExpandMore, Add, Edit, Download, Schedule,
  BarChart, PieChart, Timeline, Analytics
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AutomatedReports = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const [reportTemplates, setReportTemplates] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Form states
  const [generateForm, setGenerateForm] = useState({
    template_id: '',
    report_period_start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    report_period_end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    report_name: ''
  });

  // UI states
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        templatesRes,
        reportsRes,
        analyticsRes
      ] = await Promise.all([
        fetchWithAuth('/api/reports/templates'),
        fetchWithAuth('/api/reports/reports'),
        fetchWithAuth('/api/reports/analytics/dashboard')
      ]);

      const templatesData = templatesRes.ok ? await templatesRes.json() : [];
      const reportsData = reportsRes.ok ? await reportsRes.json() : [];
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      setReportTemplates(templatesData);
      setGeneratedReports(reportsData);
      setAnalytics(analyticsData);

    } catch (err) {
      console.error('Failed to load reports data:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateReport = async () => {
    try {
      const response = await fetchWithAuth('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: generateForm.template_id,
          report_period_start: generateForm.report_period_start.toISOString().split('T')[0],
          report_period_end: generateForm.report_period_end.toISOString().split('T')[0],
          report_name: generateForm.report_name
        })
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const result = await response.json();
      setGenerateDialogOpen(false);
      setGenerateForm({
        template_id: '',
        report_period_start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        report_period_end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
        report_name: ''
      });
      loadData();
      setSnackbar({ open: true, message: 'Report generated successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to generate report:', err);
      setSnackbar({ open: true, message: 'Failed to generate report', severity: 'error' });
    }
  };

  const handleExportReport = async (reportId, format = 'json') => {
    try {
      const response = await fetchWithAuth(`/api/reports/reports/${reportId}/export?format=${format}`);
      if (!response.ok) throw new Error('Failed to export report');

      const data = await response.json();

      // For JSON, create a downloadable file
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setSnackbar({ open: true, message: 'Report exported successfully', severity: 'success' });
    } catch (err) {
      console.error('Failed to export report:', err);
      setSnackbar({ open: true, message: 'Failed to export report', severity: 'error' });
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return <TrendingFlat color="action" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'success.main';
      case 'down': return 'error.main';
      default: return 'text.secondary';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading && !analytics) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Automated Reports Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Consolidated ministry reports and analytics from all modules
        </Typography>

        {/* Quick Stats Cards */}
        {analytics && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(analytics.current_month.giving.total_giving)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Giving
                      </Typography>
                    </Box>
                    {getTrendIcon(analytics.trends.giving_trend)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="success.main">
                        {analytics.current_month.attendance.total_attendance || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Attendance
                      </Typography>
                    </Box>
                    {getTrendIcon(analytics.trends.attendance_trend)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="warning.main">
                        {analytics.current_month.growth.total_conversions || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New Conversions
                      </Typography>
                    </Box>
                    {getTrendIcon(analytics.trends.conversion_trend)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="info.main">
                        {(analytics.current_month.cell_health.avg_health_score || 0).toFixed(1)}/10
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cell Health Score
                      </Typography>
                    </Box>
                    {getTrendIcon(analytics.trends.health_trend)}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<Assessment />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate Report
          </Button>
          <Button
            variant="outlined"
            startIcon={<Schedule />}
            onClick={() => {/* TODO: Implement scheduled reports */}}
          >
            Schedule Reports
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Executive Summary" />
            <Tab label="Detailed Analytics" />
            <Tab label="Report History" />
            <Tab label="Templates" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && analytics && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Executive Summary - Current Month
            </Typography>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📊 Key Metrics</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {analytics.executive_summary}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>💡 Key Insights</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {analytics.key_insights}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {tabValue === 1 && analytics && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Detailed Analytics Breakdown
            </Typography>

            <Grid container spacing={3}>
              {/* Financial Analytics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="💰 Financial Performance" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Total Giving: ${formatCurrency(analytics.current_month.giving.total_giving)}`}
                          secondary={`Active Givers: ${analytics.current_month.giving.active_givers || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Tithes: ${formatCurrency(analytics.current_month.giving.tithe_total)}`}
                          secondary={`Offerings: ${formatCurrency(analytics.current_month.giving.offering_total)}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Average Gift: ${formatCurrency(analytics.current_month.giving.average_gift)}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Attendance & Growth */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="📈 Attendance & Growth" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Total Attendance: ${analytics.current_month.attendance.total_attendance || 0}`}
                          secondary={`Average: ${(analytics.current_month.attendance.average_attendance || 0).toFixed(0)}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Visitors: ${analytics.current_month.attendance.total_visitors || 0}`}
                          secondary={`First Timers: ${analytics.current_month.attendance.first_timers || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Conversions: ${analytics.current_month.growth.total_conversions || 0}`}
                          secondary={`Baptisms: ${analytics.current_month.growth.total_baptisms || 0}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Cell Health */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="🏠 Cell Ministry Health" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Average Health Score: ${(analytics.current_month.cell_health.avg_health_score || 0).toFixed(1)}/10`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Cells in Win Stage: ${analytics.current_month.cell_health.cells_in_win_stage || 0}`}
                          secondary={`Build Stage: ${analytics.current_month.cell_health.cells_in_build_stage || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Send Stage: ${analytics.current_month.cell_health.cells_in_send_stage || 0}`}
                          secondary={`Multiply Stage: ${analytics.current_month.cell_health.cells_in_multiply_stage || 0}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Leadership & Wellness */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="👥 Leadership & Wellness" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Total Leaders in Pipeline: ${analytics.current_month.leadership.total_leaders || 0}`}
                          secondary={`Active Leaders: ${analytics.current_month.leadership.active_leaders || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Ready for Multiplication: ${analytics.current_month.leadership.ready_for_multiplication || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Critical Burnout Risk: ${analytics.current_month.wellness.burnout_risk?.critical_risk || 0}`}
                          secondary={`High Risk: ${analytics.current_month.wellness.burnout_risk?.high_risk || 0}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Discipleship & Spiritual Growth */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="📖 Discipleship & Spiritual Growth" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Active Growth Plans: ${analytics.current_month.discipleship.growth_plans?.active_plans || 0}`}
                          secondary={`Completed Plans: ${analytics.current_month.discipleship.growth_plans?.completed_plans || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Spiritual Disciplines Recorded: ${analytics.current_month.discipleship.spiritual_disciplines?.discipline_records || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Bible Reading: ${formatPercentage(analytics.current_month.discipleship.spiritual_disciplines?.bible_reading_percentage)}`}
                          secondary={`Prayer: ${formatPercentage(analytics.current_month.discipleship.spiritual_disciplines?.prayer_percentage)}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Community & Relationships */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="🤝 Community & Relationships" />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={`Celebration Events: ${analytics.current_month.celebrations.celebration_events?.total_events || 0}`}
                          secondary={`Completed: ${analytics.current_month.celebrations.celebration_events?.completed_events || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Testimonies: ${analytics.current_month.celebrations.testimonies?.total_testimonies || 0}`}
                          secondary={`Published: ${analytics.current_month.celebrations.testimonies?.published_testimonies || 0}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={`Active Conflicts: ${analytics.current_month.conflicts?.investigating_conflicts || 0}`}
                          secondary={`Resolved: ${analytics.current_month.conflicts?.resolved_conflicts || 0}`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Generated Reports History
            </Typography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Generated</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {generatedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.report_name}</TableCell>
                      <TableCell>
                        <Chip label={report.report_type} size="small" />
                      </TableCell>
                      <TableCell>
                        {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(report.generated_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.generation_status}
                          color={report.generation_status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleExportReport(report.id, 'json')}>
                          <Download />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Report Templates
            </Typography>

            <Grid container spacing={3}>
              {reportTemplates.map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {template.template_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {template.template_type} • {template.description}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Chip
                            label={template.template_type}
                            color="primary"
                            size="small"
                          />
                          {template.auto_generate && (
                            <Chip label="Auto" color="secondary" size="small" />
                          )}
                        </Box>
                      </Box>

                      <Typography variant="body2" gutterBottom>
                        <strong>Sections:</strong> {Array.isArray(template.report_sections) ? template.report_sections.length : 0}
                      </Typography>

                      {template.last_generated && (
                        <Typography variant="body2" gutterBottom>
                          <strong>Last Generated:</strong> {new Date(template.last_generated).toLocaleDateString()}
                        </Typography>
                      )}

                      <Box display="flex" gap={1} mt={2}>
                        <Button size="small" startIcon={<Edit />}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Assessment />}
                          onClick={() => {
                            setGenerateForm(prev => ({
                              ...prev,
                              template_id: template.id,
                              report_name: `${template.template_name} - ${new Date().toLocaleDateString()}`
                            }));
                            setGenerateDialogOpen(true);
                          }}
                        >
                          Generate
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Generate Report Dialog */}
        <Dialog
          open={generateDialogOpen}
          onClose={() => setGenerateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Generate New Report</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={reportTemplates}
                  getOptionLabel={(option) => option.template_name}
                  value={reportTemplates.find(t => t.id === generateForm.template_id) || null}
                  onChange={(event, newValue) => {
                    setGenerateForm(prev => ({
                      ...prev,
                      template_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Report Template" placeholder="Select template..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Report Period Start"
                  value={generateForm.report_period_start}
                  onChange={(date) => setGenerateForm(prev => ({ ...prev, report_period_start: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Report Period End"
                  value={generateForm.report_period_end}
                  onChange={(date) => setGenerateForm(prev => ({ ...prev, report_period_end: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Report Name (Optional)"
                  value={generateForm.report_name}
                  onChange={(e) => setGenerateForm(prev => ({ ...prev, report_name: e.target.value }))}
                  placeholder="Leave blank for auto-generated name"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateReport} variant="contained">
              Generate Report
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default AutomatedReports;