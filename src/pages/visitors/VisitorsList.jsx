// src/pages/VisitorsList.jsx
import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
import {
  Box, Typography, Grid, Paper, CircularProgress, Button, TextField, Select, MenuItem,
  FormControl, InputLabel, Pagination, Divider, useMediaQuery, Card,
  Snackbar, Alert
} from '@mui/material';
import { Download } from 'lucide-react';
import { listVisitors, deleteVisitor, convertVisitor } from '../../services/visitorService';
import { getCellGroups } from '../../services/cellGroupService';
import { getMembers } from '../../services/memberService';
import AddVisitorStepper from '../../components/visitors/AddVisitorStepper';
import FollowUpModal from '../../components/visitors/FollowUpModal';
import VisitorCard from '../../components/visitors/VisitorCard';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';

export default function VisitorsList() {
  const [visitors, setVisitors] = useState([]);
  const [groups, setGroups] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [addOpen, setAddOpen] = useState(false);
  const [fuOpen, setFuOpen] = useState(false);
  const [fuVisitor, setFuVisitor] = useState(null);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // snackbar for user feedback
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const handleCloseSnack = (_, reason) => { if (reason === 'clickaway') return; setSnack(s => ({ ...s, open: false })); };

  const { mode, theme } = useContext(ThemeContext);
  const { fetchWithAuth } = useContext(AuthContext);
  const leftPanelRef = useRef(null);

  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const reload = async () => {
    setLoading(true);
    try {
      const [v, g] = await Promise.all([
        listVisitors(fetchWithAuth, { limit: 1000 }),
        getCellGroups(fetchWithAuth, { limit: 1000 })
      ]);
      setVisitors(Array.isArray(v) ? v : []);
      setGroups(Array.isArray(g) ? g : []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, [fetchWithAuth]);
  useEffect(() => { getMembers(fetchWithAuth).then(setMembers).catch(() => setMembers([])); }, [fetchWithAuth]);

  const normalized = useMemo(() => visitors.map(v => ({
    ...v,
    first_name: v.first_name || '',
    surname: v.surname || '',
    cell_group_name: v.cell_group_name || '',
    followup_count: v.followup_count ?? v.follow_up_count ?? 0,
    last_followup_date: v.last_followup_date || null,
    follow_up_status_calculated: v.follow_up_status_calculated || v.follow_up_status || (v.followup_count >= 3 ? 'done' : v.followup_count > 0 ? 'in_progress' : 'pending')
  })), [visitors]);

  const filtered = useMemo(() => {
    let arr = [...normalized];
    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter(v => (v.first_name || '').toLowerCase().includes(q) || (v.surname || '').toLowerCase().includes(q) || (v.cell_group_name || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'needs_attention') {
        arr = arr.filter(v => {
          const last = v.last_followup_date ? new Date(v.last_followup_date) : null;
          if (!last) return true;
          const days = (Date.now() - last.getTime())/(1000*60*60*24);
          return days >= 14;
        });
      } else {
        arr = arr.filter(v => v.follow_up_status_calculated === statusFilter);
      }
    }
    if (groupFilter !== 'all') arr = arr.filter(v => Number(v.cell_group_id) === Number(groupFilter));
    return arr;
  }, [normalized, search, statusFilter, groupFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = useMemo(() => {
    const start = (page-1)*pageSize;
    return filtered.slice(start, start+pageSize);
  }, [filtered, page, pageSize]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete visitor?')) return;
    if (!fetchWithAuth) { alert('Not authenticated'); return; }
    try {
      await deleteVisitor(fetchWithAuth, id); // changed: pass fetchWithAuth first
      if (selectedVisitor?.id === id) setSelectedVisitor(null);
      setSnack({ open: true, message: 'Visitor deleted', severity: 'success' });
      await reload();
    } catch (err) { console.error(err); alert('Delete failed'); }
  };

  const handleConvert = async (v) => {
    if (!v || !v.id) {
      alert('Visitor ID is required to convert.');
      return;
    }
    if (!fetchWithAuth) {
      alert('Not authenticated');
      return;
    }
    if (!v.cell_group_id) {
      alert('Assign a cell before converting');
      return;
    }
    try {
      const res = await convertVisitor(fetchWithAuth, v.id); // pass fetchWithAuth first
      if (selectedVisitor?.id === v.id) setSelectedVisitor(null);
      // show success message when backend returns success
      if (res && res.success) {
        const name = `${res.member?.first_name || ''} ${res.member?.surname || ''}`.trim();
        setSnack({ open: true, message: name ? `Converted to member ${name}` : 'Visitor converted', severity: 'success' });
      } else {
        setSnack({ open: true, message: 'Conversion completed', severity: 'success' });
      }
      await reload();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err?.message || 'Conversion failed', severity: 'error' });
    }
  };

  const handleExport = () => {
    const rows = filtered.map(v => [v.first_name, v.surname, v.contact_primary||'', v.cell_group_name||'', v.followup_count||0, v.follow_up_status_calculated||'']);
    const csv = [['First name','Surname','Phone','Cell','Followups','Status'], ...rows].map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'visitors.csv'; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <>
      <Box
        sx={{
          p: isMobile ? 1 : 3,
          bgcolor: mode === 'dark' ? theme.palette.background.default : '#f9f9f9',
          minHeight: '100vh',
          transition: 'background 0.2s'
        }}
      >
        {/* Filters, Export, Add in one card */}
        <Card
          sx={{
            p: isMobile ? 1 : 2,
            mb: isMobile ? 1 : 3,
            boxShadow: 2,
            borderRadius: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: 2,
            bgcolor: mode === 'dark' ? theme.palette.background.paper : '#fff'
          }}
        >
          {/* Filters stretched */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            flexGrow: 1,
            minWidth: 0,
            flexDirection: isMobile ? 'column' : 'row'
          }}>
            <TextField
              placeholder="Search by name"
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              sx={{
                minWidth: 160,
                flex: 1,
                bgcolor: mode === 'dark' ? theme.palette.background.default : undefined
              }}
            />
            <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel>Cell Group</InputLabel>
              <Select label="Cell Group" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                {groups.map(g => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="needs_attention">Needs Attention</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="done">Done</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* Export and Add buttons */}
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={handleExport}
            sx={{ mt: isMobile ? 1 : 0 }}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
            sx={{ mt: isMobile ? 1 : 0 }}
          >
            Add Visitor
          </Button>
        </Card>

        <Grid container spacing={isMobile ? 1 : 2}>
          {/* LEFT PANEL */}
          <Grid item xs={12} md={5}>
            <Paper
              ref={leftPanelRef}
              sx={{
                p: isMobile ? 1 : 2,
                maxHeight: isMobile ? 'auto' : '75vh',
                overflowY: isMobile ? 'visible' : 'auto',
                borderRadius: 2,
                boxShadow: 3,
                bgcolor: mode === 'dark' ? theme.palette.background.paper : '#fff',
                transition: 'background 0.2s'
              }}
            >
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <CircularProgress />
                </Box>
              ) : paginated.length === 0 ? (
                <Typography sx={{ textAlign: 'center', mt: 2 }}>No visitors found</Typography>
              ) : (
                paginated.map(v => (
                  <Paper
                    key={v.id}
                    sx={{
                      mb: 1,
                      p: isMobile ? 1 : 2,
                      cursor: 'pointer',
                      transition: '0.2s',
                      bgcolor: selectedVisitor?.id === v.id
                        ? theme.palette.primary[mode === 'dark' ? 'dark' : 'light']
                        : (mode === 'dark' ? theme.palette.background.default : 'background.paper'),
                      color: selectedVisitor?.id === v.id ? theme.palette.primary.contrastText : undefined,
                      boxShadow: selectedVisitor?.id === v.id ? 4 : 1,
                      '&:hover': {
                        boxShadow: 6,
                        bgcolor: theme.palette.primary.dark,
                        color: theme.palette.primary.contrastText
                      },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: 'none'
                    }}
                    onClick={() => setSelectedVisitor(v)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>{v.first_name} {v.surname}</Typography>
                      <Typography variant="body2" color="textSecondary">{v.cell_group_name || '-'}</Typography>
                    </Box>
                  </Paper>
                ))
              )}

              {totalPages > 1 && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination count={totalPages} page={page} onChange={(e, val) => setPage(val)} />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* RIGHT PANEL */}
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                p: isMobile ? 1 : 3,
                borderRadius: 2,
                minHeight: isMobile ? 'auto' : '75vh',
                mt: isMobile ? 2 : 0,
                bgcolor: mode === 'dark' ? theme.palette.background.paper : '#fff',
                boxShadow: 'none',
                border: 'none',
                transition: 'background 0.2s'
              }}
            >
              {selectedVisitor ? (
                <VisitorCard
                  visitor={selectedVisitor}
                  onEdit={() => setEditOpen(true)}
                  onFollowUp={v => {
                    setFuVisitor(v);
                    setFuOpen(true);
                    if (isMobile && leftPanelRef.current) window.scrollTo({ top: leftPanelRef.current.offsetTop, behavior: 'smooth' });
                  }}
                  onConvert={handleConvert}
                  onDelete={handleDelete}
                />
              ) : (
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <Typography variant="h6" color="textSecondary">Select a visitor to see details</Typography>
                </Box>
              )}
              {/* Edit modal for visitor */}
              <AddVisitorStepper
                open={editOpen}
                onClose={async () => { setEditOpen(false); await reload(); }}
                initialGroupId={selectedVisitor?.cell_group_id || null}
                initialData={selectedVisitor}
                editMode={true}
                churchId={selectedVisitor?.church_id || null}
                onSubmit={async (payload) => {
                  setEditOpen(false);
                  await reload();
                }}
              />
            </Box>
          </Grid>
        </Grid>

        <AddVisitorStepper open={addOpen} onClose={async () => { setAddOpen(false); await reload(); }} initialGroupId={null} />
        {fuVisitor && (
          <FollowUpModal
            open={fuOpen}
            visitor={fuVisitor}
            onClose={() => { setFuOpen(false); setFuVisitor(null); }}
            onSaved={reload}
            members={members}
          />
        )}
      </Box>
      {/* render snackbar */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={handleCloseSnack}>
        <Alert onClose={handleCloseSnack} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
