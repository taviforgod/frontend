import React, { useEffect, useState, useContext } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  List,
  ListItem,
  Box,
  IconButton,
  CircularProgress,
  Button,
  Chip,
  Stack,
  Divider,
  Avatar,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getEvaluations } from '../../services/leadershipService';
import { AuthContext } from '../../contexts/AuthContext';
import StarIcon from '@mui/icons-material/Star';

const typeColors = {
  peer: 'primary',
  self: 'info',
  supervisor: 'success',
};

export default function LeaderEvaluationsModal({ open, onClose, leaderId }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { fetchWithAuth } = useContext(AuthContext) || {};

  useEffect(() => {
    if (open && leaderId) {
      setLoading(true);
      getEvaluations(fetchWithAuth, leaderId)
        .then(data => setEvaluations(data || []))
        .catch(() => setEvaluations([]))
        .finally(() => setLoading(false));
    }
  }, [open, leaderId, fetchWithAuth]);

  // Compute average score for this leader
  const avgScore = evaluations.length
    ? (
        evaluations.reduce(
          (sum, e) =>
            sum +
            (Number(e.spiritual_maturity) +
              Number(e.relational_health) +
              Number(e.discipleship) +
              Number(e.growth_potential)) /
              4,
          0
        ) / evaluations.length
      ).toFixed(2)
    : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: "#fff",
          boxShadow: 4,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h6" fontWeight={600}>Leader Evaluations</Typography>
          {avgScore && (
            <Tooltip title="Average Score">
              <Chip
                icon={<StarIcon sx={{ color: '#ffb300' }} />}
                label={avgScore}
                color="warning"
                sx={{ fontWeight: 700, fontSize: 16, px: 2 }}
              />
            </Tooltip>
          )}
        </Stack>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: theme => theme.palette.grey[600],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ px: { xs: 2, sm: 4 }, py: 2, bgcolor: '#f6f7fb' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : evaluations.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            No evaluations found.
          </Typography>
        ) : (
          <List disablePadding>
            {evaluations.map((evalItem, idx) => (
              <React.Fragment key={evalItem.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 0,
                    py: 2,
                    borderRadius: 2,
                    bgcolor: "#fff",
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 2,
                    boxShadow: 1,
                    '&:hover': { boxShadow: 3, bgcolor: '#f0f6ff' },
                    transition: 'all 0.2s',
                  }}
                  disableGutters
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start" width="100%">
                    <Avatar sx={{ bgcolor: '#0073ea', mt: 0.5 }}>
                      {evalItem.evaluator_name?.[0] || '?'}
                    </Avatar>
                    <Box flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                        <Chip
                          label={evalItem.type.charAt(0).toUpperCase() + evalItem.type.slice(1)}
                          color={typeColors[evalItem.type] || "default"}
                          variant="filled"
                          sx={{ fontWeight: 500, borderRadius: 2, textTransform: 'capitalize' }}
                        />
                        <Typography variant="subtitle2" fontWeight={600}>
                          {evalItem.evaluator_name || evalItem.evaluator_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {evalItem.evaluation_date?.substring(0, 10)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={2} mt={1} flexWrap="wrap">
                        <Chip label={`Spiritual Maturity: ${evalItem.spiritual_maturity}`} size="small" variant="outlined" color="primary" />
                        <Chip label={`Relational Health: ${evalItem.relational_health}`} size="small" variant="outlined" color="secondary" />
                        <Chip label={`Discipleship: ${evalItem.discipleship}`} size="small" variant="outlined" color="info" />
                        <Chip label={`Growth Potential: ${evalItem.growth_potential}`} size="small" variant="outlined" color="success" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Notes: {evalItem.notes || '—'}
                      </Typography>
                    </Box>
                  </Stack>
                </ListItem>
                {idx !== evaluations.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 2, bgcolor: '#f6f7fb' }}>
        <Button onClick={onClose} variant="contained" color="primary" sx={{ fontWeight: 600, borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
