import React, { useEffect, useState, useContext, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Autocomplete,
  IconButton, List, ListItem, ListItemText, ListItemAvatar, Avatar,
  Divider, Chip, Snackbar, Alert, Tooltip, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import { AuthContext } from '../../contexts/AuthContext';
import {
  getRoles as getLeaderAssignments,
  addRole, updateRole as updateRoleService, deleteRole as deleteRoleService
} from '../../services/leadershipService';
import { getMembers } from '../../services/memberService';
import { getRoles as getRoleTypes } from '../../services/roleService';
import LeadershipMilestonesModal from './LeadershipMilestones.jsx';
import MentorshipAssignmentsModal from './MentorshipAssignments.jsx';
import LeaderEvaluationsModal from './LeaderEvaluations.jsx';
import EvaluationForm from './EvaluationForm.jsx';

export default function LeaderList({ onSelectLeader }) {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  // Data
  const [leaders, setLeaders] = useState([]);
  const [members, setMembers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [selectedLeader, setSelectedLeader] = useState(null);

  // Add leader
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [newLeader, setNewLeader] = useState({ first_name: '', surname: '', role: '', member_id: '' });

  // Edit
  const [editOpen, setEditOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  const [editingData, setEditingData] = useState({ role: '', notes: '' });

  // Modal states
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [mentorshipOpen, setMentorshipOpen] = useState(false);
  const [evaluationsOpen, setEvaluationsOpen] = useState(false);
  const [evaluationFormOpen, setEvaluationFormOpen] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  // Fetch leaders
  const refreshLeaders = async () => {
    try {
      const data = await getLeaderAssignments(fetchWithAuth);
      setLeaders(data || []);
    } catch {
      setLeaders([]);
    }
  };

  useEffect(() => { refreshLeaders(); }, [fetchWithAuth]);

  // Fetch members + roles
  useEffect(() => {
    getRoleTypes(fetchWithAuth).then(data => setAllRoles(data || [])).catch(() => setAllRoles([]));
    if (showAdd) {
      getMembers(fetchWithAuth).then(data => setMembers(data || [])).catch(() => setMembers([]));
    }
  }, [showAdd, fetchWithAuth]);

  const handleMemberChange = (event, value) => {
    setSelectedMember(value);
    if (value) {
      setNewLeader({
        ...newLeader,
        first_name: value.first_name,
        surname: value.surname,
        member_id: value.id,
      });
    } else setNewLeader({ ...newLeader, first_name: '', surname: '', member_id: '' });
  };

  const handleAddLeader = async () => {
    try {
      await addRole(fetchWithAuth, newLeader);
      setShowAdd(false);
      setNewLeader({ first_name: '', surname: '', role: '', member_id: '' });
      setSelectedMember(null);
      await refreshLeaders();
      setSnack({ open: true, message: 'Leader added', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Failed to add leader', severity: 'error' });
    }
  };

  const openEdit = (leader) => {
    setEditingLeader(leader);
    setEditingData({ role: leader.role || '', notes: leader.notes || '' });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingLeader) return;
    try {
      await updateRoleService(fetchWithAuth, editingLeader.id, editingData);
      setEditOpen(false);
      setEditingLeader(null);
      setEditingData({ role: '', notes: '' });
      await refreshLeaders();
      setSnack({ open: true, message: 'Leader updated', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Failed to update leader', severity: 'error' });
    }
  };

  const handleDelete = async (leader) => {
    if (!leader) return;
    const ok = window.confirm(`Delete "${leader.role}" for ${leader.first_name} ${leader.surname}?`);
    if (!ok) return;
    try {
      await deleteRoleService(fetchWithAuth, leader.id);
      await refreshLeaders();
      setSnack({ open: true, message: 'Leader deleted', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Failed to delete leader', severity: 'error' });
    }
  };

  const handleEvaluate = () => {
    if (!selectedLeader) return;
    setEvaluationFormOpen(true);
  };

  const handleViewEvaluations = () => {
    if (!selectedLeader) return;
    setEvaluationsOpen(true);
  };

  const handleViewMilestones = () => {
    if (!selectedLeader) return;
    setMilestoneOpen(true);
  };

  const handleViewMentorship = () => {
    if (!selectedLeader) return;
    setMentorshipOpen(true);
  };
  
  const filteredLeaders = useMemo(() => leaders, [leaders]);

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      {/* Panel 1: Add/Search */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
          <TextField size="small" placeholder="Search leader..." sx={{ flex: 1 }} />
          <Button variant="contained" onClick={() => setShowAdd(s => !s)}>{showAdd ? 'Close' : 'Add Leader'}</Button>
        </Box>

        {showAdd && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexDirection: isMobile ? 'column' : 'row', alignItems: 'center' }}>
            <Autocomplete
              options={members}
              getOptionLabel={o => `${o.first_name} ${o.surname}`}
              value={selectedMember}
              onChange={handleMemberChange}
              renderInput={params => <TextField {...params} label="Select Member" size="small" />}
              sx={{ width: isMobile ? '100%' : 250 }}
            />
            <Autocomplete
              options={allRoles}
              getOptionLabel={o => o.name}
              value={allRoles.find(r => r.name === newLeader.role) || null}
              onChange={(e, value) => setNewLeader({ ...newLeader, role: value ? value.name : '' })}
              renderInput={params => <TextField {...params} label="Role" size="small" />}
              sx={{ width: isMobile ? '100%' : 180 }}
            />
            <Button variant="contained" onClick={handleAddLeader} disabled={!newLeader.member_id || !newLeader.role}>Save</Button>
          </Box>
        )}
      </Paper>

      {/* Panels 2 + 3: List + Info */}
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, height: { xs: 'auto', md: '70vh' } }}>
        {/* Panel 2: Leader List */}
        <Paper sx={{ flex: 1, overflow: 'auto', borderRadius: 2 }}>
          <List>
            {filteredLeaders.map(leader => (
              <ListItem key={leader.id} button selected={selectedLeader?.id === leader.id} onClick={() => { setSelectedLeader(leader); onSelectLeader?.(leader); }}>
                <ListItemAvatar>
                  <Avatar>{(leader.first_name || '?')[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={`${leader.first_name} ${leader.surname}`} secondary={leader.role} />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Panel 3: Leader Info + Actions */}
        <Paper sx={{ flex: 1, p: 2, overflow: 'auto', borderRadius: 2 }}>
          {selectedLeader ? (
            <>
              {/* Header with leader info + top action icons (Edit / Delete only) */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6">{selectedLeader.first_name} {selectedLeader.surname}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">{selectedLeader.role}</Typography>
                </Box>

                {/* Top action icons: keep Edit and Delete here */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Edit Leader">
                    <IconButton onClick={() => openEdit(selectedLeader)}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete / Deactivate">
                    <IconButton onClick={() => {
                      if (window.confirm(`Delete / deactivate role "${selectedLeader.role}" for ${selectedLeader.first_name} ${selectedLeader.surname}?`)) {
                        handleDelete(selectedLeader);
                      }
                    }}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Leader details */}
              <Typography variant="subtitle2">Notes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedLeader.notes || 'No notes provided.'}
              </Typography>

              {/* Add other info or chips if needed */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                <Chip label={`Role: ${selectedLeader.role}`} color="primary" />
                {selectedLeader.assigned_to && <Chip label={`Assigned: ${selectedLeader.assigned_to}`} color="info" />}
              </Box>

              {/* Bottom action icons: evaluate, view evaluations, view milestones, view mentorship */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Evaluate Leader">
                  <IconButton onClick={handleEvaluate}>
                    <CheckCircleOutlineIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="View Evaluations">
                  <IconButton onClick={handleViewEvaluations}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="View Milestones">
                  <IconButton onClick={handleViewMilestones}>
                    <EmojiEventsIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="View Mentorship Assignments">
                  <IconButton onClick={handleViewMentorship}>
                    <GroupIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          ) : (
            <Typography color="text.secondary">Select a leader to see details</Typography>
          )}
        </Paper>
      </Box>

      {/* Modals */}
      {selectedLeader && (
        <>
          <EvaluationForm
            open={evaluationFormOpen}
            onClose={() => setEvaluationFormOpen(false)}
            leader={selectedLeader}
          />
          <LeaderEvaluationsModal
            open={evaluationsOpen}
            onClose={() => setEvaluationsOpen(false)}
            leaderId={selectedLeader.member_id}
          />
          <LeadershipMilestonesModal
            memberId={selectedLeader.member_id}
            open={milestoneOpen}
            onClose={() => setMilestoneOpen(false)}
          />
          <MentorshipAssignmentsModal
            leaderId={selectedLeader.member_id}
            open={mentorshipOpen}
            onClose={() => setMentorshipOpen(false)}
          />
        </>
      )}

      {/* Edit Modal */}
      <Dialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            margin: isMobile ? 1 : 'auto',
            width: isMobile ? 'calc(100% - 16px)' : 'auto',
          }
        }}
      >
        <DialogTitle>Edit Leader</DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            fullWidth
            options={allRoles}
            getOptionLabel={o => o.name}
            value={allRoles.find(r => r.name === editingData.role) || null}
            onChange={(e, value) => setEditingData({ ...editingData, role: value ? value.name : '' })}
            renderInput={params => <TextField {...params} label="Role" />}
          />
          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={4}
            value={editingData.notes}
            onChange={(e) => setEditingData({ ...editingData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: isMobile ? 'column' : 'row', gap: 1 }}>
          <Button 
            onClick={() => setEditOpen(false)}
            fullWidth={isMobile}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained"
            fullWidth={isMobile}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
