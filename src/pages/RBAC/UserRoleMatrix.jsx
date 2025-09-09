import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, CircularProgress, List, ListItem, ListItemAvatar,
  Avatar, ListItemText, Collapse, Switch, IconButton, InputBase, Paper,
  Stack, Tooltip, Fade, Card, CardContent, Skeleton, Pagination, Autocomplete,
  TextField
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { SearchIcon } from '../../Shared/Icons';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import ConfirmDialog from '../../Shared/ConfirmDialog';
import { ThemeContext } from '../../contexts/ThemeContext';
import {
  getUsers,
  getRoles as getUserRoles,
  assignRole,
  removeRole
} from '../../services/userService';
import { getRoles } from '../../services/roleService';

const USERS_PER_PAGE = 6;

export default function UserRoleMatrix() {
  const { theme } = useContext(ThemeContext);
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

  useEffect(() => {
    fetchMatrix();
  }, []);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        getUsers(),
        getRoles(),
      ]);
      setUsers(usersRes);
      setRoles(rolesRes);

      const matrixObj = {};
      await Promise.all(usersRes.map(async (user) => {
        const userRoles = await getUserRoles(user.id);
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
        await assignRole(userId, roleId);
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
        await removeRole(userId, roleId);
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

      {/* Search + Filter Card */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* User List Card */}
      <Card>
        <CardContent>
          {loading ? (
            <Stack spacing={2}>
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={80} />
              ))}
            </Stack>
          ) : (
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {paginatedUsers.map((user) => (
                <React.Fragment key={user.id}>
                  <ListItem
                    button
                    onClick={() => toggleExpand(user.id)}
                    sx={{ px: 2 }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name || user.email}
                      secondary={user.email}
                    />
                    {expandedUser === user.id ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>

                  <Collapse in={expandedUser === user.id} timeout="auto" unmountOnExit>
                    <Box px={3} pb={2}>
                      <Stack
                        direction="row"
                        spacing={2}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ rowGap: 2, columnGap: 2 }}
                      >
                        {roles.map((role) => {
                          const key = `${user.id}-${role.id}`;
                          const checked = matrix[user.id]?.has(role.id);
                          const isLoading = toggling[key];
                          const isFlash = flash[key];

                          return (
                            <Fade in key={role.id}>
                              <Box
                                sx={{
                                  minWidth: 160,
                                  maxWidth: 200,
                                  flex: '1 1 160px',
                                  textAlign: 'center',
                                  border: '1px solid #ccc',
                                  borderRadius: 2,
                                  p: 1,
                                  m: 0.5,
                                  backgroundColor: isFlash ? 'success.light' : 'transparent',
                                  transition: 'background-color 0.3s ease-in-out',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                }}
                              >
                                <Tooltip title={role.description || role.name}>
                                  <Typography variant="body2" noWrap mb={0.5}>
                                    {role.name}
                                  </Typography>
                                </Tooltip>
                                {loading ? (
                                  <Skeleton variant="circular" width={20} height={20} />
                                ) : (
                                  <Switch
                                    color="primary"
                                    checked={checked}
                                    onChange={() => handleToggle(user.id, role.id)}
                                    disabled={isLoading}
                                  />
                                )}
                              </Box>
                            </Fade>
                          );
                        })}
                      </Stack>
                    </Box>
                  </Collapse>
                </React.Fragment>
              ))}
            </List>
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
        </CardContent>
      </Card>

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
    </Box>
  );
}
