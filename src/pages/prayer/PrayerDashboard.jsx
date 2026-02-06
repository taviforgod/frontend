import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  Box, Typography, Chip, Stack, Paper, Button, Tooltip,
  IconButton, Divider, List, ListItem, ListItemText, ListItemAvatar, Avatar,
  useMediaQuery, Grid, Card, CardContent, LinearProgress, Tab, Tabs,
  FormControl, InputLabel, Select, MenuItem, TextField, InputAdornment,
  Badge, Fab, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  UserPlus, CheckCircle2, PlusCircle, RefreshCcw, Search, Filter,
  TrendingUp, Clock, Users, AlertTriangle, Heart, MessageCircle,
  Phone, Mail, Calendar, Download, Eye, EyeOff, Bell, Archive,
  Church, UserCheck, Activity, BarChart3, PieChart
} from 'lucide-react';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../contexts/AuthContext.js';
import { ThemeContext } from '../../contexts/ThemeContext.js';
import { useNotifications } from '../../hooks/useNotifications';
import { getPrayerRequests, getUrgentCount, assignPrayer, closePrayer } from '../../services/prayerService.js';
import PrayerForm from '../../components/prayer/PrayerForm.jsx';
import MemberSelectDialog from '../../components/prayer/MemberSelectDialog.jsx';
import CloseRequestDialog from '../../components/prayer/CloseRequestDialog.jsx';
import AddFollowupDialog from '../../components/prayer/AddFollowupDialog.jsx';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

