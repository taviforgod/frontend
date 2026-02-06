import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  Box, Typography, Button, Card, CardContent, Grid, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, CircularProgress,
  Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, Chip, Tabs, Tab,
  Paper, Avatar, List, ListItem, ListItemText, ListItemAvatar, Divider,
  Accordion, AccordionSummary, AccordionDetails, LinearProgress, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, CardHeader,
  SpeedDial, SpeedDialAction, SpeedDialIcon, Fab
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, TrendingUp, TrendingDown, TrendingFlat, ExpandMore,
  Download, BarChart3, BarChart, PieChart, Timeline,
  FileText, Calendar, Users, Target, Heart, Shield, DollarSign,
  Activity, Award, ExternalLink, CheckCircle, Clock, Flag,
  Plus, Edit, Delete, RefreshCw, Filter, Search
} from 'lucide-react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  getReportTemplates, generateReport, generateQuickReport, getGeneratedReports,
  getReportAnalytics, exportReport, REPORT_TYPES, REPORT_CATEGORIES,
  REPORT_TYPE_LABELS, getReportCategory, formatCurrency, formatPercentage,
  formatNumber, getTrendIcon, getStatusColor
} from '../services/comprehensiveReportsService';

/**
 * Comprehensive Reports Dashboard
 * - Generate reports from all CMMS modules
 * - Real-time analytics and KPIs
 * - Export capabilities (JSON, CSV, PDF)
 * - Scheduled report generation
 * - Report history and templates
 */

