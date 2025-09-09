import React, { useEffect, useState, useMemo, useContext } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Card, CardContent, CardHeader, InputAdornment, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider
} from '@mui/material';
import { SearchIcon, EditIcon, DeleteIcon } from '../../Shared/Icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getPermissions, createPermission, updatePermission, deletePermission } from '../../services/permissionService';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import Pagination from '@mui/material/Pagination';
import Grid from '@mui/material/Grid';

export default function Permissions() {
  const { theme, mode } = useContext(ThemeContext); // <-- get mode for icon color
  const [permissions, setPermissions] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '' });
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await getPermissions();
        setPermissions(data);
      } catch (err) {
        setSnackbarMsg(err.message);
        setSnackbarOpen(true);
      }
    };
    fetchPermissions();
  }, []);

  const handleOpen = (perm = null) => {
    setForm({ name: perm?.name || '' });
    setEditId(perm?.id || null);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleSubmit = async () => {
    try {
      if (editId) {
        await updatePermission(editId, form.name);
      } else {
        await createPermission(form.name);
      }
      setOpen(false);
      setEditId(null);
      setPermissions(await getPermissions());
    } catch (err) {
      setSnackbarMsg(err.message);
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePermission(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      setPermissions(await getPermissions());
    } catch (err) {
      setSnackbarMsg(err.message);
      setSnackbarOpen(true);
      setDeleteDialog({ open: false, id: null });
    }
  };

  const filteredPermissions = useMemo(
    () =>
      permissions.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      ),
    [permissions, search]
  );

  // Responsive cards per page
  const getCardsPerPage = () => {
    if (window.innerWidth < 600) return 2; // mobile: 1 per row, 2 per page
    if (window.innerWidth < 900) return 4; // tablet: 2 per row, 2 rows
    return 6; // desktop: 3 per row, 2 rows
  };

  const [cardsPerPage, setCardsPerPage] = useState(getCardsPerPage());

  useEffect(() => {
    const handleResize = () => setCardsPerPage(getCardsPerPage());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const paginatedPermissions = filteredPermissions.slice(
    (page - 1) * cardsPerPage,
    page * cardsPerPage
  );

  return (
    <Box sx={{ maxWidth: 1200, margin: "auto", mt: 5, px: 1 }}>
      <Card sx={{ mb: 3, boxShadow: 3, bgcolor: "background.paper" }}>
        <CardContent>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            gap={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            width="100%"
          >
            <TextField
              label="Search by Name"
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={18} color={theme.palette.text.secondary} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 2, minWidth: 180 }}
            />
            <Button
              variant="contained"
              onClick={() => handleOpen()}
              sx={{ flex: 1, minWidth: 160, whiteSpace: "nowrap" }}
            >
              Add Permission
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {paginatedPermissions.length === 0 ? (
          <Grid item xs={12}>
            <Card sx={{ bgcolor: "background.paper", p: 3 }}>
              <Typography align="center" color="text.secondary">
                No permissions found.
              </Typography>
            </Card>
          </Grid>
        ) : (
          paginatedPermissions.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p.id}>
              <Card sx={{ bgcolor: "background.paper", boxShadow: 2, borderRadius: 3 }}>
                <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ wordBreak: "break-all" }}>
                    {p.name}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <IconButton onClick={() => handleOpen(p)} size="small" title="Edit">
                      <EditIcon size={18} color={mode === "dark" ? "#fff" : theme.palette.text.primary} />
                    </IconButton>
                    <IconButton
                      onClick={() => setDeleteDialog({ open: true, id: p.id })}
                      size="small"
                      title="Delete"
                    >
                      <DeleteIcon size={18} color={mode === "dark" ? "#fff" : theme.palette.text.primary} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Pagination Controls */}
      {filteredPermissions.length > cardsPerPage && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={Math.ceil(filteredPermissions.length / cardsPerPage)}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? "Edit Permission" : "Add Permission"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Delete Permission</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this permission?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      <SnackbarAlert
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        severity="error"
        message={snackbarMsg}
      />
    </Box>
  );
}