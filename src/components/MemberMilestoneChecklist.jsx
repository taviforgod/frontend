import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Chip, IconButton, Tooltip,
  Snackbar, Alert, CircularProgress, LinearProgress
} from '@mui/material';
import { Plus, Trash } from 'lucide-react';
import { getMilestonesByMember, deleteMilestone } from '../api/milestoneRecords';
import { getMilestoneTemplates } from '../api/milestoneTemplates';

export default function MemberMilestoneChecklist({ memberId, onAddClick, refresh }) {
  const [records, setRecords] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        getMilestonesByMember(memberId),
        getMilestoneTemplates()
      ]);
      setRecords(r);
      setTemplates(t.filter(temp => temp.required_for_promotion)); // 🔐 Only required
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to load milestones', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (memberId) load();
  }, [memberId, refresh, load]);

  const handleDelete = async (recordId) => {
    if (!window.confirm('Are you sure you want to remove this milestone?')) return;
    try {
      await deleteMilestone(recordId);
      setSnackbar({ open: true, message: 'Milestone removed.', severity: 'success' });
      load();
    } catch {
      setSnackbar({ open: true, message: 'Failed to remove milestone.', severity: 'error' });
    }
  };

  const isCompleted = (templateId) =>
    records.some((r) => r.template_id === templateId);

  const getRecordByTemplate = (templateId) =>
    records.find((r) => r.template_id === templateId);

  const completedCount = templates.filter(t => isCompleted(t.id)).length;
  const totalCount = templates.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h6">Milestones</Typography>
        <Tooltip title="Assign Milestone">
          <IconButton onClick={onAddClick} color="primary">
            <Plus size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <CircularProgress size={24} />
      ) : (
        <>
          {totalCount > 0 && (
            <Box mb={2}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                {completedCount} of {totalCount} completed ({progressPercent}%)
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{ height: 8, borderRadius: 5 }}
              />
            </Box>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {templates.map((t) => {
              const completed = isCompleted(t.id);
              const record = getRecordByTemplate(t.id);

              const completedAt = record?.completed_at
                ? new Date(record.completed_at).toLocaleDateString()
                : null;

              const assignedBy = record?.created_by_name;

              const tooltip = completed
                ? `Completed on: ${completedAt || 'Unknown'}${assignedBy ? `\nBy: ${assignedBy}` : ''}`
                : 'Not completed';

              return (
                <Tooltip key={t.id} title={tooltip}>
                  <Chip
                    label={t.name}
                    color={completed ? 'success' : 'default'}
                    variant={completed ? 'filled' : 'outlined'}
                    onDelete={completed ? () => handleDelete(record.id) : undefined}
                    deleteIcon={completed ? <Trash size={16} /> : undefined}
                  />
                </Tooltip>
              );
            })}
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
