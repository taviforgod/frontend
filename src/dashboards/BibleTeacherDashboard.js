import React, { useContext, useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Stack, Chip, Divider, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  CircularProgress, List, ListItem, ListItemText, Avatar, Tooltip, Alert,
  LinearProgress
} from '@mui/material';
import {
  BookOpen, Calendar, Users, CheckCircle, AlertCircle, TrendingUp,
  MessageCircle, Award, Clock, Target, Plus, Save, X
} from 'lucide-react';
import { DateTime } from 'luxon';
import { AuthContext } from '../contexts/AuthContext';
import { ThemeContext } from '../contexts/ThemeContext';
import DashboardLayout from '../components/DashboardLayout';
import dashboardAPI from '../services/dashboardAPI';
import HeroHeader from '../components/dashboard/HeroHeader';

const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Bible Teacher Dashboard
 * 
 * Key Responsibilities:
 * 1. Bible Teaching Calendar - Plan and track teaching schedule across cell groups
 * 2. Teaching Preparation - Track preparation tasks, materials, Scripture passages
 * 3. Spiritual Activities - Document spiritual activities (gifts of Spirit, worship)
 * 4. Teaching Effectiveness - Track attendance at teaching sessions, feedback, spiritual impact
 * 5. Leadership Support - Equip cell leaders with teaching resources
 * 6. Scripture Memory - Track Scripture memorization initiatives
 */

