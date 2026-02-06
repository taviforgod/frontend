import React, { useEffect, useState, useContext, useMemo } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext'; // <-- import your ThemeContext
import {
  Box, Typography, Chip, Stack, Paper, Button, Snackbar, Alert, Tooltip,
  IconButton, Divider, List, ListItem, ListItemText, ListItemAvatar, Avatar,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UserPlus, CheckCircle2, PlusCircle, RefreshCcw } from 'lucide-react';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../../contexts/AuthContext.js';
import { getPrayerRequests, getUrgentCount, assignPrayer, closePrayer } from '../../services/prayerService.js';
import MemberSelectDialog from '../../components/prayer/MemberSelectDialog.jsx';
import CloseRequestDialog from '../../components/prayer/CloseRequestDialog.jsx';
import AddFollowupDialog from '../../components/prayer/AddFollowupDialog.jsx';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { DateTime } from 'luxon';

export default function AdminPrayerList() {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const { theme } = useContext(ThemeContext) || {};
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  // Data
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({ status: null, urgency: null });

  // UI
  const [selectedPrayer, setSelectedPrayer] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Dialogs
  const [memberPicker, setMemberPicker] = useState({ open: false, prayer: null });
  const [closeDialog, setCloseDialog] = useState({ open: false, prayer: null });
  const [followupDialog, setFollowupDialog] = useState({ open: false, prayer: null });

  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  // Track filter changes for animation
  const [filterChangeKey, setFilterChangeKey] = useState(0);

  useEffect(() => {
    setFilterChangeKey(prev => prev + 1);
  }, [filters]);

  // Load requests
  const load = async (reset = false) => {
    setLoading(true);
    try {
      // build params but omit null/undefined/empty values
      const rawParams = {
        limit: pageSize,
        offset: reset ? 0 : page * pageSize,
        status: filters.status,
        urgency: filters.urgency
      };
      const params = {};
      Object.entries(rawParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params[k] = v;
      });

      // primary: use service helper
      let res = await getPrayerRequests(fetchWithAuth, params).catch(err => {
        console.debug('getPrayerRequests error', err);
        return null;
      });

      // fallback: if service returned null (e.g. 304 handled as null), force cache-busted fetches
      if (!res) {
        const base = process.env.REACT_APP_API_URL || '';
        const endpoints = [`${base}/api/prayer`, `${base}/api/prayer/requests`];
        for (const u of endpoints) {
          try {
            // only append params that exist — avoid status=null
            const qs = new URLSearchParams(params).toString();
            const url = `${u}${qs ? '?' + qs + '&' : '?'}ts=${Date.now()}`;
            const r = fetchWithAuth
              ? await fetchWithAuth(url, { method: 'GET', credentials: 'include' })
              : await fetch(url, { method: 'GET', credentials: 'include' });
            console.debug('fallback prayer fetch', url, 'status', r?.status);
            if (r && r.ok) {
              try { res = await r.json(); break; } catch (e) { res = null; }
            }
          } catch (e) {
            console.debug('fallback prayer fetch error', e);
          }
        }
      }

      console.debug('AdminPrayerList: prayer response', res);

      // normalize response shapes -> data array
      const data = Array.isArray(res) ? res : (res?.rows ?? res?.data ?? res?.results ?? []);
      setRows(prev => reset ? data : [...(prev || []), ...data]);
      setTotal(res?.total ?? data.length);

      const u = await getUrgentCount(fetchWithAuth);
      setUrgentCount(u?.urgent_open || 0);
    } catch (err) {
      console.error('Failed to load prayer requests', err);
      setSnack({ open: true, message: 'Failed to load prayer requests', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line
  }, [filters, pageSize]);

  const handleLoadMore = () => {
    if (rows.length < total) {
      setPage(p => p + 1);
      load();
    }
  };

  // Toggle filter (working)
  const toggleFilter = (key, value) => {
    setFilters(f => {
      const newFilters = { ...f, [key]: f[key] === value ? null : value };
      if (selectedPrayer) {
        const matches = (!newFilters.status || selectedPrayer.status === newFilters.status) &&
                        (!newFilters.urgency || selectedPrayer.urgency === newFilters.urgency);
        if (!matches) setSelectedPrayer(null);
      }
      return newFilters;
    });
  };

  // Filtered rows (already correct)
  const filteredRows = useMemo(() => {
    return rows.filter(r =>
      (!filters.status || r.status === filters.status) &&
      (!filters.urgency || r.urgency === filters.urgency)
    );
  }, [rows, filters]);

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
      setSnack({ open: true, message: 'Assigned successfully', severity: 'success' });
      setMemberPicker({ open: false, prayer: null });
      load(true);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err?.message || 'Assign failed', severity: 'error' });
    }
  };

  const onClosed = async () => {
    setCloseDialog({ open: false, prayer: null });
    setSnack({ open: true, message: 'Request closed', severity: 'success' });
    load(true);
  };

  const onFollowupAdded = async () => {
    setFollowupDialog({ open: false, prayer: null });
    setSnack({ open: true, message: 'Follow-up added', severity: 'success' });
    load(true);
  };

  const handleBulkAssign = () => {
    if (!selectedIds.length) return;
    setMemberPicker({ open: true, prayer: { id: selectedIds } });
  };

  const handleBulkClose = async () => {
    if (!selectedIds.length) return;
    try {
      for (const id of selectedIds) {
        await closePrayer(fetchWithAuth, id, { outcome: 'Closed (bulk)', resolution_notes: 'Closed by admin bulk action' });
      }
      setSnack({ open: true, message: 'Closed selected requests', severity: 'success' });
      setSelectedIds([]);
      load(true);
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err?.message || 'Bulk close failed', severity: 'error' });
    }
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prayers');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf], { type: 'application/octet-stream' }), 'prayers.xlsx');
  };

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* Header */}
      <Stack
        direction={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'stretch' : 'center'}
        spacing={isMobile ? 1 : 0}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography variant={isMobile ? "h6" : "h4"} fontWeight={700}>Prayer & Counseling Requests</Typography>
          <Typography variant="caption" color="text.secondary">Manage prayer & counseling workflow</Typography>
        </Box>

        <Stack direction={isMobile ? 'column' : 'row'} spacing={1} alignItems="center" sx={{ mt: isMobile ? 1 : 0 }}>
          <Chip label={`Urgent Open: ${urgentCount}`} color="error" />
          <Button fullWidth={isMobile} variant="outlined" startIcon={<FileDownloadIcon />} onClick={handleExport}>Export</Button>
          <Button fullWidth={isMobile} variant="contained" onClick={handleBulkAssign} disabled={!selectedIds.length}>Bulk Assign</Button>
          <Button fullWidth={isMobile} variant="contained" color="error" onClick={handleBulkClose} disabled={!selectedIds.length}>Bulk Close</Button>
          <Tooltip title="Refresh"><IconButton onClick={() => load(true)}><RefreshCcw size={18} /></IconButton></Tooltip>
        </Stack>
      </Stack>

      {/* Panels */}
      <Box sx={{ display: 'flex', gap: 2, height: { xs: 'auto', md: '72vh' }, flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Middle: Prayer List */}
        <Paper sx={{
          flex: 1.2,
          borderRadius: 2,
          overflow: 'auto',
          minWidth: isMobile ? 'auto' : 300,
          maxWidth: isMobile ? '100%' : 450,
          px: isMobile ? 1 : 0,
          py: isMobile ? 1 : 0
        }}>
           <List>
             <AnimatePresence initial={false}>
               {filteredRows.map(row => {
                 const isSelected = selectedPrayer?.id === row.id;
                 return (
                   <motion.div
                     key={`${row.id}-${filterChangeKey}`}
                     layout
                     initial={{ opacity: 0, y: 8, backgroundColor: 'rgba(255,255,0,0.15)' }}
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
                     <ListItem button selected={isSelected} onClick={() => setSelectedPrayer(row)} sx={{ alignItems: 'flex-start', py: isMobile ? 1 : 1.2, px: isMobile ? 1 : 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }}>
                          {row.anonymous ? 'A' : (row.first_name || row.assigned_first_name || '?')[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontWeight: 700, fontSize: isMobile ? '0.95rem' : '1rem' }}>
                            {row.request_no || `#${row.id}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: isMobile ? 'none' : 'inline' }}>
                            — {row.category}
                          </Typography>
                          {row.anonymous && (
                            <Chip label="Anonymous" size="small" color="default" variant="outlined" />
                          )}
                        </Box>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {row.anonymous ? 'Submitted anonymously' : (row.first_name && row.surname ? `${row.first_name} ${row.surname}` : 'Unknown member')}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Chip label={row.urgency || 'Normal'} color={row.urgency === 'High' ? 'error' : 'primary'} size="small" />
                            <Chip label={row.status || 'Open'} color={row.status === 'Open' ? 'success' : 'default'} size="small" />
                            {isMobile && <Typography variant="caption" color="text.secondary"> {row.category} {row.assigned_first_name ? `• ${row.assigned_first_name}` : ''}</Typography>}
                          </Box>
                        </Box>
                      </Box>
                     </ListItem>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
           </List>

          {/* Load more */}
          {rows.length < total && (
            <Box sx={{ p: 1 }}>
              <Button fullWidth variant="outlined" onClick={handleLoadMore} disabled={loading}>
                {loading ? 'Loading...' : 'Load more'}
              </Button>
            </Box>
          )}
         </Paper>

         {/* Right: Preview */}
         <Paper sx={{ p: { xs: 1, md: 2 }, minHeight: { xs: 'auto', md: '72vh' }, overflowY: 'auto', borderRadius: 2, flex: 1.2, boxShadow: 2 }}>
           <Typography variant="subtitle1" sx={{ mb: 1 }}>Preview</Typography>
           {selectedPrayer ? (
             <>
               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                 <Box sx={{ minWidth: 0 }}>
                   <Typography variant="h6">{selectedPrayer.request_no || `#${selectedPrayer.id}`}</Typography>
                   <Typography variant="body2" color="text.secondary" noWrap>{selectedPrayer.category}</Typography>
                   <Typography variant="caption" color="text.secondary">
                     {selectedPrayer.created_at ? DateTime.fromISO(selectedPrayer.created_at).toLocaleString(DateTime.DATETIME_MED) : ''}
                   </Typography>
                 </Box>
                 <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                   <Tooltip title="Assign"><IconButton onClick={() => handleAssign(selectedPrayer)}><UserPlus size={20} /></IconButton></Tooltip>
                   <Tooltip title="Close"><IconButton onClick={() => handleCloseReq(selectedPrayer)}><CheckCircle2 size={20} /></IconButton></Tooltip>
                   <Tooltip title="Add follow-up"><IconButton onClick={() => handleAddFollowup(selectedPrayer)}><PlusCircle size={20} /></IconButton></Tooltip>
                 </Box>
               </Box>
               <Divider sx={{ my: 1 }} />
               <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 2 }}>
                 <Chip label={`Urgency: ${selectedPrayer.urgency || 'Normal'}`} color={selectedPrayer.urgency === 'High' ? 'error' : 'primary'} />
                 <Chip label={`Status: ${selectedPrayer.status || 'Open'}`} color={selectedPrayer.status === 'Open' ? 'success' : 'default'} />
                 <Chip label={`Category: ${selectedPrayer.category}`} />
                 {selectedPrayer.assigned_first_name && <Chip label={`Assigned: ${selectedPrayer.assigned_first_name}`} color="info" />}
               </Box>
               <Typography variant="subtitle2">Description</Typography>
               <Typography sx={{ mb: 2 }}>{selectedPrayer.description || 'No description provided.'}</Typography>
               
               <Typography variant="subtitle2">Submitted by</Typography>
               <Typography sx={{ mb: 2 }}>
                 {selectedPrayer.anonymous ? 'Anonymous' : (selectedPrayer.first_name && selectedPrayer.surname ? `${selectedPrayer.first_name} ${selectedPrayer.surname}` : 'Unknown member')}
               </Typography>
               
               <Divider sx={{ my: 1 }} />
               <Typography variant="subtitle2">Follow-ups ({selectedPrayer.followups?.length || 0})</Typography>
               {selectedPrayer.followups?.length
                 ? selectedPrayer.followups.map(f => (
                   <Typography key={f.id}>• {f.note} — {f.contacted_at ? DateTime.fromISO(f.contacted_at).toLocaleString(DateTime.DATETIME_MED) : ''}</Typography>
                 ))
                 : <Typography color="text.secondary">No follow-ups</Typography>
               }
               <Divider sx={{ my: 1 }} />
               <Typography variant="subtitle2">Audit ({selectedPrayer.audit?.length || 0})</Typography>
               {selectedPrayer.audit?.length
                 ? selectedPrayer.audit.map(a => (
                   <Typography key={a.id}>• {a.action} — {a.created_at ? DateTime.fromISO(a.created_at).toLocaleString(DateTime.DATETIME_MED) : ''}</Typography>
                 ))
                 : <Typography color="text.secondary">No audits</Typography>
               }
             </>
           ) : (
             <Typography color="text.secondary">Select a prayer request to view details</Typography>
           )}
         </Paper>
       </Box>

       {/* Dialogs */}
       <MemberSelectDialog open={memberPicker.open} onClose={onMemberSelected} preselectedId={null} preferredRole="pastor" />
       <CloseRequestDialog open={closeDialog.open} prayer={closeDialog.prayer} onClose={() => setCloseDialog({ open: false, prayer: null })} onClosed={onClosed} />
       <AddFollowupDialog open={followupDialog.open} prayer={followupDialog.prayer} onClose={() => setFollowupDialog({ open: false, prayer: null })} onAdded={onFollowupAdded} />

       <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
         <Alert severity={snack.severity}>{snack.message}</Alert>
       </Snackbar>
     </Box>
  );
}
