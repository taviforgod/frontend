import React, { useState, useContext, useEffect } from 'react';
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
  Tabs,
  Tab,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Pencil as LucideEdit,
  Trash2 as LucideDelete,
  Medal as LucideMilestone,
  Users as LucideMentorship,
  BookOpen as LucideFoundation
} from 'lucide-react';
import ConfirmDialog from '../../Shared/ConfirmDialog';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import { AuthContext } from '../../contexts/AuthContext';
import { deleteMember as deleteMemberService, getMemberRelationships, deleteRelationship, getMemberDepartments, removeDepartment } from '../../services/memberService';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AddMilestoneDialog from '../spiritual/AddMilestoneDialog';
import MemberMilestoneChecklist from '../spiritual/MemberMilestones';
import MentorshipCard from '../spiritual/MentorshipCard';
import FoundationCard from '../spiritual/FoundationSchoolCard';
import AddRelationshipDialog from './AddRelationshipDialog';
import AssignDepartmentDialog from './AssignDepartmentDialog';

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
  const [activeTab, setActiveTab] = useState(0);
  const [mentorshipOpen, setMentorshipOpen] = useState(false);
  const [foundationOpen, setFoundationOpen] = useState(false);

  // Data for relationships & departments
  const [relationships, setRelationships] = useState([]);
  const [relationshipLoading, setRelationshipLoading] = useState(false);
  const [deptAssignments, setDeptAssignments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  // Dialogs
  const [addRelationshipOpen, setAddRelationshipOpen] = useState(false);
  const [assignDeptOpen, setAssignDeptOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Retrieve permissions and fetchWithAuth from AuthContext
  const { permissions = [], fetchWithAuth } = useContext(AuthContext) || {};
  const canEdit = true;
  const canDelete = true;

  // Load related data when tabs are activated
  useEffect(() => {
    const loadRelationships = async () => {
      if (!fetchWithAuth || !member?.id) return;
      setRelationshipLoading(true);
      try {
        const res = await fetchWithAuth(`/api/members/${member.id}/relationships`);
        if (!res.ok) throw new Error('Failed to fetch relationships');
        const data = await res.json();
        setRelationships(data || []);
      } catch (err) {
        console.error('Failed to load relationships', err);
      } finally {
        setRelationshipLoading(false);
      }
    };

    const loadDepartments = async () => {
      if (!fetchWithAuth || !member?.id) return;
      setDeptLoading(true);
      try {
        const res = await fetchWithAuth(`/api/members/${member.id}/departments`);
        if (!res.ok) throw new Error('Failed to fetch departments');
        const data = await res.json();
        setDeptAssignments(data || []);
      } catch (err) {
        console.error('Failed to load departments', err);
      } finally {
        setDeptLoading(false);
      }
    };

    if (activeTab === 1) loadRelationships();
    if (activeTab === 3) loadDepartments();
    if (activeTab === 6) loadRelationships(); // family members also rely on relationships
  }, [activeTab, fetchWithAuth, member?.id]);

  const theme = useTheme();

  const handleDelete = async () => {
    try {
      await deleteMemberService(fetchWithAuth, member.id);
      setSnackbar({ open: true, message: 'Member deleted', severity: 'success' });
      if (onDelete) onDelete(member.id);
    } catch (err) {
      setSnackbar({ open: true, message: err.message || 'Delete failed', severity: 'error' });
    }
    setConfirmOpen(false);
  };

  // Helper to show date or fallback
  const showDate = (date) => {
    if (!date) return 'Not Available';
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'Not Available' : d.toLocaleDateString();
  };

  // Tab handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
              <LucideEdit size={20} color={theme.palette.primary.main} />
            </IconButton>
          )}
          {canDelete && (
            <IconButton
              onClick={() => setConfirmOpen(true)}
            >
              <LucideDelete size={20} color={theme.palette.error.main} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Avatar and Name */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar
          src={member.profile_photo || member.profile_picture_url}
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

      <Divider sx={{ my: 2 }} />

      {/* Tabbed Interface */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Personal Info" />
          <Tab label="Family Links" />
          <Tab label="Cell Ministry" />
          <Tab label="Department" />
          <Tab label="Spiritual Info" />
          <Tab label="Counselling" />
          <Tab label="Family Members" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box sx={{ p: 2 }}>
        {/* Tab 0: Personal Info */}
        {activeTab === 0 && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Email</Typography>
              <Typography>{member.email || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Phone</Typography>
              <Typography>{member.contact_primary || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Secondary Phone</Typography>
              <Typography>{member.contact_secondary || 'N/A'}</Typography>
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
              <Box>
                <Typography variant="subtitle2" fontWeight="bold" component="div">Marital Status</Typography>
                <Typography component="div">{member.marital_status || 'N/A'}</Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Profession</Typography>
              <Typography>{member.profession || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Occupation</Typography>
              <Typography>{member.occupation || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Work Address</Typography>
              <Typography>{member.work_address || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Nationality</Typography>
              <Typography>{member.nationality || 'N/A'}</Typography>
            </Box>
          </Stack>
        )}

        {/* Tab 1: Family Links */}
        {activeTab === 1 && (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Family relationship information and links to related members.
              </Typography>
              <Button size="small" variant="outlined" onClick={() => setAddRelationshipOpen(true)}>Add Relationship</Button>
            </Box>

            {relationshipLoading && <CircularProgress size={24} />}

            {!relationshipLoading && relationships.length === 0 && (
              <Typography>No family relationships recorded.</Typography>
            )}

            {!relationshipLoading && relationships.length > 0 && (
              <List dense>
                {relationships.map(r => (
                  <ListItem key={r.id} secondaryAction={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {r.is_primary ? <Chip label="primary" size="small" /> : null}
                      <IconButton size="small" onClick={async () => {
                        setConfirmAction({
                          title: `Delete relationship with ${r.related_first_name || ''} ${r.related_surname || ''}?`,
                          action: async () => {
                            try {
                              await deleteRelationship(fetchWithAuth, member.id, r.id);
                              setRelationships(prev => prev.filter(x => x.id !== r.id));
                            } catch (err) {
                              console.error('Failed to delete relationship', err);
                              setSnackbar({ open: true, message: err.message || 'Delete failed', severity: 'error' });
                            }
                          }
                        });
                        setConfirmDialogOpen(true);
                      }}>
                        <LucideDelete size={16} color="gray" />
                      </IconButton>
                    </Box>
                  }>
                    <ListItemText
                      primary={`${(r.relationship_type || '').replace('_',' ')}: ${r.related_first_name || ''} ${r.related_surname || ''}`.trim()}
                      secondary={r.metadata?.note || ''}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Number of Children</Typography>
              <Typography>{member.num_children || 0}</Typography>
            </Box>

            <AddRelationshipDialog
              open={addRelationshipOpen}
              onClose={() => setAddRelationshipOpen(false)}
              memberId={member.id}
              onOptimisticAdd={(opt) => setRelationships(prev => [opt, ...prev])}
              onOptimisticCommit={(tempId, created) => setRelationships(prev => prev.map(x => x.id === tempId ? created : x))}
              onOptimisticRollback={(tempId, err) => {
                setRelationships(prev => prev.filter(x => x.id !== tempId));
                setSnackbar({ open: true, message: err?.message || 'Failed to create relationship', severity: 'error' });
              }}
              onSuccess={async () => {
                // fallback full reload in case the optimistic handlers aren't used
                setRelationshipLoading(true);
                try {
                  const data = await getMemberRelationships(fetchWithAuth, member.id);
                  setRelationships(data || []);
                } catch (err) {
                  console.error('Failed to refresh relationships', err);
                } finally {
                  setRelationshipLoading(false);
                }
              }}
            />
          </Stack>
        )}

        {/* Tab 2: Cell Ministry */}
        {activeTab === 2 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Cell group membership and ministry details.
            </Typography>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Cell Group</Typography>
              <Typography>{member.cell_group_name || 'Not assigned'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Role in Cell</Typography>
              <Typography>{member.cell_role || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Cell Leader</Typography>
              <Typography>{member.cell_leader || 'N/A'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Cell Contact</Typography>
              <Typography>{member.cell_contact || 'N/A'}</Typography>
            </Box>
          </Stack>
        )}

        {/* Tab 3: Department */}
        {activeTab === 3 && (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Department and ministry assignment details.
              </Typography>
              <Button size="small" variant="outlined" onClick={() => setAssignDeptOpen(true)}>Assign to Department</Button>
            </Box>

            {deptLoading && <CircularProgress size={24} />}

            {!deptLoading && deptAssignments.length === 0 && (
              <Typography>No department assignments.</Typography>
            )}

            {!deptLoading && deptAssignments.length > 0 && (
              <List dense>
                {deptAssignments.map(d => (
                  <ListItem key={d.id} secondaryAction={
                    <IconButton size="small" onClick={async () => {
                      setConfirmAction({
                        title: `Remove ${d.department_name} assignment?`,
                        action: async () => {
                          try {
                            await removeDepartment(fetchWithAuth, member.id, d.id);
                            setDeptAssignments(prev => prev.filter(x => x.id !== d.id));
                          } catch (err) {
                            console.error('Failed to remove department', err);
                            setSnackbar({ open: true, message: err.message || 'Remove failed', severity: 'error' });
                          }
                        }
                      });
                      setConfirmDialogOpen(true);
                    }}>
                      <LucideDelete size={16} color="gray" />
                    </IconButton>
                  }>
                    <ListItemText
                      primary={d.department_name}
                      secondary={`${d.role || 'Member'} • Assigned: ${d.assigned_at ? new Date(d.assigned_at).toLocaleDateString() : 'N/A'}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <AssignDepartmentDialog
              open={assignDeptOpen}
              onClose={() => setAssignDeptOpen(false)}
              memberId={member.id}
              onOptimisticAdd={(opt) => setDeptAssignments(prev => [opt, ...prev])}
              onOptimisticCommit={(tempId, created) => setDeptAssignments(prev => prev.map(x => x.id === tempId ? created : x))}
              onOptimisticRollback={(tempId, err) => {
                setDeptAssignments(prev => prev.filter(x => x.id !== tempId));
                setSnackbar({ open: true, message: err?.message || 'Failed to assign department', severity: 'error' });
              }}
              onSuccess={async () => {
                setDeptLoading(true);
                try {
                  const data = await getMemberDepartments(fetchWithAuth, member.id);
                  setDeptAssignments(data || []);
                } catch (err) {
                  console.error('Failed to refresh departments', err);
                } finally {
                  setDeptLoading(false);
                }
              }}
            />
          </Stack>
        )}

        {/* Tab 4: Spiritual Info */}
        {activeTab === 4 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Spiritual journey and milestones.
            </Typography>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Baptism Status</Typography>
              <Typography>{member.baptism_status || 'Not baptized'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Baptism Date</Typography>
              <Typography>{showDate(member.baptism_date)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Foundation School Status</Typography>
              <Typography>{member.foundation_school_status || 'Not started'}</Typography>
            </Box>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setMilestoneChecklistOpen(true)}
              sx={{ width: 'fit-content', mt: 2 }}
            >
              View/Add Milestones
            </Button>
          </Stack>
        )}

        {/* Tab 5: Counselling */}
        {activeTab === 5 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Counselling and care information.
            </Typography>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Counsellor Assigned</Typography>
              <Typography>{member.counsellor || 'Not assigned'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Last Counselling Session</Typography>
              <Typography>{showDate(member.last_counselling_date)}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Care Status</Typography>
              <Typography>{member.care_status || 'Standard'}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">Prayer Requests</Typography>
              <Typography>{member.prayer_requests || 'None'}</Typography>
            </Box>
          </Stack>
        )}

        {/* Tab 6: Family Members */}
        {activeTab === 6 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Family members in the church and household members.
            </Typography>

            {relationshipLoading && <CircularProgress size={24} />}

            {!relationshipLoading && relationships.length === 0 && (
              <Typography>No family members recorded.</Typography>
            )}

            {!relationshipLoading && relationships.length > 0 && (
              <List dense>
                {relationships
                  .filter(r => ['child','parent','sibling'].includes((r.relationship_type || '').toLowerCase()))
                  .map(r => (
                    <ListItem key={r.id}>
                      <ListItemText
                        primary={`${r.relationship_type}: ${r.related_first_name || ''} ${r.related_surname || ''}`.trim()}
                        secondary={r.metadata?.note || ''}
                      />
                    </ListItem>
                  ))}
              </List>
            )}
          </Stack>
        )}
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

      {/* Mentorship Modal */}
      <Dialog
        open={mentorshipOpen}
        onClose={() => setMentorshipOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Mentorship for {member.first_name} {member.surname}
        </DialogTitle>
        <DialogContent>
          <MentorshipCard menteeId={member.id} />
        </DialogContent>
      </Dialog>

      {/* Foundation Modal */}
      <Dialog
        open={foundationOpen}
        onClose={() => setFoundationOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Foundation for {member.first_name} {member.surname}
        </DialogTitle>
        <DialogContent>
          <FoundationCard memberId={member.id} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Member"
        content="Are you sure you want to delete this member?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        title={confirmAction?.title || 'Confirm Action'}
        content=""
        onConfirm={async () => {
          if (confirmAction?.action) {
            await confirmAction.action();
          }
          setConfirmDialogOpen(false);
          setConfirmAction(null);
        }}
        onCancel={() => {
          setConfirmDialogOpen(false);
          setConfirmAction(null);
        }}
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