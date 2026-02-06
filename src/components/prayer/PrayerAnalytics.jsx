import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, LinearProgress,
  CircularProgress, Chip, Avatar, Stack, Divider, Tooltip,
  List, ListItem, ListItemText, ListItemAvatar, IconButton,
  Select, MenuItem, FormControl, InputLabel, Button
} from '@mui/material';
import {
  TrendingUp, Heart, Clock, Users, AlertTriangle, CalendarCheck,
  MessageCircle, PhoneCall, Mail, Eye, EyeOff, Activity, PieChart,
  BarChart3, Download, RefreshCcw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getPrayerRequests, getUrgentCount } from '../../services/prayerService';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export default function PrayerAnalytics({ dateRange = '30days' }) {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const { theme } = useContext(ThemeContext) || {};
  
  const [loading, setLoading] = useState(false);
  const [prayerData, setPrayerData] = useState([]);
  const [analytics, setAnalytics] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    urgent: 0,
    anonymous: 0,
    thisWeek: 0,
    thisMonth: 0,
    avgResponseTime: 0,
    categories: {},
    urgency: {},
    monthlyTrend: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState(dateRange);

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const now = DateTime.now();
      let startDate;
      
      switch (selectedPeriod) {
        case '7days':
          startDate = now.minus({ days: 7 });
          break;
        case '30days':
          startDate = now.minus({ days: 30 });
          break;
        case '90days':
          startDate = now.minus({ days: 90 });
          break;
        case '1year':
          startDate = now.minus({ years: 1 });
          break;
        default:
          startDate = now.minus({ days: 30 });
      }

      const params = {
        limit: 1000,
        start_date: startDate.toISO(),
        end_date: now.toISO()
      };

      const requests = await getPrayerRequests(fetchWithAuth, params).catch(() => []);
      const urgentData = await getUrgentCount(fetchWithAuth).catch(() => ({ urgent_open: 0 }));

      // Process analytics
      const processed = processAnalytics(requests, urgentData, startDate);
      setAnalytics(processed);
      setPrayerData(requests);
    } catch (err) {
      console.error('Failed to load prayer analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (requests, urgentData, startDate) => {
    const now = DateTime.now();
    
    // Basic counts
    const total = requests.length;
    const open = requests.filter(r => r.status === 'open').length;
    const inProgress = requests.filter(r => r.status === 'in_progress').length;
    const closed = requests.filter(r => r.status === 'closed').length;
    const urgent = requests.filter(r => r.urgency === 'urgent' || r.urgency === 'High').length;
    const anonymous = requests.filter(r => r.anonymous).length;
    
    // Time-based counts
    const thisWeek = requests.filter(r => {
      const created = DateTime.fromISO(r.created_at);
      return created >= now.minus({ weeks: 1 });
    }).length;
    
    const thisMonth = requests.filter(r => {
      const created = DateTime.fromISO(r.created_at);
      return created >= now.minus({ months: 1 });
    }).length;

    // Category breakdown
    const categories = requests.reduce((acc, r) => {
      const cat = r.category || 'Other';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    // Urgency breakdown
    const urgency = requests.reduce((acc, r) => {
      const urg = r.urgency || 'normal';
      acc[urg] = (acc[urg] || 0) + 1;
      return acc;
    }, {});

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = now.minus({ months: i }).startOf('month');
      const monthEnd = now.minus({ months: i }).endOf('month');
      
      const monthCount = requests.filter(r => {
        const created = DateTime.fromISO(r.created_at);
        return created >= monthStart && created <= monthEnd;
      }).length;
      
      monthlyTrend.push({
        month: monthStart.toFormat('MMM yyyy'),
        count: monthCount
      });
    }

    // Average response time (time from creation to assignment)
    const assignedRequests = requests.filter(r => r.assigned_to && r.created_at);
    const responseTimes = assignedRequests.map(r => {
      const created = DateTime.fromISO(r.created_at);
      // This would need assigned_at field, for now using a placeholder
      return created; // Would calculate difference to assigned_at
    });
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length 
      : 0;

    return {
      total,
      open,
      inProgress,
      closed,
      urgent,
      anonymous,
      thisWeek,
      thisMonth,
      avgResponseTime,
      categories,
      urgency,
      monthlyTrend
    };
  };

  const exportAnalytics = () => {
    const exportData = {
      summary: analytics,
      monthly_trend: analytics.monthlyTrend,
      categories: analytics.categories,
      urgency: analytics.urgency,
      raw_data: prayerData,
      generated_at: DateTime.now().toISO()
    };

    const ws = XLSX.utils.json_to_sheet([exportData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prayer Analytics');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), `prayer-analytics-${DateTime.now().toFormat('yyyy-MM-dd')}.xlsx`);
  };

  const MetricCard = ({ title, value, icon, color, subtitle, trend }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ 
        height: '100%', 
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        '&:hover': { boxShadow: 3 }
      }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>
              {icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700} color={color}>
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
              {trend && (
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TrendingUp size={12} color={trend > 0 ? '#4caf50' : '#f44336'} />
                  <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </Typography>
                </Stack>
              )}
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );

  const CategoryBreakdown = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PieChart size={20} />
          Request Categories
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Stack spacing={2}>
          {Object.entries(analytics.categories).map(([category, count]) => {
            const percentage = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
            return (
              <Box key={category}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {count} ({percentage.toFixed(1)}%)
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={percentage} 
                  sx={{ 
                    height: 8, 
                    borderRadius: 4,
                    backgroundColor: 'grey.200'
                  }} 
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );

  const MonthlyTrend = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChart3 size={20} />
          Monthly Trend
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Stack spacing={1}>
          {analytics.monthlyTrend.map((month, index) => {
            const maxCount = Math.max(...analytics.monthlyTrend.map(m => m.count));
            const percentage = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
            
            return (
              <Box key={month.month}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {month.month}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {month.count}
                  </Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={percentage} 
                  sx={{ 
                    height: 6, 
                    borderRadius: 3,
                    backgroundColor: 'grey.200'
                  }} 
                />
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Activity size={28} />
            Prayer Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive insights and trends
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              label="Period"
            >
              <MenuItem value="7days">Last 7 days</MenuItem>
              <MenuItem value="30days">Last 30 days</MenuItem>
              <MenuItem value="90days">Last 90 days</MenuItem>
              <MenuItem value="1year">Last year</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Refresh">
            <IconButton onClick={loadAnalytics}>
              <RefreshCcw size={20} />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportAnalytics}
          >
            Export
          </Button>
        </Stack>
      </Stack>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Requests"
            value={analytics.total}
            icon={<Heart size={24} />}
            color="#1976d2"
            subtitle={`+${analytics.thisWeek} this week`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Open Requests"
            value={analytics.open}
            icon={<Clock size={24} />}
            color="#ff9800"
            subtitle={`${analytics.urgent} urgent`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="In Progress"
            value={analytics.inProgress}
            icon={<Activity size={24} />}
            color="#4caf50"
            subtitle="Being handled"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Anonymous"
            value={analytics.anonymous}
            icon={<EyeOff size={24} />}
            color="#9e9e9e"
            subtitle="Privacy protected"
          />
        </Grid>
      </Grid>

      {/* Charts and Breakdowns */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <CategoryBreakdown />
        </Grid>
        <Grid item xs={12} md={6}>
          <MonthlyTrend />
        </Grid>
      </Grid>
    </Box>
  );
}
