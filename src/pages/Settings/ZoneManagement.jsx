import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Autocomplete,
  Snackbar
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';
import { getMembers } from '../../services/memberService';

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

export default function ZoneManagementPage() {
  const { fetchWithAuth, user } = useContext(AuthContext);
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super_Admin';

  const [zones, setZones] = useState([]);
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Zone form
  const [zoneDialog, setZoneDialog] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', region: '' });

  // Church assignment
  const [selectedZone, setSelectedZone] = useState(null);
  const [assignDialog, setAssignDialog] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState(null);

  // Leaders management
  const [leaders, setLeaders] = useState([]);
  const [leadersLoading, setLeadersLoading] = useState(false);
  const [assignLeaderDialog, setAssignLeaderDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [membersList, setMembersList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Fetch zones and churches
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [zonesRes, churchesRes] = await Promise.all([
          fetchWithAuth('/api/zones'),
          fetchWithAuth('/api/lookups/churches')
        ]);

        const zonesData = Array.isArray(zonesRes)
          ? zonesRes
          : (zonesRes && typeof zonesRes.json === 'function' && zonesRes.ok ? await zonesRes.json() : []);
        const churchesData = Array.isArray(churchesRes)
          ? churchesRes
          : (churchesRes && typeof churchesRes.json === 'function' && churchesRes.ok ? await churchesRes.json() : []);

        setZones(zonesData || []);
        setChurches(churchesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        showSnackbar('Failed to load zones and churches', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (fetchWithAuth && isAdmin) {
      fetchData();
    }
  }, [fetchWithAuth, isAdmin, showSnackbar]);

  // Create zone
  const handleCreateZone = async () => {
    if (!zoneForm.name.trim()) {
      showSnackbar('Zone name is required', 'error');
      return;
    }

    try {
      const res = await fetchWithAuth('/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneForm)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create zone');
      }
      const created = await res.json();
      setZones([...zones, created]);
      setZoneForm({ name: '', description: '', region: '' });
      setZoneDialog(false);
      showSnackbar('Zone created successfully', 'success');
    } catch (error) {
      console.error('Error creating zone:', error);
      showSnackbar('Failed to create zone', 'error');
    }
  };

  // Update zone
  const handleUpdateZone = async () => {
    if (!zoneForm.name.trim()) {
      showSnackbar('Zone name is required', 'error');
      return;
    }

    try {
      const res = await fetchWithAuth(`/api/zones/${editingZone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zoneForm)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to update zone');
      }
      const updated = await res.json();
      setZones(zones.map(z => z.id === editingZone.id ? updated : z));
      setZoneForm({ name: '', description: '', region: '' });
      setEditingZone(null);
      setZoneDialog(false);
      showSnackbar('Zone updated successfully', 'success');
    } catch (error) {
      console.error('Error updating zone:', error);
      showSnackbar('Failed to update zone', 'error');
    }
  };

  // Delete zone
  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;

    try {
      const res = await fetchWithAuth(`/api/zones/${zoneId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete zone');
      }
      setZones(zones.filter(z => z.id !== zoneId));
      showSnackbar('Zone deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting zone:', error);
      showSnackbar('Failed to delete zone', 'error');
    }
  };

  // Assign church to zone
  const handleAssignChurch = async () => {
    if (!selectedChurch) {
      showSnackbar('Please select a church', 'error');
      return;
    }
    if (!selectedZone) {
      showSnackbar('Please select a zone first', 'error');
      return;
    }

    try {
      console.log('Assigning church:', selectedChurch.id, 'to zone:', selectedZone.id);
      const res = await fetchWithAuth(`/api/zones/${selectedZone.id}/churches/${selectedChurch.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      console.log('Response status:', res.status, res.ok);
      
      if (!res.ok) {
        let errMsg = 'Failed to assign church to zone';
        try {
          const err = await res.json();
          errMsg = err.message || err.error || errMsg;
        } catch (e) {
          try {
            errMsg = await res.text();
          } catch {}
        }
        console.error('Server error:', errMsg);
        throw new Error(errMsg);
      }
      
      console.log('Church assigned successfully');
      // Update local state
      setChurches(churches.map(c => c.id === selectedChurch.id ? { ...c, zone_id: selectedZone.id } : c));
      setAssignDialog(false);
      setSelectedChurch(null);
      showSnackbar('Church assigned to zone successfully', 'success');
    } catch (error) {
      console.error('Error assigning church:', error);
      showSnackbar(error.message || 'Failed to assign church', 'error');
    }
  };

  // Remove church from zone
  const handleRemoveChurchFromZone = async (churchId) => {
    if (!selectedZone) {
      showSnackbar('Please select a zone first', 'error');
      return;
    }
    
    try {
      console.log('Removing church:', churchId, 'from zone:', selectedZone.id);
      const res = await fetchWithAuth(`/api/zones/${selectedZone.id}/churches/${churchId}/unassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      console.log('Response status:', res.status, res.ok);
      
      if (!res.ok) {
        let errMsg = 'Failed to remove church from zone';
        try {
          const err = await res.json();
          errMsg = err.message || err.error || errMsg;
        } catch (e) {
          try {
            errMsg = await res.text();
          } catch {}
        }
        console.error('Server error:', errMsg);
        throw new Error(errMsg);
      }
      
      console.log('Church removed successfully');
      // Update local state
      setChurches(churches.map(c => c.id === churchId ? { ...c, zone_id: null } : c));
      showSnackbar('Church removed from zone', 'success');
    } catch (error) {
      console.error('Error removing church:', error);
      showSnackbar(error.message || 'Failed to remove church', 'error');
    }
  };

  // --- Leaders helpers ---
  const fetchLeaders = async (zone) => {
    if (!zone) return setLeaders([]);
    setLeadersLoading(true);
    try {
      const res = await fetchWithAuth(`/api/zones/${zone.id}/leaders`);
      if (!res.ok) throw new Error('Failed to load leaders');
      const data = await res.json();
      setLeaders(data || []);
    } catch (err) {
      console.error('Failed to fetch leaders:', err);
      showSnackbar('Failed to load leaders', 'error');
      setLeaders([]);
    } finally {
      setLeadersLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders(selectedZone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone]);

  // Fetch members when assign dialog opens
  useEffect(() => {
    if (!assignLeaderDialog) return;
    let cancelled = false;
    (async () => {
      setMembersLoading(true);
      try {
        const m = await getMembers(fetchWithAuth);
        if (!cancelled) setMembersList(m || []);
      } catch (err) {
        console.error('Failed to load members for leader assignment', err);
        showSnackbar('Failed to load members', 'error');
        if (!cancelled) setMembersList([]);
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignLeaderDialog]);

  const handleAssignLeader = async () => {
    if (!selectedZone) return showSnackbar('Select a zone first', 'error');
    if (!selectedMember) return showSnackbar('Select a member to assign', 'error');
    try {
      const payload = { memberId: selectedMember.id, userId: selectedMember.user_id || null };
      const res = await fetchWithAuth(`/api/zones/${selectedZone.id}/leaders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to assign leader');
      }
      await fetchLeaders(selectedZone);
      setAssignLeaderDialog(false);
      setSelectedMember(null);
      showSnackbar('Leader assigned', 'success');
    } catch (err) {
      console.error('Assign leader failed', err);
      showSnackbar('Failed to assign leader', 'error');
    }
  };

  const handleRemoveLeader = async (memberId) => {
    if (!selectedZone) return;
    if (!window.confirm('Remove this leader from the zone?')) return;
    try {
      const res = await fetchWithAuth(`/api/zones/${selectedZone.id}/leaders/${memberId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to remove leader');
      }
      await fetchLeaders(selectedZone);
      showSnackbar('Leader removed', 'success');
    } catch (err) {
      console.error('Failed to remove leader', err);
      showSnackbar('Failed to remove leader', 'error');
    }
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">You do not have permission to access this page.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const unassignedChurches = churches.filter(c => !c.zone_id);
  const zoneChurches = selectedZone ? churches.filter(c => c.zone_id === selectedZone.id) : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <h1>Zone Management</h1>
        <p>Create and manage zones, assign churches to zones, and manage zone leaders.</p>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Tab label="Zones" id="tab-0" aria-controls="tabpanel-0" />
          <Tab label="Church Assignments" id="tab-1" aria-controls="tabpanel-1" />
          <Tab label="Leaders" id="tab-2" aria-controls="tabpanel-2" />
        </Tabs>

        {/* Zones Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingZone(null);
                setZoneForm({ name: '', description: '', region: '' });
                setZoneDialog(true);
              }}
            >
              Add Zone
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Zone Name</strong></TableCell>
                  <TableCell><strong>Region</strong></TableCell>
                  <TableCell><strong>Description</strong></TableCell>
                  <TableCell><strong>Churches</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {zones.map((zone) => {
                  const zoneChurchCount = churches.filter(c => c.zone_id === zone.id).length;
                  return (
                    <TableRow key={zone.id}>
                      <TableCell>{zone.name}</TableCell>
                      <TableCell>{zone.region || '-'}</TableCell>
                      <TableCell>{zone.description || '-'}</TableCell>
                      <TableCell>
                        <Chip label={`${zoneChurchCount} church${zoneChurchCount !== 1 ? 'es' : ''}`} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingZone(zone);
                            setZoneForm(zone);
                            setZoneDialog(true);
                          }}
                          title="Edit"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteZone(zone.id)}
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {zones.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              No zones created yet. Click "Add Zone" to get started.
            </Box>
          )}
        </TabPanel>

        {/* Church Assignments Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Zone selector */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardHeader title="Select Zone" />
                <CardContent>
                  <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {zones.map((zone) => (
                      <ListItem
                        key={zone.id}
                        button
                        selected={selectedZone?.id === zone.id}
                        onClick={() => setSelectedZone(zone)}
                        sx={{
                          cursor: 'pointer',
                          backgroundColor: selectedZone?.id === zone.id ? 'action.selected' : 'transparent'
                        }}
                      >
                        <ListItemText
                          primary={zone.name}
                          secondary={`${churches.filter(c => c.zone_id === zone.id).length} churches`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Churches in selected zone */}
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader
                  title={selectedZone ? `Churches in ${selectedZone.name}` : 'Select a zone'}
                  action={
                    selectedZone && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setAssignDialog(true)}
                      >
                        Add Church
                      </Button>
                    )
                  }
                />
                <CardContent>
                  {selectedZone ? (
                    <List>
                      {zoneChurches.length > 0 ? (
                        zoneChurches.map((church) => (
                          <ListItem
                            key={church.id}
                            secondaryAction={
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => handleRemoveChurchFromZone(church.id)}
                                color="error"
                              >
                                <RemoveIcon />
                              </IconButton>
                            }
                          >
                            <ListItemText primary={church.name} secondary={church.address} />
                          </ListItem>
                        ))
                      ) : (
                        <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                          No churches assigned to this zone
                        </Box>
                      )}
                    </List>
                  ) : (
                    <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                      Select a zone to view its churches
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Leaders Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title={selectedZone ? `Zone Leaders - ${selectedZone.name}` : 'Select a zone'}
                  action={
                    selectedZone && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => { setSelectedMember(null); setAssignLeaderDialog(true); }}
                      >
                        Assign Leader
                      </Button>
                    )
                  }
                />
                <CardContent>
                  {selectedZone ? (
                    leadersLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                    ) : leaders.length > 0 ? (
                      <List>
                        {leaders.map((leader) => (
                          <ListItem key={leader.member_id} secondaryAction={
                            <IconButton edge="end" size="small" color="error" onClick={() => handleRemoveLeader(leader.member_id)}>
                              <RemoveIcon />
                            </IconButton>
                          }>
                            <ListItemText primary={`${leader.first_name} ${leader.surname}`} secondary={leader.email || ''} />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                        No leaders assigned to this zone
                      </Box>
                    )
                  ) : (
                    <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                      Select a zone to manage leaders
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Zone Dialog */}
      <Dialog open={zoneDialog} onClose={() => setZoneDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingZone ? 'Edit Zone' : 'Create Zone'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Zone Name"
            value={zoneForm.name}
            onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
            margin="normal"
            placeholder="e.g., Northern Region, Eastern Zone"
          />
          <TextField
            fullWidth
            label="Region"
            value={zoneForm.region}
            onChange={(e) => setZoneForm({ ...zoneForm, region: e.target.value })}
            margin="normal"
            placeholder="e.g., North, South, East, West"
          />
          <TextField
            fullWidth
            label="Description"
            value={zoneForm.description}
            onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            placeholder="Describe this zone..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setZoneDialog(false)}>Cancel</Button>
          <Button
            onClick={editingZone ? handleUpdateZone : handleCreateZone}
            variant="contained"
          >
            {editingZone ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Church Assignment Dialog */}
      <Dialog open={assignDialog} onClose={() => setAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Church to {selectedZone?.name}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Autocomplete
            options={unassignedChurches}
            getOptionLabel={(option) => `${option.name} (${option.address || 'N/A'})`}
            value={selectedChurch}
            onChange={(e, val) => setSelectedChurch(val)}
            renderInput={(params) => <TextField {...params} label="Select Church" />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignChurch} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>
      {/* Assign Leader Dialog */}
      <Dialog open={assignLeaderDialog} onClose={() => setAssignLeaderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Leader{selectedZone ? ` - ${selectedZone.name}` : ''}</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={membersList}
            getOptionLabel={(m) => `${m.first_name || ''} ${m.surname || ''} ${m.contact_primary ? `(${m.contact_primary})` : ''}`}
            value={selectedMember}
            onChange={(e, val) => setSelectedMember(val)}
            renderInput={(params) => <TextField {...params} label="Select member" margin="normal" />}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            loading={membersLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignLeaderDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAssignLeader}>Assign</Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
