// src/pages/CellGroupListTablePage.jsx
import React, { useEffect, useState, useCallback, useContext, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Select, MenuItem,
  Stack, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Card, CardContent, CardActions, List, ListItem, ListItemButton, ListItemAvatar, Avatar,
  ListItemText, ListItemSecondaryAction, Divider, Chip, Tooltip, Pagination, useTheme, useMediaQuery,
  Snackbar, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import CellGroupModal from '../../components/cell/CellGroupModal';
import CellGroupDetail from '../../components/cell/CellGroupDetail';
import { getCellGroups, getCellGroupFormLookups, saveCellGroup } from '../../services/cellGroupService';
import { exportGroupsToExcel } from '../../utils/exportExcel';
import { exportGroupsToPDF } from '../../utils/exportPDF';
import { AuthContext } from '../../contexts/AuthContext';
import NotificationContext from '../../contexts/NotificationContext'; // <-- added

function normalizeFetch(fetchWithAuth) {
  if (typeof fetchWithAuth === 'function') return fetchWithAuth;
  if (fetchWithAuth && typeof fetchWithAuth.fetchWithAuth === 'function') return fetchWithAuth.fetchWithAuth;
  if (fetchWithAuth && typeof fetchWithAuth.value === 'object' && typeof fetchWithAuth.value.fetchWithAuth === 'function') return fetchWithAuth.value.fetchWithAuth;
  return null;
}

export default function CellGroupListTablePage() {
  const { user, fetchWithAuth } = useContext(AuthContext);
  const notifCtx = useContext(NotificationContext); // already present
  const { notifications: incomingNotifications = [], unreadCount } = notifCtx || {};

  const theme = useTheme();
  const isSm = useMediaQuery(theme.breakpoints.down('sm'));

  const [groups, setGroups] = useState([]);
  const [lookups, setLookups] = useState({ zones: [], statuses: [], leaders: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, initial: null });
  const [detailModal, setDetailModal] = useState({ open: false, groupId: null });

  const [selected, setSelected] = useState(null);

  const [filters, setFilters] = useState({ q: '', zone_id: '', status_id: '' });
  const [debouncedQ, setDebouncedQ] = useState(filters.q);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  const [totalCount, setTotalCount] = useState(-1);
  const [error, setError] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const lastNotifIdRef = useRef(null); // keep ref to avoid duplicate toasts

  // debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(filters.q), 350);
    return () => clearTimeout(t);
  }, [filters.q]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fn = normalizeFetch(fetchWithAuth);
      if (!fn) throw new Error('fetchWithAuth is not available');

      const params = {
        q: debouncedQ || undefined,
        zone_id: filters.zone_id || undefined,
        status_id: filters.status_id || undefined,
        limit: rowsPerPage,
        offset: (page - 1) * rowsPerPage,
        orderBy,
        order
      };

      // get groups and lookups in parallel
      const [groupsRes, lookupsRes] = await Promise.all([
        getCellGroups(fn, params),
        getCellGroupFormLookups(fn)
      ]);

      // groupsRes might be an array, or an object { rows, total }
      let rows = [];
      let total = -1;
      if (Array.isArray(groupsRes)) {
        rows = groupsRes;
        total = groupsRes.length < rowsPerPage && page === 1 ? groupsRes.length : -1;
      } else if (groupsRes && typeof groupsRes === 'object') {
        rows = Array.isArray(groupsRes.rows) ? groupsRes.rows : (groupsRes.data || []);
        total = Number.isFinite(groupsRes.total) ? groupsRes.total : (rows.length < rowsPerPage && page === 1 ? rows.length : -1);
      }

      setGroups(rows);
      setTotalCount(Number.isFinite(total) ? total : -1);

      setLookups({
        zones: lookupsRes?.zones || [],
        statuses: lookupsRes?.statuses || [],
        leaders: lookupsRes?.leaders || []
      });
    } catch (err) {
      console.error('Failed to load cell groups', err);
      setError(err.message || 'Failed to load data');
      setGroups([]);
      setLookups({ zones: [], statuses: [], leaders: [] });
      setTotalCount(-1);
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, filters.zone_id, filters.status_id, page, rowsPerPage, orderBy, order, fetchWithAuth]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // show snackbar when a new notification arrives (reuse main snackbar)
  useEffect(() => {
    if (!incomingNotifications || incomingNotifications.length === 0) return;
    const latest = incomingNotifications[0];
    if (!latest || latest.id == null) return;

    // Prevent showing the same notification repeatedly when navigating to the page.
    // Persist last shown id for this session so reopening the page won't re-display it.
    const storageKey = 'noti:lastSeenId';
    const seenId = (() => {
      try { return sessionStorage.getItem(storageKey); } catch (e) { return null; }
    })();

    if (String(seenId) === String(latest.id)) return; // already shown this session
    if (lastNotifIdRef.current === latest.id) return; // already shown during this mount

    lastNotifIdRef.current = latest.id;
    try { sessionStorage.setItem(storageKey, String(latest.id)); } catch (e) {}

    setSnackbar({
      open: true,
      message: (latest.title ? `${latest.title}: ` : '') + (latest.message || latest.body || 'You have a new notification'),
      severity: 'info'
    });
  }, [incomingNotifications]);

  // handlers
  const handleFilterChange = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }));

  const handleOpenCreate = () => setModal({ open: true, initial: null });
  const handleOpenEdit = (e, group) => {
    e.stopPropagation();
    setModal({ open: true, initial: group });
  };
  const handleOpenView = (e, group) => {
    e.stopPropagation();
    setDetailModal({ open: true, groupId: group.id });
  };
  const handleCloseView = () => setDetailModal({ open: false, groupId: null });

  const handleSaveFromModal = async (form) => {
    try {
      if (!form || typeof form !== "object") {
        console.error('handleSaveFromModal: No form data provided!', form);
        return;
      }
      const payload = { ...form };
      if (!payload.church_id && user?.church_id) {
        payload.church_id = user.church_id;
      }

      const fn = normalizeFetch(fetchWithAuth);
      if (!fn) throw new Error('fetchWithAuth is not available');

      const saved = await saveCellGroup(fn, payload);
      setModal({ open: false, initial: null });
      setSnackbar({ open: true, message: 'Cell group saved successfully!', severity: 'success' });

      // show immediate notification on bell
      if (notifCtx && typeof notifCtx.addNotification === 'function') {
        notifCtx.addNotification({
          id: Date.now(),
          title: 'Cell group saved',
          message: (saved && (saved.name || saved.title)) ? `${saved.name || saved.title} saved` : 'A cell group was saved',
          read: false,
        });
      }

      // Wait a short moment to ensure backend is ready, then reload
      setTimeout(() => {
        loadAll();
        if (notifCtx && typeof notifCtx.reload === 'function') notifCtx.reload();
      }, 400);
    } catch (err) {
      console.error('Failed to save cell group', err);
      setSnackbar({ open: true, message: 'Failed to save cell group', severity: 'error' });
      throw err;
    }
  };

  const displayedLabel = (from, to, total) => {
    if (total === -1) return `${from}–${to}`;
    return `${from}–${to} of ${total}`;
  };

  const totalPages = totalCount === -1 ? Math.max(1, Math.ceil(groups.length / rowsPerPage)) : Math.max(1, Math.ceil(totalCount / rowsPerPage));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction="row" justifyContent="space-between" mb={2} alignItems="center">
        <Typography variant="h5">Cell Groups</Typography>
      </Stack>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Search groups"
              value={filters.q}
              onChange={handleFilterChange('q')}
              size="small"
              fullWidth
              sx={{ minWidth: 120 }}
            />

            <Select
              value={filters.zone_id}
              onChange={handleFilterChange('zone_id')}
              displayEmpty
              size="small"
              fullWidth={isSm}
              sx={{ minWidth: isSm ? '100%' : 180 }}
            >
              <MenuItem value="">All Zones</MenuItem>
              {lookups.zones.map(z => <MenuItem key={z.id} value={z.id}>{z.name}</MenuItem>)}
            </Select>

            <Select
              value={filters.status_id}
              onChange={handleFilterChange('status_id')}
              displayEmpty
              size="small"
              fullWidth={isSm}
              sx={{ minWidth: isSm ? '100%' : 180 }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              {lookups.statuses.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </Select>
          </Stack>
        </CardContent>
        <CardActions sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 120 }}>
            {loading ? 'Loading…' : groups.length === 0 ? 'No results' : displayedLabel((page - 1) * rowsPerPage + 1, Math.min(page * rowsPerPage, totalCount === -1 ? (page - 1) * rowsPerPage + groups.length : totalCount), totalCount)}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: { xs: 1, sm: 0 } }}>
            <Button size="small" onClick={() => { setFilters({ q: '', zone_id: '', status_id: '' }); setPage(1); }}>Clear</Button>

            {isSm ? (
              <>
                <Tooltip title="Export Excel">
                  <IconButton size="small" onClick={() => exportGroupsToExcel(groups)} disabled={!groups.length}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export PDF">
                  <IconButton size="small" onClick={() => exportGroupsToPDF(groups)} disabled={!groups.length}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Add Group">
                  <IconButton color="primary" onClick={handleOpenCreate} size="small">
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportGroupsToExcel(groups)} disabled={!groups.length}>
                  Export Excel
                </Button>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportGroupsToPDF(groups)} disabled={!groups.length}>
                  Export PDF
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                  Add Group
                </Button>
              </>
            )}
          </Stack>
        </CardActions>
      </Card>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ color: 'error.main', mt: 4 }}>{error}</Box>
      ) : (
        <Card>
          <List disablePadding>
            {groups.length === 0 ? (
              <ListItem>
                <ListItemText primary={<Typography color="text.secondary">No cell groups found</Typography>} />
              </ListItem>
            ) : groups.map(g => {
              const actionButtons = (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View details">
                    <Button size="small" startIcon={<VisibilityIcon />} onClick={(e) => handleOpenView(e, g)}>View</Button>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <Button size="small" startIcon={<EditIcon />} onClick={(e) => handleOpenEdit(e, g)}>Edit</Button>
                  </Tooltip>
                </Stack>
              );

              const actionIcons = (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="View details">
                    <IconButton size="small" onClick={(e) => handleOpenView(e, g)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={(e) => handleOpenEdit(e, g)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              );

              return (
                <React.Fragment key={g.id}>
                  <ListItem alignItems="flex-start" secondaryAction={!isSm ? (
                    <ListItemSecondaryAction sx={{ right: 8, top: '50%', transform: 'translateY(-50%)' }}>
                      {actionButtons}
                    </ListItemSecondaryAction>
                  ) : null}>
                    <ListItemButton onClick={() => setSelected(g.id)} sx={{ py: { xs: 1, sm: 1.5 } }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
                          {(g.name || '').charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                           <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                             <Typography component="div" variant="subtitle1" noWrap sx={{ maxWidth: isSm ? '60%' : 'auto' }}>{g.name}</Typography>
                             <Chip label={`${g.member_count ?? 0}`} size="small" color="primary" />
                           </Stack>
                        }
                        // ensure ListItemText wraps use <div> so we don't put <div> inside default <p>
                        primaryTypographyProps={{ component: 'div' }}
                        secondaryTypographyProps={{ component: 'div' }}
                        secondary={
                           <Stack direction="column" spacing={0.5}>
                             <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                               <Typography component="span" variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '40%' }}>{g.zone_name || '—'}</Typography>
                               <Typography component="span" variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '40%' }}>{g.status_name || '—'}</Typography>
                               <Typography component="span" variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '40%' }}>{(g.leader_first_name || '') + (g.leader_surname ? ` ${g.leader_surname}` : '')}</Typography>
                             </Stack>
                             {isSm ? (
                               <Box sx={{ mt: 0.5 }}>
                                 {actionIcons}
                               </Box>
                             ) : null}
                           </Stack>
                        }
                        sx={{ minWidth: 0 }}
                      />
                    </ListItemButton>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              );
            })}
          </List>

          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, p) => setPage(p)}
              color="primary"
              showFirstButton={!isSm}
              showLastButton={!isSm}
              siblingCount={isSm ? 0 : 1}
            />
          </Box>
        </Card>
      )}

      {/* Detail Dialog (popup) */}
      <Dialog
        fullWidth
        maxWidth="md"
        open={detailModal.open}
        onClose={handleCloseView}
        aria-labelledby="cellgroup-detail-title"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} id="cellgroup-detail-title">
          Cell Group Details
          <IconButton
            aria-label="close"
            onClick={handleCloseView}
            sx={{ position: 'absolute', right: 8, top: 8 }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {detailModal.groupId ? (
            <CellGroupDetail
              groupId={detailModal.groupId}
              onClose={handleCloseView}
              onMemberAssign={async () => {
                await loadAll();
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseView}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Modal */}
      <CellGroupModal
        open={modal.open}
        onClose={() => setModal({ open: false, initial: null })}
        lookups={lookups}
        onSave={handleSaveFromModal}
        initial={modal.initial}
        loading={false}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* reused main snackbar shows notification messages */}
    </Box>
  );
}
