import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import { Pencil, Trash2, Save, X } from 'lucide-react'; // Lucide icons

function LookupManager({ label, fetchAll, create, update, remove }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAll());
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await create(newName);
      setNewName('');
      await load();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setEditName(item.name);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await update(editId, editName);
      setEditId(null);
      setEditName('');
      await load();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    setLoading(true);
    setError('');
    try {
      await remove(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <Card elevation={3} sx={{ mb: 2, minWidth: 260, width: '100%', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{label}</Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={editId ? handleUpdate : handleCreate}>
          <Stack spacing={2}>
            <TextField
              size="small"
              label="Name"
              value={editId ? editName : newName}
              onChange={(e) => editId ? setEditName(e.target.value) : setNewName(e.target.value)}
              disabled={loading}
              fullWidth
            />

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                type="submit"
                variant="contained"
                color={editId ? 'warning' : 'primary'}
                startIcon={editId ? <Save size={18} /> : null}
                disabled={loading}
              >
                {editId ? 'Update' : 'Add'}
              </Button>

              {editId && (
                <Button
                  type="button"
                  variant="outlined"
                  color="inherit"
                  startIcon={<X size={18} />}
                  onClick={() => {
                    setEditId(null);
                    setEditName('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
              )}

              {loading && <CircularProgress size={20} />}
            </Stack>
          </Stack>
        </form>

        <Divider sx={{ my: 3 }} />

        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center">
            No items found.
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 180, overflow: 'auto' }}>
            {items.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <IconButton onClick={() => handleEdit(item)} disabled={loading} size="small">
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)} disabled={loading} size="small">
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                }
                sx={{ py: 0.5 }}
              >
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontWeight: editId === item.id ? 'bold' : 'normal',
                    color: editId === item.id ? 'primary.main' : 'text.primary',
                    fontSize: 15,
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

// Grid wrapper
export function LookupManagerGrid({ managers }) {
  return (
    <Grid container spacing={3}>
      {managers.map((props, idx) => (
        <Grid item xs={12} sm={6} md={4} key={idx}>
          <LookupManager {...props} />
        </Grid>
      ))}
    </Grid>
  );
}

export default LookupManager;
