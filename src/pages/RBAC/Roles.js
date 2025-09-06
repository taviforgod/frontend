import React, { useEffect, useState, useContext } from 'react';
import {
  Box, Typography, Card, CardContent, Dialog, DialogTitle, DialogContent,
  Stack, IconButton, Tooltip, Button, List, ListItem, ListItemText, Divider,
  DialogActions, Skeleton, Fade, InputAdornment, TextField, MenuItem
} from "@mui/material";
import { EditIcon, DeleteIcon, SearchIcon } from '../../Shared/Icons';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import ConfirmDialog from '../../Shared/ConfirmDialog';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getRoles, createRole, removeRole, updateRole } from '../../services/roleService';
import { useForm } from 'react-hook-form';
import Pagination from '@mui/material/Pagination';

export default function Roles() {
  const { theme } = useContext(ThemeContext);
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Pagination
  const [page, setPage] = useState(1); // Start from 1 for Pagination component
  const rowsPerPage = 5;

  // Filtering
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: { name: '' } });

  // Fetch roles
  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    handleFiltering();
  }, [roles, search, sortOrder]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFiltering = () => {
    const sorted = [...roles]
      .filter(role => role.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortOrder === 'asc') return a.name.localeCompare(b.name);
        return b.name.localeCompare(a.name);
      });
    setFilteredRoles(sorted);
  };

  const handleOpen = (role = null) => {
    if (role) {
      reset({ name: role.name });
      setEditId(role.id);
    } else {
      reset({ name: '' });
      setEditId(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = async (data) => {
    try {
      if (editId) {
        await updateRole(editId, data.name);
        setSnackbar({ open: true, message: 'Role updated successfully', severity: 'success' });
      } else {
        await createRole(data.name);
        setSnackbar({ open: true, message: 'Role created successfully', severity: 'success' });
      }
      handleClose();
      fetchRoles();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await removeRole(deleteId);
      setSnackbar({ open: true, message: 'Role deleted', severity: 'success' });
      fetchRoles();
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setConfirmOpen(false);
      setDeleteId(null);
    }
  };

  const paginatedRoles = filteredRoles.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Box p={4}>
      {/* Title */}
      <Typography variant="h4" fontWeight="bold" mb={3}>
        Roles
      </Typography>

      {/* Search, Filter, Add Role on the same card */}
      <Card sx={{ mb: 3, maxWidth: 600, mx: 'auto', p: 2 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              fullWidth
              placeholder="Search roles..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon size={20} />
                  </InputAdornment>
                )
              }}
              size="small"
              sx={{ flex: 1 }}
            />
            <TextField
              select
              label="Sort"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              sx={{ minWidth: 120, flex: 1 }}
              size="small"
            >
              <MenuItem value="asc">A → Z</MenuItem>
              <MenuItem value="desc">Z → A</MenuItem>
            </TextField>
            <Button
              variant="contained"
              onClick={() => handleOpen(null)}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Role
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Role List */}
      <Card sx={{ boxShadow: 2, width: "100%", maxWidth: 600, mx: "auto" }}>
        <CardContent>
          {loading ? (
            <Stack spacing={2}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" height={40} animation="wave" />
              ))}
            </Stack>
          ) : filteredRoles.length === 0 ? (
            <Typography textAlign="center" color="text.secondary">
              No roles found.
            </Typography>
          ) : (
            <List sx={{ width: "100%", bgcolor: "background.paper", p: 0 }}>
              {paginatedRoles.map((role, idx) => (
                <Fade in key={role.id}>
                  <Box>
                    <ListItem
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpen(role)}>
                              <EditIcon size={18} color={theme.palette.text.primary} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleDeleteClick(role.id)}>
                              <DeleteIcon size={18} color={theme.palette.text.primary} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      }
                    >
                      <ListItemText primary={role.name} />
                    </ListItem>
                    {idx < paginatedRoles.length - 1 && <Divider component="li" />}
                  </Box>
                </Fade>
              ))}
            </List>
          )}
        </CardContent>
        {/* Pagination Controls */}
        {filteredRoles.length > rowsPerPage && (
          <Box display="flex" justifyContent="center" px={2} pb={2}>
            <Pagination
              count={Math.ceil(filteredRoles.length / rowsPerPage)}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Card>

      {/* Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? "Edit Role" : "Add Role"}</DialogTitle>
        <DialogContent>
          <form id="role-form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              label="Role Name"
              fullWidth
              margin="normal"
              {...register('name', { required: 'Role name is required' })}
              error={!!errors.name}
              helperText={errors.name?.message}
              autoFocus
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" form="role-form" variant="contained">
            {editId ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Role"
        message="Are you sure you want to delete this role?"
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />

      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        message={snackbar.message}
      />
    </Box>
  );
}
