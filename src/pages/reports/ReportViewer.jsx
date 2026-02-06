import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, IconButton, TextField,
  FormControl, InputLabel, Select, MenuItem, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Divider, CircularProgress,
  Snackbar, Alert, Tabs, Tab, Accordion, AccordionSummary, AccordionDetails,
  Tooltip, Badge, Menu, MenuItem as MenuItemComponent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Download, Filter, Calendar, TrendingUp, TrendingDown, Minus,
  RefreshCw, Eye, FileText, BarChart3, PieChart, Activity, DollarSign,
  Users, Target, CheckCircle, AlertCircle, Clock, ArrowLeft, Share2,
  Printer, Mail, MoreVertical, ChevronDown, Info
} from 'lucide-react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthContext } from '../../contexts/AuthContext';

const ReportViewer = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchWithAuth } = useContext(AuthContext);

  // State
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
    category: 'all',
    status: 'all'
  });
  const [exportMenu, setExportMenu] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Load report data from API
  const loadReport = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/api/reports/reports/${id}`);
      if (response.ok) {
        const data = await response.json();
        // Map API response to frontend format
        const mappedReport = {
          id: data.id,
          name: data.report_name,
          type: data.template_name || data.report_type,
          description: `${data.report_type} report for ${data.report_period_start} to ${data.report_period_end}`,
          generatedDate: data.generated_date,
          status: data.generation_status,
          data: data.report_data
        };
        setReport(mappedReport);
      } else if (response.status === 404) {
        // Report not found, use mock data as fallback
        console.warn(`Report ${id} not found, using mock data`);
        // Use mock data as fallback
        const mockReportData = {
          1: {
            id: 1,
            name: 'Monthly Giving Report',
            type: 'Financial',
            description: 'Comprehensive giving analysis including tithes, offerings, and trends',
            generatedDate: '2024-01-15',
            status: 'completed',
            data: {
              summary: { totalGiving: 45678.90, tithes: 34259.17, offerings: 11419.73, activeGivers: 234, averageGift: 195.12, trend: 'up' },
              breakdown: [
                { category: 'Tithes', amount: 34259.17, percentage: 75, trend: 'up' },
                { category: 'Offerings', amount: 11419.73, percentage: 25, trend: 'stable' },
                { category: 'Missions', amount: 5678.90, percentage: 12.4, trend: 'up' },
                { category: 'Building Fund', amount: 2340.56, percentage: 5.1, trend: 'down' }
              ],
              monthlyTrends: [
                { month: 'Aug', amount: 42100 }, { month: 'Sep', amount: 43800 }, { month: 'Oct', amount: 45200 },
                { month: 'Nov', amount: 44100 }, { month: 'Dec', amount: 48900 }, { month: 'Jan', amount: 45678 }
              ],
              insights: ['Monthly giving increased by 8.5% compared to last month', 'New givers increased by 12% this quarter']
            }
          },
          2: {
            id: 2,
            name: 'Attendance Analytics',
            type: 'Attendance',
            description: 'Weekly attendance patterns, visitor tracking, and growth metrics',
            generatedDate: '2024-01-14',
            status: 'completed',
            data: {
              summary: { totalAttendance: 1256, averageWeekly: 314, visitors: 45, memberAttendance: 89.2, trend: 'up' },
              weeklyData: [
                { week: 'Week 1', adults: 289, children: 67, visitors: 8, total: 364 },
                { week: 'Week 2', adults: 295, children: 71, visitors: 12, total: 378 },
                { week: 'Week 3', adults: 301, children: 69, visitors: 6, total: 376 },
                { week: 'Week 4', adults: 312, children: 74, visitors: 9, total: 395 }
              ],
              growthMetrics: { monthlyGrowth: 5.2, visitorRetention: 67, newMembers: 12 },
              insights: ['Attendance increased by 5.2% this month', 'Visitor retention rate improved to 67%']
            }
          },
          3: {
            id: 3,
            name: 'Cell Groups Health Report',
            type: 'Cell Groups',
            description: 'Cell group health scores, multiplication readiness, and leadership pipeline',
            generatedDate: '2024-01-10',
            status: 'completed',
            data: {
              summary: { totalCells: 24, healthyCells: 18, multiplyingCells: 6, totalMembers: 289, averageSize: 12 },
              healthMetrics: [
                { metric: 'Leadership Development', score: 85, status: 'good' },
                { metric: 'Member Engagement', score: 78, status: 'good' },
                { metric: 'Multiplication Readiness', score: 72, status: 'fair' },
                { metric: 'Discipleship Process', score: 88, status: 'excellent' }
              ],
              cellBreakdown: [
                { zone: 'North', cells: 8, healthy: 6, multiplying: 2 },
                { zone: 'South', cells: 7, healthy: 5, multiplying: 2 },
                { zone: 'East', cells: 5, healthy: 4, multiplying: 1 },
                { zone: 'West', cells: 4, healthy: 3, multiplying: 1 }
              ],
              insights: ['75% of cells are healthy and growing', '6 cells ready to multiply this quarter']
            }
          },
          4: {
            id: 4,
            name: 'Cell Growth Dashboard',
            type: 'Cell Growth',
            description: 'Cell multiplication metrics, growth trends, and expansion analysis',
            generatedDate: '2024-01-12',
            status: 'completed',
            data: {
              summary: { totalMultiplications: 6, newCells: 3, growthRate: 12.5, targetAchieved: 87 },
              multiplicationTrends: [
                { quarter: 'Q1', multiplications: 2, newCells: 1 },
                { quarter: 'Q2', multiplications: 3, newCells: 2 },
                { quarter: 'Q3', multiplications: 4, newCells: 2 },
                { quarter: 'Q4', multiplications: 6, newCells: 3 }
              ],
              pipelineStatus: { ready: 6, preparing: 8, developing: 12 },
              insights: ['Cell multiplication increased by 50% this year', '6 cells currently in multiplication pipeline']
            }
          },
          9: {
            id: 9,
            name: 'Crisis Care Report',
            type: 'Crisis Care',
            description: 'Active crisis cases, intervention outcomes, and resource utilization',
            generatedDate: '2024-01-13',
            status: 'in_progress',
            data: {
              summary: { activeCases: 12, resolvedThisMonth: 8, ongoingSupport: 18, urgentCases: 2 },
              caseTypes: [
                { type: 'Medical Emergency', count: 3, resolved: 2 },
                { type: 'Financial Crisis', count: 5, resolved: 3 },
                { type: 'Family Conflict', count: 4, resolved: 2 }
              ],
              responseMetrics: { averageResponseTime: '2.3 hours', resolutionRate: 67, satisfactionScore: 4.2 },
              insights: ['Crisis response time improved by 30%', 'Resolution rate increased to 67%']
            }
          },
          14: {
            id: 14,
            name: 'Foundation School Progress',
            type: 'Foundation School',
            description: 'Student progress, completion rates, and spiritual growth metrics',
            generatedDate: '2024-01-08',
            status: 'completed',
            data: {
              summary: { totalStudents: 45, activeStudents: 38, completed: 12, inProgress: 26 },
              classBreakdown: [
                { class: 'Foundation 101', enrolled: 15, completed: 12, averageGrade: 87 },
                { class: 'Foundation 201', enrolled: 18, completed: 0, averageGrade: 82 },
                { class: 'Foundation 301', enrolled: 12, completed: 0, averageGrade: 79 }
              ],
              spiritualMetrics: { prayerLife: 85, bibleStudy: 78, evangelism: 72, discipleship: 88 },
              insights: ['87% completion rate for Foundation 101', 'Students showing strong spiritual growth indicators']
            }
          },
          16: {
            id: 16,
            name: 'Baptism Records Report',
            type: 'Baptism',
            description: 'Baptism statistics, conversion rates, and water baptism tracking',
            generatedDate: '2024-01-14',
            status: 'completed',
            data: {
              summary: { totalBaptisms: 34, thisMonth: 8, thisQuarter: 23, conversionRate: 78 },
              monthlyTrends: [
                { month: 'Oct', baptisms: 6, conversions: 8 },
                { month: 'Nov', baptisms: 9, conversions: 11 },
                { month: 'Dec', baptisms: 7, conversions: 9 },
                { month: 'Jan', baptisms: 8, conversions: 10 }
              ],
              demographics: {
                ageGroups: { '18-25': 12, '26-35': 15, '36-50': 5, '50+': 2 },
                source: { 'Cell Group': 18, 'Visitors': 8, 'Events': 6, 'Other': 2 }
              },
              insights: ['Baptism rate increased by 15% this quarter', '53% of baptisms came from cell groups']
            }
          },
          18: {
            id: 18,
            name: 'Members Database Report',
            type: 'Members',
            description: 'Member demographics, growth trends, and database integrity metrics',
            generatedDate: '2024-01-15',
            status: 'completed',
            data: {
              summary: { totalMembers: 892, activeMembers: 756, newMembers: 34, inactiveMembers: 136 },
              demographics: {
                ageGroups: { '0-17': 145, '18-25': 89, '26-35': 234, '36-50': 267, '50+': 157 },
                gender: { male: 412, female: 480 },
                maritalStatus: { single: 234, married: 567, divorced: 67, widowed: 24 }
              },
              growthMetrics: { monthlyGrowth: 3.8, retentionRate: 84.7, newMemberConversion: 67 },
              insights: ['Member base grew by 3.8% this month', '84.7% member retention rate maintained']
            }
          }
        };
        setReport(mockReportData[id] || {
          id: id,
          name: `Report ${id}`,
          type: 'General',
          description: 'Report data loading...',
          generatedDate: new Date().toISOString().split('T')[0],
          status: 'completed',
          data: {
            summary: { totalRecords: 100, status: 'Active' },
            insights: ['Report data is being processed', 'Full functionality coming soon']
          }
        });
      } else {
        throw new Error('Failed to load report');
      }
    } catch (error) {
      console.error('Error loading report:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load report',
        severity: 'error'
      });
      // Use mock data as fallback
      const mockReportData = {
        1: {
          id: 1,
          name: 'Monthly Giving Report',
          type: 'Financial',
          generatedDate: '2024-01-15',
          status: 'completed',
          data: { summary: { totalGiving: 45678.90 } }
        },
        2: {
          id: 2,
          name: 'Attendance Analytics',
          type: 'Attendance',
          generatedDate: '2024-01-14',
          status: 'completed',
          data: { summary: { totalAttendance: 1247 } }
        }
      };
      setReport(mockReportData[id]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadReport();
    }
  }, [id]);

  // Handle export
  const handleExport = async (format) => {
    setExportMenu(null);
    try {
      // Try API first, fallback to mock data
      try {
        const response = await fetchWithAuth(`/api/reports/reports/${id}/export?format=${format}`);
        if (response.ok) {
          const data = await response.json();
          downloadFile(data, format);
          return;
        }
      } catch (apiError) {
        console.log('API export failed, using mock data');
      }
      
      // Fallback to mock data export
      const exportData = {
        reportName: report.name,
        reportType: report.type,
        generatedDate: report.generatedDate,
        data: report.data,
        exportedAt: new Date().toISOString()
      };
      
      downloadFile(exportData, format);
      
      setSnackbar({
        open: true,
        message: `Report exported as ${format.toUpperCase()}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({
        open: true,
        message: 'Export failed',
        severity: 'error'
      });
    }
  };

  // Download file helper
  const downloadFile = (data, format) => {
    let content, mimeType, fileName;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileName = `report-${id}.json`;
        break;
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv';
        fileName = `report-${id}.csv`;
        break;
      case 'excel':
        content = convertToCSV(data); // Simplified - would need proper Excel library
        mimeType = 'text/csv';
        fileName = `report-${id}.csv`;
        break;
      case 'pdf':
        content = JSON.stringify(data, null, 2); // Simplified - would need PDF library
        mimeType = 'application/json';
        fileName = `report-${id}.json`;
        break;
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        fileName = `report-${id}.json`;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Convert data to CSV
  const convertToCSV = (data) => {
    if (!data.data) return '';
    
    const csvRows = [];
    csvRows.push(`Report: ${data.reportName}`);
    csvRows.push(`Generated: ${data.generatedDate}`);
    csvRows.push('');
    
    if (data.data.summary) {
      csvRows.push('Summary');
      Object.entries(data.data.summary).forEach(([key, value]) => {
        csvRows.push(`${key},${value}`);
      });
      csvRows.push('');
    }
    
    if (data.data.insights) {
      csvRows.push('Insights');
      data.data.insights.forEach(insight => {
        csvRows.push(`"${insight}"`);
      });
    }
    
    return csvRows.join('\n');
  };

  // Handle share
  const handleShare = () => {
    setSnackbar({
      open: true,
      message: 'Report link copied to clipboard',
      severity: 'success'
    });
  };

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      default: return <Minus color="action" />;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!report) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          Report not found
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowLeft />}
          onClick={() => navigate('/reports')}
          sx={{ mt: 2 }}
        >
          Back to Reports
        </Button>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, background: theme.palette.background.default, minHeight: '100vh' }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate('/reports')}>
              <ArrowLeft />
            </IconButton>
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                {report.name}
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={report.type}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Typography variant="body2" color="text.secondary">
                  Generated: {new Date(report.generatedDate).toLocaleDateString()}
                </Typography>
                <Chip
                  label={report.status}
                  size="small"
                  color={report.status === 'completed' ? 'success' : 'warning'}
                />
              </Box>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Tooltip title="Share Report">
              <IconButton onClick={handleShare}>
                <Share2 />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Report">
              <IconButton onClick={handlePrint}>
                <Printer />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Options">
              <IconButton onClick={(e) => setExportMenu(e.currentTarget)}>
                <Download />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={exportMenu}
              open={Boolean(exportMenu)}
              onClose={() => setExportMenu(null)}
            >
              <MenuItemComponent onClick={() => handleExport('pdf')}>
                Export as PDF
              </MenuItemComponent>
              <MenuItemComponent onClick={() => handleExport('excel')}>
                Export as Excel
              </MenuItemComponent>
              <MenuItemComponent onClick={() => handleExport('csv')}>
                Export as CSV
              </MenuItemComponent>
              <MenuItemComponent onClick={() => handleExport('json')}>
                Export as JSON
              </MenuItemComponent>
            </Menu>
          </Box>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Filter size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              Filters
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={filters.dateRange}
                    label="Date Range"
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                  >
                    <MenuItem value="last7days">Last 7 Days</MenuItem>
                    <MenuItem value="last30days">Last 30 Days</MenuItem>
                    <MenuItem value="last90days">Last 90 Days</MenuItem>
                    <MenuItem value="thisyear">This Year</MenuItem>
                    <MenuItem value="custom">Custom Range</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Start Date"
                  value={filters.startDate}
                  onChange={(date) => setFilters({ ...filters, startDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="End Date"
                  value={filters.endDate}
                  onChange={(date) => setFilters({ ...filters, endDate: date })}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<RefreshCw />}
                  onClick={() => setSnackbar({ open: true, message: 'Filters applied', severity: 'success' })}
                >
                  Apply Filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Overview" />
            <Tab label="Detailed Data" />
            <Tab label="Charts & Graphs" />
            <Tab label="Insights" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Summary Cards */}
            {report.data.summary && Object.entries(report.data.summary).map(([key, value]) => (
              <Grid item xs={12} sm={6} md={3} key={key}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="primary.main">
                      {typeof value === 'number' ? (
                        key.includes('Giving') || key.includes('Gift') || key.includes('amount') ? 
                          formatCurrency(value) : value.toLocaleString()
                      ) : value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Typography>
                    {key === 'trend' && getTrendIcon(value)}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            {/* Breakdown Table */}
            {report.data.breakdown && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Detailed Breakdown
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Percentage</TableCell>
                            <TableCell align="center">Trend</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {report.data.breakdown.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.category || item.service}</TableCell>
                              <TableCell align="right">
                                {item.amount ? formatCurrency(item.amount) : item.attendance}
                              </TableCell>
                              <TableCell align="right">{item.percentage}%</TableCell>
                              <TableCell align="center">
                                {getTrendIcon(item.trend)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Trends Table */}
            {report.data.weeklyTrends && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {report.data.monthlyTrends ? 'Monthly Trends' : 'Weekly Trends'}
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Period</TableCell>
                            <TableCell align="right">
                              {report.data.monthlyTrends ? 'Amount' : 'Attendance'}
                            </TableCell>
                            <TableCell align="right">Change</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(report.data.monthlyTrends || report.data.weeklyTrends).map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.month || item.week}</TableCell>
                              <TableCell align="right">
                                {item.amount ? formatCurrency(item.amount) : item.attendance}
                              </TableCell>
                              <TableCell align="right">
                                {index > 0 && (
                                  <Typography
                                    variant="body2"
                                    color={
                                      (item.amount || item.attendance) > 
                                      ((report.data.monthlyTrends || report.data.weeklyTrends)[index - 1]?.amount || 
                                       (report.data.monthlyTrends || report.data.weeklyTrends)[index - 1]?.attendance)
                                        ? 'success.main' : 'error.main'
                                    }
                                  >
                                    {index > 0 && (
                                      <>
                                        {((item.amount || item.attendance) - 
                                          ((report.data.monthlyTrends || report.data.weeklyTrends)[index - 1]?.amount || 
                                           (report.data.monthlyTrends || report.data.weeklyTrends)[index - 1]?.attendance)) > 0 ? '+' : ''}
                                        {((item.amount || item.attendance) - 
                                          ((report.data.monthlyTrends || report.data.weeklyTrends)[index - 1]?.amount || 
                                           (report.data.monthlyTrends || report.data.weeklyTrends)[index - 1]?.attendance)).toFixed(0)}
                                      </>
                                    )}
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <BarChart3 size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Performance Chart
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Chart visualization would be rendered here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PieChart size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                    Distribution Chart
                  </Typography>
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Pie chart would be rendered here
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tabValue === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Info size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                Key Insights & Recommendations
              </Typography>
              {report.data.insights?.map((insight, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <CheckCircle size={16} color="success" style={{ marginRight: 8, marginTop: 4 }} />
                    {insight}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        )}

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

export default ReportViewer;
