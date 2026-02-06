import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, Grid, Card, CardContent, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, Autocomplete, Checkbox,
  FormControlLabel, Alert, Avatar, List, ListItem, ListItemText,
  ListItemAvatar, Divider, Calendar
} from '@mui/material';
import {
  Celebration, Event, Cake, School, Star, ExpandMore, Add, Edit,
  Person, CalendarMonth, MilitaryTech, Timeline, EmojiEvents, Opacity
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';
import { useNotifications } from '../hooks/useNotifications';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const CelebrationsEvents = () => {
  const { fetchWithAuth } = useContext(AuthContext);
  const notifications = useNotifications();
  const [celebrations, setCelebrations] = useState([]);
  const [specialDates, setSpecialDates] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Dialog states
  const [celebrationDialogOpen, setCelebrationDialogOpen] = useState(false);
  const [specialDateDialogOpen, setSpecialDateDialogOpen] = useState(false);
  const [achievementDialogOpen, setAchievementDialogOpen] = useState(false);

  // Form states
  const [celebrationForm, setCelebrationForm] = useState({
    title: '',
    description: '',
    event_type: 'birthday',
    event_date: new Date(),
    is_recurring: false,
    recurrence_pattern: '',
    primary_member: '',
    secondary_member: '',
    involved_members: [],
    celebration_theme: '',
    planned_activities: '',
    coordinator: '',
    budget_allocated: ''
  });

  const [specialDateForm, setSpecialDateForm] = useState({
    member_id: '',
    date_type: 'birthday',
    special_date: new Date(),
    description: '',
    wants_celebration: true,
    celebration_preferences: '',
    gift_suggestions: '',
    dietary_restrictions: ''
  });

  const [achievementForm, setAchievementForm] = useState({
    member_id: '',
    achievement_type: 'spiritual',
    title: '',
    description: '',
    achievement_date: new Date(),
    significance_level: 'personal',
    recognition_given: '',
    impact_description: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        celebrationsRes,
        specialDatesRes,
        achievementsRes,
        membersRes,
        statsRes,
        upcomingRes
      ] = await Promise.all([
        fetchWithAuth('/api/celebrations/events'),
        fetchWithAuth('/api/celebrations/special-dates'),
        fetchWithAuth('/api/celebrations/achievements'),
        fetchWithAuth('/api/members?limit=1000'),
        fetchWithAuth('/api/celebrations/stats/overview'),
        fetchWithAuth('/api/celebrations/upcoming/list?days=30')
      ]);

      const celebrationsData = celebrationsRes.ok ? await celebrationsRes.json() : [];
      const specialDatesData = specialDatesRes.ok ? await specialDatesRes.json() : [];
      const achievementsData = achievementsRes.ok ? await achievementsRes.json() : [];
      const membersData = membersRes.ok ? await membersRes.json() : [];
      const statsData = statsRes.ok ? await statsRes.json() : null;
      const upcomingData = upcomingRes.ok ? await upcomingRes.json() : [];

      setCelebrations(celebrationsData);
      setSpecialDates(specialDatesData);
      setAchievements(achievementsData);
      setMembers(membersData);
      setStats(statsData);
      setUpcomingEvents(upcomingData);

    } catch (err) {
      console.error('Failed to load celebrations data:', err);
      notifications.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCelebration = async () => {
    try {
      const response = await fetchWithAuth('/api/celebrations/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(celebrationForm)
      });

      if (!response.ok) throw new Error('Failed to create celebration event');

      setCelebrationDialogOpen(false);
      setCelebrationForm({
        title: '', description: '', event_type: 'birthday', event_date: new Date(),
        is_recurring: false, recurrence_pattern: '', primary_member: '', secondary_member: '',
        involved_members: [], celebration_theme: '', planned_activities: '', coordinator: '',
        budget_allocated: ''
      });
      loadData();
      notifications.success('Celebration event created successfully');
    } catch (err) {
      console.error('Failed to create celebration:', err);
      notifications.error('Failed to create celebration event');
    }
  };

  const handleCreateSpecialDate = async () => {
    try {
      const response = await fetchWithAuth('/api/celebrations/special-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specialDateForm)
      });

      if (!response.ok) throw new Error('Failed to record special date');

      setSpecialDateDialogOpen(false);
      setSpecialDateForm({
        member_id: '', date_type: 'birthday', special_date: new Date(),
        description: '', wants_celebration: true, celebration_preferences: '',
        gift_suggestions: '', dietary_restrictions: ''
      });
      loadData();
      notifications.success('Special date recorded successfully');
    } catch (err) {
      console.error('Failed to create special date:', err);
      notifications.error('Failed to record special date');
    }
  };

  const handleCreateAchievement = async () => {
    try {
      const response = await fetchWithAuth('/api/celebrations/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(achievementForm)
      });

      if (!response.ok) throw new Error('Failed to record achievement');

      setAchievementDialogOpen(false);
      setAchievementForm({
        member_id: '', achievement_type: 'spiritual', title: '', description: '',
        achievement_date: new Date(), significance_level: 'personal',
        recognition_given: '', impact_description: ''
      });
      loadData();
      notifications.success('Achievement recorded successfully');
    } catch (err) {
      console.error('Failed to create achievement:', err);
      notifications.error('Failed to record achievement');
    }
  };

  const getEventTypeIcon = (eventType) => {
    const icons = {
      birthday: <Cake />,
      wedding_anniversary: <Celebration />,
      salvation_anniversary: <Star />,
      baptism_anniversary: <Opacity />,
      graduation: <School />,
      leadership_milestone: <MilitaryTech />,
      ministry_achievement: <EmojiEvents />,
      other: <Event />
    };
    return icons[eventType] || <Event />;
  };

  const getEventTypeColor = (eventType) => {
    const colors = {
      birthday: 'primary',
      wedding_anniversary: 'secondary',
      salvation_anniversary: 'success',
      baptism_anniversary: 'info',
      graduation: 'warning',
      leadership_milestone: 'error',
      ministry_achievement: 'success',
      other: 'default'
    };
    return colors[eventType] || 'default';
  };

  if (loading && celebrations.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          Celebrations & Events Tracker
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Celebrate milestones, track special dates, and recognize achievements
        </Typography>

        {/* Stats Cards */}
        {stats && (
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary.main">
                    {stats.total_events}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Celebration Events
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="secondary.main">
                    {stats.total_special_dates}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Special Dates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {stats.total_achievements}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Achievements
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {stats.completed_events}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed Events
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Action Buttons */}
        <Box display="flex" gap={2} mb={3}>
          <Button
            variant="contained"
            startIcon={<Celebration />}
            onClick={() => setCelebrationDialogOpen(true)}
          >
            Plan Celebration
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarMonth />}
            onClick={() => setSpecialDateDialogOpen(true)}
          >
            Add Special Date
          </Button>
          <Button
            variant="outlined"
            startIcon={<MilitaryTech />}
            onClick={() => setAchievementDialogOpen(true)}
          >
            Record Achievement
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Upcoming Events" />
            <Tab label="Celebration Events" />
            <Tab label="Special Dates" />
            <Tab label="Achievements" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upcoming Celebrations & Events (Next 30 Days)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Stay ahead of upcoming celebrations and special occasions
            </Typography>

            <Grid container spacing={3}>
              {upcomingEvents.map((event, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {getEventTypeIcon(event.event_type)}
                        <Box>
                          <Typography variant="h6">{event.event_title}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {event.person_name} • {new Date(event.event_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Chip
                          label={event.type}
                          color={event.type === 'celebration' ? 'primary' : 'secondary'}
                          size="small"
                        />
                      </Box>

                      {event.description && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {event.description}
                        </Typography>
                      )}

                      <Typography variant="caption" color="text.secondary">
                        {Math.ceil((new Date(event.event_date) - new Date()) / (1000 * 60 * 60 * 24))} days away
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}

              {upcomingEvents.length === 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" align="center" color="text.secondary">
                        No upcoming events in the next 30 days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            {celebrations.map((celebration) => (
              <Grid item xs={12} md={6} key={celebration.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {celebration.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {celebration.description}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        {getEventTypeIcon(celebration.event_type)}
                        <Chip
                          label={celebration.planning_status}
                          color={celebration.planning_status === 'completed' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" gutterBottom>
                      <strong>Date:</strong> {new Date(celebration.event_date).toLocaleDateString()}
                    </Typography>

                    {celebration.primary_first_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Celebrant:</strong> {celebration.primary_first_name} {celebration.primary_surname}
                      </Typography>
                    )}

                    {celebration.coordinator_first_name && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Coordinator:</strong> {celebration.coordinator_first_name} {celebration.coordinator_surname}
                      </Typography>
                    )}

                    {celebration.budget_allocated && (
                      <Typography variant="body2" gutterBottom>
                        <strong>Budget:</strong> ${celebration.budget_allocated}
                      </Typography>
                    )}

                    <Box display="flex" gap={1} mt={2}>
                      <Button size="small" startIcon={<Edit />}>
                        Update
                      </Button>
                      <Button size="small" startIcon={<Timeline />}>
                        View Details
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Special Dates & Anniversaries
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Track birthdays, anniversaries, and other important dates
            </Typography>

            <Grid container spacing={3}>
              {specialDates.map((date) => (
                <Grid item xs={12} md={6} lg={4} key={date.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        <Avatar>
                          {date.first_name?.[0]}{date.surname?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {date.first_name} {date.surname}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {date.date_type.replace('_', ' ')}
                          </Typography>
                        </Box>
                        {getEventTypeIcon(date.date_type)}
                      </Box>

                      <Typography variant="body2" gutterBottom>
                        <strong>Date:</strong> {new Date(date.special_date).toLocaleDateString()}
                      </Typography>

                      {date.description && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {date.description}
                        </Typography>
                      )}

                      <Typography variant="body2" gutterBottom>
                        <strong>Celebration:</strong> {date.wants_celebration ? 'Yes' : 'No'}
                      </Typography>

                      <Box display="flex" gap={1} mt={2}>
                        <Button size="small" startIcon={<Edit />}>
                          Update
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {tabValue === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Achievements & Milestones
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Recognize and celebrate member achievements and spiritual growth
            </Typography>

            <Grid container spacing={3}>
              {achievements.map((achievement) => (
                <Grid item xs={12} md={6} key={achievement.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {achievement.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {achievement.description}
                          </Typography>
                        </Box>
                        <MilitaryTech color="primary" />
                      </Box>

                      <Typography variant="body2" gutterBottom>
                        <strong>Recipient:</strong> {achievement.first_name} {achievement.surname}
                      </Typography>

                      <Typography variant="body2" gutterBottom>
                        <strong>Type:</strong> {achievement.achievement_type}
                      </Typography>

                      <Typography variant="body2" gutterBottom>
                        <strong>Date:</strong> {new Date(achievement.achievement_date).toLocaleDateString()}
                      </Typography>

                      <Typography variant="body2" gutterBottom>
                        <strong>Significance:</strong> {achievement.significance_level}
                      </Typography>

                      {achievement.recognition_given && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Recognition:</strong> {achievement.recognition_given}
                        </Typography>
                      )}

                      <Box display="flex" gap={1} mt={2}>
                        <Button size="small" startIcon={<Edit />}>
                          Update
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Create Celebration Dialog */}
        <Dialog
          open={celebrationDialogOpen}
          onClose={() => setCelebrationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Plan Celebration Event</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Event Title"
                  value={celebrationForm.title}
                  onChange={(e) => setCelebrationForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={celebrationForm.description}
                  onChange={(e) => setCelebrationForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Event Type</InputLabel>
                  <Select
                    value={celebrationForm.event_type}
                    label="Event Type"
                    onChange={(e) => setCelebrationForm(prev => ({ ...prev, event_type: e.target.value }))}
                  >
                    <MenuItem value="birthday">Birthday</MenuItem>
                    <MenuItem value="wedding_anniversary">Wedding Anniversary</MenuItem>
                    <MenuItem value="salvation_anniversary">Salvation Anniversary</MenuItem>
                    <MenuItem value="baptism_anniversary">Baptism Anniversary</MenuItem>
                    <MenuItem value="graduation">Graduation</MenuItem>
                    <MenuItem value="leadership_milestone">Leadership Milestone</MenuItem>
                    <MenuItem value="ministry_achievement">Ministry Achievement</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Event Date"
                  value={celebrationForm.event_date}
                  onChange={(date) => setCelebrationForm(prev => ({ ...prev, event_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === celebrationForm.primary_member) || null}
                  onChange={(event, newValue) => {
                    setCelebrationForm(prev => ({
                      ...prev,
                      primary_member: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Primary Celebrant" placeholder="Select primary celebrant..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === celebrationForm.coordinator) || null}
                  onChange={(event, newValue) => {
                    setCelebrationForm(prev => ({
                      ...prev,
                      coordinator: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Event Coordinator" placeholder="Select coordinator..." fullWidth />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Budget Allocated (Optional)"
                  value={celebrationForm.budget_allocated}
                  onChange={(e) => setCelebrationForm(prev => ({ ...prev, budget_allocated: e.target.value }))}
                  InputProps={{ startAdornment: '$' }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={celebrationForm.is_recurring}
                      onChange={(e) => setCelebrationForm(prev => ({ ...prev, is_recurring: e.target.checked }))}
                    />
                  }
                  label="Recurring Event"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Celebration Theme (Optional)"
                  value={celebrationForm.celebration_theme}
                  onChange={(e) => setCelebrationForm(prev => ({ ...prev, celebration_theme: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Planned Activities (Optional)"
                  value={celebrationForm.planned_activities}
                  onChange={(e) => setCelebrationForm(prev => ({ ...prev, planned_activities: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCelebrationDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCelebration} variant="contained">
              Create Event
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Special Date Dialog */}
        <Dialog
          open={specialDateDialogOpen}
          onClose={() => setSpecialDateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Add Special Date</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === specialDateForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setSpecialDateForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" placeholder="Select member..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Date Type</InputLabel>
                  <Select
                    value={specialDateForm.date_type}
                    label="Date Type"
                    onChange={(e) => setSpecialDateForm(prev => ({ ...prev, date_type: e.target.value }))}
                  >
                    <MenuItem value="birthday">Birthday</MenuItem>
                    <MenuItem value="wedding_anniversary">Wedding Anniversary</MenuItem>
                    <MenuItem value="salvation_anniversary">Salvation Anniversary</MenuItem>
                    <MenuItem value="baptism_anniversary">Baptism Anniversary</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Special Date"
                  value={specialDateForm.special_date}
                  onChange={(date) => setSpecialDateForm(prev => ({ ...prev, special_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Description (Optional)"
                  value={specialDateForm.description}
                  onChange={(e) => setSpecialDateForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={specialDateForm.wants_celebration}
                      onChange={(e) => setSpecialDateForm(prev => ({ ...prev, wants_celebration: e.target.checked }))}
                    />
                  }
                  label="Wants to celebrate this date"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Celebration Preferences (Optional)"
                  value={specialDateForm.celebration_preferences}
                  onChange={(e) => setSpecialDateForm(prev => ({ ...prev, celebration_preferences: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSpecialDateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateSpecialDate} variant="contained">
              Add Special Date
            </Button>
          </DialogActions>
        </Dialog>

        {/* Record Achievement Dialog */}
        <Dialog
          open={achievementDialogOpen}
          onClose={() => setAchievementDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Record Achievement</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Autocomplete
                  options={members}
                  getOptionLabel={(option) =>
                    `${option.first_name} ${option.surname}`
                  }
                  value={members.find(m => m.id === achievementForm.member_id) || null}
                  onChange={(event, newValue) => {
                    setAchievementForm(prev => ({
                      ...prev,
                      member_id: newValue ? newValue.id : ''
                    }));
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Member" placeholder="Select member..." fullWidth required />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Achievement Title"
                  value={achievementForm.title}
                  onChange={(e) => setAchievementForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description"
                  value={achievementForm.description}
                  onChange={(e) => setAchievementForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Achievement Type</InputLabel>
                  <Select
                    value={achievementForm.achievement_type}
                    label="Achievement Type"
                    onChange={(e) => setAchievementForm(prev => ({ ...prev, achievement_type: e.target.value }))}
                  >
                    <MenuItem value="spiritual">Spiritual Growth</MenuItem>
                    <MenuItem value="leadership">Leadership</MenuItem>
                    <MenuItem value="service">Service</MenuItem>
                    <MenuItem value="graduation">Graduation</MenuItem>
                    <MenuItem value="ministry">Ministry</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Significance Level</InputLabel>
                  <Select
                    value={achievementForm.significance_level}
                    label="Significance Level"
                    onChange={(e) => setAchievementForm(prev => ({ ...prev, significance_level: e.target.value }))}
                  >
                    <MenuItem value="personal">Personal</MenuItem>
                    <MenuItem value="cell_group">Cell Group</MenuItem>
                    <MenuItem value="church">Church</MenuItem>
                    <MenuItem value="community">Community</MenuItem>
                    <MenuItem value="regional">Regional</MenuItem>
                    <MenuItem value="national">National</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Achievement Date"
                  value={achievementForm.achievement_date}
                  onChange={(date) => setAchievementForm(prev => ({ ...prev, achievement_date: date }))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Recognition Given (Optional)"
                  value={achievementForm.recognition_given}
                  onChange={(e) => setAchievementForm(prev => ({ ...prev, recognition_given: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Impact Description (Optional)"
                  value={achievementForm.impact_description}
                  onChange={(e) => setAchievementForm(prev => ({ ...prev, impact_description: e.target.value }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAchievementDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAchievement} variant="contained">
              Record Achievement
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
};

export default CelebrationsEvents;