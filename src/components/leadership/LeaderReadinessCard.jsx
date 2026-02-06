import React, { useEffect, useState, useContext } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  TextField
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../../contexts/AuthContext';
import { getReadiness as apiGetReadiness, requestApproval as apiRequestApproval, approveLeader as apiApproveLeader, rejectLeader as apiRejectLeader, getMilestoneTemplates as apiGetMilestoneTemplates, getMilestoneRecords as apiGetMilestoneRecords } from '../../services/leadershipService';

export default function LeaderReadinessCard({ leaderId, fetchWithAuth, showSnackbar }) {
  const theme = useTheme();
  const { permissions = [], user } = useContext(AuthContext) || {};

  const [loading, setLoading] = useState(true);
  const [readiness, setReadiness] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const [milestones, setMilestones] = useState([]);
  const [records, setRecords] = useState([]);

  const load = async () => {
    if (!fetchWithAuth || !leaderId) return;
    setLoading(true);
    try {
      const res = await apiGetReadiness(fetchWithAuth, leaderId);
      setReadiness(res?.readiness || null);

      // load milestone templates and records for suggested actions
      try {
        const tmpls = await apiGetMilestoneTemplates(fetchWithAuth);
        setMilestones(tmpls || []);
      } catch (e) {
        setMilestones([]);
      }
      try {
        const recs = await apiGetMilestoneRecords(fetchWithAuth, leaderId);
        setRecords(recs || []);
      } catch (e) {
        setRecords([]);
      }
    } catch (err) {
      console.error('Failed to load readiness', err);
      showSnackbar && showSnackbar(`Failed to load readiness: ${err.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderId, fetchWithAuth]);

  const handleRequestApproval = async () => {
    if (!fetchWithAuth || !leaderId) return;
    setSubmitting(true);
    try {
      const res = await apiRequestApproval(fetchWithAuth, leaderId);
      showSnackbar && showSnackbar(res?.message || 'Approval requested', 'success');
      setConfirmOpen(false);
      await load();
    } catch (err) {
      console.error('Request approval failed', err);
      showSnackbar && showSnackbar(`Request failed: ${err.message || err}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!fetchWithAuth || !leaderId) return;
    setSubmitting(true);
    try {
      const res = await apiApproveLeader(fetchWithAuth, leaderId, { reason: reason || null });
      showSnackbar && showSnackbar(res?.message || 'Leader approved', 'success');
      setApproveOpen(false);
      setReason('');
      await load();
    } catch (err) {
      console.error('Approve failed', err);
      showSnackbar && showSnackbar(`Approve failed: ${err.message || err}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!fetchWithAuth || !leaderId) return;
    setSubmitting(true);
    try {
      const res = await apiRejectLeader(fetchWithAuth, leaderId, { reason: reason || null });
      showSnackbar && showSnackbar(res?.message || 'Leader rejected', 'success');
      setRejectOpen(false);
      setReason('');
      await load();
    } catch (err) {
      console.error('Reject failed', err);
      showSnackbar && showSnackbar(`Reject failed: ${err.message || err}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const status = readiness?.status || readiness?.readiness_status || 'unknown';
  const score = readiness?.score ?? readiness?.readiness_score ?? null;

  const history = readiness?.history || [];

  // compute suggested next milestones (templates required for promotion not yet recorded)
  const completedTemplateIds = (records || []).map(r => r.template_id).filter(Boolean);
  const requiredTemplates = (milestones || []).filter(t => t.required_for_promotion);
  const nextMilestones = requiredTemplates.filter(t => !completedTemplateIds.includes(t.id));

  const canApprove = permissions.includes('update_member') && user?.id !== leaderId;

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>Leadership Readiness</Typography>}
      />
      <CardContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress variant="determinate" value={score ?? 0} size={80} thickness={6} />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="h6">{score !== null ? `${Math.round(score)}%` : '—'}</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Status</Typography>
                <Chip label={status} size="small" sx={{ mt: 0.5 }} />
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Breakdown
                  </Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography variant="caption">Evaluations avg: {readiness?.breakdown?.evalAvg ?? '0'}</Typography>
                    <Typography variant="caption">Has mentorship: {readiness?.breakdown?.hasMentorship ? 'Yes' : 'No'}</Typography>
                    <Typography variant="caption">Milestones completed: {readiness?.breakdown?.milestoneCount ?? 0}</Typography>
                  </Stack>
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => setConfirmOpen(true)}
                disabled={status === 'pending' || status === 'approved'}
                sx={{ textTransform: 'none' }}
              >
                {status === 'pending' ? 'Approval Pending' : status === 'approved' ? 'Certified' : 'Request Approval'}
              </Button>

              {canApprove && (
                <>
                  <Button variant="outlined" size="small" color="success" onClick={() => setApproveOpen(true)} disabled={submitting}>
                    Approve
                  </Button>
                  <Button variant="outlined" size="small" color="error" onClick={() => setRejectOpen(true)} disabled={submitting}>
                    Reject
                  </Button>
                </>
              )}
            </Box>

            {/* Suggested actions */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Suggested actions</Typography>
              {nextMilestones.length > 0 ? (
                <List dense>
                  {nextMilestones.map((m) => (
                    <ListItem key={m.id}>
                      <ListItemText primary={m.name} secondary={m.description || ''} />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>No required milestones pending. Consider mentoring or arranging training.</Typography>
              )}
            </Box>

            {/* Audit trail */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Approval history</Typography>
              {history.length > 0 ? (
                <List dense>
                  {history.map((h) => (
                    <ListItem key={h.id}>
                      <ListItemText
                        primary={`${h.action.replace('_', ' ')}${h.actor_name ? ` by ${h.actor_name}` : ''}`}
                        secondary={`${h.reason ? `Reason: ${h.reason} • ` : ''}${new Date(h.created_at).toLocaleString()}`}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>No approval activity yet.</Typography>
              )}
            </Box>
          </Box>
        )}

        <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
          <DialogTitle>Request Approval</DialogTitle>
          <DialogContent>
            <Typography variant="body2">Request approval to certify you as a leader. This will notify your supervisor for review.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleRequestApproval} variant="contained" disabled={submitting}>
              {submitting ? 'Requesting...' : 'Confirm'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={approveOpen} onClose={() => setApproveOpen(false)}>
          <DialogTitle>Approve Leader</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>Add an optional note or reason for approval.</Typography>
            <TextField fullWidth multiline minRows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional note" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleApprove} variant="contained" disabled={submitting}>{submitting ? 'Approving...' : 'Approve'}</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)}>
          <DialogTitle>Reject Leader</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>Provide a reason for rejection (required).</Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection (required)"
              error={!reason.trim()}
              helperText={!reason.trim() ? 'Reason is required' : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleReject} variant="contained" color="error" disabled={submitting || !reason.trim()}>{submitting ? 'Rejecting...' : 'Reject'}</Button>
          </DialogActions>
        </Dialog>

      </CardContent>
    </Card>
  );
}
