import React, { useEffect, useState, useContext } from 'react';
import { Box, Card, CardHeader, CardContent, List, ListItem, ListItemText, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography, CircularProgress, Snackbar, Alert, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';
import { getPendingApprovals as apiGetPending, approveLeader as apiApprove, rejectLeader as apiReject, getZones as apiGetZones } from '../../services/leadershipService';

export default function ApprovalsInbox() {
  const { fetchWithAuth, user, permissions } = useContext(AuthContext) || {};
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // paging & filters
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [status, setStatus] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [zones, setZones] = useState([]);
  const [pageInput, setPageInput] = useState(1);

  // inline reject state
  const [inlineReject, setInlineReject] = useState({ open: false, item: null, reason: '' });

  // fetch zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      if (!fetchWithAuth) return;
      try {
        const res = await apiGetZones(fetchWithAuth).catch(() => []);
        const zoneArr = Array.isArray(res) ? res : (res?.zones || res?.data || []);
        setZones((zoneArr || []).map(z => ({ id: z.id, name: z.name || z.zone_name || `Zone ${z.id}` })));
      } catch (e) {
        console.debug('getZones failed', e?.message || e);
      }
    };
    fetchZones();
  }, [fetchWithAuth]);

  // keep pageInput in sync
  useEffect(() => { setPageInput(page + 1); }, [page]);
  const load = async (opts = {}) => {
    if (!fetchWithAuth) return;
    setLoading(true);
    try {
      const res = await apiGetPending(fetchWithAuth, {
        page: opts.page ?? page,
        limit: opts.limit ?? limit,
        search: typeof opts.search !== 'undefined' ? opts.search : search,
        minScore: typeof opts.minScore !== 'undefined' ? opts.minScore : (minScore === '' ? null : Number(minScore)),
        maxScore: typeof opts.maxScore !== 'undefined' ? opts.maxScore : (maxScore === '' ? null : Number(maxScore)),
        status: typeof opts.status !== 'undefined' ? opts.status : (status === '' ? null : status),
        zoneId: typeof opts.zoneId !== 'undefined' ? opts.zoneId : (zoneId === '' ? null : Number(zoneId))
      });
      setPending(res?.pending || []);
      setPage(res?.page ?? (opts.page ?? page));
      setLimit(res?.limit ?? (opts.limit ?? limit));
      setHasMore(Boolean(res?.hasMore));
      setTotal(Number(res?.total || 0));
    } catch (err) {
      console.error('Failed to load pending approvals', err);
      setSnackbar({ open: true, message: err?.message || 'Failed to load pending approvals', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [fetchWithAuth]);

  const handleApprove = async (item) => {
    if (!fetchWithAuth || !item) return;
    setSubmitting(true);
    try {
      const res = await apiApprove(fetchWithAuth, item.leader_id, { reason });
      setSnackbar({ open: true, message: res?.message || 'Approved', severity: 'success' });
      await load();
      setSelected(null);
      setReason('');
    } catch (err) {
      console.error('Approve failed', err);
      setSnackbar({ open: true, message: err?.message || 'Approve failed', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (item) => {
    if (!fetchWithAuth || !item) return;
    setSubmitting(true);
    try {
      const res = await apiReject(fetchWithAuth, item.leader_id, { reason });
      setSnackbar({ open: true, message: res?.message || 'Rejected', severity: 'success' });
      await load();
      setSelected(null);
      setReason('');
    } catch (err) {
      console.error('Reject failed', err);
      setSnackbar({ open: true, message: err?.message || 'Reject failed', severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!permissions?.includes('update_member')) {
    return (
      <Card>
        <CardHeader title="Approvals Inbox" />
        <CardContent>
          <Typography variant="body2">You do not have permission to view approvals.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={`Approvals Inbox (${pending.length})`} />
      <CardContent>
        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Leader name" onKeyDown={(e) => { if (e.key === 'Enter') load({ page: 0, search: e.target.value }); }} />
          <TextField size="small" label="Min score" type="number" value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="e.g. 60" onKeyDown={(e) => { if (e.key === 'Enter') load({ page: 0, minScore: e.target.value }); }} sx={{ width: 120 }} />
          <TextField size="small" label="Max score" type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="e.g. 90" onKeyDown={(e) => { if (e.key === 'Enter') load({ page: 0, maxScore: e.target.value }); }} sx={{ width: 120 }} />

          <FormControl size="small" sx={{ width: 160 }}>
            <InputLabel id="status-label">Status</InputLabel>
            <Select labelId="status-label" value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
              <MenuItem value="">Any</MenuItem>
              <MenuItem value="certified">Certified</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="not_started">Not Started</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel id="zone-label">Zone</InputLabel>
            <Select labelId="zone-label" value={zoneId} label="Zone" onChange={(e) => setZoneId(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              {zones.map(z => <MenuItem key={z.id} value={String(z.id)}>{z.name}</MenuItem>)}
            </Select>
          </FormControl>

          <TextField size="small" label="Per page" type="number" value={limit} onChange={(e) => setLimit(Number(e.target.value || 10))} onBlur={() => load({ page: 0, limit })} sx={{ width: 100 }} />
          <Button onClick={() => load({ page: 0, search, minScore, maxScore, status, zoneId, limit })}>Apply</Button>
          <Typography variant="caption" sx={{ ml: 2 }}>Total: {total}</Typography>
        </Box>

        {loading ? <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box> : (
          <List>
            {pending.length === 0 && <Typography variant="caption">No pending approvals.</Typography>}
            {pending.map((p) => (
              <ListItem key={p.leader_id} secondaryAction={<>
                <Button size="small" onClick={() => setSelected({ ...p, action: 'approve'})}>Approve</Button>
                <Button size="small" color="error" onClick={() => setSelected({ ...p, action: 'reject'})}>Reject</Button>
                <Button size="small" onClick={async () => {
                  // inline quick-approve with confirmation
                  // eslint-disable-next-line no-restricted-globals
                  if (!confirm(`Approve ${p.leader_name}?`)) return;
                  setSubmitting(true);
                  try {
                    await apiApprove(fetchWithAuth, p.leader_id, {});
                    setSnackbar({ open: true, message: 'Approved', severity: 'success' });
                    await load();
                  } catch (err) {
                    console.error('Quick approve failed', err);
                    setSnackbar({ open: true, message: err?.message || 'Approve failed', severity: 'error' });
                  } finally { setSubmitting(false); }
                }}>Quick Approve</Button>
                <Button size="small" color="error" onClick={() => setInlineReject({ open: true, item: p, reason: '' })}>Quick Reject</Button>
              </>}>
                <ListItemText primary={p.leader_name} secondary={`Requested at: ${new Date(p.requested_at).toLocaleString()} • Score: ${p.readiness_score ?? '—'}${p.zone_id ? ` • Zone: ${p.zone_id}` : ''}${p.readiness_status ? ` • ${p.readiness_status}` : ''}`} />
              </ListItem>
            ))}
          </List>
        )}

        <Box sx={{ display: 'flex', gap: 1, mt: 2, alignItems: 'center' }}>
          <Button disabled={page <= 0} onClick={() => load({ page: page - 1 })}>Prev</Button>
          <Typography variant="caption">Page {page + 1} of {Math.max(1, Math.ceil(total / Math.max(1, limit)))}</Typography>
          <TextField size="small" type="number" label="Go to" value={pageInput} onChange={(e) => setPageInput(Number(e.target.value || 1))} sx={{ width: 100 }} />
          <Button onClick={() => {
            const p = Math.max(1, Math.min(Math.max(1, Math.ceil(total / Math.max(1, limit))), Number(pageInput || 1)));
            load({ page: p - 1 });
          }}>Go</Button>
          <Button disabled={!hasMore} onClick={() => load({ page: page + 1 })}>Next</Button>
        </Box>

        <Dialog open={!!selected} onClose={() => setSelected(null)}>
          <DialogTitle>{selected?.action === 'approve' ? 'Approve Leader' : 'Reject Leader'}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>{selected?.leader_name}</Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={selected?.action === 'reject' ? 'Reason for rejection (required)' : 'Optional note'}
              error={selected?.action === 'reject' && !reason.trim()}
              helperText={selected?.action === 'reject' && !reason.trim() ? 'Reason is required' : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelected(null)} disabled={submitting}>Cancel</Button>
            {selected?.action === 'approve' ? (
              <Button variant="contained" onClick={() => handleApprove(selected)} disabled={submitting}>Confirm Approve</Button>
            ) : (
              <Button variant="contained" color="error" onClick={() => handleReject(selected)} disabled={submitting || !reason.trim()}>Confirm Reject</Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Inline quick reject dialog */}
        <Dialog open={inlineReject.open} onClose={() => setInlineReject({ open: false, item: null, reason: '' })} maxWidth="xs" fullWidth>
          <DialogTitle>Quick Reject</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>{inlineReject.item?.leader_name}</Typography>
            <TextField
              autoFocus
              fullWidth
              multiline
              minRows={2}
              value={inlineReject.reason}
              onChange={(e) => setInlineReject(ir => ({ ...ir, reason: e.target.value }))}
              placeholder={'Reason for rejection (required)'}
              error={!inlineReject.reason.trim()}
              helperText={!inlineReject.reason.trim() ? 'Reason is required' : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInlineReject({ open: false, item: null, reason: '' })} disabled={submitting}>Cancel</Button>
            <Button variant="contained" color="error" onClick={async () => {
              if (!inlineReject.reason.trim() || !inlineReject.item) return;
              setSubmitting(true);
              try {
                await apiReject(fetchWithAuth, inlineReject.item.leader_id, { reason: inlineReject.reason });
                setSnackbar({ open: true, message: 'Rejected', severity: 'success' });
                setInlineReject({ open: false, item: null, reason: '' });
                await load();
              } catch (err) {
                console.error('Inline reject failed', err);
                setSnackbar({ open: true, message: err?.message || 'Reject failed', severity: 'error' });
              } finally { setSubmitting(false); }
            }} disabled={submitting || !inlineReject.reason.trim()}>Confirm Reject</Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for user feedback */}
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

      </CardContent>
    </Card>
  );
}