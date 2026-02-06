// src/components/InactiveExitList.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import NotificationContext from '../../contexts/NotificationContext';
import {
  Box, Typography, Paper, Card, CardContent, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, InputAdornment, FormControl, Select, MenuItem, InputLabel,
  Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, Toolbar, Tooltip, Fab, Stack, CircularProgress, Alert, Snackbar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import GetAppIcon from '@mui/icons-material/GetApp';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import { DateTime } from 'luxon';
import { listExits, deleteExit, reinstateExit, bulkDeleteExits, bulkReinstateExits, getExitStatistics, findInconsistentExits, fixInconsistentExit } from '../../services/inactiveExitService';
import { exportExits } from '../../services/exportService';
import { createInterview, deleteInterview } from '../../services/exitInterviewService';
import InactiveExitForm from './InactiveExitForm';
import ExitInterviewForm from './ExitInterviewForm';

export default function InactiveExitList() {
  // Get fetchWithAuth and ready from AuthContext
  const { fetchWithAuth, ready, user } = useContext(AuthContext) || {};
  const permissions = user?.permissions || [];  // array of permission strings
  const navigate = useNavigate();

  const [exits, setExits] = useState([]);
  const [statistics, setStatistics] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewExit, setInterviewExit] = useState(null);
  const [interviewType, setInterviewType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [quickLogging, setQuickLogging] = useState({});
  const [lastCreatedUndo, setLastCreatedUndo] = useState(null); // { id, exitId, memberId, timeoutId } for undo
  const [lastCreatedViewLink, setLastCreatedViewLink] = useState(null);
  const [optimisticBackup, setOptimisticBackup] = useState(null);

  // Filtering and pagination
  const [search, setSearch] = useState('');
  const [exitTypeFilter, setExitTypeFilter] = useState('');
  const [exitStatusFilter, setExitStatusFilter] = useState('inactive'); // 'inactive' or 'reinstated' or 'all'
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Bulk operations
  const [selected, setSelected] = useState([]);
  const [bulkMode, setBulkMode] = useState(false);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, id: null, ids: [] });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Data integrity
  const [inconsistentExits, setInconsistentExits] = useState([]);
  const [showDataIntegrity, setShowDataIntegrity] = useState(false);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);

  const { notifications } = useContext(NotificationContext) || { notifications: [] };

  const load = async () => {
    // Guard: wait for auth and ensure fetchWithAuth is available
    if (!ready || typeof fetchWithAuth !== 'function') return;

    setLoading(true);
    try {
      const params = {
        offset: page * rowsPerPage,
        limit: rowsPerPage,
        search: search || null,
        includeInterviews: true,
        includeReinstated: exitStatusFilter === 'reinstated' || exitStatusFilter === 'all'
      };

      const response = await listExits(fetchWithAuth, params);

      // Response may be an array (legacy) or an object { rows, total_count }
      if (Array.isArray(response)) {
        setExits(response);
        setTotalCount(Number(response.length) || 0);
      } else if (response && Array.isArray(response.rows)) {
        setExits(response.rows);
        setTotalCount(Number(response.total_count) || response.rows.length || 0);
      } else {
        setExits([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Failed to load exits:', err);
      setSnackbar({ open: true, message: err.message || 'Failed to load exits', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!ready || typeof fetchWithAuth !== 'function') return;

    try {
      const stats = await getExitStatistics(fetchWithAuth);
      setStatistics(Array.isArray(stats) ? stats : []);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  // Load exits and statistics when component mounts and auth is ready
  useEffect(() => {
    load();
    loadStatistics();
  }, [fetchWithAuth, ready, page, rowsPerPage, search, exitStatusFilter]);

  // Refresh the list when a relevant notification arrives (e.g., new exit created)
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const latest = notifications[0];
    const action = latest?.metadata?.action || latest?.action || null;
    if (action === 'inactive_exit_created' || action === 'exit_created' || action === 'member:exited') {
      // small delay to allow DB transaction/other handlers to settle
      const t = setTimeout(() => { load(); loadStatistics(); }, 200);
      return () => clearTimeout(t);
    }
  }, [notifications]);

  const handleEdit = (id) => { setEditingId(id); setOpenForm(true); };
  const handleCreate = () => { setEditingId(null); setOpenForm(true); };

  const handleDelete = (id) => {
    setConfirmDialog({ open: true, action: 'delete', id, ids: [id] });
  };

  const handleReinstate = (id) => {
    setConfirmDialog({ open: true, action: 'reinstate', id, ids: [id] });
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setConfirmDialog({ open: true, action: 'bulk_delete', ids: selected });
  };

  const handleBulkReinstate = () => {
    if (selected.length === 0) return;
    setConfirmDialog({ open: true, action: 'bulk_reinstate', ids: selected });
  };

  const handleSelectAll = (checked) => {
    setSelected(checked ? exits.map(exit => exit.id) : []);
  };

  const handleSelectOne = (id, checked) => {
    setSelected(prev =>
      checked
        ? [...prev, id]
        : prev.filter(selectedId => selectedId !== id)
    );
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({ open: false, action: null, id: null, ids: [] });
  };

  const handleConfirmDialogOk = async () => {
    if (!ready || typeof fetchWithAuth !== 'function') {
      setSnackbar({ open: true, message: 'Not authenticated', severity: 'error' });
      return;
    }

    try {
      let result;
      if (confirmDialog.action === 'delete') {
        result = await deleteExit(fetchWithAuth, confirmDialog.id);
      } else if (confirmDialog.action === 'reinstate') {
        result = await reinstateExit(fetchWithAuth, confirmDialog.id);
      } else if (confirmDialog.action === 'bulk_delete') {
        result = await bulkDeleteExits(fetchWithAuth, confirmDialog.ids);
      } else if (confirmDialog.action === 'bulk_reinstate') {
        result = await bulkReinstateExits(fetchWithAuth, confirmDialog.ids);
      }

      const actionName = confirmDialog.action.replace('_', ' ');
      setSnackbar({
        open: true,
        message: `${actionName} completed successfully`,
        severity: 'success'
      });

      load();
      loadStatistics();
      setSelected([]);
      setBulkMode(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || `${confirmDialog.action} failed`,
        severity: 'error'
      });
    }
    handleConfirmDialogClose();
  };

  const handleExportCSV = async () => {
    if (!ready || typeof fetchWithAuth !== 'function') {
      setSnackbar({ open: true, message: 'Not authenticated', severity: 'error' });
      return;
    }

    try {
      const blob = await exportExits(fetchWithAuth, { fromDate: '', toDate: '', format: 'csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inactive_exits_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Export completed successfully', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Export failed', severity: 'error' });
    }
  };

  const openInterview = (exit, type = null) => { setInterviewExit(exit); setInterviewType(type); setInterviewOpen(true); };

  const quickLog = async (exit, type) => {
    if (!ready || typeof fetchWithAuth !== 'function') {
      setSnackbar({ open: true, message: 'Not authenticated', severity: 'error' });
      return;
    }

    const key = `${exit.id}:${type}`;
    setQuickLogging(prev => ({ ...prev, [key]: true }));

    // Optimistic UI: increment visit/followup count locally
    const prev = exits.find(x => x.id === exit.id);
    const backup = prev ? { ...prev } : null;
    setOptimisticBackup(backup);
    setExits(prevExits => prevExits.map(x => x.id === exit.id ? ({ ...x, visit_count: type === 'visit' ? (Number(x.visit_count || 0) + 1) : x.visit_count, last_visit_date: type === 'visit' ? new Date().toISOString() : x.last_visit_date, followup_count: type === 'followup' ? (Number(x.followup_count || 0) + 1) : x.followup_count, last_followup_date: type === 'followup' ? new Date().toISOString() : x.last_followup_date }) : x));

    try {
      const payload = {
        exit_id: exit.id,
        member_id: exit.member_id,
        interview_type: type,
        summary: `Quick ${type} logged`,
        answers: []
      };
      const created = await createInterview(fetchWithAuth, payload);

      // show undo option and prepare view link
      const timeoutId = window.setTimeout(() => setLastCreatedUndo(null), 10000);
      const memberId = created?.member_id ?? null;
      const viewLink = memberId ? `/members/${memberId}/exit-interviews/${created.id}` : `/exit-interviews/${created.id}`;
      setLastCreatedUndo({ id: created.id, exitId: exit.id, memberId, timeoutId });
      setLastCreatedViewLink(viewLink);

      setSnackbar({ open: true, message: `${type === 'visit' ? 'Visit' : 'Follow-up'} logged`, severity: 'success' });

      // Refresh authoritative data
      load();
      loadStatistics();
    } catch (err) {
      // revert optimistic change
      if (backup) {
        setExits(prevExits => prevExits.map(x => x.id === backup.id ? backup : x));
        setOptimisticBackup(null);
      }
      setSnackbar({ open: true, message: err.message || `Failed to log ${type}`, severity: 'error' });
    } finally {
      setQuickLogging(prev => { const copy = { ...prev }; delete copy[key]; return copy; });
    }
  }; 

  // Data integrity functions
  const checkDataIntegrity = async () => {
    if (!ready || typeof fetchWithAuth !== 'function') return;

    setCheckingIntegrity(true);
    try {
      const inconsistencies = await findInconsistentExits(fetchWithAuth);
      setInconsistentExits(Array.isArray(inconsistencies) ? inconsistencies : []);
      setShowDataIntegrity(true);

      if (inconsistencies.length > 0) {
        setSnackbar({
          open: true,
          message: `Found ${inconsistencies.length} inconsistent exit record${inconsistencies.length !== 1 ? 's' : ''}`,
          severity: 'warning'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'All exit records are consistent',
          severity: 'success'
        });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to check data integrity', severity: 'error' });
    } finally {
      setCheckingIntegrity(false);
    }
  };

  const fixInconsistentRecord = async (exit_id) => {
    if (!ready || typeof fetchWithAuth !== 'function') return;

    try {
      const fixed = await fixInconsistentExit(fetchWithAuth, exit_id);
      setInconsistentExits(prev => prev.filter(exit => exit.exit_id !== exit_id));

      setSnackbar({
        open: true,
        message: 'Exit record consistency fixed',
        severity: 'success'
      });

      // Refresh the data
      load();
      loadStatistics();
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Failed to fix inconsistent record', severity: 'error' });
    }
  };

  // Don't render until auth is ready
  if (!ready) return null;

  return (
    <Box p={2}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Member Exit Management</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant={bulkMode ? "outlined" : "text"}
            onClick={() => setBulkMode(!bulkMode)}
            startIcon={<FilterListIcon />}
          >
            {bulkMode ? 'Exit Bulk Mode' : 'Bulk Mode'}
          </Button>
          <Button variant="contained" onClick={handleCreate}>Record Exit</Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      {statistics.length > 0 && (
        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          {statistics.map(stat => (
            <Card key={stat.exit_type} sx={{ minWidth: 140 }}>
              <CardContent sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="h6" color="primary">{stat.total_count}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.exit_type.charAt(0).toUpperCase() + stat.exit_type.slice(1)}
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 0.5 }}>
                  <Typography variant="caption" color="warning.main">
                    {stat.active_count} active
                  </Typography>
                  {stat.reinstated_count > 0 && (
                    <Typography variant="caption" color="success.main">
                      {stat.reinstated_count} reinstated
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Exit Type</InputLabel>
            <Select
              value={exitTypeFilter}
              label="Exit Type"
              onChange={(e) => setExitTypeFilter(e.target.value)}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="resigned">Resigned</MenuItem>
              <MenuItem value="moved">Moved</MenuItem>
              <MenuItem value="transferred">Transferred</MenuItem>
              <MenuItem value="deceased">Deceased</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Exit Status</InputLabel>
            <Select
              value={exitStatusFilter}
              label="Exit Status"
              onChange={(e) => setExitStatusFilter(e.target.value)}
            >
              <MenuItem value="inactive">Active Exits</MenuItem>
              <MenuItem value="reinstated">Reinstated</MenuItem>
              <MenuItem value="all">All Exits</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Refresh
          </Button>
        </Stack>
      </Paper>

      {/* Bulk Actions */}
      {bulkMode && selected.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {selected.length} exit{selected.length !== 1 ? 's' : ''} selected
            <Button size="small" onClick={() => setSelected([])} sx={{ ml: 1 }}>Clear</Button>
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              startIcon={<DeleteSweepIcon />}
              color="error"
              variant="outlined"
              onClick={handleBulkDelete}
            >
              Bulk Delete
            </Button>
            <Button
              size="small"
              startIcon={<RestoreFromTrashIcon />}
              color="success"
              variant="outlined"
              onClick={handleBulkReinstate}
            >
              Bulk Reinstate
            </Button>
          </Stack>
        </Alert>
      )}

      {/* Exits Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {bulkMode && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < exits.length}
                    checked={exits.length > 0 && selected.length === exits.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
              )}
              <TableCell>Member</TableCell>
              <TableCell>Exit Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Exit Date</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Visits</TableCell>
              <TableCell>Last Visit</TableCell>
              <TableCell>Follow-ups</TableCell>
              <TableCell>Last Follow-up</TableCell>
              <TableCell>Interview</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={bulkMode ? 12 : 11} align="center">
                  <Typography>Loading...</Typography>
                </TableCell>
              </TableRow>
            ) : exits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={bulkMode ? 12 : 11} align="center">
                  <Typography>No exits recorded.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              exits.map(e => (
                <TableRow key={e.id} hover>
                  {bulkMode && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(e.id)}
                        onChange={(event) => handleSelectOne(e.id, event.target.checked)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Typography variant="body2">
                      {e.first_name || 'Member'} {e.surname || ''}
                    </Typography>
                    {e.is_suggestion && <Chip label="Suggestion" size="small" color="warning" sx={{ mt: 0.5 }} />}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={e.exit_type}
                      size="small"
                      color={e.exit_type === 'inactive' ? 'default' : 'primary'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={e.exit_status || 'inactive'}
                      size="small"
                      color={e.exit_status === 'reinstated' ? 'success' : 'warning'}
                      variant={e.exit_status === 'reinstated' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    {e.exit_date ? DateTime.fromISO(e.exit_date).toLocaleString(DateTime.DATE_MED) : 'N/A'}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="body2" sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {e.exit_reason || 'No reason provided'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {typeof e.visit_count !== 'undefined' ? e.visit_count : 0}
                  </TableCell>
                  <TableCell>
                    {e.last_visit_date ? DateTime.fromISO(e.last_visit_date).toLocaleString(DateTime.DATE_MED) : '—'}
                  </TableCell>
                  <TableCell>
                    {typeof e.followup_count !== 'undefined' ? e.followup_count : 0}
                  </TableCell>
                  <TableCell>
                    {e.last_followup_date ? DateTime.fromISO(e.last_followup_date).toLocaleString(DateTime.DATE_MED) : '—'}
                  </TableCell>
                  <TableCell>
                    {e.has_interview ? (
                      <Chip label="Completed" size="small" color="success" />
                    ) : (
                      <Button size="small" onClick={() => openInterview(e)} disabled={!permissions.includes('create_exit_interviews')}>
                        Conduct
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title={permissions.includes('create_exit_interviews') ? 'Quick Log Visit' : 'No permission to log visits'}>
                        <span>
                          <IconButton
                            aria-label="Quick Log Visit"
                            size="small"
                            onClick={() => quickLog(e, 'visit')}
                            disabled={!permissions.includes('create_exit_interviews') || !!quickLogging[`${e.id}:visit`]}
                          >
                            {quickLogging[`${e.id}:visit`] ? <CircularProgress size={16} /> : <FlashOnIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Button size="small" aria-label={`Log Visit for ${e.id}`} onClick={() => openInterview(e, 'visit')} disabled={!permissions.includes('create_exit_interviews')}>Log Visit</Button>

                      <Tooltip title={permissions.includes('create_exit_interviews') ? 'Quick Log Follow-up' : 'No permission to log follow-ups'}>
                        <span>
                          <IconButton
                            aria-label="Quick Log Follow-up"
                            size="small"
                            onClick={() => quickLog(e, 'followup')}
                            disabled={!permissions.includes('create_exit_interviews') || !!quickLogging[`${e.id}:followup`]}
                          >
                            {quickLogging[`${e.id}:followup`] ? <CircularProgress size={16} /> : <FlashOnIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Button size="small" aria-label={`Log Follow-up for ${e.id}`} onClick={() => openInterview(e, 'followup')} disabled={!permissions.includes('create_exit_interviews')}>Log Follow-up</Button>

                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit(e.id)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(e.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reinstate">
                        <IconButton size="small" color="success" onClick={() => handleReinstate(e.id)}>
                          <RestoreIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />

      {/* Export Actions */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Export & Reports</Typography>
          <Stack direction="row" spacing={1}>
            <Button startIcon={<GetAppIcon />} onClick={handleExportCSV}>
              Export CSV
            </Button>
            <Button startIcon={<RefreshIcon />} onClick={() => { load(); loadStatistics(); }}>
              Refresh All
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Data Integrity Section */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>Data Integrity</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Check for inconsistencies between member status and exit records
          </Typography>

          {!showDataIntegrity ? (
            <Button
              variant="outlined"
              onClick={checkDataIntegrity}
              disabled={checkingIntegrity}
              startIcon={<RefreshIcon />}
            >
              {checkingIntegrity ? 'Checking...' : 'Check Data Integrity'}
            </Button>
          ) : (
            <Box>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Button variant="outlined" onClick={checkDataIntegrity} disabled={checkingIntegrity}>
                  Re-check
                </Button>
                <Button variant="text" onClick={() => setShowDataIntegrity(false)}>
                  Hide
                </Button>
              </Stack>

              {inconsistentExits.length === 0 ? (
                <Alert severity="success">
                  <Typography variant="body2">All exit records are consistent! ✅</Typography>
                </Alert>
              ) : (
                <Box>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Found {inconsistentExits.length} inconsistent record{inconsistentExits.length !== 1 ? 's' : ''}.
                      These members are marked as active but have unreinstated exit records.
                    </Typography>
                  </Alert>

                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Member</TableCell>
                          <TableCell>Exit Type</TableCell>
                          <TableCell>Exit Date</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inconsistentExits.map(exit => (
                          <TableRow key={exit.exit_id}>
                            <TableCell>
                              {exit.first_name} {exit.surname}
                            </TableCell>
                            <TableCell>
                              <Chip label={exit.exit_type} size="small" color="warning" />
                            </TableCell>
                            <TableCell>
                              {exit.exit_date ? DateTime.fromISO(exit.exit_date).toLocaleString(DateTime.DATE_MED) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="small"
                                variant="outlined"
                                color="success"
                                onClick={() => fixInconsistentRecord(exit.exit_id)}
                              >
                                Fix Record
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <InactiveExitForm
        open={openForm}
        editId={editingId}
        onClose={() => setOpenForm(false)}
        onSaved={() => { setOpenForm(false); load(); }}
      />
      <ExitInterviewForm
        open={interviewOpen}
        onClose={() => { setInterviewOpen(false); setInterviewType(null); }}
        exitId={interviewExit?.id}
        memberId={interviewExit?.member_id}
        initialInterviewType={interviewType}
        onSaved={() => { load(); setInterviewOpen(false); setInterviewType(null); }}
      />

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onClose={handleConfirmDialogClose}>
        <DialogTitle>
          {confirmDialog.action === 'delete' && 'Delete Exit'}
          {confirmDialog.action === 'reinstate' && 'Reinstate Member'}
          {confirmDialog.action === 'bulk_delete' && 'Bulk Delete Exits'}
          {confirmDialog.action === 'bulk_reinstate' && 'Bulk Reinstate Members'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.action === 'delete' && 'Are you sure you want to mark this exit as deleted?'}
            {confirmDialog.action === 'reinstate' && 'Are you sure you want to reinstate this member? This will restore their active status.'}
            {confirmDialog.action === 'bulk_delete' && `Are you sure you want to delete ${confirmDialog.ids?.length || 0} exits?`}
            {confirmDialog.action === 'bulk_reinstate' && `Are you sure you want to reinstate ${confirmDialog.ids?.length || 0} members? This will restore their active status.`}
          </Typography>
          {(confirmDialog.action === 'bulk_delete' || confirmDialog.action === 'bulk_reinstate') && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button
            onClick={handleConfirmDialogOk}
            variant="contained"
            color={(confirmDialog.action === 'delete' || confirmDialog.action === 'bulk_delete') ? 'error' : 'primary'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          action={lastCreatedUndo ? (
            <div>
              <Button color="inherit" size="small" onClick={async () => {
                // undo action
                try {
                  if (!lastCreatedUndo?.id) return;
                  await deleteInterview(fetchWithAuth, lastCreatedUndo.id);
                  if (lastCreatedUndo.timeoutId) window.clearTimeout(lastCreatedUndo.timeoutId);
                  setLastCreatedUndo(null);
                  setLastCreatedViewLink(null);
                  setSnackbar({ open: true, message: 'Undo successful', severity: 'success' });
                  load();
                  loadStatistics();
                } catch (err) {
                  setSnackbar({ open: true, message: err.message || 'Undo failed', severity: 'error' });
                }
              }}>Undo</Button>
              <Button color="inherit" size="small" onClick={() => {
                if (!lastCreatedViewLink) return;
                // navigate to the interview view
                navigate(lastCreatedViewLink);
                // clear undo state
                if (lastCreatedUndo?.timeoutId) window.clearTimeout(lastCreatedUndo.timeoutId);
                setLastCreatedUndo(null);
                setLastCreatedViewLink(null);
                setSnackbar({ open: false, message: '' });
              }}>View</Button>
            </div>
          ) : null}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
