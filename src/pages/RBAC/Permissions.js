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
  Typography
} from "@mui/material";
import { Edit, Trash2, Plus, Search as LucideSearch } from "lucide-react"; // Add Lucide icons
import {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission
} from "../../services/permissionService";
import { AuthContext } from "../../contexts/AuthContext";

export default function Permissions() {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [perms, setPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPerm, setEditPerm] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogAction, setConfirmDialogAction] = useState(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const fetchPermissions = async () => {
    setLoading(true);
    try {
      if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
      const data = await getPermissions(fetchWithAuth);
      setPerms(Array.isArray(data) ? data : []);
    } catch (err) {
      setPerms([]);
      setSnackbar({ open: true, message: "Failed to load permissions", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!fetchWithAuth) return;
    fetchPermissions();
  }, [fetchWithAuth]);

  const handleOpenDialog = (perm = null) => {
    setEditPerm(perm);
    setForm(perm ? { name: perm.name, description: perm.description || "" } : { name: "", description: "" });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditPerm(null);
    setForm({ name: "", description: "" });
  };

  const handleFormChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editPerm) {
        await updatePermission(fetchWithAuth, editPerm.id, form);
        setSnackbar({ open: true, message: "Permission updated successfully", severity: "success" });
      } else {
        await createPermission(fetchWithAuth, form.name, form.description);
        setSnackbar({ open: true, message: "Permission created successfully", severity: "success" });
      }
      await fetchPermissions();
      handleCloseDialog();
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to save permission", severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Replace window.confirm with MUI Dialog for single delete
  const handleDelete = (id) => {
    setConfirmDialogAction(() => () => doDelete(id));
    setConfirmDialogOpen(true);
  };

  const doDelete = async (id) => {
    setDeleteId(id);
    setConfirmDialogOpen(false);
    try {
      await deletePermission(fetchWithAuth, id);
      setSnackbar({ open: true, message: "Permission deleted successfully", severity: "success" });
      await fetchPermissions();
      setSelected(selected.filter(selId => selId !== id));
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete permission", severity: "error" });
    } finally {
      setDeleteId(null);
    }
  };

  // Replace window.confirm with MUI Dialog for bulk delete
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
        await deletePermission(fetchWithAuth, id);
      }
      setSnackbar({ open: true, message: "Selected permissions deleted", severity: "success" });
      await fetchPermissions();
      setSelected([]);
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to delete selected permissions", severity: "error" });
    } finally {
      setBulkDeleting(false);
    }
  };

  // Filter and paginate
  const filteredPerms = perms.filter(
    (p) =>
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase())) &&
      (search.toLowerCase().includes("add") ? p.name.toLowerCase().includes("add") : true)
  );
  const pageCount = Math.ceil(filteredPerms.length / rowsPerPage);
  const pagedPerms = filteredPerms.slice((page - 1) * rowsPerPage, page * rowsPerPage);

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
      setSelected(pagedPerms.map((p) => p.id));
    } else {
      setSelected([]);
    }
  };

  const allSelected = pagedPerms.length > 0 && pagedPerms.every((p) => selected.includes(p.id));
  const someSelected = pagedPerms.some((p) => selected.includes(p.id));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Top Card: Search, Bulk Delete, Add (in that order, filling the card) */}
      <Paper sx={{ borderRadius: 2, boxShadow: 3, mb: 3, p: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Search permissions... (type 'add' to filter by add)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            sx={{ flex: 1, minWidth: 0 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  {/* Use Lucide Search icon */}
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
            startIcon={<Trash2 size={18} />} // Lucide Trash2
          >
            Bulk Delete
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />} // Lucide Plus
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: "50px", boxShadow: 2, whiteSpace: "nowrap" }}
          >
            Add Permission
          </Button>
        </Box>
      </Paper>

      {/* List Card */}
      <Paper sx={{ borderRadius: 2, boxShadow: 3, mb: 2, overflow: "hidden" }}>
        <List disablePadding>
          {/* Select all checkbox row */}
          {pagedPerms.length > 0 && (
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
                  ml: 1, // <-- Add left margin to move from edge
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
                  ml: 2, // match the name column's ml
                }}
              >
                <Typography variant="subtitle1" noWrap>
                  Select All
                </Typography>
              </Box>
              <Box sx={{ flex: 1, pl: 4, display: "flex", alignItems: "center" }} />
            </ListItem>
          )}
          {pagedPerms.length === 0 && (
            <ListItem>
              <ListItemText primary="No permissions found." />
            </ListItem>
          )}
          {pagedPerms.map((p, idx) => (
            <React.Fragment key={p.id}>
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
                  ...(idx === pagedPerms.length - 1 && {
                    borderBottomLeftRadius: 16,
                    borderBottomRightRadius: 16,
                  }),
                  ...(idx !== pagedPerms.length - 1 && {
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }),
                }}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={() => handleOpenDialog(p)}>
                      <Edit size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(p.id)}
                      disabled={deleteId === p.id}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                }
              >
                <Checkbox
                  edge="start"
                  checked={selected.includes(p.id)}
                  tabIndex={-1}
                  disableRipple
                  onChange={() => handleToggle(p.id)}
                  sx={{
                    mr: 2,
                    ml: 1, // <-- Add left margin to move from edge
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
                  <Box
                    sx={{
                      minWidth: 250, 
                      maxWidth: 350, 
                      flex: "0 0 300px", 
                      display: "flex",
                      alignItems: "center",
                      ml: 2,
                    }}
                  >
                    <Typography variant="subtitle1" noWrap>
                      {p.name}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, pl: 6, display: "flex", alignItems: "center" }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                      }}
                    >
                      {p.description || "No description"}
                    </Typography>
                  </Box>
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

      {/* Dialog and Snackbar remain unchanged */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>{editPerm ? "Edit Permission" : "Add Permission"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            disabled={!!editPerm} // Name is not editable in edit mode
            variant="outlined"
          />
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleFormChange}
            fullWidth
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !form.name}>
            {editPerm ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {confirmDialogAction === doBulkDelete ? "the selected permissions" : "this permission"}?
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