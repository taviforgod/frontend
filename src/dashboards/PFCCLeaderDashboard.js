import React, { useContext, useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip, Divider, Grid, Button,
  List, ListItem, ListItemText, Avatar, CircularProgress, LinearProgress, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import {
  Users, TrendingUp, AlertTriangle, BookOpen, FileText, BarChart2, Target,
  Award, CheckCircle, Clock, PieChart, Zap
} from 'lucide-react';
import { DateTime } from 'luxon';
import DashboardLayout from '../components/DashboardLayout';
import dashboardAPI from '../services/dashboardAPI';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import HeroHeader from '../components/dashboard/HeroHeader';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * PFCC Leader (Zonal Leader) Dashboard
 * 
 * Responsibilities:
 * 1. Zone-wide Cell Oversight - Monitor health of all cells in zone
 * 2. Leadership Development - Support & develop cell leaders
 * 3. Attendance & Growth Tracking - Zone-level attendance trends
 * 4. Evangelism & Discipleship - Track conversions, baptisms, foundation school
 * 5. Financial Stewardship - Monitor giving in zone
 * 6. Reporting & Accountability - Ensure leaders submit reports on time
 * 7. Conflict Resolution - Help resolve issues in cells
 * 8. Multiplication Planning - Identify cells ready to multiply
 */

function StatCard({ icon: Icon, label, value, color = 'primary' }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="caption" fontWeight={600}>
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={700} mt={0.5}>
              {value}
            </Typography>
          </Box>
          <Icon size={28} style={{ opacity: 0.6 }} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default function PFCCLeaderDashboard() {
  const { fetchWithAuth, user } = useContext(AuthContext);
  const { mode, theme } = useContext(ThemeContext);
  const [loading, setLoading] = useState(true);

  // Zone data
  const [zoneStats, setZoneStats] = useState({
    zoneName: 'PFCC Zone 1',
    totalCells: 5,
    totalMembers: 78,
    attendancePercentage: 82,
    growthPercentage: 12,
    newMembers: 8,
    baptisms: 3
  });

  const [cells, setCells] = useState([
    {
      id: 1,
      name: 'Hope Cell',
      leader: 'Samuel Lee',
      members: 16,
      lastAttendance: 14,
      healthScore: 92,
      status: 'healthy',
      readyForMultiplication: true,
      visitors: 2,
      baptisms: 1
    },
    {
      id: 2,
      name: 'Light Cell',
      leader: 'Jane Smith',
      members: 18,
      lastAttendance: 15,
      healthScore: 88,
      status: 'healthy',
      readyForMultiplication: false,
      visitors: 1,
      baptisms: 0
    },
    {
      id: 3,
      name: 'Grace Cell',
      leader: 'John Doe',
      members: 14,
      lastAttendance: 9,
      healthScore: 64,
      status: 'at_risk',
      readyForMultiplication: false,
      visitors: 0,
      baptisms: 0
    },
    {
      id: 4,
      name: 'Victory Cell',
      leader: 'Maria Santos',
      members: 16,
      lastAttendance: 13,
      healthScore: 81,
      status: 'healthy',
      readyForMultiplication: false,
      visitors: 3,
      baptisms: 1
    },
    {
      id: 5,
      name: 'Faith Cell',
      leader: 'David Brown',
      members: 14,
      lastAttendance: 10,
      healthScore: 71,
      status: 'moderate',
      readyForMultiplication: false,
      visitors: 1,
      baptisms: 1
    }
  ]);

  const [atRiskCells, setAtRiskCells] = useState([]);
  const [overduReports, setOverdueReports] = useState([]);
  const [leadershipNeeds, setLeadershipNeeds] = useState([]);
  const [evangelismMetrics, setEvangelismMetrics] = useState({
    totalVisitors: 7,
    totalBaptisms: 3,
    foundationEnrolled: 12,
    foundationCompleted: 4
  });

  const [selectedCell, setSelectedCell] = useState(null);
  const [openCellDetail, setOpenCellDetail] = useState(false);

  useEffect(() => {
    loadZoneData();
  }, [fetchWithAuth]);

  const loadZoneData = async () => {
    try {
      setLoading(true);
      // TODO: Implement actual API calls when backend endpoints available
      
      // Identify at-risk cells
      const atRisk = cells.filter(c => c.status === 'at_risk' || c.healthScore < 70);
      setAtRiskCells(atRisk);

      // Simulate overdue reports
      setOverdueReports([
        { cellName: 'Grace Cell', type: 'Weekly Report', daysOverdue: 3 },
        { cellName: 'Faith Cell', type: 'Monthly Summary', daysOverdue: 1 }
      ]);

      // Leadership development needs
      setLeadershipNeeds([
        { leader: 'John Doe (Grace Cell)', need: 'Attendance recovery plan needed' },
        { leader: 'David Brown (Faith Cell)', need: 'Leadership training recommended' }
      ]);

    } catch (error) {
      console.error('Failed to load zone dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCellDetails = (cell) => {
    setSelectedCell(cell);
    setOpenCellDetail(true);
  };

  const getHealthColor = (score) => {
    if (score >= 85) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'moderate': return 'warning';
      case 'at_risk': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout title="Zone Leader Dashboard">
      <Box sx={{ bgcolor: 'background.default' }}>
      <HeroHeader
        title={`${zoneStats.zoneName} Overview`}
        subtitle="Zone-wide cell monitoring, leader development, and accountability"
        icon={<Users size={22} />}
      />

      {/* Key Stats */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={Users} label="Cells" value={zoneStats.totalCells} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={Users} label="Members" value={zoneStats.totalMembers} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={TrendingUp} label="Attendance %" value={`${zoneStats.attendancePercentage}%`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={Zap} label="Growth" value={`+${zoneStats.growthPercentage}%`} />
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3} mb={3}>
        {/* Alerts & Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <AlertTriangle size={20} /> Attention Needed
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {atRiskCells.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" fontWeight={600} color="error" mb={1}>
                    🚨 Cells at Risk ({atRiskCells.length})
                  </Typography>
                  <Stack spacing={1}>
                    {atRiskCells.map(cell => (
                      <Box
                        key={cell.id}
                        sx={{
                          p: 1.5,
                          bgcolor: 'error.50',
                          border: '1px solid',
                          borderColor: 'error.200',
                          borderRadius: 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'error.100' }
                        }}
                        onClick={() => handleViewCellDetails(cell)}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{cell.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {cell.lastAttendance}/{cell.members} present • Score: {cell.healthScore}
                            </Typography>
                          </Box>
                          <Chip label={cell.status} color={getStatusColor(cell.status)} size="small" />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {overduReports.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} color="warning.main" mb={1}>
                    📋 Overdue Reports ({overduReports.length})
                  </Typography>
                  <Stack spacing={1}>
                    {overduReports.map((report, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1.5,
                          bgcolor: 'warning.50',
                          border: '1px solid',
                          borderColor: 'warning.200',
                          borderRadius: 1
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{report.cellName}</Typography>
                            <Typography variant="caption" color="text.secondary">{report.type}</Typography>
                          </Box>
                          <Chip label={`${report.daysOverdue}d overdue`} color="warning" size="small" />
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Leadership Needs */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Award size={20} /> Leadership Development
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                {leadershipNeeds.map((need, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      p: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      borderLeft: '4px solid #3b82f6'
                    }}
                  >
                    <Typography variant="body2" fontWeight={600}>{need.leader}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {need.need}
                    </Typography>
                  </Box>
                ))}
              </Stack>

              <Button variant="outlined" fullWidth sx={{ mt: 2 }}>
                View All Leader Assignments
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* All Cells in Zone */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BarChart2 size={20} /> All Cells in {zoneStats.zoneName}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                {cells.map(cell => (
                  <Box
                    key={cell.id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'action.hover', transform: 'translateX(4px)' }
                    }}
                    onClick={() => handleViewCellDetails(cell)}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{cell.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Leader: {cell.leader}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {cell.readyForMultiplication && (
                          <Tooltip title="Ready for multiplication">
                            <Chip label="🚀 Ready to Multiply" color="success" size="small" />
                          </Tooltip>
                        )}
                        <Chip label={cell.status} color={getStatusColor(cell.status)} size="small" />
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Members</Typography>
                        <Typography variant="body2" fontWeight={600}>{cell.members}</Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Attendance</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {cell.lastAttendance}/{cell.members}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {Math.round((cell.lastAttendance / cell.members) * 100)}%
                          </Typography>
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Health Score</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600}>{cell.healthScore}</Typography>
                          <Box sx={{ width: 40, height: 4, bgcolor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
                            <Box
                              sx={{
                                height: '100%',
                                width: `${cell.healthScore}%`,
                                bgcolor: getHealthColor(cell.healthScore),
                                transition: 'width 0.3s'
                              }}
                            />
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="caption" color="text.secondary">Visitors / Baptisms</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {cell.visitors} / {cell.baptisms}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Evangelism & Discipleship */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Zap size={20} /> Evangelism Metrics
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>New Visitors This Month</Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {evangelismMetrics.totalVisitors}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Baptisms (This Period)</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {evangelismMetrics.totalBaptisms}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BookOpen size={20} /> Foundation School
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Currently Enrolled</Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">
                    {evangelismMetrics.foundationEnrolled}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>Completed This Quarter</Typography>
                  <Typography variant="h5" fontWeight={700} color="success.main">
                    {evangelismMetrics.foundationCompleted}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cell Detail Dialog */}
      <Dialog open={openCellDetail} onClose={() => setOpenCellDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedCell?.name} - Detailed View
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedCell && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>Leader</Typography>
                <Typography variant="body2">{selectedCell.leader}</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Health Score: {selectedCell.healthScore}/100</Typography>
                <LinearProgress
                  variant="determinate"
                  value={selectedCell.healthScore}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Members</Typography>
                  <Typography variant="h6">{selectedCell.members}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Last Attendance</Typography>
                  <Typography variant="h6">{selectedCell.lastAttendance}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Visitors (month)</Typography>
                  <Typography variant="h6">{selectedCell.visitors}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Baptisms (quarter)</Typography>
                  <Typography variant="h6">{selectedCell.baptisms}</Typography>
                </Grid>
              </Grid>

              {selectedCell.status === 'at_risk' && (
                <Alert severity="error">
                  This cell requires immediate attention and support from zone leadership.
                </Alert>
              )}

              {selectedCell.readyForMultiplication && (
                <Alert severity="success">
                  This cell has met criteria for multiplication. Consider planning division strategy.
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCellDetail(false)}>Close</Button>
          <Button variant="contained">View Full Report</Button>
        </DialogActions>
      </Dialog>
      </Box>
    </DashboardLayout>
  );
}
