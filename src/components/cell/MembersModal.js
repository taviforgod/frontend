import React, { useEffect, useState, useCallback } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Box,
  IconButton,
  Autocomplete,
  TextField,
  Chip,
  Stack,
  CircularProgress
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  getCellGroupMembers,
  getUnassignedMembers,
  addCellGroupMember,
  removeCellGroupMember,
} from "../services/cellService";
import { useNotification } from "../context/NotificationProvider";
import { useLookups } from "../context/LookupsProvider";

/**
 * MembersModal
 * - Replaces MemberAssignModal usage inside Cell UI.
 * - Uses lookups and the existing cellService functions.
 * - Optimistic UI for add/remove with per-row loading indicators.
 * - Does not expose raw IDs in the visible UI.
 *
 * Props:
 *  - cellGroup: the cell group object (must include id and name)
 *  - onClose: close callback
 */
export default function MembersModal({ cellGroup, onClose }) {
  const [members, setMembers] = useState([]);
  const [unassigned, setUnassigned] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // map memberId -> bool
  const { showSuccess, showError } = useNotification();
  const lookups = useLookups();

  const loadData = useCallback(async () => {
    if (!cellGroup?.id) return;
    setLoading(true);
    try {
      const [m, u] = await Promise.all([
        getCellGroupMembers(cellGroup.id),
        getUnassignedMembers()
      ]);
      setMembers(m || []);
      setUnassigned(u || []);
    } catch (err) {
      showError(err?.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, [cellGroup?.id, showError]);

  useEffect(() => {
    if (cellGroup) loadData();
  }, [cellGroup, loadData]);

  async function handleAdd() {
    if (!selected) return;
    const sel = selected;
    // optimistic update: remove from unassigned and add to members with a temp flag
    const prevMembers = members;
    const prevUnassigned = unassigned;
    const tempMember = { ...sel, _optimistic: true };
    setMembers((s) => [...s, tempMember]);
    setUnassigned((s) => s.filter((u) => u.id !== sel.id));
    setSelected(null);

    try {
      await addCellGroupMember(cellGroup.id, [sel.id], 'member');
      // fetch canonical state to ensure nested lookup fields are present
      const refreshed = await getCellGroupMembers(cellGroup.id);
      setMembers(refreshed || []);
      const u = await getUnassignedMembers();
      setUnassigned(u || []);
      showSuccess('Member added to cell group');
    } catch (err) {
      // revert optimistic change
      setMembers(prevMembers);
      setUnassigned(prevUnassigned);
      showError(err?.message || 'Failed to add member');
    }
  }

  async function handleRemove(memberId) {
    // optimistic remove: mark loading for that row and remove it from list
    setActionLoading(l => ({ ...l, [memberId]: true }));
    const prevMembers = members;
    const prevUnassigned = unassigned;
    setMembers((s) => s.filter((m) => m.id !== memberId));

    try {
      await removeCellGroupMember(cellGroup.id, memberId);
      // refresh unassigned list (member should appear back in unassigned)
      const u = await getUnassignedMembers();
      setUnassigned(u || []);
      showSuccess('Member removed from cell group');
    } catch (err) {
      // revert
      setMembers(prevMembers);
      setUnassigned(prevUnassigned);
      showError(err?.message || 'Failed to remove member');
    } finally {
      setActionLoading(l => ({ ...l, [memberId]: false }));
    }
  }

  const formatMemberSecondary = (m) => {
    const parts = [];
    if (m.email) parts.push(m.email);
    // include member_type and member_status labels when available
    if (m.member_type?.name) parts.push(m.member_type.name);
    if (m.member_status?.name) parts.push(m.member_status.name);
    return parts.join(' • ');
  };

  return (
    <Box
      sx={{
        width: 480,
        maxHeight: 560,
        overflow: "auto",
        p: 2,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {cellGroup?.name || 'Cell Group'} — Members
        </Typography>
        <IconButton onClick={onClose} size="large">
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {members.length === 0 && (
              <ListItem>
                <ListItemText primary="No members assigned" />
              </ListItem>
            )}
            {members.map((m) => (
              <ListItem
                key={m.id}
                secondaryAction={
                  <Button
                    color="error"
                    size="small"
                    onClick={() => handleRemove(m.id)}
                    disabled={!!actionLoading[m.id]}
                  >
                    {actionLoading[m.id] ? <CircularProgress size={18} /> : 'Remove'}
                  </Button>
                }
              >
                <ListItemText
                  primary={`${m.first_name || ''} ${m.surname || ''}`.trim() || 'Unnamed'}
                  secondary={formatMemberSecondary(m)}
                />
                <Stack direction="row" spacing={1} sx={{ ml: 1 }}>
                  {m.member_type?.name && <Chip size="small" label={m.member_type.name} />}
                  {m.member_status?.name && <Chip size="small" label={m.member_status.name} color="secondary" />}
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Add Member
      </Typography>

      <Autocomplete
        options={unassigned || []}
        getOptionLabel={(option) => `${option.first_name || ''} ${option.surname || ''}`.trim() || option.email || 'Unnamed'}
        value={selected}
        onChange={(_, value) => setSelected(value)}
        renderInput={(params) => (
          <TextField {...params} label="Unassigned Member" fullWidth sx={{ mb: 2 }} />
        )}
        isOptionEqualToValue={(option, value) => (option && value) ? option.id === value.id : false}
        noOptionsText="No unassigned members"
      />

      <Button
        variant="contained"
        onClick={handleAdd}
        disabled={!selected}
        sx={{ mb: 2 }}
      >
        Add to Cell Group
      </Button>

      <Button variant="outlined" color="secondary" onClick={onClose}>
        Close
      </Button>
    </Box>
  );
}