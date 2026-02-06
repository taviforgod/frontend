import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, IconButton, TextField,
  Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, InputAdornment, Tooltip, CircularProgress, Tabs, Tab,
  FormControl, InputLabel, Select, MenuItem, Avatar, Badge, Dialog,
  DialogTitle, DialogContent, DialogActions, Accordion, AccordionSummary,
  AccordionDetails, Stepper, Step, StepLabel, Switch, FormControlLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Search, Filter, Download, Eye, Calendar, TrendingUp, Users, DollarSign,
  FileText, BarChart3, PieChart, Activity, Target, Clock, CheckCircle,
  AlertCircle, RefreshCw, ChevronDown, PlayArrow, Settings
} from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';

// Simple ReportsIcon component to avoid import issues
const ReportsIcon = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="2"/>
    <line x1="16" y1="3" x2="16" y2="7"/>
    <line x1="8" y1="3" x2="8" y2="7"/>
    <line x1="3" y1="11" x2="21" y2="11"/>
  </svg>
);

// Mock data for demonstration - comprehensive reports for all modules
const mockReports = [
  // Core Ministry Reports
  { id: 1, name: 'Monthly Giving Report', type: 'Financial', description: 'Comprehensive giving analysis including tithes, offerings, and trends', lastGenerated: '2024-01-15', status: 'completed', icon: DollarSign, color: '#4caf50', category: 'financial', frequency: 'monthly', scheduled: true },
  { id: 2, name: 'Attendance Analytics', type: 'Attendance', description: 'Weekly attendance patterns, visitor tracking, and growth metrics', lastGenerated: '2024-01-14', status: 'completed', icon: Users, color: '#2196f3', category: 'attendance', frequency: 'weekly', scheduled: true },
  { id: 3, name: 'Cell Groups Health Report', type: 'Cell Groups', description: 'Cell group health scores, multiplication readiness, and leadership pipeline', lastGenerated: '2024-01-10', status: 'completed', icon: Activity, color: '#ff9800', category: 'ministry', frequency: 'monthly', scheduled: false },
  { id: 4, name: 'Cell Growth Dashboard', type: 'Cell Growth', description: 'Cell multiplication metrics, growth trends, and expansion analysis', lastGenerated: '2024-01-12', status: 'completed', icon: TrendingUp, color: '#4caf50', category: 'leadership', frequency: 'monthly', scheduled: true },
  { id: 5, name: 'Personal Growth Tracker Report', type: 'Personal Growth', description: 'Individual spiritual growth metrics and discipleship progress', lastGenerated: '2024-01-11', status: 'completed', icon: Target, color: '#9c27b0', category: 'leadership', frequency: 'quarterly', scheduled: false },
  { id: 6, name: 'Leadership Development Report', type: 'Leadership', description: 'Leadership pipeline status, training progress, and readiness assessments', lastGenerated: '2024-01-12', status: 'completed', icon: Target, color: '#9c27b0', category: 'leadership', frequency: 'quarterly', scheduled: false },
  { id: 7, name: 'Visitors Analysis Report', type: 'Visitors', description: 'Visitor demographics, conversion rates, and follow-up effectiveness', lastGenerated: '2024-01-13', status: 'completed', icon: Users, color: '#00bcd4', category: 'ministry', frequency: 'monthly', scheduled: true },
  
  // Care & Support Reports
  { id: 8, name: 'Prayer Requests Summary', type: 'Prayers', description: 'Prayer request trends, answered prayers, and prayer team effectiveness', lastGenerated: '2024-01-14', status: 'completed', icon: FileText, color: '#795548', category: 'care', frequency: 'weekly', scheduled: true },
  { id: 9, name: 'Crisis Care Report', type: 'Crisis Care', description: 'Active crisis cases, intervention outcomes, and resource utilization', lastGenerated: '2024-01-13', status: 'in_progress', icon: AlertCircle, color: '#f44336', category: 'care', frequency: 'weekly', scheduled: true },
  { id: 10, name: 'Absentee Follow-up Analysis', type: 'Absentee Follow-up', description: 'Absentee trends, re-engagement rates, and follow-up effectiveness', lastGenerated: '2024-01-12', status: 'completed', icon: Users, color: '#ff5722', category: 'care', frequency: 'monthly', scheduled: true },
  { id: 11, name: 'Conflict Management Report', type: 'Conflict Management', description: 'Conflict resolution cases, mediation success rates, and reconciliation metrics', lastGenerated: '2024-01-10', status: 'completed', icon: AlertCircle, color: '#ff9800', category: 'care', frequency: 'quarterly', scheduled: false },
  { id: 12, name: 'Celebrations & Events Report', type: 'Celebrations', description: 'Event participation, celebration milestones, and community engagement metrics', lastGenerated: '2024-01-15', status: 'completed', icon: FileText, color: '#e91e63', category: 'care', frequency: 'monthly', scheduled: true },
  { id: 13, name: 'Giving & Testimony Report', type: 'Giving Testimony', description: 'Testimony trends, giving patterns, and spiritual impact metrics', lastGenerated: '2024-01-14', status: 'completed', icon: DollarSign, color: '#4caf50', category: 'care', frequency: 'monthly', scheduled: true },
  
  // Discipleship Reports
  { id: 14, name: 'Foundation School Progress', type: 'Foundation School', description: 'Student progress, completion rates, and spiritual growth metrics', lastGenerated: '2024-01-08', status: 'completed', icon: FileText, color: '#00bcd4', category: 'discipleship', frequency: 'monthly', scheduled: true },
  { id: 15, name: 'Bible Teaching Calendar Report', type: 'Bible Teaching', description: 'Teaching schedule coverage, attendance rates, and curriculum effectiveness', lastGenerated: '2024-01-13', status: 'completed', icon: FileText, color: '#3f51b5', category: 'discipleship', frequency: 'monthly', scheduled: true },
  { id: 16, name: 'Baptism Records Report', type: 'Baptism', description: 'Baptism statistics, conversion rates, and water baptism tracking', lastGenerated: '2024-01-14', status: 'completed', icon: FileText, color: '#00bcd4', category: 'discipleship', frequency: 'monthly', scheduled: true },
  
  // Evangelism Reports
  { id: 17, name: 'Evangelism Impact Report', type: 'Evangelism', description: 'Outreach effectiveness, conversion metrics, and evangelism team performance', lastGenerated: '2024-01-11', status: 'completed', icon: TrendingUp, color: '#795548', category: 'outreach', frequency: 'monthly', scheduled: false },
  
  // Administration Reports
  { id: 18, name: 'Members Database Report', type: 'Members', description: 'Member demographics, growth trends, and database integrity metrics', lastGenerated: '2024-01-15', status: 'completed', icon: Users, color: '#2196f3', category: 'administration', frequency: 'monthly', scheduled: true },
  { id: 19, name: 'Leadership Matrix Report', type: 'Leadership', description: 'Role assignments, permission matrices, and leadership coverage analysis', lastGenerated: '2024-01-10', status: 'completed', icon: Settings, color: '#607d8b', category: 'administration', frequency: 'quarterly', scheduled: false },
  { id: 20, name: 'Devices & Access Report', type: 'Devices', description: 'System access patterns, device usage, and security compliance metrics', lastGenerated: '2024-01-12', status: 'completed', icon: Settings, color: '#795548', category: 'administration', frequency: 'monthly', scheduled: true },
  { id: 21, name: 'Lookups Management Report', type: 'Lookups', description: 'Data integrity, lookup usage patterns, and system configuration status', lastGenerated: '2024-01-09', status: 'completed', icon: Settings, color: '#9e9e9e', category: 'administration', frequency: 'quarterly', scheduled: false },
  { id: 22, name: 'Inactive Members Exit Report', type: 'Inactive Exits', description: 'Member exit analysis, retention metrics, and exit reason trends', lastGenerated: '2024-01-08', status: 'completed', icon: AlertCircle, color: '#f44336', category: 'administration', frequency: 'quarterly', scheduled: false }
];

