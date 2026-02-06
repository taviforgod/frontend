import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Container,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { AuthContext } from '../../contexts/AuthContext';

export default function ZoneSettings() {
  const { fetchWithAuth, user } = useContext(AuthContext);
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super_Admin';

  const [zones, setZones] = useState([]);
  const [churches, setChurches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const [zoneDialog, setZoneDialog] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [zoneForm, setZoneForm] = useState({ name: '', description: '', region: '' });

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const loadData = useCallback(async () => {
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
    } catch (err) {
      console.error('ZoneSettings loadData error', err);
      showSnackbar('Failed to load zones and churches', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth, showSnackbar]);

  useEffect(() => {
    if (fetchWithAuth && isAdmin) loadData();
  }, [fetchWithAuth, isAdmin, loadData]);

  const zonesById = useMemo(() => {
    const map = new Map();
    if (Array.isArray(zones)) zones.forEach(z => map.set(z.id, z));
    return map;
  }, [zones]);

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
        let errMsg = 'Failed to create zone';
        try {
          const err = await res.json();
          errMsg = err.message || err.error || errMsg;
        } catch (e) {
          try { const txt = await res.text(); if (txt) errMsg = txt; } catch {}
        }
        console.error('ZoneSettings create zone server error', res.status, errMsg);
        showSnackbar(errMsg, 'error');
        return;
      }
      let created = null;
      try { created = await res.json(); } catch {}
      // Refresh list to ensure consistent state
      await loadData();
      setZoneForm({ name: '', description: '', region: '' });
      setZoneDialog(false);
      showSnackbar('Zone created', 'success');
    } catch (err) {
      console.error('ZoneSettings create zone error', err);
      showSnackbar(err.message || 'Failed to create zone', 'error');
    }
  };

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
        let errMsg = 'Failed to update zone';
        try {
          const err = await res.json();
          errMsg = err.message || err.error || errMsg;
        } catch (e) {
          try { const txt = await res.text(); if (txt) errMsg = txt; } catch {}
        }
        console.error('ZoneSettings update zone server error', res.status, errMsg);
        showSnackbar(errMsg, 'error');
        return;
      }
      try { await res.json(); } catch {}
      // Refresh list
      await loadData();
      setZoneForm({ name: '', description: '', region: '' });
      setEditingZone(null);
      setZoneDialog(false);
      showSnackbar('Zone updated', 'success');
    } catch (err) {
      console.error('ZoneSettings update zone error', err);
      showSnackbar(err.message || 'Failed to update zone', 'error');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Delete this zone? Churches assigned to it will become unassigned.')) return;
    try {
      const res = await fetchWithAuth(`/api/zones/${zoneId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete zone');
      }
      setZones(prev => prev.filter(z => z.id !== zoneId));
      setChurches(prev => prev.map(c => (c.zone_id === zoneId ? { ...c, zone_id: null } : c)));
      showSnackbar('Zone deleted', 'success');
    } catch (err) {
      console.error('ZoneSettings delete zone error', err);
      showSnackbar('Failed to delete zone', 'error');
    }
  };

  const handleChurchZoneChange = async (churchId, zoneId) => {
    try {
      if (zoneId) {
        // Assign church to zone
        const res = await fetchWithAuth(`/api/zones/${zoneId}/churches/${churchId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to assign church to zone');
        }
      } else {
        // Remove church from zone (find the current zone first)
        const church = churches.find(c => c.id === churchId);
        if (church && church.zone_id) {
          const res = await fetchWithAuth(`/api/zones/${church.zone_id}/churches/${churchId}/unassign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to unassign church from zone');
          }
        }
      }
      
      // Update local state
      setChurches(prev => prev.map(c => (c.id === churchId ? { ...c, zone_id: zoneId || null } : c)));
      showSnackbar('Church zone updated successfully', 'success');
    } catch (err) {
      console.error('ZoneSettings update church zone error', err);
      showSnackbar('Failed to update church zone', 'error');
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

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <h1>Zone Settings</h1>
        <p>Define zones and assign churches. Zonal pastors receive aggregated reports for their zones.</p>
      </Box>

      <Grid container spacing={3}>
        {/* Zones */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardHeader
              title="Zones"
              action={
                <Button
                  size="small"
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
              }
            />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Zone</TableCell>
                      <TableCell>Region</TableCell>
                      <TableCell>Churches</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {zones.map((z) => {
                      const count = churches.filter(c => c.zone_id === z.id).length;
                      return (
                        <TableRow key={z.id}>
                          <TableCell>{z.name}</TableCell>
                          <TableCell>{z.region || '-'}</TableCell>
                          <TableCell>
                            <Chip label={count} size="small" />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              startIcon={<EditIcon />}
                              onClick={() => {
                                setEditingZone(z);
                                setZoneForm({ name: z.name || '', description: z.description || '', region: z.region || '' });
                                setZoneDialog(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteIcon />}
                              onClick={() => handleDeleteZone(z.id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {zones.length === 0 && (
                <Box sx={{ py: 3, textAlign: 'center', color: 'text.secondary' }}>
                  No zones yet. Add a zone to get started.
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Church assignments */}
        <Grid item xs={12} md={7}>
          <Card>
            <CardHeader title="Church Assignments" />
            <CardContent>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Church</TableCell>
                      <TableCell>Zone</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {churches.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={c.zone_id || ''}
                            onChange={(e) => handleChurchZoneChange(c.id, e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Unassigned</em>
                            </MenuItem>
                            {zones.map(z => (
                              <MenuItem key={z.id} value={z.id}>
                                {z.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {c.zone_id && zonesById.get(c.zone_id)?.name && (
                            <Box sx={{ mt: 0.5, color: 'text.secondary', fontSize: 12 }}>
                              Current: {zonesById.get(c.zone_id)?.name}
                            </Box>
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
      </Grid>

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
          />
          <TextField
            fullWidth
            label="Region"
            value={zoneForm.region}
            onChange={(e) => setZoneForm({ ...zoneForm, region: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={zoneForm.description}
            onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
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