const ComprehensiveReports = () => {
  const theme = useTheme();
  const { fetchWithAuth } = useContext(AuthContext);

  // Main state
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Dialog states
  const [generateDialog, setGenerateDialog] = useState({ open: false, mode: 'generate' });
  const [reportDetailsDialog, setReportDetailsDialog] = useState({ open: false, report: null });

  // Form states
  const [generateForm, setGenerateForm] = useState({
    report_type: '',
    template_id: '',
    report_name: '',
    report_period_start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
    report_period_end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
    filters: {}
  });

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesRes, reportsRes, analyticsRes] = await Promise.all([
        getReportTemplates(fetchWithAuth),
        getGeneratedReports(fetchWithAuth, { limit: 50 }),
        getReportAnalytics(fetchWithAuth)
      ]);

      setTemplates(Array.isArray(templatesRes) ? templatesRes : []);
      setGeneratedReports(Array.isArray(reportsRes) ? reportsRes : []);
      setAnalytics(analyticsRes);
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

  // Filtered reports
  const filteredReports = generatedReports.filter(report => {
    const matchesSearch = !searchQuery ||
      report.report_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      REPORT_TYPE_LABELS[report.report_type]?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.generation_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Generate report handler
  const handleGenerateReport = async (saveReport = true) => {
    try {
      const reportData = {
        report_type: generateForm.report_type,
        template_id: generateForm.template_id || null,
        report_name: generateForm.report_name ||
          `${REPORT_TYPE_LABELS[generateForm.report_type]} - ${generateForm.report_period_start.toLocaleDateString()} to ${generateForm.report_period_end.toLocaleDateString()}`,
        report_period_start: generateForm.report_period_start.toISOString().split('T')[0],
        report_period_end: generateForm.report_period_end.toISOString().split('T')[0],
        filters: generateForm.filters
      };

      const result = saveReport
        ? await generateReport(fetchWithAuth, reportData)
        : await generateQuickReport(fetchWithAuth, reportData);

      setGenerateDialog({ open: false, mode: 'generate' });
      setGenerateForm({
        report_type: '',
        template_id: '',
        report_name: '',
        report_period_start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        report_period_end: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
        filters: {}
      });

      loadData();
      setSnackbar({
        open: true,
        message: saveReport ? 'Report generated and saved successfully' : 'Quick report generated',
        severity: 'success'
      });
    } catch (err) {
      console.error('Report generation failed:', err);
      setSnackbar({ open: true, message: 'Failed to generate report', severity: 'error' });
    }
  };

  // Export report handler
  const handleExportReport = async (reportId, format = 'json') => {
    try {
      const result = await exportReport(fetchWithAuth, reportId, format);

      if (format === 'json') {
        // Download JSON
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // Download CSV or other formats
        const blob = new Blob([result], { type: `text/${format}` });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setSnackbar({ open: true, message: `Report exported as ${format.toUpperCase()}`, severity: 'success' });
    } catch (err) {
      console.error('Export failed:', err);
      setSnackbar({ open: true, message: 'Failed to export report', severity: 'error' });
    }
  };

  // Get reports by category
  const getReportsByCategory = (category) => {
    return Object.keys(REPORT_TYPES).filter(type =>
      getReportCategory(REPORT_TYPES[type]) === category
    ).map(type => ({
      value: REPORT_TYPES[type],
      label: REPORT_TYPE_LABELS[REPORT_TYPES[type]]
    }));
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
      <Box sx={{ p: 3, background: theme.palette.background.default, minHeight: '100vh' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Comprehensive Reports
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Generate detailed reports from all church ministry modules
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Calendar />}
              onClick={() => {/* TODO: Implement scheduled reports */}}
            >
              Scheduled Reports
            </Button>
            <Button
              variant="contained"
              startIcon={<ClipboardList />}
              onClick={() => setGenerateDialog({ open: true, mode: 'generate' })}
            >
              Generate Report
            </Button>
          </Box>
        </Box>

        {/* Analytics Overview */}
        {analytics && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography variant="h6" color="primary.main">
                        {generatedReports.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generated Reports
                      </Typography>
                    </Box>
                    <FileText color="primary" />
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
                        {analytics.current_month?.key_performance_indicators?.financial_health?.total_giving ?
                          formatCurrency(analytics.current_month.key_performance_indicators.financial_health.total_giving) :
                          '$0'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Giving
                      </Typography>
                    </Box>
                    <DollarSign color="success" />
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
                        {analytics.current_month?.key_performance_indicators?.attendance_growth?.total_attendance || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Attendance
                      </Typography>
                    </Box>
                    <Users color="info" />
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
                        {analytics.current_month?.key_performance_indicators?.ministry_health?.cell_health_score?.toFixed(1) || '0.0'}/10
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Cell Health Score
                      </Typography>
                    </Box>
                    <Activity color="warning" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Dashboard" icon={<BarChart3 />} />
            <Tab label="Generate Reports" icon={<ClipboardList />} />
            <Tab label="Report History" icon={<FileText />} />
            <Tab label="Templates" icon={<Target />} />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && analytics && (
          <Box>
            <Typography variant="h6" gutterBottom>Executive Summary - Current Month</Typography>

            {analytics.current_month?.executive_summary && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {analytics.current_month.executive_summary}
                  </Typography>
                </CardContent>
              </Card>
            )}

            <Grid container spacing={3}>
              {/* Financial Overview */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="💰 Financial Performance" />
                  <CardContent>
                    <Typography variant="body2" gutterBottom>
                      Total Giving: {formatCurrency(analytics.current_month?.key_performance_indicators?.financial_health?.total_giving)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Active Givers: {analytics.current_month?.key_performance_indicators?.financial_health?.active_givers || 0}
                    </Typography>
                    <Typography variant="body2">
                      Trend: {getTrendIcon(analytics.trends?.financial)} {analytics.trends?.financial}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Attendance & Growth */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="📈 Attendance & Growth" />
                  <CardContent>
                    <Typography variant="body2" gutterBottom>
                      Total Attendance: {formatNumber(analytics.current_month?.key_performance_indicators?.attendance_growth?.total_attendance)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      New Conversions: {analytics.current_month?.key_performance_indicators?.outreach_impact?.new_visitors || 0}
                    </Typography>
                    <Typography variant="body2">
                      Trend: {getTrendIcon(analytics.trends?.attendance)} {analytics.trends?.attendance}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Ministry Health */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="🏠 Ministry Health" />
                  <CardContent>
                    <Typography variant="body2" gutterBottom>
                      Cell Health Score: {analytics.current_month?.key_performance_indicators?.ministry_health?.cell_health_score?.toFixed(1)}/10
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Active Cells: {analytics.current_month?.key_performance_indicators?.ministry_health?.active_cells || 0}
                    </Typography>
                    <Typography variant="body2">
                      Trend: {getTrendIcon(analytics.trends?.cell_health)} {analytics.trends?.cell_health}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Leadership & Discipleship */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title="👥 Leadership & Discipleship" />
                  <CardContent>
                    <Typography variant="body2" gutterBottom>
                      Leaders in Pipeline: {analytics.current_month?.key_performance_indicators?.leadership_development?.total_leaders || 0}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      Foundation Completions: {analytics.current_month?.key_performance_indicators?.discipleship_growth?.foundation_completions || 0}
                    </Typography>
                    <Typography variant="body2">
                      Trend: {getTrendIcon(analytics.trends?.leadership)} {analytics.trends?.leadership}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Report Generation</Typography>

            <Grid container spacing={3}>
              {/* Financial Reports */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader title="💰 Financial Reports" />
                  <CardContent>
                    {getReportsByCategory(REPORT_CATEGORIES.FINANCIAL).map(report => (
                      <Button
                        key={report.value}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 1, justifyContent: 'flex-start' }}
                        onClick={() => {
                          setGenerateForm(prev => ({ ...prev, report_type: report.value }));
                          setGenerateDialog({ open: true, mode: 'generate' });
                        }}
                      >
                        {report.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Attendance & Growth */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader title="📈 Attendance & Growth" />
                  <CardContent>
                    {getReportsByCategory(REPORT_CATEGORIES.ATTENDANCE).map(report => (
                      <Button
                        key={report.value}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 1, justifyContent: 'flex-start' }}
                        onClick={() => {
                          setGenerateForm(prev => ({ ...prev, report_type: report.value }));
                          setGenerateDialog({ open: true, mode: 'generate' });
                        }}
                      >
                        {report.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Ministry Health */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader title="🏠 Ministry Health" />
                  <CardContent>
                    {getReportsByCategory(REPORT_CATEGORIES.MINISTRY_HEALTH).map(report => (
                      <Button
                        key={report.value}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 1, justifyContent: 'flex-start' }}
                        onClick={() => {
                          setGenerateForm(prev => ({ ...prev, report_type: report.value }));
                          setGenerateDialog({ open: true, mode: 'generate' });
                        }}
                      >
                        {report.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Leadership */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader title="👥 Leadership" />
                  <CardContent>
                    {getReportsByCategory(REPORT_CATEGORIES.LEADERSHIP).map(report => (
                      <Button
                        key={report.value}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 1, justifyContent: 'flex-start' }}
                        onClick={() => {
                          setGenerateForm(prev => ({ ...prev, report_type: report.value }));
                          setGenerateDialog({ open: true, mode: 'generate' });
                        }}
                      >
                        {report.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Discipleship */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader title="📖 Discipleship" />
                  <CardContent>
                    {getReportsByCategory(REPORT_CATEGORIES.DISCIPLESHIP).map(report => (
                      <Button
                        key={report.value}
                        fullWidth
                        variant="outlined"
                        sx={{ mb: 1, justifyContent: 'flex-start' }}
                        onClick={() => {
                          setGenerateForm(prev => ({ ...prev, report_type: report.value }));
                          setGenerateDialog({ open: true, mode: 'generate' });
                        }}
                      >
                        {report.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </Grid>

              {/* Comprehensive */}
              <Grid item xs={12} md={6} lg={4}>
                <Card>
                  <CardHeader title="📊 Comprehensive Reports" />
                  <CardContent>
                    {getReportsByCategory(REPORT_CATEGORIES.COMPREHENSIVE).map(report => (
                      <Button
                        key={report.value}
                        fullWidth
                        variant="contained"
                        sx={{ mb: 1, justifyContent: 'flex-start' }}
                        onClick={() => {
                          setGenerateForm(prev => ({ ...prev, report_type: report.value }));
                          setGenerateDialog({ open: true, mode: 'generate' });
                        }}
                      >
                        {report.label}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Report History</Typography>
              <Box display="flex" gap={2}>
                <TextField
                  size="small"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

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
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <FileText size={20} />
                          <Typography variant="body2" fontWeight={500}>
                            {report.report_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(report.report_period_start).toLocaleDateString()} -
                        {new Date(report.report_period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(report.generated_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.generation_status}
                          color={getStatusColor(report.generation_status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => setReportDetailsDialog({ open: true, report })}
                            >
                              <ExternalLink size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export JSON">
                            <IconButton
                              size="small"
                              onClick={() => handleExportReport(report.id, 'json')}
                            >
                              <Download size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Export CSV">
                            <IconButton
                              size="small"
                              onClick={() => handleExportReport(report.id, 'csv')}
                            >
                              <BarChart size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {filteredReports.length === 0 && (
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="text.secondary">
                  No reports found matching your criteria
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Report Templates</Typography>

            <Grid container spacing={3}>
              {templates.map((template) => (
                <Grid item xs={12} md={6} lg={4} key={template.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {template.template_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {template.template_type} • {getReportCategory(template.template_type)}
                          </Typography>
                        </Box>
                        <Box display="flex" flexDirection="column" gap={1}>
                          <Chip
                            label={template.is_active ? 'Active' : 'Inactive'}
                            color={template.is_active ? 'success' : 'default'}
                            size="small"
                          />
                          {template.auto_generate && (
                            <Chip label="Auto" color="info" size="small" />
                          )}
                        </Box>
                      </Box>

                      {template.description && (
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                      )}

                      <Box display="flex" gap={1}>
                        <Button size="small" variant="outlined" startIcon={<Edit />}>
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<ClipboardList />}
                          onClick={() => {
                            setGenerateForm(prev => ({
                              ...prev,
                              report_type: template.template_type,
                              template_id: template.id,
                              report_name: template.template_name
                            }));
                            setGenerateDialog({ open: true, mode: 'generate' });
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

            {templates.length === 0 && (
              <Box textAlign="center" py={6}>
                <Typography variant="h6" color="text.secondary">
                  No report templates found
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Plus />}
                  sx={{ mt: 2 }}
                  onClick={() => {/* TODO: Add template creation */}}
                >
                  Create Template
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Generate Report Dialog */}
        <Dialog
          open={generateDialog.open}
          onClose={() => setGenerateDialog({ open: false, mode: 'generate' })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {generateDialog.mode === 'quick' ? 'Generate Quick Report' : 'Generate & Save Report'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={generateForm.report_type}
                    label="Report Type"
                    onChange={(e) => setGenerateForm(prev => ({ ...prev, report_type: e.target.value }))}
                  >
                    {Object.values(REPORT_CATEGORIES).map(category => (
                      <Box key={category}>
                        <Typography variant="body2" sx={{ px: 2, py: 1, fontWeight: 500 }}>
                          {category}
                        </Typography>
                        {getReportsByCategory(category).map(report => (
                          <MenuItem key={report.value} value={report.value} sx={{ pl: 4 }}>
                            {report.label}
                          </MenuItem>
                        ))}
                      </Box>
                    ))}
                  </Select>
                </FormControl>
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
            <Button onClick={() => setGenerateDialog({ open: false, mode: 'generate' })}>
              Cancel
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleGenerateReport(false)}
              sx={{ mr: 1 }}
            >
              Quick Report
            </Button>
            <Button
              variant="contained"
              onClick={() => handleGenerateReport(true)}
            >
              Generate & Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Report Details Dialog */}
        <Dialog
          open={reportDetailsDialog.open}
          onClose={() => setReportDetailsDialog({ open: false, report: null })}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {reportDetailsDialog.report?.report_name}
          </DialogTitle>
          <DialogContent>
            {reportDetailsDialog.report && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Generated on {new Date(reportDetailsDialog.report.generated_date).toLocaleString()}
                </Typography>

                {reportDetailsDialog.report.executive_summary && (
                  <Card sx={{ mb: 3 }}>
                    <CardHeader title="Executive Summary" />
                    <CardContent>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {reportDetailsDialog.report.executive_summary}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                <Typography variant="h6" gutterBottom>Key Insights</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 3 }}>
                  {reportDetailsDialog.report.key_insights || 'No insights available'}
                </Typography>

                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    startIcon={<Download />}
                    onClick={() => handleExportReport(reportDetailsDialog.report.id, 'json')}
                  >
                    Export JSON
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<BarChart />}
                    onClick={() => handleExportReport(reportDetailsDialog.report.id, 'csv')}
                  >
                    Export CSV
                  </Button>
                </Box>
              </Box>
            )}
          </DialogContent>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default ComprehensiveReports;