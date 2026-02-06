import React, { useEffect, useState, useCallback, useContext } from 'react';
import {
  Card, CardContent, CardHeader, Typography, List, ListItem, ListItemAvatar,
  ListItemText, Avatar, Chip, Button, Box, CircularProgress, Divider,
  Stack, IconButton, Tooltip, Badge
} from '@mui/material';
import {
  Bell, CheckCircle, AlertCircle, AlertTriangle, Users, Heart, Cross,
  Trash2, Eye, Clock, ExternalLink
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useNotificationService } from '../services/notificationService';
import { AuthContext } from '../contexts/AuthContext';
import { DateTime } from 'luxon';

/**
 * NotificationWidget - Displays recent notifications on dashboards
 * Supports role-aware filtering:
 *   - admin: sees all system notifications
 *   - pastor: sees church-level and crisis notifications
 *   - member: sees personal notifications
 * 
 * Props:
 *   - role: 'admin', 'pastor', or 'member' (or any custom role)
 *   - limit: max notifications to display (default 5)
 *   - compact: if true, shows compact view without full list
 *   - onViewAll: callback when "View All" is clicked
 */
const NotificationWidget = ({ role = 'member', limit = 5, compact = false, onViewAll }) => {
  const { user } = useContext(AuthContext);
  const { notifications, unreadCount } = useNotifications();
  const { deleteNotification } = useNotificationService();
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter notifications based on role
  useEffect(() => {
    if (!notifications || notifications.length === 0) {
      setFilteredNotifications([]);
      return;
    }

    let filtered = [...notifications];

    // Role-based filtering
    if (role === 'member') {
      // Members see: personal notifications, crisis assignments, prayer requests mentioning them
      filtered = filtered.filter(n => {
        const type = n.type || n.metadata?.action || '';
        const isPersonal = n.user_id === user?.id || n.recipient_id === user?.id;
        const isMemberEvent = ['crisis_assigned', 'prayer_request', 'mentorship_assignment', 'foundation_assignment'].includes(type);
        return isPersonal || isMemberEvent;
      });
    } else if (role === 'pastor') {
      // Pastors see: all crisis-related, member milestones, group activities, prayer requests
      filtered = filtered.filter(n => {
        const type = n.type || n.metadata?.action || '';
        const isCrisisRelated = ['crisis_created', 'crisis_assigned', 'crisis_intervention', 'crisis_referral'].includes(type);
        const isChurchLevel = ['member_registered', 'foundation_started', 'baptism_prepared', 'new_leader'].includes(type);
        return isCrisisRelated || isChurchLevel;
      });
    }
    // admin and others see everything

    // Sort by most recent
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });

    // Limit results
    setFilteredNotifications(filtered.slice(0, limit));
  }, [notifications, role, user?.id, limit]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteNotification(id);
      // Remove from local state
      setFilteredNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setDeleting(null);
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (notification) => {
    const type = notification.type || notification.metadata?.action || '';
    const color = notification.read || notification.is_read ? 'inherit' : 'primary';

    switch (type) {
      case 'crisis_assigned':
      case 'crisis_created':
        return <AlertTriangle style={{ color: '#ef4444' }} />;
      case 'prayer_request':
        return <Heart style={{ color: '#ec4899' }} />;
      case 'member_registered':
      case 'baptism_prepared':
        return <Users style={{ color: '#3b82f6' }} />;
      case 'foundation_started':
      case 'foundation_completed':
        return <CheckCircle style={{ color: '#10b981' }} />;
      case 'mentorship_assignment':
      case 'new_leader':
        return <Cross style={{ color: '#8b5cf6' }} />;
      default:
        return <Bell style={{ color: '#6366f1' }} />;
    }
  };

  // Format time ago
  const timeAgo = (dateString) => {
    try {
      const dt = DateTime.fromISO(dateString);
      return dt.toRelative() || 'just now';
    } catch {
      return 'recently';
    }
  };

  // Compact view (just show count and icon)
  if (compact && filteredNotifications.length === 0) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title="Notifications"
          avatar={<Bell size={20} />}
        />
        <CardContent>
          <Typography color="text.secondary" align="center">
            No notifications yet
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Notifications"
        subheader={`${unreadCount} unread`}
        avatar={
          <Badge badgeContent={unreadCount} color="error">
            <Bell size={20} />
          </Badge>
        }
        action={
          onViewAll && (
            <Tooltip title="View all notifications">
              <Button size="small" onClick={onViewAll} endIcon={<ExternalLink size={16} />}>
                View All
              </Button>
            </Tooltip>
          )
        }
      />
      <Divider />
      
      {filteredNotifications.length === 0 ? (
        <CardContent>
          <Typography color="text.secondary" align="center" variant="body2">
            No notifications for your role
          </Typography>
        </CardContent>
      ) : (
        <List sx={{ flexGrow: 1, overflow: 'auto', maxHeight: 400 }}>
          {filteredNotifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider />}
              <ListItem
                sx={{
                  bgcolor: (notification.read || notification.is_read) ? 'transparent' : 'action.hover',
                  alignItems: 'flex-start',
                  pr: 1,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Delete">
                      <IconButton
                        edge="end"
                        size="small"
                        disabled={deleting === notification.id}
                        onClick={() => handleDelete(notification.id)}
                        sx={{ color: 'error.main' }}
                      >
                        {deleting === notification.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}>
                    {getNotificationIcon(notification)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: notification.read || notification.is_read ? 400 : 600 }}
                    >
                      {notification.title}
                    </Typography>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Clock size={12} />
                          {timeAgo(notification.created_at)}
                        </Typography>
                        {notification.type && (
                          <Chip
                            label={notification.type.replace(/_/g, ' ')}
                            size="small"
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                        )}
                      </Box>
                    </Stack>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      {filteredNotifications.length > 0 && (
        <>
          <Divider />
          <CardContent sx={{ py: 1 }}>
            <Button
              fullWidth
              variant="text"
              size="small"
              onClick={onViewAll}
              sx={{ textTransform: 'none' }}
            >
              {filteredNotifications.length < limit ? 'See all notifications' : `View all ${unreadCount + notifications.length} notifications`}
            </Button>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default NotificationWidget;
