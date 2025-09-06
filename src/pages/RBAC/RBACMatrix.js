import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, CircularProgress, List, ListItem, ListItemText,
  Collapse, Switch, Avatar, Stack, Tooltip, Fade, Card, CardContent,
  Skeleton, Pagination, Autocomplete, TextField
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import { ThemeContext } from '../../contexts/ThemeContext';
import {
  getRoles,
  fetchPermissions,
  fetchRolePermissions,
  assignPermission,
  removePermission
} from '../../services/roleService';

const PERMISSIONS_PER_PAGE = 6;

export default function RBACMatrix() {
  const { theme } = useContext(ThemeContext);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [matrix, setMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState({});
  const [flash, setFlash] = useState({});
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [expandedPermission, setExpandedPermission] = useState(null);
  const [page, setPage] = useState(1);

  const fetchMatrix = async () => {
    setLoading(true);
    try {
      const [roleList, permList, matrixData] = await Promise.all([
        getRoles(),
        fetchPermissions(),
        fetchRolePermissions()
      ]);

      setRoles(roleList);
      setPermissions(permList);

      const m = {};
      (matrixData.assignments || []).forEach(({ role_id, permission_id }) => {
        m[permission_id] = m[permission_id] || new Set();
        m[permission_id].add(role_id);
      });
      setMatrix(m);
    } catch (err) {
      setSnackbarMsg(err.message || 'Failed to load RBAC matrix');
      setSnackbarOpen(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatrix();
    // eslint-disable-next-line
  }, []);

  const handleToggle = async (roleId, permId) => {
    const key = `${permId}-${roleId}`;
    setToggling((t) => ({ ...t, [key]: true }));

    try {
      const assigned = matrix[permId]?.has(roleId);
      if (assigned) {
        await removePermission(roleId, permId);
        setMatrix((m) => ({
          ...m,
          [permId]: new Set([...m[permId]].filter((id) => id !== roleId))
        }));
      } else {
        await assignPermission(roleId, permId);
        setMatrix((m) => ({
          ...m,
          [permId]: new Set([...(m[permId] || []), roleId])
        }));
        setFlash((f) => ({ ...f, [key]: true }));
        setTimeout(() => setFlash((f) => ({ ...f, [key]: false })), 800);
      }
    } catch (error) {
      setSnackbarMsg(error.message || 'Failed to update permission');
      setSnackbarOpen(true);
    }

    setToggling((t) => ({ ...t, [key]: false }));
  };

  const toggleExpand = (permId) => {
    setExpandedPermission((prev) => (prev === permId ? null : permId));
  };

  // Filtering
  const filteredPermissions = permissions.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (roleFilter.length === 0 || roleFilter.some(role => matrix[p.id]?.has(role.id)))
  );

  const paginatedPermissions = filteredPermissions.slice(
    (page - 1) * PERMISSIONS_PER_PAGE,
    page * PERMISSIONS_PER_PAGE
  );

  const pageCount = Math.ceil(filteredPermissions.length / PERMISSIONS_PER_PAGE);

  return (
    <Box p={{ xs: 2, md: 4 }} maxWidth="1000px" mx="auto">
      <Typography variant="h4" mb={3} fontWeight={700} textAlign="center">
        RBAC Matrix — Permissions × Roles
      </Typography>

      {/* Search + Filter */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="Search permissions"
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

      {/* Permission List */}
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
              {paginatedPermissions.map((perm) => (
                <React.Fragment key={perm.id}>
                  <ListItem button onClick={() => toggleExpand(perm.id)} sx={{ px: 2 }}>
                    <ListItemText
                      primary={perm.name}
                      secondary={perm.description || ''}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                    {expandedPermission === perm.id ? <ExpandLess /> : <ExpandMore />}
                  </ListItem>

                  <Collapse in={expandedPermission === perm.id} timeout="auto" unmountOnExit>
                    <Box px={3} pb={2}>
                      <Stack
                        direction="row"
                        spacing={2}
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ rowGap: 2, columnGap: 2 }}
                      >
                        {roles.map((role) => {
                          const key = `${perm.id}-${role.id}`;
                          const checked = matrix[perm.id]?.has(role.id);
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
                                    onChange={() => handleToggle(role.id, perm.id)}
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

      <SnackbarAlert
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        severity="error"
        message={snackbarMsg}
      />
    </Box>
  );
}
