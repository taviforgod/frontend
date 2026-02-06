import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, CircularProgress, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, Collapse, Switch, IconButton, InputBase, Paper,
  Stack, Tooltip, Fade, Card, CardContent, Skeleton, Pagination, Autocomplete,
  TextField, Grid, Button, Chip, Checkbox
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { SearchIcon } from '../../Shared/Icons';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import ConfirmDialog from '../../Shared/ConfirmDialog';
import { ThemeContext } from '../../contexts/ThemeContext';
import { AuthContext } from '../../contexts/AuthContext';
import {
  getUsers,
  getRoles as getUserRoles,
  assignRole,
  removeRole
} from '../../services/userService';
import { getRoles } from '../../services/roleService';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const USERS_PER_PAGE = 6;

export default function UserRoleMatrix() {
  const { theme } = useContext(ThemeContext);
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [expandedUser, setExpandedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  const [flash, setFlash] = useState({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState([]);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, userId: null, roleId: null, action: null });
  const [page, setPage] = useState(1);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogUser, setRoleDialogUser] = useState(null);
  const [roleDialogRoles, setRoleDialogRoles] = useState([]);
  const [savingRoles, setSavingRoles] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
      const [usersRes, rolesRes] = await Promise.all([
        getUsers(fetchWithAuth),
        getRoles(fetchWithAuth),
      ]);
      setUsers(usersRes);
      setRoles(rolesRes);

      const matrixObj = {};
      await Promise.all(usersRes.map(async (user) => {
        const userRoles = await getUserRoles(fetchWithAuth, user.id);
        matrixObj[user.id] = new Set(userRoles.map(r => r.id));
      }));
      setMatrix(matrixObj);
    } catch (err) {
      setError(err.message || 'Failed to load data');
      setShowError(true);
    }
    setLoading(false);
  };

  const handleToggle = async (userId, roleId) => {
    const key = `${userId}-${roleId}`;
    setToggling(prev => ({ ...prev, [key]: true }));

    try {
      if (matrix[userId]?.has(roleId)) {
        setConfirm({ open: true, userId, roleId, action: 'remove' });
      } else {
        await assignRole(fetchWithAuth, userId, roleId);
        setMatrix(prev => ({
          ...prev,
          [userId]: new Set([...prev[userId], roleId])
        }));
        setFlash(f => ({ ...f, [key]: true }));
        setTimeout(() => setFlash(f => ({ ...f, [key]: false })), 800);
      }
    } catch (error) {
      setError(error.message || 'Error toggling role');
      setShowError(true);
    }

    setToggling(prev => ({ ...prev, [key]: false }));
  };

  const handleConfirm = async (confirmed) => {
    setConfirm(prev => ({ ...prev, open: false }));

    if (confirmed) {
      const { userId, roleId } = confirm;
      try {
        await removeRole(fetchWithAuth, userId, roleId);
        setMatrix(prev => ({
          ...prev,
          [userId]: new Set([...prev[userId]].filter(id => id !== roleId))
        }));
      } catch (error) {
        setError(error.message || 'Error removing role');
        setShowError(true);
      }
    }
  };

  const toggleExpand = (userId) => {
    setExpandedUser(prev => (prev === userId ? null : userId));
  };

  // Open modal for user
  const openRoleDialog = (user) => {
    setRoleDialogUser(user);
    setRoleDialogRoles(Array.from(matrix[user.id] || []));
    setRoleDialogOpen(true);
  };

  // Handle role checkbox change
  const handleRoleDialogToggle = (roleId) => {
    setRoleDialogRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Save roles for user
  const handleRoleDialogSave = async () => {
    if (!roleDialogUser) return;
    setSavingRoles(true);
    try {
      // Remove all roles not in roleDialogRoles
      const currentRoles = Array.from(matrix[roleDialogUser.id] || []);
      const toRemove = currentRoles.filter((id) => !roleDialogRoles.includes(id));
      const toAdd = roleDialogRoles.filter((id) => !currentRoles.includes(id));
      for (const roleId of toRemove) {
        await removeRole(fetchWithAuth, roleDialogUser.id, roleId);
      }
      for (const roleId of toAdd) {
        await assignRole(fetchWithAuth, roleDialogUser.id, roleId);
      }
      setMatrix((prev) => ({
        ...prev,
        [roleDialogUser.id]: new Set(roleDialogRoles),
      }));
      setRoleDialogOpen(false);
      setShowSuccess(true);
    } catch (error) {
      setError(error.message || 'Error updating roles');
      setShowError(true);
    }
    setSavingRoles(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || user.email).toLowerCase().includes(search.toLowerCase());
    const matchesRoles =
      roleFilter.length === 0 || roleFilter.some(role => matrix[user.id]?.has(role.id));
    return matchesSearch && matchesRoles;
  });

  const paginatedUsers = filteredUsers.slice(
    (page - 1) * USERS_PER_PAGE,
    page * USERS_PER_PAGE
  );

  const pageCount = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  return (
    <Box p={{ xs: 2, md: 4 }} maxWidth="1000px" mx="auto">
      <Typography variant="h4" mb={3} fontWeight={700} textAlign="center">
        User-Role Assignment Matrix
      </Typography>

      {/* Search + Filter Row (no Card) */}
      <Box mb={4}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            label="Search users"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 220 }}
            variant="outlined"
          />
          <Autocomplete
            multiple
            options={roles}
            getOptionLabel={(option) => option.name}
            value={roleFilter}
            onChange={(e, value) => setRoleFilter(value)}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Roles" size="small" variant="outlined" />
            )}
            sx={{ flex: 1, minWidth: 220 }}
          />
        </Stack>
      </Box>

      {/* User List Grid (no Card) */}
      {loading ? (
        <Stack spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={80} />
          ))}
        </Stack>
      ) : (
        <Grid container spacing={2}>
          {paginatedUsers.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary">No users found.</Typography>
            </Grid>
          )}
          {paginatedUsers.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar>
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">{user.name || "—"}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                      <Box mt={1}>
                        <Chip
                          label={matrix[user.id]?.size > 0 ? `${matrix[user.id].size} roles` : 'No roles'}
                          size="small"
                        />
                      </Box>
                    </Box>
                  </Box>
                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => openRoleDialog(user)}
                    >
                      Roles
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : ""}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {pageCount > 1 && (
        <Box mt={3} display="flex" justifyContent="center">
          <Pagination
            count={pageCount}
            page={page}
            onChange={(e, value) => setPage(value)}
          />
        </Box>
      )}

      {/* Role Selection Modal */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          Assign Roles {roleDialogUser ? `to ${roleDialogUser.name || roleDialogUser.email}` : ""}
        </DialogTitle>
        <DialogContent>
          <Box mb={2} display="flex" gap={1}>
            <Button
              size="small"
              onClick={() => setRoleDialogRoles(roles.map(r => r.id))}
              disabled={savingRoles}
            >
              Select All
            </Button>
            <Button
              size="small"
              onClick={() => setRoleDialogRoles([])}
              disabled={savingRoles}
            >
              Clear All
            </Button>
          </Box>
          {/* 2 roles per row */}
          <Box display="flex" flexDirection="column" gap={1}>
            {Array.from({ length: Math.ceil(roles.length / 2) }).map((_, rowIdx) => (
              <Box key={rowIdx} display="flex" gap={2}>
                {roles.slice(rowIdx * 2, rowIdx * 2 + 2).map((role) => (
                  <Box key={role.id} display="flex" alignItems="center" flex={1}>
                    <Checkbox
                      checked={roleDialogRoles.includes(role.id)}
                      onChange={() => handleRoleDialogToggle(role.id)}
                      disabled={savingRoles}
                    />
                    <Box>
                      <Typography fontWeight={500}>{role.name}</Typography>
                      {role.description && (
                        <Typography variant="caption" color="text.secondary">
                          {role.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)} disabled={savingRoles}>Cancel</Button>
          <Button
            onClick={handleRoleDialogSave}
            variant="contained"
            disabled={savingRoles}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm + Snackbar */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm(prev => ({ ...prev, open: false }))}
        onConfirm={handleConfirm}
        title="Confirm Role Removal"
        message="Are you sure you want to remove this role from the user?"
      />

      {showError && (
        <SnackbarAlert
          open={showError}
          onClose={() => setShowError(false)}
          severity="error"
          message={error}
        />
      )}

      <SnackbarAlert
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        severity="success"
        message="Roles updated successfully!"
      />
    </Box>
  );
}
