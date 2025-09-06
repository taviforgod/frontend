import React, { useEffect, useState, useMemo, useContext } from 'react';
import {
  Box, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Card, CardContent, CardHeader, InputAdornment, IconButton,
  List, ListItem, ListItemText, ListItemSecondaryAction, Divider
} from '@mui/material';
import { SearchIcon, EditIcon, DeleteIcon } from '../../Shared/Icons';
import { ThemeContext } from '../../contexts/ThemeContext';
import { getPermissions, createPermission, updatePermission, deletePermission } from '../../services/permissionService';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import Pagination from '@mui/material/Pagination';

export default function Permissions() {
  const { theme } = useContext(ThemeContext);
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

  const paginatedPermissions = filteredPermissions.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Box sx={{ maxWidth: 900, margin: "auto", mt: 5 }}>
      <Card sx={{ mb: 3, boxShadow: 3 }}>
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

      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={<Typography variant="h4" fontWeight="bold">Permissions</Typography>}
        />
        <CardContent>
          <List>
            {paginatedPermissions.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="No permissions found."
                  sx={{ textAlign: 'center', py: 3 }}
                />
              </ListItem>
            ) : (
              paginatedPermissions.map((p, idx) => (
                <React.Fragment key={p.id}>
                  <ListItem>
                    <ListItemText primary={p.name} />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => handleOpen(p)} size="small" title="Edit">
                        <EditIcon size={18} color={theme.palette.text.primary} />
                      </IconButton>
                      <IconButton
                        onClick={() => setDeleteDialog({ open: true, id: p.id })}
                        size="small"
                        title="Delete"
                      >
                        <DeleteIcon size={18} color={theme.palette.text.primary} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {idx < paginatedPermissions.length - 1 && (
                    <Divider
                      sx={{
                        bgcolor: theme.palette.divider,
                        opacity: 0.4,
                        height: 1,
                        marginLeft: 2,
                        marginRight: 2,
                      }}
                    />
                  )}
                </React.Fragment>
              ))
            )}
          </List>
          {/* Pagination Controls */}
          {filteredPermissions.length > rowsPerPage && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={Math.ceil(filteredPermissions.length / rowsPerPage)}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </CardContent>
      </Card>

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