export default function PrayerDashboard() {
  const { fetchWithAuth, user } = useContext(AuthContext) || {};
  const notifications = useNotifications();
  const { theme } = useContext(ThemeContext) || {};
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  // Data states
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    closed: 0,
    anonymous: 0,
    thisWeek: 0,
    thisMonth: 0
  });

  // UI states
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list, cards, kanban

  // Filters
  const [filters, setFilters] = useState({
    status: null,
    urgency: null,
    category: null,
    anonymous: null,
    assigned: null,
    dateRange: null
  });

  // Dialogs
  const [memberPicker, setMemberPicker] = useState({ open: false, prayer: null });
  const [closeDialog, setCloseDialog] = useState({ open: false, prayer: null });
  const [followupDialog, setFollowupDialog] = useState({ open: false, prayer: null });
  const [newPrayerDialog, setNewPrayerDialog] = useState(false);

  // Track filter changes for animation
  const [filterChangeKey, setFilterChangeKey] = useState(0);

  useEffect(() => {
    setFilterChangeKey(prev => prev + 1);
  }, [filters, searchQuery]);

  // Load requests
  const load = async (reset = false) => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        offset: reset ? 0 : page * pageSize,
        status: filters.status,
        urgency: filters.urgency,
        category: filters.category,
        search: searchQuery
      };

      let res = await getPrayerRequests(fetchWithAuth, params).catch(err => {
        console.debug('getPrayerRequests error', err);
        return null;
      });

      if (!res) {
        const base = process.env.REACT_APP_API_URL || '';
        const endpoints = [`${base}/api/prayer`, `${base}/api/prayer/requests`];
        for (const u of endpoints) {
          try {
            const qs = new URLSearchParams(params).toString();
            const url = `${u}${qs ? '?' + qs + '&' : '?'}ts=${Date.now()}`;
            const r = fetchWithAuth
              ? await fetchWithAuth(url, { method: 'GET', credentials: 'include' })
              : await fetch(url, { method: 'GET', credentials: 'include' });
            if (r && r.ok) {
              try { res = await r.json(); break; } catch (e) { res = null; }
            }
          } catch (e) {
            console.debug('fallback prayer fetch error', e);
          }
        }
      }

      const data = Array.isArray(res) ? res : (res?.rows ?? res?.data ?? res?.results ?? []);
      setRows(prev => reset ? data : [...(prev || []), ...data]);
      setTotal(res?.total ?? data.length);

      // Calculate stats
      const newStats = {
        total: data.length,
        open: data.filter(r => r.status === 'open').length,
        inProgress: data.filter(r => r.status === 'in_progress').length,
        closed: data.filter(r => r.status === 'closed').length,
        anonymous: data.filter(r => r.anonymous).length,
        thisWeek: data.filter(r => {
          const created = DateTime.fromISO(r.created_at);
          return created >= DateTime.now().minus({ weeks: 1 });
        }).length,
        thisMonth: data.filter(r => {
          const created = DateTime.fromISO(r.created_at);
          return created >= DateTime.now().minus({ months: 1 });
        }).length
      };
      setStats(newStats);

      const u = await getUrgentCount(fetchWithAuth);
      setUrgentCount(u?.urgent_open || 0);
    } catch (err) {
      console.error('Failed to load prayer requests', err);
      notifications.error('Failed to load prayer requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, [filters, pageSize, searchQuery]);

  // Filtered and searched data
  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      const matchesSearch = !searchQuery || 
        r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.first_name && r.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.surname && r.surname.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesFilters = 
        (!filters.status || r.status === filters.status) &&
        (!filters.urgency || r.urgency === filters.urgency) &&
        (!filters.category || r.category === filters.category) &&
        (filters.anonymous === null || r.anonymous === filters.anonymous) &&
        (!filters.assigned || (filters.assigned === 'assigned' ? r.assigned_to : !r.assigned_to));

      return matchesSearch && matchesFilters;
    });
  }, [rows, filters, searchQuery]);

  // Tab data
  const tabData = useMemo(() => {
    const all = filteredRows;
    const open = all.filter(r => r.status === 'open');
    const inProgress = all.filter(r => r.status === 'in_progress');
    const urgent = all.filter(r => r.urgency === 'urgent' || r.urgency === 'High');
    const anonymous = all.filter(r => r.anonymous);
    
    return [
      { label: 'All Requests', count: all.length, data: all },
      { label: 'Open', count: open.length, data: open },
      { label: 'In Progress', count: inProgress.length, data: inProgress },
      { label: 'Urgent', count: urgent.length, data: urgent },
      { label: 'Anonymous', count: anonymous.length, data: anonymous }
    ];
  }, [filteredRows]);

  const currentData = tabData[currentTab]?.data || [];

  // Actions
  const handleAssign = (prayer) => setMemberPicker({ open: true, prayer });
  const handleCloseReq = (prayer) => setCloseDialog({ open: true, prayer });
  const handleAddFollowup = (prayer) => setFollowupDialog({ open: true, prayer });

  const onMemberSelected = async (member) => {
    if (!member) return setMemberPicker({ open: false, prayer: null });
    try {
      const ids = Array.isArray(memberPicker.prayer.id) ? memberPicker.prayer.id : [memberPicker.prayer.id];
      for (const id of ids) {
        await assignPrayer(fetchWithAuth, id, member.member_id ?? member.id ?? member);
      }
      notifications.success('Assigned successfully');
      setMemberPicker({ open: false, prayer: null });
      load(true);
    } catch (err) {
      console.error(err);
      notifications.error(err?.message || 'Assign failed');
    }
  };

  const onClosed = async () => {
    setCloseDialog({ open: false, prayer: null });
    notifications.success('Request closed');
    load(true);
  };

  const onFollowupAdded = async () => {
    setFollowupDialog({ open: false, prayer: null });
    notifications.success('Follow-up added');
    load(true);
  };

  const onPrayerSubmitted = () => {
    setNewPrayerDialog(false);
    notifications.modules.prayers.added();
    load(true);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prayers');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'prayers.xlsx');
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ 
        height: '100%', 
        background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
        border: `1px solid ${color}30`,
        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
        transition: 'all 0.3s ease'
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 2, 
              background: color,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </Box>
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
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, maxWidth: '100%' }}>
      {/* Header */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
        spacing={isMobile ? 2 : 0}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Heart size={isMobile ? 24 : 32} />
            Prayer & Counseling Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage prayer requests, counseling, and follow-ups
          </Typography>
        </Box>

        <Stack direction={isMobile ? 'column' : 'row'} spacing={1} alignItems="center">
          <Button
            variant="contained"
            startIcon={<PlusCircle />}
            onClick={() => setNewPrayerDialog(true)}
            fullWidth={isMobile}
          >
            New Request
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport}
            fullWidth={isMobile}
          >
            Export
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={() => load(true)}>
              <RefreshCcw size={20} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Stats Cards */}
      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Requests"
                value={stats.total}
                icon={<Heart size={20} />}
                color="#1976d2"
                subtitle={`+${stats.thisWeek} this week`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Open Requests"
                value={stats.open}
                icon={<Clock size={20} />}
                color="#f59e0b"
                subtitle={`${urgentCount} urgent`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="In Progress"
                value={stats.inProgress}
                icon={<Activity size={20} />}
                color="#8b5cf6"
                subtitle="Being handled"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Anonymous"
                value={stats.anonymous}
                icon={<EyeOff size={20} />}
                color="#6b7280"
                subtitle="Privacy protected"
              />
            </Grid>
          </Grid>
        </motion.div>
      )}

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search requests..."
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
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status || ''}
                onChange={(e) => setFilters(f => ({ ...f, status: e.target.value || null }))}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Urgency</InputLabel>
              <Select
                value={filters.urgency || ''}
                onChange={(e) => setFilters(f => ({ ...f, urgency: e.target.value || null }))}
                label="Urgency"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value || null }))}
                label="Category"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="prayer">Prayer</MenuItem>
                <MenuItem value="counseling">Counseling</MenuItem>
                <MenuItem value="both">Both</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              startIcon={<Filter />}
              onClick={() => setFilters({ status: null, urgency: null, category: null, anonymous: null, assigned: null })}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : false}
        >
          {tabData.map((tab, index) => (
            <Tab
              key={index}
              label={
                <Badge badgeContent={tab.count} color="primary" showZero={false}>
                  <Typography variant="body2">{tab.label}</Typography>
                </Badge>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2, height: { xs: 'auto', md: '70vh' }, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Prayer List */}
        <Paper sx={{
          flex: 1.2,
          borderRadius: 2,
          overflow: 'auto',
          minWidth: isMobile ? 'auto' : 350,
          maxWidth: isMobile ? '100%' : 500
        }}>
          {loading && <LinearProgress />}
          <List>
            <AnimatePresence initial={false}>
              {currentData.map(row => {
                const isSelected = selectedPrayer?.id === row.id;
                return (
                  <motion.div
                    key={`${row.id}-${filterChangeKey}`}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isSelected ? 1.02 : 1,
                      backgroundColor: isSelected ? 'rgba(25,118,210,0.08)' : 'rgba(255,255,255,0)',
                    }}
                    whileHover={{ scale: 1.03, boxShadow: '0px 4px 15px rgba(0,0,0,0.1)' }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    style={{ borderRadius: 8 }}
                  >
                    <ListItem 
                      button 
                      selected={isSelected} 
                      onClick={() => setSelectedPrayer(row)} 
                      sx={{ alignItems: 'flex-start', py: 1.5, px: 2 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 48, height: 48 }}>
                          {row.anonymous ? 'A' : (row.first_name || row.assigned_first_name || '?')[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
                            {row.request_no || `#${row.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.category}
                          </Typography>
                          {row.anonymous && (
                            <Chip label="Anonymous" size="small" color="default" variant="outlined" />
                          )}
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {row.anonymous ? 'Submitted anonymously' : (row.first_name && row.surname ? `${row.first_name} ${row.surname}` : 'Unknown member')}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Chip 
                            label={row.urgency || 'Normal'} 
                            color={row.urgency === 'urgent' || row.urgency === 'High' ? 'error' : 'primary'} 
                            size="small" 
                          />
                          <Chip 
                            label={row.status || 'Open'} 
                            color={row.status === 'open' ? 'success' : 'default'} 
                            size="small" 
                          />
                          {row.assigned_first_name && (
                            <Chip label={`Assigned: ${row.assigned_first_name}`} color="info" size="small" />
                          )}
                        </Box>
                        {row.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            {row.description.substring(0, 100)}{row.description.length > 100 ? '...' : ''}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </List>

          {currentData.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No prayer requests found matching your criteria
              </Typography>
            </Box>
          )}

          {/* Load more */}
          {rows.length < total && (
            <Box sx={{ p: 2 }}>
              <Button fullWidth variant="outlined" onClick={() => setPage(p => p + 1)} disabled={loading}>
                {loading ? 'Loading...' : 'Load more'}
              </Button>
            </Box>
          )}
        </Paper>

        {/* Preview Panel */}
        <Paper sx={{ 
          p: 2, 
          minHeight: { xs: 'auto', md: '70vh' }, 
          overflowY: 'auto', 
          borderRadius: 2, 
          flex: 1,
          boxShadow: 2 
        }}>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Eye size={20} />
            Request Details
          </Typography>
          
          {selectedPrayer ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Request Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6">
                    {selectedPrayer.request_no || `#${selectedPrayer.id}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedPrayer.category}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedPrayer.created_at ? DateTime.fromISO(selectedPrayer.created_at).toLocaleString(DateTime.DATETIME_MED) : ''}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Tooltip title="Assign">
                    <IconButton onClick={() => handleAssign(selectedPrayer)}>
                      <UserPlus size={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Close">
                    <IconButton onClick={() => handleCloseReq(selectedPrayer)}>
                      <CheckCircle2 size={20} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add follow-up">
                    <IconButton onClick={() => handleAddFollowup(selectedPrayer)}>
                      <PlusCircle size={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Status Chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip 
                  label={`Urgency: ${selectedPrayer.urgency || 'Normal'}`} 
                  color={selectedPrayer.urgency === 'urgent' || selectedPrayer.urgency === 'High' ? 'error' : 'primary'} 
                />
                <Chip 
                  label={`Status: ${selectedPrayer.status || 'Open'}`} 
                  color={selectedPrayer.status === 'open' ? 'success' : 'default'} 
                />
                <Chip label={`Category: ${selectedPrayer.category}`} />
                {selectedPrayer.assigned_first_name && (
                  <Chip label={`Assigned: ${selectedPrayer.assigned_first_name}`} color="info" />
                )}
                {selectedPrayer.anonymous && (
                  <Chip label="Anonymous" color="default" variant="outlined" />
                )}
              </Box>

              {/* Description */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Description</Typography>
              <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {selectedPrayer.description || 'No description provided.'}
              </Typography>

              {/* Submitted By */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Submitted by</Typography>
              <Typography sx={{ mb: 2 }}>
                {selectedPrayer.anonymous ? 'Anonymous' : (selectedPrayer.first_name && selectedPrayer.surname ? `${selectedPrayer.first_name} ${selectedPrayer.surname}` : 'Unknown member')}
              </Typography>

              {/* Contact Info */}
              {selectedPrayer.contact_details && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Contact Information</Typography>
                  <Typography sx={{ mb: 2 }}>
                    {typeof selectedPrayer.contact_details === 'string' 
                      ? selectedPrayer.contact_details 
                      : JSON.stringify(selectedPrayer.contact_details)}
                  </Typography>
                </>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Follow-ups */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Follow-ups ({selectedPrayer.followups?.length || 0})
              </Typography>
              {selectedPrayer.followups?.length ? (
                <Box sx={{ mb: 2 }}>
                  {selectedPrayer.followups.map(f => (
                    <Box key={f.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">{f.note}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {f.contacted_at ? DateTime.fromISO(f.contacted_at).toLocaleString(DateTime.DATETIME_MED) : ''}
                        {f.method && ` • ${f.method}`}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary" sx={{ mb: 2 }}>No follow-ups</Typography>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Audit Trail */}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Audit Trail ({selectedPrayer.audit?.length || 0})
              </Typography>
              {selectedPrayer.audit?.length ? (
                <Box>
                  {selectedPrayer.audit.map(a => (
                    <Box key={a.id} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">{a.action}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {a.created_at ? DateTime.fromISO(a.created_at).toLocaleString(DateTime.DATETIME_MED) : ''}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography color="text.secondary">No audit trail</Typography>
              )}
            </motion.div>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '60%',
              textAlign: 'center'
            }}>
              <Eye size={48} color="text.secondary" sx={{ mb: 2 }} />
              <Typography color="text.secondary">
                Select a prayer request to view details
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Floating Action Button for new prayer */}
      <Fab
        color="primary"
        aria-label="add prayer request"
        onClick={() => setNewPrayerDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' }
        }}
      >
        <PlusCircle />
      </Fab>

      {/* Dialogs */}
      <Dialog open={newPrayerDialog} onClose={() => setNewPrayerDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submit New Prayer Request</DialogTitle>
        <DialogContent>
          <PrayerForm onSuccess={onPrayerSubmitted} onClose={() => setNewPrayerDialog(false)} showTitle={false} />
        </DialogContent>
      </Dialog>

      <MemberSelectDialog open={memberPicker.open} onClose={onMemberSelected} preselectedId={null} preferredRole="pastor" />
      <CloseRequestDialog open={closeDialog.open} prayer={closeDialog.prayer} onClose={() => setCloseDialog({ open: false, prayer: null })} onClosed={onClosed} />
      <AddFollowupDialog open={followupDialog.open} prayer={followupDialog.prayer} onClose={() => setFollowupDialog({ open: false, prayer: null })} onAdded={onFollowupAdded} />
    </Box>
  );
}
