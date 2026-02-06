import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Tab,
  Tabs,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Users,
  MapPin,
  AlertCircle,
  TrendingUp,
  Folder,
  Heart
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import NotificationWidget from '../components/NotificationWidget';
import HeroHeader from '../components/dashboard/HeroHeader';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function ZonalPastorDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { fetchWithAuth, user } = useContext(AuthContext);

  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Fetch zonal pastor's zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setLoading(true);
        
        // Try to use zones from user object first (populated during login)
        if (user?.zones && user.zones.length > 0) {
          setZones(user.zones);
          setSelectedZone(user.zones[0]);
        } else {
          // Fall back to fetching if not in user object
          const response = await fetchWithAuth('/api/zones/my-zones');
          if (response && Array.isArray(response)) {
            setZones(response);
            if (response.length > 0) {
              setSelectedZone(response[0]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching zones:', error);
        showSnackbar('Failed to load zones', 'error');
      }
    };
    if (fetchWithAuth) {
      fetchZones();
    }
  }, [fetchWithAuth, user, showSnackbar]);

  // Fetch dashboard data for selected zone
  useEffect(() => {
    if (!selectedZone || !fetchWithAuth) return;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetchWithAuth(`/api/zones/${selectedZone.id}/dashboard`);
        setDashboardData(response);
      } catch (error) {
        console.error('Error fetching zone dashboard:', error);
        showSnackbar('Failed to load zone dashboard', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [selectedZone, fetchWithAuth, showSnackbar]);

  const handleZoneChange = (event, value) => {
    setSelectedZone(zones[value]);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading && !dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!selectedZone || !dashboardData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">No zones assigned to this account yet.</Alert>
      </Container>
    );
  }

  const zone = dashboardData?.zone || selectedZone;
  const metrics = dashboardData?.metrics || {};
  const membersTotal = metrics.members?.total ?? 0;
  const leaders = dashboardData.leaders || [];

  // Metrics cards
  const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <Card sx={{
      height: '100%',
      bgcolor: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
      transition: 'all 0.3s ease',
      '&:hover': {
        bgcolor: 'rgba(255, 255, 255, 0.85)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
        transform: 'translateY(-4px)'
      }
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>
              {value}
            </Typography>
            {subtext && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                {subtext}
              </Typography>
            )}
          </Box>
          <Icon size={40} color={color} opacity={0.3} style={{ flexShrink: 0 }} />
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.02) 0%, rgba(15, 23, 42, 0.05) 100%)',
        borderRadius: 3,
        p: 4,
        mb: 4
      }}>
        {/* Header with zone selection */}
        <HeroHeader
          title="Zonal Dashboard"
          subtitle="Oversight snapshot for your assigned zones"
          icon={<MapPin size={22} />}
        />

        {zones.length > 1 && (
          <Paper sx={{
            mb: 3,
            mt: 3,
            bgcolor: 'rgba(255, 255, 255, 0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Tabs
              value={zones.findIndex(z => z.id === selectedZone?.id)}
              onChange={handleZoneChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            >
              {zones.map((z, idx) => (
                <Tab
                  key={z.id}
                  label={z.name}
                  id={`zone-tab-${idx}`}
                  aria-controls={`zone-panel-${idx}`}
                />
              ))}
            </Tabs>
          </Paper>
        )}

        {/* Zone info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            p: 1.5,
            bgcolor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MapPin size={22} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {zone?.name || 'Zone'}
            </Typography>
            {zone?.description && (
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                {zone.description}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      {/* Main metrics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Folder}
            label="Churches"
            value={zone?.churches?.length || 0}
            color={theme.palette.primary.main}
            subtext="in this zone"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Users}
            label="Members"
            value={metrics.members?.total?.toLocaleString() || 0}
            color={theme.palette.success.main}
            subtext={`${metrics.members?.active || 0} active`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={AlertCircle}
            label="Crisis Cases"
            value={metrics.crisisCases?.total || 0}
            color={theme.palette.warning.main}
            subtext={`${metrics.crisisCases?.critical || 0} critical`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={Heart}
            label="Cell Groups"
            value={metrics.cellGroups?.total || 0}
            color={theme.palette.info.main}
            subtext="zone-wide"
          />
        </Grid>
      </Grid>

      {/* Detailed tabs */}
      <Card sx={{
        bgcolor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)'
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label="Churches" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Leadership" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="Statistics" id="tab-2" aria-controls="tabpanel-2" />
          <Tab label="Notifications" id="tab-3" aria-controls="tabpanel-3" />
        </Tabs>

        {/* Churches Tab */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <List>
              {zone?.churches && zone.churches.length > 0 ? (
                zone.churches.map((church) => (
                  <ListItem
                    key={church.id}
                    onClick={() => navigate(`/church/${church.id}`)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' },
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemText
                      primary={church.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="textPrimary">
                            {church.address}
                          </Typography>
                          {' — '}
                          <Typography component="span" variant="body2" color="textSecondary">
                            {church.members_count || 0} members
                          </Typography>
                        </>
                      }
                    />
                    <Chip
                      label={`${church.cell_groups_count || 0} cell groups`}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                ))
              ) : (
                <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                  No churches in this zone yet
                </Typography>
              )}
            </List>
          </CardContent>
        </TabPanel>

        {/* Leadership Tab */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              Zone Leaders
            </Typography>
            <List>
              {leaders && leaders.length > 0 ? (
                leaders.map((leader) => (
                  <ListItem
                    key={leader.id}
                    sx={{
                      py: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <ListItemText
                      primary={`${leader.first_name} ${leader.surname}`}
                      secondary={
                        <>
                          <Chip
                            label={leader.role || 'Zone Leader'}
                            size="small"
                            sx={{ mr: 1, mt: 0.5 }}
                          />
                          {leader.email && (
                            <Typography component="span" variant="body2" display="block" sx={{ mt: 0.5 }}>
                              {leader.email}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))
              ) : (
                <Typography sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                  No zone leaders assigned
                </Typography>
              )}
            </List>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                Leadership Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Leaders
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {metrics.leaders?.total || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Cell Leaders
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {metrics.leaders?.cellLeaders || 0}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Statistics Tab */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Grid container spacing={3}>
              {/* Members breakdown */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Members Breakdown
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Active Members</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {metrics.members?.active || 0}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      metrics.members?.total
                        ? (metrics.members.active / metrics.members.total) * 100
                        : 0
                    }
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Inactive Members</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {metrics.members?.inactive || 0}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={
                      metrics.members?.total
                        ? (metrics.members.inactive / metrics.members.total) * 100
                        : 0
                    }
                  />
                </Box>

                <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary">
                    Total Members in Zone
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {metrics.members?.total?.toLocaleString() || 0}
                  </Typography>
                </Box>
              </Grid>

              {/* Crisis & giving */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Care & Giving
                </Typography>
                
                <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Active Crisis Cases
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {metrics.crisisCases?.active || 0}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'error.dark' }}>
                    {metrics.crisisCases?.critical || 0} critical
                  </Typography>
                </Box>

                <Box sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Total Giving (YTD)
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ${metrics.giving?.ytd?.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'success.dark' }}>
                    All time: ${metrics.giving?.total?.toFixed(2) || '0.00'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <NotificationWidget role="zonal_pastor" limit={10} />
          </CardContent>
        </TabPanel>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
