import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  List,
  ListItem,
  Checkbox,
  Paper,
  Pagination,
  InputAdornment,
  Stack,
  ListItemText,
  Typography,
  Menu,
  MenuItem,
  Tooltip,
  Chip
} from "@mui/material";
import { Edit, Trash2, Plus, Search as LucideSearch, Lock, Unlock, KeyRound, UserCheck, UserX } from "lucide-react";
import {
   getUsers,
   createUser,
   updateUser,
   deleteUser,
   activateUser,
   deactivateUser,
   lockUser,
   unlockUser,
   changeUserPassword
 } from "../../services/userService";
import { AuthContext } from "../../contexts/AuthContext";

export default function Users() {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    name: "",
    // Add any other fields with default values
  });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState(null);

  // For user actions menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [actionUser, setActionUser] = useState(null);

  // Password change dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ password: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
      const data = await getUsers(fetchWithAuth);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
      setSnackbar({ open: true, message: "Failed to load users", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchWithAuth]);

  const handleOpenDialog = (user = null) => {
    setEditUser(user);
    setForm({
      username: user?.username || "",
      email: user?.email || "",
      name: user?.name || "",
      // Add other fields with fallback empty strings
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditUser(null);
    setForm({ username: "", email: "", name: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value || "" // Ensure empty string instead of undefined
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editUser) {
        await updateUser(fetchWithAuth, editUser.id, form);
        setSnackbar({ open: true, message: "User updated successfully", severity: "success" });
      } else {
        await createUser(fetchWithAuth, form);
        setSnackbar({ open: true, message: "User created successfully", severity: "success" });
      }
      await fetchUsers();
      handleCloseDialog();
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to save user", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Confirm dialog for delete and bulk delete
  const handleDelete = (id) => {
    setConfirmDialogAction(() => () => doDelete(id));
    setConfirmDialogOpen(true);
  };

  const doDelete = async (id) => {
    setDeleteId(id);
    setConfirmDialogOpen(false);
    try {
      await deleteUser(fetchWithAuth, id);
      setSnackbar({ open: true, message: "User deleted successfully", severity: "success" });
      await fetchUsers();
      setSelected(selected.filter(selId => selId !== id));
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete user", severity: "error" });
    } finally {
      setDeleteId(null);
    }
  };

  const handleBulkDelete = () => {
    if (selected.length === 0) return;
    setConfirmDialogAction(() => doBulkDelete);
    setConfirmDialogOpen(true);
  };

  const doBulkDelete = async () => {
    setConfirmDialogOpen(false);
    setBulkDeleting(true);
    try {
      for (const id of selected) {
        await deleteUser(fetchWithAuth, id);
      }
      setSnackbar({ open: true, message: "Selected users deleted", severity: "success" });
      await fetchUsers();
      setSelected([]);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete selected users", severity: "error" });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkDeactivate = () => {
    if (selected.length === 0) return;
    setConfirmDialogAction(() => doBulkDeactivate);
    setConfirmDialogOpen(true);
  };

  const doBulkDeactivate = async () => {
    setConfirmDialogOpen(false);
    setBulkProcessing(true);
    try {
      await Promise.all(selected.map(id => deactivateUser(fetchWithAuth, id)));
      setSnackbar({ open: true, message: "Selected users deactivated", severity: "success" });
      await fetchUsers();
      setSelected([]);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to deactivate selected users", severity: "error" });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkUnlock = () => {
    if (selected.length === 0) return;
    setConfirmDialogAction(() => doBulkUnlock);
    setConfirmDialogOpen(true);
  };

  const doBulkUnlock = async () => {
    setConfirmDialogOpen(false);
    setBulkProcessing(true);
    try {
      await Promise.all(selected.map(id => unlockUser(fetchWithAuth, id)));
      setSnackbar({ open: true, message: "Selected users unlocked", severity: "success" });
      await fetchUsers();
      setSelected([]);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to unlock selected users", severity: "error" });
    } finally {
      setBulkProcessing(false);
    }
  };

  // User actions: activate, deactivate, lock, unlock, password change
  const handleUserActionMenu = (event, user) => {
    setAnchorEl(event.currentTarget);
    setActionUser(user);
  };

  // Accept user param and use it (also setActionUser for consistency)
  const handleActivate = async (user) => {
    setActionUser(user);
    try {
      await activateUser(fetchWithAuth, user.id);
      // update local state immediately so icon/label flips
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'active' } : u));
      setSnackbar({ open: true, message: "User activated", severity: "success" });
      // optional: await fetchUsers();
    } catch {
      setSnackbar({ open: true, message: "Failed to activate user", severity: "error" });
    }
  };

  const handleDeactivate = async (user) => {
    setActionUser(user);
    try {
      await deactivateUser(fetchWithAuth, user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: 'inactive' } : u));
      setSnackbar({ open: true, message: "User deactivated", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to deactivate user", severity: "error" });
    }
  };

  const handleLock = async (user) => {
    setActionUser(user);
    try {
      await lockUser(fetchWithAuth, user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, locked: true } : u));
      setSnackbar({ open: true, message: "User locked out", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to lock user", severity: "error" });
    }
  };

  const handleUnlock = async (user) => {
    setActionUser(user);
    try {
      await unlockUser(fetchWithAuth, user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, locked: false } : u));
      setSnackbar({ open: true, message: "User unlocked", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Failed to unlock user", severity: "error" });
    }
  };

  const handleOpenPasswordDialog = (user) => {
    setActionUser(user);
    setPasswordDialogOpen(true);
    setPasswordForm({ password: "" });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ password: e.target.value });
  };

  const handleSavePassword = async () => {
    setPasswordSaving(true);
    try {
      await changeUserPassword(fetchWithAuth, actionUser.id, passwordForm.password);
      setSnackbar({ open: true, message: "Password changed", severity: "success" });
      setPasswordDialogOpen(false);
    } catch {
      setSnackbar({ open: true, message: "Failed to change password", severity: "error" });
    } finally {
      setPasswordSaving(false);
    }
  };

  // Filter and paginate
  const filteredUsers = users.filter(
    (u) =>
      ((u.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.name || "").toLowerCase().includes(search.toLowerCase()))
  );
  const pageCount = Math.ceil(filteredUsers.length / rowsPerPage);
  const pagedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  useEffect(() => {
    setPage(1); // Reset to first page on search
  }, [search]);

  // Multiselect handlers
  const handleToggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelected(pagedUsers.map((u) => u.id));
    } else {
      setSelected([]);
    }
  };

  const allSelected = pagedUsers.length > 0 && pagedUsers.every((u) => selected.includes(u.id));
  const someSelected = pagedUsers.some((u) => selected.includes(u.id));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Top Card: Search, Bulk Delete, Add */}
      <Paper sx={{ borderRadius: 2, boxShadow: 3, mb: 3, p: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 0 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LucideSearch size={18} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="outlined"
            color="error"
            disabled={selected.length === 0 || bulkDeleting}
            onClick={handleBulkDelete}
            sx={{ whiteSpace: "nowrap" }}
            startIcon={<Trash2 size={18} />}
          >
            Bulk Delete
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: "50px", boxShadow: 2, whiteSpace: "nowrap" }}
          >
            Add User
          </Button>
        </Box>
      </Paper>

      {/* List Card */}
      <Paper sx={{ borderRadius: 2, boxShadow: 3, mb: 2, overflow: "hidden" }}>
        <List disablePadding>
          {/* Select all checkbox row */}
          {pagedUsers.length > 0 && (
            <ListItem
              sx={{
                py: 1,
                px: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: "background.paper",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                display: "flex",
                alignItems: "center",
              }}
            >
              <Checkbox
                edge="start"
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onChange={e => handleSelectAll(e.target.checked)}
                inputProps={{ 'aria-label': 'select all' }}
                sx={{
                  p: 0.5,
                  ml: 1,
                  color: "primary.main",
                  '&.Mui-checked': {
                    color: "primary.main",
                  },
                  '&.MuiCheckbox-indeterminate': {
                    color: "primary.main",
                  },
                }}
              />
              <Box
                sx={{
                  minWidth: 180,
                  maxWidth: 220,
                  flex: "0 0 200px",
                  display: "flex",
                  alignItems: "center",
                  ml: 2,
                }}
              >
                <Typography variant="subtitle1" noWrap>
                  Select All
                </Typography>
              </Box>
              <Box sx={{ flex: 1, pl: 4, display: "flex", alignItems: "center" }} />
            </ListItem>
          )}
          {pagedUsers.length === 0 && (
            <ListItem>
              <ListItemText primary="No users found." />
            </ListItem>
          )}
          {pagedUsers.map((u, idx) => (
            <React.Fragment key={u.id}>
              <ListItem
                sx={{
                  py: 1.5,
                  px: 2,
                  alignItems: "center",
                  bgcolor: "background.paper",
                  display: "flex",
                  ...(idx === 0 && {
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                  }),
                  ...(idx === pagedUsers.length - 1 && {
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                  }),
                  ...(idx !== pagedUsers.length - 1 && {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }),
                }}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit User">
                      <IconButton size="small" onClick={() => handleOpenDialog(u)}>
                        <Edit size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(u.id)}
                        disabled={deleteId === u.id}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={u.status === "active" ? "Deactivate" : "Activate"}>
                      <IconButton size="small" onClick={() => (u.status === "active" ? handleDeactivate(u) : handleActivate(u))} disabled={!u.id} >
                        {u.status === "active" ? <UserX size={18} /> : <UserCheck size={18} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={u.locked ? "Unlock" : "Lock Out"}>
                      <IconButton size="small" onClick={() => (u.locked ? handleUnlock(u) : handleLock(u))} disabled={!u.id} >
                        {u.locked ? <Unlock size={18} /> : <Lock size={18} />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Change Password">
                      <IconButton size="small" onClick={() => handleOpenPasswordDialog(u)} disabled={!u.id}>
                        <KeyRound size={18} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                }
              >
                <Checkbox
                  edge="start"
                  checked={selected.includes(u.id)}
                  tabIndex={-1}
                  disableRipple
                  onChange={() => handleToggle(u.id)}
                  sx={{
                    mr: 0.5,
                    ml: 1,
                    p: 0.5,
                    color: "primary.main",
                    '&.Mui-checked': {
                      color: "primary.main",
                    },
                    '&.MuiCheckbox-indeterminate': {
                      color: "primary.main",
                    },
                  }}
                />
                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <Typography
                    variant="subtitle1"
                    noWrap
                    sx={{
                      minWidth: 90,
                      maxWidth: 140,
                      flex: "0 0 110px",
                      ml: 0,
                    }}
                  >
                    {u.username}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{
                      minWidth: 120,
                      maxWidth: 180,
                      flex: "0 0 140px",
                      ml: 1,
                    }}
                  >
                    {u.email}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{
                      minWidth: 100,
                      maxWidth: 160,
                      flex: "0 0 120px",
                      ml: 1,
                    }}
                  >
                    {u.name}
                  </Typography>
                  {/* Status Pill (moved before date created) */}
                  <Chip
                    label={u.status === "active" ? "Active" : "Inactive"}
                    color={u.status === "active" ? "success" : "default"}
                    size="small"
                    sx={{ ml: 1, minWidth: 70, textTransform: "capitalize" }}
                  />
                  {/* Date Created */}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{
                      minWidth: 110,
                      maxWidth: 140,
                      flex: "0 0 120px",
                      ml: 1,
                    }}
                  >
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : ""}
                  </Typography>
                </Box>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
        {pageCount > 1 && (
          <Box display="flex" justifyContent="center" my={2}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Username"
            name="username"
            value={form.username || ""} // Add fallback
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            disabled={!!editUser}
            variant="outlined"
          />
          <TextField
            label="Email"
            name="email"
            value={form.email || ""} 
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <TextField
            label="Name"
            name="name"
            value={form.name || ""} 
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.username || !form.email}>
            {editUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            label="New Password"
            name="password"
            type="password"
            value={passwordForm.password}
            onChange={handlePasswordChange}
            fullWidth
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)} disabled={passwordSaving}>Cancel</Button>
          <Button onClick={handleSavePassword} variant="contained" disabled={passwordSaving || !passwordForm.password}>
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {confirmDialogAction === doBulkDelete ? "the selected users" : "this user"}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => confirmDialogAction && confirmDialogAction()}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}