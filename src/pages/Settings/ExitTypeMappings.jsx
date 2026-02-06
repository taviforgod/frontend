import React, { useContext, useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Stack, Button, Select, MenuItem, IconButton, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Snackbar } from '@mui/material';
import { Trash2 } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContext';
import * as exitTypeMapService from '../../services/exitTypeMapService';
import * as lookupService from '../../services/lookupService';

export default function ExitTypeMappings() {
  const { fetchWithAuth } = useContext(AuthContext);
  const [mappings, setMappings] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingExit, setSavingExit] = useState(null);
  const [deletingExit, setDeletingExit] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Add dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newExitType, setNewExitType] = useState('');
  const [newStatusId, setNewStatusId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [maps, sts] = await Promise.all([
        exitTypeMapService.listMappings(fetchWithAuth),
        lookupService.getMemberStatuses(fetchWithAuth)
      ]);
      setMappings(maps || []);
      setStatuses(sts || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(exit_type, member_status_id) {
    try {
      setSavingExit(exit_type);
      const saved = await exitTypeMapService.upsertMapping(fetchWithAuth, { exit_type, member_status_id });
      setMappings((prev) => {
        const found = prev.find((p) => p.exit_type === saved.exit_type);
        if (found) return prev.map(p => p.exit_type === saved.exit_type ? saved : p);
        return [...prev, saved];
      });
      setSnackbar({ open: true, message: 'Mapping saved', severity: 'success' });
    } catch (err) {
      setError(err.message || 'Failed to save mapping');
      setSnackbar({ open: true, message: err.message || 'Failed to save mapping', severity: 'error' });
    } finally {
      setSavingExit(null);
    }
  }

  async function handleDelete(exit_type) {
    try {
      setDeletingExit(exit_type);
      await exitTypeMapService.deleteMapping(fetchWithAuth, exit_type);
      setMappings((prev) => prev.filter(p => p.exit_type !== exit_type));
      setSnackbar({ open: true, message: 'Mapping deleted', severity: 'success' });
    } catch (err) {
      setError(err.message || 'Failed to delete mapping');
      setSnackbar({ open: true, message: err.message || 'Failed to delete mapping', severity: 'error' });
    } finally {
      setDeletingExit(null);
    }
  }

  async function handleAdd() {
    if (!newExitType || !newStatusId) {
      setError('Exit type and status required');
      return;
    }
    await handleSave(newExitType.trim(), Number(newStatusId));
    setDialogOpen(false);
    setNewExitType('');
    setNewStatusId('');
  }

  return (
    <Box sx={{ mt: 3, px: { xs: 1, sm: 2, md: 4 } }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Exit Type → Member Status Mappings</Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Typography variant="body2">Define which member status should be applied for each exit type.</Typography>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>Add mapping</Button>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {mappings.length === 0 ? (
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>No mappings defined</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>Create mappings to control how exit types map to member statuses.</Typography>
              <Button variant="contained" onClick={() => setDialogOpen(true)}>Add first mapping</Button>
            </Card>
          ) : (
            <Stack spacing={1}>
              {mappings.map((m) => (
                <Card key={m.exit_type}> 
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ minWidth: 160, fontWeight: 600 }}>{m.exit_type}</Typography>
                    <Select value={m.member_status_id ?? ''} onChange={(e) => handleSave(m.exit_type, Number(e.target.value))} size="small" sx={{ minWidth: 220 }} disabled={!!savingExit}>
                      <MenuItem value=""><em>— select —</em></MenuItem>
                      {statuses.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                    </Select>
                    <Box sx={{ flex: 1 }} />
                    <IconButton color="error" onClick={() => handleDelete(m.exit_type)} disabled={!!deletingExit}>
                      {deletingExit === m.exit_type ? <CircularProgress size={16} /> : <Trash2 size={16} />}
                    </IconButton>
                    {savingExit === m.exit_type && <CircularProgress size={18} sx={{ ml: 1 }} />}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </>
      )}

      {/* Add dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Add mapping</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 360 }}>
            <TextField label="Exit type" value={newExitType} onChange={(e) => setNewExitType(e.target.value)} size="small" />
            <Select value={newStatusId} onChange={(e) => setNewStatusId(e.target.value)} size="small">
              <MenuItem value=""><em>— select status —</em></MenuItem>
              {statuses.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </Stack>
        </DialogContent>
          <DialogActions>
           <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!newExitType || !newStatusId}>{loading ? <CircularProgress size={16} /> : 'Add'}</Button>
         </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} message={snackbar.message} />
    </Box>
  );
}
