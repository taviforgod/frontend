// src/components/CellGroupDetail.jsx
import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';  // ✅ import AuthContext
import {
  Box, Typography, Card, CardHeader, CardContent, Chip,
  Button, Divider, Snackbar, Alert, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MemberAssignModal from '../MemberAssignModal';
import RoleChangeModal from './RoleChangeModal';
import CellMembersSection from './CellMembersSection';
import {
  getCellGroupById,
  getCellMembers,
  getUnassignedMembers,
  addCellMember,
  bulkAddCellMembers,
  removeCellMember,
  changeCellMemberRole
} from '../../services/cellGroupService';
import { getRoles } from '../../services/roleService';

export default function CellGroupDetail({ groupId, onClose, onMemberAssign }) {
  const { fetchWithAuth } = useContext(AuthContext); // ✅ use AuthContext
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [roles, setRoles] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [editRole, setEditRole] = useState({ open: false, member: null });
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);

  const loadAll = async () => {
    if (!groupId || !fetchWithAuth) return;
    setLoading(true);
    try {
      const [g, m, un, r] = await Promise.all([
        getCellGroupById(fetchWithAuth, groupId),
        getCellMembers(fetchWithAuth, groupId, true),
        getUnassignedMembers(fetchWithAuth),
        getRoles(fetchWithAuth)
      ]);
      setGroup(g || null);
      setMembers(Array.isArray(m) ? m : []);
      setUnassigned(Array.isArray(un) ? un : []);
      const roleList = Array.isArray(r)
        ? r.filter(rr => !['admin', 'pastor', 'super_admin'].includes(String(rr.name).toLowerCase()))
        : [];
      setRoles(roleList);
    } catch (err) {
      console.error('Failed to load cell detail', err);
      setSnack({ open: true, message: err.message || 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (groupId && fetchWithAuth) loadAll(); }, [groupId, fetchWithAuth]);

  // Assign single
  const handleAssign = async ({ member_id, role_id }) => {
    setAssigning(true);
    try {
      await addCellMember(fetchWithAuth, { cell_group_id: groupId, member_id, role_id });
      setAssignOpen(false);
      setSnack({ open: true, message: 'Member assigned!', severity: 'success' });
      await loadAll();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err.message || 'Failed to assign', severity: 'error' });
    } finally { setAssigning(false); }
  };

  // Bulk assign
  const handleBulkAssign = async ({ member_ids, role_id }) => {
    setAssigning(true);
    try {
      await bulkAddCellMembers(fetchWithAuth, { cell_group_id: groupId, member_ids, role_id });
      setBulkOpen(false);
      setSnack({ open: true, message: 'Members assigned!', severity: 'success' });
      await loadAll();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err.message || 'Failed to bulk assign', severity: 'error' });
    } finally { setAssigning(false); }
  };

  // Remove member
  const handleRemove = async (m) => {
    try {
      await removeCellMember(fetchWithAuth, { cell_group_id: groupId, member_id: m.member_id });
      setSnack({ open: true, message: 'Member removed!', severity: 'success' });
      await loadAll();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err.message || 'Failed to remove', severity: 'error' });
    }
  };

  // Change role
  const handleChangeRole = async (role) => {
    if (!editRole.member) return;
    setAssigning(true);
    try {
      await changeCellMemberRole(fetchWithAuth, {
        cell_group_id: groupId,
        member_id: editRole.member.member_id,
        role_id: role.id
      });
      setEditRole({ open: false, member: null });
      setSnack({ open: true, message: 'Role changed!', severity: 'success' });
      await loadAll();
    } catch (err) {
      console.error(err);
      setSnack({ open: true, message: err.message || 'Failed to change role', severity: 'error' });
    } finally { setAssigning(false); }
  };

  const handleAssignSuccess = async () => {
    setAssignOpen(false);
    if (typeof onMemberAssign === 'function') await onMemberAssign();
    await loadAll();
  };

  if (!group && loading) return <Typography sx={{ m: 3 }}>Loading...</Typography>;
  if (!group) return <Typography sx={{ m: 3 }}>No group selected</Typography>;

  return (
    <Card sx={{ maxWidth: 900, mx: 'auto', my: 3 }}>
      <CardHeader
        title={group.name}
        subheader={(group.zone_name ? group.zone_name + " • " : "") + (group.status_name || "")}
        action={onClose ? <Button onClick={onClose}>Close</Button> : null}
      />
      <Divider />
      <CardContent>
        <Typography gutterBottom>
          <b>Leader:</b> {group.leader_first_name || '-'} {group.leader_surname || ''}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={`Members: ${group.member_count || 0}`} />
          {group.meeting_day && <Chip label={`Day: ${group.meeting_day}`} />}
          {group.meeting_time && <Chip label={`Time: ${group.meeting_time}`} />}
        </Stack>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <b>Location:</b> {group.meeting_location || "-"}
        </Typography>
        {group.notes && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{group.notes}</Typography>
        )}

        {/* Actions */}
        <Stack direction="row" spacing={1} mb={2}>
          <Button size="small" startIcon={<AddIcon />} variant="contained" onClick={() => setAssignOpen(true)}>
            Assign Member
          </Button>
          <Button size="small" variant="outlined" onClick={() => setBulkOpen(true)}>
            Bulk Assign
          </Button>
        </Stack>

        {/* Members Section */}
        <CellMembersSection
          members={members}
          roles={roles}
          onRemove={handleRemove}
          onChangeRole={m => setEditRole({ open: true, member: m })}
        />
      </CardContent>

      {/* Member Assign Modal (single) */}
      <MemberAssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        onAssign={handleAssign}
        roles={roles}
        members={unassigned}
        loading={assigning}
        multiple={false}
      />

      {/* Bulk Assign Modal */}
      <MemberAssignModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onAssign={handleBulkAssign}
        roles={roles}
        members={unassigned}
        loading={assigning}
        multiple={true}
      />

      {/* Change Role Modal */}
      <RoleChangeModal
        open={editRole.open}
        onClose={() => setEditRole({ open: false, member: null })}
        member={editRole.member}
        roles={roles}
        onChange={handleChangeRole}
        loading={assigning}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </Card>
  );
}
