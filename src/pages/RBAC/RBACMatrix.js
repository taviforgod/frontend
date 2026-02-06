import React, { useEffect, useState, useContext, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Checkbox,
  Tooltip,
  Skeleton,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import SelectAllIcon from "@mui/icons-material/SelectAll";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SnackbarAlert from "../../Shared/SnackbarAlert";
import { ThemeContext } from "../../contexts/ThemeContext";
import {
  getRoles,
  fetchPermissions,
  fetchRolePermissions,
  assignPermission,
  removePermission,
} from "../../services/roleService";
import { AuthContext } from "../../contexts/AuthContext";

function normalizeFetch(fetchWithAuth) {
  if (typeof fetchWithAuth === "function") return fetchWithAuth;
  if (fetchWithAuth && typeof fetchWithAuth.fetchWithAuth === "function") return fetchWithAuth.fetchWithAuth;
  if (fetchWithAuth && typeof fetchWithAuth.value === "object" && typeof fetchWithAuth.value.fetchWithAuth === "function") return fetchWithAuth.value.fetchWithAuth;
  return null;
}

// Dialog for assigning permissions to a role
function RolePermissionsDialog({
  open,
  onClose,
  role,
  permissions,
  assigned,
  onToggle,
  loading,
  onSelectAll,
  onClearAll,
}) {
  const [permSearch, setPermSearch] = useState("");
  const filteredPermissions = useMemo(
    () =>
      permissions.filter((perm) =>
        perm.name.toLowerCase().includes(permSearch.toLowerCase())
      ),
    [permissions, permSearch]
  );
  const allChecked =
    filteredPermissions.length > 0 &&
    filteredPermissions.every((perm) => assigned[perm.id]);
  const someChecked =
    filteredPermissions.some((perm) => assigned[perm.id]) && !allChecked;

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        Assign Permissions: {role?.name}
        <Box display="flex" alignItems="center" gap={1} mt={1}>
          <TextField
            size="small"
            placeholder="Search permissions..."
            value={permSearch}
            onChange={(e) => setPermSearch(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Tooltip title="Select All">
            <span>
              <IconButton
                onClick={() => onSelectAll(filteredPermissions.map((p) => p.id))}
                disabled={loading || filteredPermissions.length === 0 || allChecked}
                color="primary"
              >
                <SelectAllIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Clear All">
            <span>
              <IconButton
                onClick={() => onClearAll(filteredPermissions.map((p) => p.id))}
                disabled={loading || filteredPermissions.length === 0 || !someChecked}
                color="error"
              >
                <ClearAllIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ maxHeight: 400, minHeight: 200 }}>
        <Stack spacing={1}>
          {filteredPermissions.length === 0 && (
            <Typography color="text.secondary" align="center">
              No permissions found.
            </Typography>
          )}
          {filteredPermissions.map((perm) => (
            <FormControlLabel
              key={perm.id}
              control={
                <Checkbox
                  checked={!!assigned[perm.id]}
                  onChange={() => onToggle(perm.id, !assigned[perm.id])}
                  disabled={loading}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1">{perm.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {perm.description}
                  </Typography>
                </Box>
              }
              sx={{
                alignItems: "flex-start",
                m: 0,
                p: 0.5,
                borderRadius: 1,
                "&:hover": { background: "#f5f5f5" },
              }}
            />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

const ROLES_PER_PAGE = 9;

export default function RBACMatrix() {
  const { theme } = useContext(ThemeContext);
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({}); // { [roleId]: Set(permissionId) }
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Fetch roles, permissions, and assignments
  const fetchAll = async () => {
    setLoading(true);
    try {
      const fn = normalizeFetch(fetchWithAuth);
      if (!fn) throw new Error("fetchWithAuth is required");
      const [roleList, permList, matrixData] = await Promise.all([
        getRoles(fn),
        fetchPermissions(fn),
        fetchRolePermissions(fn),
      ]);
      setRoles(roleList || []);
      setPermissions(permList || []);
      // Build { [roleId]: Set(permissionId) }
      const rp = {};
      (roleList || []).forEach((r) => {
        rp[r.id] = new Set();
      });
      (matrixData.assignments || []).forEach(({ role_id, permission_id }) => {
        if (!rp[role_id]) rp[role_id] = new Set();
        rp[role_id].add(permission_id);
      });
      setRolePermissions(rp);
    } catch (err) {
      setSnackbarMsg(err.message || "Failed to load RBAC data");
      setSnackbarOpen(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [fetchWithAuth]);

  // Filtering and pagination
  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(query.toLowerCase())
  );
  const paged = filtered.slice(
    (page - 1) * ROLES_PER_PAGE,
    page * ROLES_PER_PAGE
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / ROLES_PER_PAGE));

  // Open dialog for a role
  const openAssignPerm = (role) => {
    setSelectedRole(role);
    setDialogOpen(true);
  };

  // Toggle permission for a role
  const handleTogglePermission = async (permId, checked) => {
    if (!selectedRole) return;
    setDialogLoading(true);
    try {
      const fn = normalizeFetch(fetchWithAuth);
      if (!fn) throw new Error("fetchWithAuth is required");
      if (checked) {
        await assignPermission(fn, selectedRole.id, permId);
        setRolePermissions((prev) => ({
          ...prev,
          [selectedRole.id]: new Set([...prev[selectedRole.id], permId]),
        }));
      } else {
        await removePermission(fn, selectedRole.id, permId);
        setRolePermissions((prev) => {
          const newSet = new Set(prev[selectedRole.id]);
          newSet.delete(permId);
          return { ...prev, [selectedRole.id]: newSet };
        });
      }
    } catch (err) {
      setSnackbarMsg(err.message || "Failed to update permission");
      setSnackbarOpen(true);
    }
    setDialogLoading(false);
  };

  // Select all permissions for the role (filtered)
  const handleSelectAll = async (permIds) => {
    if (!selectedRole) return;
    setDialogLoading(true);
    try {
      const fn = normalizeFetch(fetchWithAuth);
      if (!fn) throw new Error("fetchWithAuth is required");
      await Promise.all(
        permIds
          .filter((pid) => !rolePermissions[selectedRole.id]?.has(pid))
          .map((pid) => assignPermission(fn, selectedRole.id, pid))
      );
      setRolePermissions((prev) => ({
        ...prev,
        [selectedRole.id]: new Set([
          ...prev[selectedRole.id],
          ...permIds,
        ]),
      }));
    } catch (err) {
      setSnackbarMsg(err.message || "Failed to assign all permissions");
      setSnackbarOpen(true);
    }
    setDialogLoading(false);
  };

  // Clear all permissions for the role (filtered)
  const handleClearAll = async (permIds) => {
    if (!selectedRole) return;
    setDialogLoading(true);
    try {
      const fn = normalizeFetch(fetchWithAuth);
      if (!fn) throw new Error("fetchWithAuth is required");
      await Promise.all(
        permIds
          .filter((pid) => rolePermissions[selectedRole.id]?.has(pid))
          .map((pid) => removePermission(fn, selectedRole.id, pid))
      );
      setRolePermissions((prev) => {
        const newSet = new Set(prev[selectedRole.id]);
        permIds.forEach((pid) => newSet.delete(pid));
        return { ...prev, [selectedRole.id]: newSet };
      });
    } catch (err) {
      setSnackbarMsg(err.message || "Failed to clear permissions");
      setSnackbarOpen(true);
    }
    setDialogLoading(false);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Roles & Permissions</Typography>
        <TextField
          placeholder="Search roles..."
          size="small"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220 }}
        />
      </Box>

      <Grid container spacing={2}>
        {loading
          ? [...Array(ROLES_PER_PAGE)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={120} />
              </Grid>
            ))
          : paged.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box>
                        <Typography variant="h6">{role.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {role.description}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openAssignPerm(role)}
                      >
                        Permissions
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>

      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, v) => setPage(v)}
        />
      </Box>

      {/* Assign Permissions Dialog */}
      {selectedRole && (
        <RolePermissionsDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setSelectedRole(null);
          }}
          role={selectedRole}
          permissions={permissions}
          assigned={Object.fromEntries(
            [...(rolePermissions[selectedRole.id] || [])].map((pid) => [pid, true])
          )}
          onToggle={handleTogglePermission}
          loading={dialogLoading}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
        />
      )}

      <SnackbarAlert
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        severity="error"
        message={snackbarMsg}
      />
    </Box>
  );
}