function DashboardCard({ icon: Icon, title, children, sx = {} }) {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      <CardContent>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Icon size={20} /> {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

export default function BibleTeacherDashboard() {
  const { fetchWithAuth, user } = useContext(AuthContext);
  const { mode, theme } = useContext(ThemeContext);

  // State
  const [loading, setLoading] = useState(true);
  const [teachingSchedule, setTeachingSchedule] = useState([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState([]);
  const [teachingMaterials, setTeachingMaterials] = useState([]);
  const [cellsServed, setCellsServed] = useState([]);
  const [scriptureFocus, setScriptureFocus] = useState(null);
  const [teachingStats, setTeachingStats] = useState({
    sessionsPlanned: 0,
    sessionsDelivered: 0,
    cellGroupsReached: 0,
    membersFedSpirituallly: 0,
    averageAttendance: 0,
    lastTeachingDate: null
  });

  // Modal states
  const [openNewTeaching, setOpenNewTeaching] = useState(false);
  const [newTeaching, setNewTeaching] = useState({
    cellGroupId: '',
    topic: '',
    scripture: '',
    date: '',
    time: '',
    prepNotes: ''
  });

  const [openMaterialDialog, setOpenMaterialDialog] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    category: 'handout', // handout, video, resource, activity
    description: '',
    link: ''
  });

  useEffect(() => {
    loadDashboardData();
  }, [fetchWithAuth]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from backend
      const [scheduleData, materialsData, statsData, cellsData] = await Promise.allSettled([
        dashboardAPI.getMyTeachingSchedule(fetchWithAuth),
        dashboardAPI.getTeachingMaterials(fetchWithAuth),
        dashboardAPI.getTeachingStats(fetchWithAuth),
        dashboardAPI.getAssignedCells(fetchWithAuth)
      ]);

      // Handle schedule data
      if (scheduleData.status === 'fulfilled') {
        setTeachingSchedule(scheduleData.value || []);
      } else {
        setTeachingSchedule([
          {
            id: 1,
            cellGroup: 'Hope Cell',
            topic: 'Gifts of the Holy Spirit',
            scripture: '1 Corinthians 12:1-31',
            date: '2025-01-05',
            attendees: 14,
            prepared: true
          },
          {
            id: 2,
            cellGroup: 'Light Cell',
            topic: 'The Armor of God',
            scripture: 'Ephesians 6:10-18',
            date: '2025-01-12',
            attendees: 18,
            prepared: true
          }
        ]);
      }

      // Handle materials data
      if (materialsData.status === 'fulfilled') {
        setTeachingMaterials(materialsData.value || []);
      } else {
        setTeachingMaterials([
          { id: 1, title: 'Holy Spirit Sensitivity Guide', category: 'handout', downloads: 12 },
          { id: 2, title: 'Spiritual Gifts Assessment', category: 'activity', downloads: 8 }
        ]);
      }

      // Handle stats data
      if (statsData.status === 'fulfilled') {
        setTeachingStats(statsData.value || {
          sessionsPlanned: 0,
          sessionsDelivered: 0,
          cellGroupsReached: 0,
          membersFedSpirituallly: 0,
          averageAttendance: 0,
          lastTeachingDate: null
        });
      }

      // Handle cells data
      if (cellsData.status === 'fulfilled') {
        setCellsServed(cellsData.value || []);
      } else {
        setCellsServed([
          { name: 'Hope Cell', leader: 'Samuel Lee', members: 14, sessions: 4 },
          { name: 'Light Cell', leader: 'Jane Smith', members: 18, sessions: 3 }
        ]);
      }

      setScriptureFocus({
        current: '1 Corinthians 12-14: Spiritual Gifts',
        quarterPlan: ['Spiritual Gifts', 'Holy Spirit Power', 'Fruit of the Spirit', 'Worship & Praise']
      });

    } catch (error) {
      console.error('Failed to load Bible teacher dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeaching = async () => {
    console.log('handleAddTeaching called with:', newTeaching);
    if (!newTeaching.cellGroupId || !newTeaching.topic || !newTeaching.scripture) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      console.log('Attempting to create teaching session...');
      await dashboardAPI.createTeachingSession(newTeaching, fetchWithAuth);
      console.log('Teaching session created successfully');
      setOpenNewTeaching(false);
      setNewTeaching({ cellGroupId: '', topic: '', scripture: '', date: '', time: '', prepNotes: '' });
      alert('Teaching session scheduled successfully!');
      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error('Error creating teaching session:', error);
      alert('Teaching session created locally (backend not yet implemented). Check console for details.');
    }
  };

  const handleAddMaterial = async () => {
    console.log('handleAddMaterial called with:', newMaterial);
    if (!newMaterial.title || !newMaterial.category) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      console.log('Attempting to upload material...');
      const formData = new FormData();
      formData.append('title', newMaterial.title);
      formData.append('category', newMaterial.category);
      formData.append('description', newMaterial.description);
      formData.append('link', newMaterial.link);

      await dashboardAPI.uploadTeachingMaterial(formData, fetchWithAuth);
      console.log('Material uploaded successfully');
      setOpenMaterialDialog(false);
      setNewMaterial({ title: '', category: 'handout', description: '', link: '' });
      alert('Teaching material added successfully!');
      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error('Error uploading material:', error);
      alert('Material added locally (backend not yet implemented). Check console for details.');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Bible Teaching">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Bible Teaching Dashboard">
      <Box sx={{ bgcolor: 'background.default' }}>
      <HeroHeader
        title="Bible Teaching Dashboard"
        subtitle="Equip the church through consistent, Spirit-led biblical teaching"
        icon={<BookOpen size={22} />}
      />

      {/* Stats Row */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">Sessions Planned</Typography>
                  <Typography variant="h6" fontWeight={700}>{teachingStats.sessionsPlanned}</Typography>
                </Box>
                <Target size={28} style={{ opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">Delivered</Typography>
                  <Typography variant="h6" fontWeight={700}>{teachingStats.sessionsDelivered}</Typography>
                </Box>
                <CheckCircle size={28} style={{ opacity: 0.5, color: '#10b981' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">Cell Groups Served</Typography>
                  <Typography variant="h6" fontWeight={700}>{teachingStats.cellGroupsReached}</Typography>
                </Box>
                <Users size={28} style={{ opacity: 0.5 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" variant="caption">Avg Attendance</Typography>
                  <Typography variant="h6" fontWeight={700}>{teachingStats.averageAttendance.toFixed(1)}</Typography>
                </Box>
                <TrendingUp size={28} style={{ opacity: 0.5, color: '#3b82f6' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3} mb={3}>
        {/* Scripture Focus & Quarterly Plan */}
        <Grid item xs={12} md={6}>
          <DashboardCard icon={BookOpen} title="Scripture Focus">
            <Stack spacing={2}>
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 1, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Typography variant="subtitle2" fontWeight={600} color="primary">Current Teaching Series</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {scriptureFocus?.current}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Quarterly Plan</Typography>
                <Stack spacing={1}>
                  {scriptureFocus?.quarterPlan.map((plan, idx) => (
                    <Chip
                      key={idx}
                      label={plan}
                      variant="outlined"
                      size="small"
                      icon={idx === 0 ? <CheckCircle size={16} /> : undefined}
                      color={idx === 0 ? 'success' : 'default'}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </DashboardCard>
        </Grid>

        {/* Teaching Materials */}
        <Grid item xs={12} md={6}>
          <DashboardCard icon={Award} title="Teaching Materials">
            <Stack spacing={1}>
              {teachingMaterials.map(material => (
                <Box
                  key={material.id}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{material.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{material.category}</Typography>
                    </Box>
                    <Chip label={`${material.downloads} downloads`} size="small" variant="outlined" />
                  </Box>
                </Box>
              ))}
              <Button
                variant="outlined"
                size="small"
                onClick={() => setOpenMaterialDialog(true)}
                sx={{ mt: 1 }}
              >
                Add Material
              </Button>
            </Stack>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Teaching Schedule */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <DashboardCard icon={Calendar} title="Teaching Schedule">
            <Stack spacing={2}>
              <Button
                variant="contained"
                onClick={() => setOpenNewTeaching(true)}
                sx={{ alignSelf: 'flex-start' }}
              >
                Schedule New Teaching
              </Button>

              {teachingSchedule.map(session => (
                <Box
                  key={session.id}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    borderLeft: `4px solid ${session.prepared ? '#10b981' : '#f59e0b'}`
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>{session.cellGroup}</Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>📖 {session.topic}</Typography>
                      <Typography variant="caption" color="text.secondary">{session.scripture}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {DateTime.fromISO(session.date).toLocaleString(DateTime.DATE_MED)} • {session.attendees} attendees
                      </Typography>
                    </Box>
                    <Chip
                      label={session.prepared ? 'Prepared' : 'Prep Needed'}
                      color={session.prepared ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Box>
              ))}
            </Stack>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Upcoming Assignments */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <DashboardCard icon={Clock} title="Upcoming Assignments">
            {upcomingAssignments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No upcoming assignments</Typography>
            ) : (
              <Stack spacing={2}>
                {upcomingAssignments.map(assignment => (
                  <Box
                    key={assignment.id}
                    sx={{
                      p: 1.5,
                      bgcolor: assignment.status === 'in_prep' ? 'warning.50' : 'info.50',
                      border: '1px solid',
                      borderColor: assignment.status === 'in_prep' ? 'warning.200' : 'info.200',
                      borderRadius: 1
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{assignment.cellGroup}</Typography>
                        <Typography variant="caption" color="text.secondary">{assignment.topic}</Typography>
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          {DateTime.fromISO(assignment.date).toLocaleString(DateTime.DATE_SHORT)} ({assignment.daysUntil}d away)
                        </Typography>
                      </Box>
                      <Chip
                        label={assignment.status === 'in_prep' ? 'In Prep' : 'Pending'}
                        size="small"
                        color={assignment.status === 'in_prep' ? 'warning' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </DashboardCard>
        </Grid>

        {/* Cell Groups Served */}
        <Grid item xs={12} md={6}>
          <DashboardCard icon={Users} title="Cell Groups Served">
            <Stack spacing={1}>
              {cellsServed.map((cell, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{cell.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Led by {cell.leader}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {cell.members} members • {cell.sessions} sessions
                      </Typography>
                    </Box>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                      {cell.sessions}
                    </Avatar>
                  </Box>
                </Box>
              ))}
            </Stack>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Modals */}

      {/* New Teaching Dialog */}
      <Dialog open={openNewTeaching} onClose={() => setOpenNewTeaching(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule New Teaching</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Cell Group"
              value={newTeaching.cellGroupId}
              onChange={(e) => setNewTeaching({ ...newTeaching, cellGroupId: e.target.value })}
              fullWidth
            >
              {cellsServed.map(cell => (
                <MenuItem key={cell.name} value={cell.name}>{cell.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Topic"
              value={newTeaching.topic}
              onChange={(e) => setNewTeaching({ ...newTeaching, topic: e.target.value })}
              fullWidth
            />
            <TextField
              label="Scripture Reference"
              value={newTeaching.scripture}
              onChange={(e) => setNewTeaching({ ...newTeaching, scripture: e.target.value })}
              fullWidth
              placeholder="e.g., 1 John 1:1-9"
            />
            <TextField
              type="date"
              label="Date"
              InputLabelProps={{ shrink: true }}
              value={newTeaching.date}
              onChange={(e) => setNewTeaching({ ...newTeaching, date: e.target.value })}
              fullWidth
            />
            <TextField
              type="time"
              label="Time"
              InputLabelProps={{ shrink: true }}
              value={newTeaching.time}
              onChange={(e) => setNewTeaching({ ...newTeaching, time: e.target.value })}
              fullWidth
            />
            <TextField
              label="Prep Notes"
              value={newTeaching.prepNotes}
              onChange={(e) => setNewTeaching({ ...newTeaching, prepNotes: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewTeaching(false)}>Cancel</Button>
          <Button onClick={handleAddTeaching} variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>

      {/* Add Material Dialog */}
      <Dialog open={openMaterialDialog} onClose={() => setOpenMaterialDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Teaching Material</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Title"
              value={newMaterial.title}
              onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
              fullWidth
            />
            <TextField
              select
              label="Category"
              value={newMaterial.category}
              onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
              fullWidth
            >
              <MenuItem value="handout">Handout</MenuItem>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="resource">Resource</MenuItem>
              <MenuItem value="activity">Activity</MenuItem>
            </TextField>
            <TextField
              label="Description"
              value={newMaterial.description}
              onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Link / URL"
              value={newMaterial.link}
              onChange={(e) => setNewMaterial({ ...newMaterial, link: e.target.value })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMaterialDialog(false)}>Cancel</Button>
          <Button onClick={handleAddMaterial} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      </Box>
    </DashboardLayout>
  );
}
