import React, { useState } from 'react';
import {
  Box, Typography, Card, CardContent, CardActions, Button, Grid,
  Chip, Avatar, IconButton, Tooltip, LinearProgress, Badge,
  List, ListItem, ListItemText, ListItemAvatar, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Heart, MessageCircle, Users, Clock, AlertTriangle,
  TrendingUp, CalendarCheck, PhoneCall, Mail, Eye, PlusCircle,
  RefreshCcw, Download, Filter, Search, Bell, Archive, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';
import PrayerForm from '../prayer/PrayerForm';
import { getPrayerRequests, getUrgentCount } from '../../services/prayerService';

export default function PrayerQuickActions({ onNavigate }) {
  const { fetchWithAuth, user } = useContext(AuthContext) || {};
  const { theme } = useContext(ThemeContext) || {};
  
  const [stats, setStats] = useState({
    total: 0,
    urgent: 0,
    thisWeek: 0,
    anonymous: 0,
    open: 0,
    inProgress: 0
  });
  const [loading, setLoading] = useState(false);
  const [newPrayerOpen, setNewPrayerOpen] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);

  const loadQuickStats = async () => {
    setLoading(true);
    try {
      const [requests, urgentData] = await Promise.allSettled([
        getPrayerRequests(fetchWithAuth, { limit: 10 }).catch(() => []),
        getUrgentCount(fetchWithAuth).catch(() => ({ urgent_open: 0 }))
      ]);

      const prayerData = requests.status === 'fulfilled' ? requests.value : [];
      const urgentCount = urgentData.status === 'fulfilled' ? urgentData.value?.urgent_open || 0 : 0;

      const thisWeek = prayerData.filter(r => {
        const created = DateTime.fromISO(r.created_at);
        return created >= DateTime.now().minus({ weeks: 1 });
      }).length;

      const anonymous = prayerData.filter(r => r.anonymous).length;
      const open = prayerData.filter(r => r.status === 'open').length;
      const inProgress = prayerData.filter(r => r.status === 'in_progress').length;

      setStats({
        total: prayerData.length,
        urgent: urgentCount,
        thisWeek,
        anonymous,
        open,
        inProgress
      });

      setRecentRequests(prayerData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load prayer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadQuickStats();
  }, []);

  const QuickStatCard = ({ title, value, icon, color, subtitle, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        sx={{ 
          height: '100%', 
          cursor: onClick ? 'pointer' : 'default',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
          border: `1px solid ${color}30`,
          '&:hover': { boxShadow: 3 }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ 
              bgcolor: color, 
              width: 48, 
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700} color={color}>
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
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );

  const ActionCard = ({ title, description, icon, color, onClick, badge }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        sx={{ 
          height: '100%', 
          cursor: 'pointer',
          '&:hover': { boxShadow: 3 }
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" alignItems="flex-start" spacing={2}>
            <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>
              {badge ? (
                <Badge badgeContent={badge} color="error">
                  {icon}
                </Badge>
              ) : (
                icon
              )}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Heart size={28} />
            Prayer & Counseling Hub
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage prayer requests, counseling, and spiritual support
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={loadQuickStats} disabled={loading}>
              <RefreshCcw size={20} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<PlusCircle />}
            onClick={() => setNewPrayerOpen(true)}
          >
            New Request
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <QuickStatCard
            title="Total Requests"
            value={stats.total}
            icon={<Heart size={24} />}
            color="#1976d2"
            subtitle={`+${stats.thisWeek} this week`}
            onClick={() => onNavigate && onNavigate('/prayers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickStatCard
            title="Urgent"
            value={stats.urgent}
            icon={<AlertTriangle size={24} />}
            color="#f44336"
            subtitle="Need immediate attention"
            onClick={() => onNavigate && onNavigate('/prayers?urgency=urgent')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickStatCard
            title="Open"
            value={stats.open}
            icon={<Clock size={24} />}
            color="#ff9800"
            subtitle="Awaiting assignment"
            onClick={() => onNavigate && onNavigate('/prayers?status=open')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickStatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<TrendingUp size={24} />}
            color="#4caf50"
            subtitle="Being handled"
            onClick={() => onNavigate && onNavigate('/prayers?status=in_progress')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickStatCard
            title="Anonymous"
            value={stats.anonymous}
            icon={<Eye size={24} />}
            color="#9e9e9e"
            subtitle="Privacy protected"
            onClick={() => onNavigate && onNavigate('/prayers?anonymous=true')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <QuickStatCard
            title="This Week"
            value={stats.thisWeek}
            icon={<CalendarCheck size={24} />}
            color="#9c27b0"
            subtitle="New requests"
            onClick={() => onNavigate && onNavigate('/prayers?dateRange=this_week')}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard
            title="Dashboard"
            description="View comprehensive prayer dashboard"
            icon={<Heart size={20} />}
            color="#1976d2"
            onClick={() => onNavigate && onNavigate('/prayers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard
            title="Admin View"
            description="Manage all prayer requests"
            icon={<Users size={20} />}
            color="#f44336"
            badge={stats.urgent}
            onClick={() => onNavigate && onNavigate('/prayers/admin')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard
            title="New Request"
            description="Submit prayer or counseling request"
            icon={<PlusCircle size={20} />}
            color="#4caf50"
            onClick={() => setNewPrayerOpen(true)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActionCard
            title="Reports"
            description="Export and analyze prayer data"
            icon={<Download size={20} />}
            color="#ff9800"
            onClick={() => onNavigate && onNavigate('/prayers/reports')}
          />
        </Grid>
      </Grid>

      {/* Recent Requests */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <MessageCircle size={20} />
            Recent Prayer Requests
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          {recentRequests.length > 0 ? (
            <List dense>
              {recentRequests.map((request) => (
                <ListItem key={request.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: request.urgency === 'urgent' ? '#f44336' : '#1976d2' }}>
                      {request.anonymous ? 'A' : (request.first_name || '?')[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={request.anonymous ? 'Anonymous Request' : `${request.first_name} ${request.surname || ''}`}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {request.category} • {request.description?.substring(0, 60)}{request.description?.length > 60 ? '...' : ''}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {DateTime.fromISO(request.created_at).toLocaleString(DateTime.DATETIME_MED)}
                        </Typography>
                      </Box>
                    }
                  />
                  <Stack direction="row" spacing={1}>
                    <Chip 
                      label={request.status} 
                      size="small" 
                      color={request.status === 'open' ? 'success' : 'default'}
                    />
                    {request.urgency === 'urgent' && (
                      <Chip label="Urgent" size="small" color="error" />
                    )}
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography color="text.secondary">
                No recent prayer requests
              </Typography>
            </Box>
          )}
          
          {recentRequests.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => onNavigate && onNavigate('/prayers')}
              >
                View All Requests
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* New Prayer Dialog */}
      <Dialog open={newPrayerOpen} onClose={() => setNewPrayerOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submit Prayer Request</DialogTitle>
        <DialogContent>
          <PrayerForm 
            onSuccess={() => {
              setNewPrayerOpen(false);
              loadQuickStats();
            }} 
            onClose={() => setNewPrayerOpen(false)} 
            showTitle={false} 
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
