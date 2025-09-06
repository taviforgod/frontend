import React, { useState, useContext } from 'react';
import {
  Box,
  Avatar,
  Typography,
  Chip,
  Stack,
  IconButton,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  EditIcon,
  DeleteIcon
} from '../../Shared/Icons';
import ConfirmDialog from '../../Shared/ConfirmDialog';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import { AuthContext } from '../../contexts/AuthContext';
import { deleteMember } from '../../services/memberService';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AddMilestoneDialog from '../AddMilestoneDialog';
import MemberMilestoneChecklist from '../MemberMilestoneChecklist';

export default function MemberDetailPanel({
  member,
  onEdit,
  onDelete,
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [milestoneChecklistOpen, setMilestoneChecklistOpen] = useState(false);
  const [addMilestoneOpen, setAddMilestoneOpen] = useState(false);
  const [milestoneRefreshTrigger, setMilestoneRefreshTrigger] = useState(0);

  // Retrieve permissions from AuthContext
  const { permissions = [] } = useContext(AuthContext) || {};
  const canEdit = true;
  const canDelete = true;

  const theme = useTheme();

  const handleDelete = async () => {
    try {
      await deleteMember(member.id);
      setSnackbar({ open: true, message: 'Member deleted', severity: 'success' });
      if (onDelete) onDelete(member.id);
    } catch (err) {
      setSnackbar({ open: true, message: 'Delete failed', severity: 'error' });
    }
    setConfirmOpen(false);
  };

  // Helper to show date or fallback
  const showDate = (date) => {
    if (!date) return 'Not Available';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Not Available' : d.toLocaleDateString();
  };

  if (!member) return <Typography>No member selected.</Typography>;

  return (
    <Box sx={{ p: 2, borderRadius: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          pb: 1,
          borderBottom: '1px solid #eee',
        }}
      >
        <Typography variant="h5">Member Details</Typography>
        <Box>
          {canEdit && (
            <IconButton
              onClick={() => onEdit(member)}
              sx={{ mr: 1 }}
            >
              <EditIcon size={20} style={{ color: theme.palette.primary.main }} />
            </IconButton>
          )}
          {canDelete && (
            <IconButton
              onClick={() => setConfirmOpen(true)}
            >
              <DeleteIcon size={20} style={{ color: theme.palette.error.main }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Avatar and Name */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar
          src={member.profile_picture_url}
          sx={{ width: 64, height: 64, mr: 2 }}
        >
          {member.first_name?.[0]}{member.surname?.[0]}
        </Avatar>
        <Box>
          <Typography variant="h6">
            {member.first_name} {member.surname}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            {/* Member Type Chip */}
            <Chip
              label={member.member_type?.replace('_', ' ') || 'N/A'}
              size="small"
              variant="outlined"
              sx={{
                borderColor:
                  member.member_type === 'member'
                    ? 'green'
                    : member.member_type === 'first_timer'
                    ? 'orange'
                    : member.member_type === 'new_convert'
                    ? 'purple'
                    : 'gray',
                color:
                  member.member_type === 'member'
                    ? 'green'
                    : member.member_type === 'first_timer'
                    ? 'orange'
                    : member.member_type === 'new_convert'
                    ? 'purple'
                    : 'gray',
              }}
            />
            {/* Status Chip */}
            <Chip
              label={member.status || 'N/A'}
              size="small"
              variant="outlined"
              sx={{
                borderColor:
                  member.status === 'active'
                    ? 'green'
                    : member.status === 'inactive'
                    ? 'red'
                    : 'gray',
                color:
                  member.status === 'active'
                    ? 'green'
                    : member.status === 'inactive'
                    ? 'red'
                    : 'gray',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Details */}
      <Stack spacing={2} mb={2}>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">Email</Typography>
          <Typography>{member.email || 'N/A'}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">Phone</Typography>
          <Typography>{member.contact_primary || 'N/A'}</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold">Address</Typography>
          <Typography>{member.physical_address || 'N/A'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" component="div">Joined</Typography>
            <Typography component="div">
              {showDate(member.date_joined_church)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" component="div">Born Again</Typography>
            <Typography component="div">
              {showDate(member.date_born_again)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" component="div">DOB</Typography>
            <Typography component="div">
              {showDate(member.date_of_birth)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" component="div">Gender</Typography>
            <Typography component="div">{member.gender || 'N/A'}</Typography>
          </Box>
        </Box>
      </Stack>

      <Divider sx={{ my: 3 }} />

      {/* Milestone Icon: opens checklist modal */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
        <Tooltip title="View/Add Milestones">
          <IconButton
            onClick={() => setMilestoneChecklistOpen(true)}
            sx={{ mr: 1 }}
          >
            <EmojiEventsIcon fontSize="small" color="warning" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Milestone Checklist Modal */}
      <Dialog
        open={milestoneChecklistOpen}
        onClose={() => setMilestoneChecklistOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Milestones for {member.first_name} {member.surname}
        </DialogTitle>
        <DialogContent>
          <MemberMilestoneChecklist
            memberId={member.id}
            onAddClick={() => setAddMilestoneOpen(true)}
            refresh={milestoneRefreshTrigger}
          />
        </DialogContent>
      </Dialog>

      {/* Add Milestone Modal (nested) */}
      <AddMilestoneDialog
        open={addMilestoneOpen}
        onClose={() => setAddMilestoneOpen(false)}
        memberId={member.id}
        onSuccess={() => {
          setAddMilestoneOpen(false);
          setMilestoneRefreshTrigger(prev => prev + 1);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Member"
        content="Are you sure you want to delete this member?"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
      <SnackbarAlert
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      />
    </Box>
  );
}