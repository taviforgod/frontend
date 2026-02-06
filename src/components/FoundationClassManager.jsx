import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, List, ListItem, Stack, Divider, IconButton, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getFoundationClasses, addFoundationClass, updateFoundationClass, deleteFoundationClass } from '../services/foundationService';
import { AuthContext } from '../contexts/AuthContext';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export default function FoundationClassManager() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState(null); // class to edit
  const [formVals, setFormVals] = useState({ name: '', description: '', start_date: '', end_date: '' });
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState(null);
  const { fetchWithAuth } = useContext(AuthContext);

  useEffect(() => { loadClasses(); }, [search]);
  const loadClasses = async () => {
    setLoading(true);
    try {
      const classList = await getFoundationClasses(fetchWithAuth, { q: search });
      setClasses(Array.isArray(classList) ? classList : []);
    } catch (e) {
      setSnack({ message: e.message, severity: 'error' });
    }
    setLoading(false);
  };

  // Add class
  const handleChange = e => setFormVals({ ...formVals, [e.target.name]: e.target.value });
  const handleAddClass = async e => {
    e.preventDefault();
    try {
      await addFoundationClass(fetchWithAuth, formVals);
      setSnack({ message: 'Class added!', severity: 'success' });
      setOpenAdd(false);
      setFormVals({ name: '', description: '', start_date: '', end_date: '' });
      loadClasses();
    } catch (err) {
      setSnack({ message: err.message, severity: 'error' });
    }
  };

  // Edit class
  const handleEditClass = async e => {
    e.preventDefault();
    try {
      await updateFoundationClass(fetchWithAuth, editing.id, formVals);
      setSnack({ message: 'Class updated!', severity: 'success' });
      setOpenEdit(false);
      setEditing(null);
      setFormVals({ name: '', description: '', start_date: '', end_date: '' });
      loadClasses();
    } catch (err) {
      setSnack({ message: err.message, severity: 'error' });
    }
  };

  // Delete class
  const handleDeleteClass = async id => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    try {
      await deleteFoundationClass(fetchWithAuth, id);
      setSnack({ message: 'Class deleted!', severity: 'success' });
      loadClasses();
    } catch (err) {
      setSnack({ message: err.message, severity: 'error' });
    }
  };

  // Fill edit form and show dialog
  const openEditDialog = c => {
    setEditing(c);
    setFormVals({ name: c.name, description: c.description || '', start_date: c.start_date || '', end_date: c.end_date || '' });
    setOpenEdit(true);
  };

  return (
    <Box sx={{ maxWidth: 900, pt: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Foundation Classes</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="Search class by name or description..."
          size="small"
          sx={{ mr: 2, width: 340 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button variant="contained" color="primary" onClick={() => setOpenAdd(true)}>
          Add New Class
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center' }}>Loading...</TableCell>
              </TableRow>
            )}
            {!loading && classes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center' }}>No classes found.</TableCell>
              </TableRow>
            )}
            {classes.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.description}</TableCell>
                <TableCell>{c.start_date ? new Date(c.start_date).toLocaleDateString() : ''}</TableCell>
                <TableCell>{c.end_date ? new Date(c.end_date).toLocaleDateString() : ''}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton onClick={() => openEditDialog(c)}><EditIcon /></IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDeleteClass(c.id)}><DeleteIcon color="error" /></IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add class dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Foundation Class</DialogTitle>
        <DialogContent>
          <form id="add-foundation-class-form" onSubmit={handleAddClass}>
            <TextField label="Name" name="name" fullWidth margin="normal"
              value={formVals.name} onChange={handleChange} required />
            <TextField label="Description" name="description" fullWidth margin="normal"
              value={formVals.description} onChange={handleChange} multiline minRows={2} />
            <TextField label="Start Date" name="start_date" type="date" fullWidth margin="normal"
              value={formVals.start_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" name="end_date" type="date" fullWidth margin="normal"
              value={formVals.end_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
          <Button type="submit" form="add-foundation-class-form" variant="contained">Create Class</Button>
        </DialogActions>
      </Dialog>

      {/* Edit class dialog */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Foundation Class</DialogTitle>
        <DialogContent>
          <form id="edit-foundation-class-form" onSubmit={handleEditClass}>
            <TextField label="Name" name="name" fullWidth margin="normal"
              value={formVals.name} onChange={handleChange} required />
            <TextField label="Description" name="description" fullWidth margin="normal"
              value={formVals.description} onChange={handleChange} multiline minRows={2} />
            <TextField label="Start Date" name="start_date" type="date" fullWidth margin="normal"
              value={formVals.start_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" name="end_date" type="date" fullWidth margin="normal"
              value={formVals.end_date} onChange={handleChange} InputLabelProps={{ shrink: true }} />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)}>Cancel</Button>
          <Button type="submit" form="edit-foundation-class-form" variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {snack && (
        <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)}>
          <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.message}</Alert>
        </Snackbar>
      )}
    </Box>
  );
}