const categories = [
  { value: 'all', label: 'All Reports', color: '#666' },
  { value: 'financial', label: 'Financial', color: '#4caf50' },
  { value: 'attendance', label: 'Attendance', color: '#2196f3' },
  { value: 'ministry', label: 'Ministry Health', color: '#ff9800' },
  { value: 'leadership', label: 'Leadership', color: '#9c27b0' },
  { value: 'discipleship', label: 'Discipleship', color: '#00bcd4' },
  { value: 'care', label: 'Crisis Care', color: '#f44336' },
  { value: 'outreach', label: 'Outreach', color: '#795548' },
  { value: 'comprehensive', label: 'Comprehensive', color: '#607d8b' }
];

const ReportDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { fetchWithAuth } = useContext(AuthContext);
  const notifications = useNotifications();

  // State
  const [tabValue, setTabValue] = useState(0);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [scheduledReportsOpen, setScheduledReportsOpen] = useState(false);

  // Report types for consolidated view
  const reportTypes = [
    { value: 'simple', label: 'Simple Reports', description: 'Quick, basic reports for everyday use' },
    { value: 'comprehensive', label: 'Comprehensive Reports', description: 'Detailed analysis with advanced features' },
    { value: 'automated', label: 'Automated Reports', description: 'Scheduled reports that run automatically' },
    { value: 'weekly', label: 'Weekly Reports', description: 'Standard weekly ministry reports' }
  ];

  // Load reports from API
  const loadReports = async () => {
    try {
      setLoading(true);
      console.log('Loading reports...');
      console.log('Mock reports data:', mockReports);
      
      // Use mock data directly for now
      setReports(mockReports);
      setFilteredReports(mockReports);
      
      console.log('Reports set to state');
      
      // TODO: Uncomment when API is ready
      // const response = await fetchWithAuth('/api/reports/reports');
      // if (response.ok) {
      //   const data = await response.json();
      //   // Map API response to frontend format
      //   const mappedReports = data.map(report => ({
      //     id: report.id,
      //     name: report.report_name,
      //     type: report.template_name || report.report_type,
      //     description: `${report.report_type} report for ${report.report_period_start} to ${report.report_period_end}`,
      //     lastGenerated: report.generated_date,
      //     status: report.generation_status,
      //     icon: report.report_type.includes('giving') ? DollarSign : 
      //           report.report_type.includes('attendance') ? Users : 
      //           report.report_type.includes('health') ? Activity : FileText,
      //     color: report.report_type.includes('giving') ? '#4caf50' : 
      //           report.report_type.includes('attendance') ? '#2196f3' : 
      //           report.report_type.includes('health') ? '#ff9800' : '#607d8b',
      //     category: report.report_type.includes('giving') ? 'financial' : 
      //              report.report_type.includes('attendance') ? 'attendance' : 
      //              report.report_type.includes('health') ? 'ministry' : 'comprehensive',
      //     frequency: 'monthly',
      //     scheduled: false
      //   }));
      //   setReports(mappedReports);
      //   setFilteredReports(mappedReports);
      // } else {
      //   throw new Error('Failed to load reports');
      // }
    } catch (error) {
      console.error('Error loading reports:', error);
      notifications.error('Failed to load reports');
      // Use mock data as fallback
      setReports(mockReports);
      setFilteredReports(mockReports);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Filter reports by tab type
  useEffect(() => {
    console.log('Filter effect running, reports length:', reports.length);
    
    // Only filter if reports exist
    if (reports.length === 0) {
      console.log('No reports to filter yet');
      return;
    }
    
    let filtered = reports;
    
    // For now, show all reports regardless of tab
    // TODO: Implement proper tab filtering later
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(report =>
        report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(report => report.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    console.log('Setting filtered reports:', filtered.length);
    setFilteredReports(filtered);
  }, [reports, searchQuery, categoryFilter, statusFilter, tabValue]);

  // Handle report click
  const handleReportClick = (report) => {
    navigate(`/reports/${report.id}`);
  };

  // Handle quick export
  const handleQuickExport = async (e, reportId, format = 'json') => {
    e.stopPropagation();
    try {
      const response = await fetchWithAuth(`/api/reports/${reportId}/export?format=${format}`);
      if (response.ok) {
        const data = await response.json();
        // Download the file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${reportId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        notifications.modules.reports.generated();
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      notifications.error('Export failed');
    }
  };

  // Get status icon and color
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: '#4caf50', label: 'Completed' };
      case 'in_progress':
        return { icon: RefreshCw, color: '#ff9800', label: 'In Progress' };
      case 'failed':
        return { icon: AlertCircle, color: '#f44336', label: 'Failed' };
      default:
        return { icon: Clock, color: '#666', label: 'Pending' };
    }
  };

  // Get category color
  const getCategoryColor = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat ? cat.color : '#666';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, background: theme.palette.background.default, minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ReportsIcon size={32} />
            Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consolidated reporting dashboard for all ministry modules
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<Calendar />}
            onClick={() => setScheduledReportsOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Scheduled Reports
          </Button>
          <Button
            variant="contained"
            startIcon={<FileText />}
            onClick={() => setGenerateDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      {/* Report Type Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {reportTypes.map((type, index) => (
            <Tab
              key={type.value}
              label={type.label}
              icon={type.value === 'simple' ? <FileText size={16} /> :
                    type.value === 'comprehensive' ? <BarChart3 size={16} /> :
                    type.value === 'automated' ? <Calendar size={16} /> :
                    <Calendar size={16} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" color="primary.main">
                    {reports.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Reports
                  </Typography>
                </Box>
                <FileText color={theme.palette.primary.main} />
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
                    {reports.filter(r => r.status === 'completed').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
                <CheckCircle color={theme.palette.success.main} />
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
                    {reports.filter(r => r.status === 'in_progress').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In Progress
                  </Typography>
                </Box>
                <RefreshCw color={theme.palette.warning.main} />
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
                    {reports.filter(r => r.scheduled).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled
                  </Typography>
                </Box>
                <Calendar color={theme.palette.info.main} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={20} />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={4}>
            <Box display="flex" gap={1} justifyContent="flex-end">
              <Button
                variant={viewMode === 'grid' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Reports Display */}
      {viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {filteredReports.map((report) => {
            const StatusIcon = getStatusInfo(report.status).icon;
            const statusColor = getStatusInfo(report.status).color;
            const ReportIcon = report.icon;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={report.id}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                  onClick={() => handleReportClick(report)}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: report.color,
                          width: 48,
                          height: 48
                        }}
                      >
                        <ReportIcon size={24} color="white" />
                      </Avatar>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Chip
                          label={report.type}
                          size="small"
                          sx={{
                            bgcolor: getCategoryColor(report.category) + '20',
                            color: getCategoryColor(report.category),
                            fontSize: '0.7rem'
                          }}
                        />
                        {report.scheduled && (
                          <Badge badgeContent="Auto" color="primary">
                            <Calendar size={16} color={theme.palette.text.secondary} />
                          </Badge>
                        )}
                      </Box>
                    </Box>

                    <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
                      {report.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.8rem' }}>
                      {report.description}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <StatusIcon size={16} color={statusColor} />
                        <Typography variant="caption" color={statusColor}>
                          {getStatusInfo(report.status).label}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {report.frequency}
                      </Typography>
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {new Date(report.lastGenerated).toLocaleDateString()}
                      </Typography>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View Report">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReportClick(report);
                            }}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export JSON">
                          <IconButton
                            size="small"
                            onClick={(e) => handleQuickExport(e, report.id, 'json')}
                          >
                            <Download size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Report Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Last Generated</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Frequency</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReports.map((report) => {
                const StatusIcon = getStatusInfo(report.status).icon;
                const statusColor = getStatusInfo(report.status).color;

                return (
                  <TableRow
                    key={report.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleReportClick(report)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar
                          sx={{
                            bgcolor: report.color,
                            width: 32,
                            height: 32
                          }}
                        >
                          <report.icon size={16} color="white" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {report.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {report.description}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.type}
                        size="small"
                        sx={{
                          bgcolor: getCategoryColor(report.category) + '20',
                          color: getCategoryColor(report.category)
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {categories.find(c => c.value === report.category)?.label}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(report.lastGenerated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <StatusIcon size={16} color={statusColor} />
                        <Typography variant="body2" color={statusColor}>
                          {getStatusInfo(report.status).label}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {report.frequency}
                        {report.scheduled && (
                          <Chip label="Auto" size="small" sx={{ ml: 1 }} />
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="View Report">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReportClick(report);
                            }}
                          >
                            <Eye size={16} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Export JSON">
                          <IconButton
                            size="small"
                            onClick={(e) => handleQuickExport(e, report.id, 'json')}
                          >
                            <Download size={16} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filteredReports.length === 0 && (
        <Box textAlign="center" py={8}>
          <FileText size={48} color={theme.palette.text.secondary} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            No reports found matching your criteria
          </Typography>
          <Button
            variant="contained"
            startIcon={<FileText />}
            onClick={() => setGenerateDialogOpen(true)}
            sx={{ mt: 2 }}
          >
            Generate Report
          </Button>
        </Box>
      )}

      {/* Generate Report Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose the type of report you want to generate
          </Typography>
          <Grid container spacing={2}>
            {reportTypes.map((type) => (
              <Grid item xs={12} sm={6} key={type.value}>
                <Card 
                  sx={{ 
                    cursor: 'pointer', 
                    '&:hover': { bgcolor: 'action.hover' },
                    border: tabValue === reportTypes.findIndex(t => t.value === type.value) ? 2 : 1,
                    borderColor: tabValue === reportTypes.findIndex(t => t.value === type.value) ? 'primary.main' : 'divider'
                  }}
                  onClick={() => {
                    setTabValue(reportTypes.findIndex(t => t.value === type.value));
                    setGenerateDialogOpen(false);
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2}>
                      {type.value === 'simple' ? <FileText size={24} /> :
                       type.value === 'comprehensive' ? <BarChart3 size={24} /> :
                       type.value === 'automated' ? <Calendar size={24} /> :
                       <Calendar size={24} />}
                      <Box>
                        <Typography variant="h6">{type.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Scheduled Reports Dialog */}
      <Dialog open={scheduledReportsOpen} onClose={() => setScheduledReportsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Scheduled Reports</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure automated reports that run on a schedule
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ChevronDown />}>
              <Box display="flex" alignItems="center" gap={2}>
                <Calendar />
                <Typography>Weekly Attendance Report</Typography>
                <Chip label="Active" size="small" color="success" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Frequency</InputLabel>
                    <Select defaultValue="weekly">
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                      <MenuItem value="quarterly">Quarterly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Day</InputLabel>
                    <Select defaultValue="monday">
                      <MenuItem value="monday">Monday</MenuItem>
                      <MenuItem value="friday">Friday</MenuItem>
                      <MenuItem value="sunday">Sunday</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel 
                    control={<Switch defaultChecked />} 
                    label="Email report to leadership" 
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ChevronDown />}>
              <Box display="flex" alignItems="center" gap={2}>
                <DollarSign />
                <Typography>Monthly Giving Report</Typography>
                <Chip label="Active" size="small" color="success" />
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Configure monthly giving report settings...
              </Typography>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduledReportsOpen(false)}>Close</Button>
          <Button variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportDashboard;
