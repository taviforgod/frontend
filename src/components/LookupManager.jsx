import React, { useEffect, useState, useContext } from 'react';
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
  Paper,
  Divider,
  Grid,
  useMediaQuery,
  AppBar,
  Toolbar,
  InputAdornment,
} from '@mui/material';
import { Pencil, Trash2, Save, X, PlusCircle, Search } from 'lucide-react';
import { useTheme } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext'; // <-- Add this import
import { useLocation } from 'react-router-dom';

// ----------------------
// Individual Manager Card
// ----------------------
function LookupManager({ label, fetchAll, create, update, remove }) {
  const [items, setItems] = useState([]);
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchAll(fetchWithAuth));
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await create(fetchWithAuth, newName);
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
      await update(fetchWithAuth, editId, editName);
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
    if (typeof id === 'function') {
      console.error('Attempted to delete using a function as id', id);
      setError('Invalid item id');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await remove(fetchWithAuth, id);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        p: { xs: 2, sm: 3 },
        height: 340, // <-- reduce height
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        transition: 'box-shadow 0.2s ease',
        '&:hover': { boxShadow: theme.shadows[6] },
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        {label}
      </Typography>

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
            onChange={(e) => (editId ? setEditName(e.target.value) : setNewName(e.target.value))}
            disabled={loading}
            fullWidth
          />

          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={1.5}
            alignItems={isMobile ? 'stretch' : 'center'}
          >
            <Button
              type="submit"
              variant="contained"
              color={editId ? 'warning' : 'primary'}
              startIcon={editId ? <Save size={18} /> : <PlusCircle size={18} />}
              disabled={loading}
              fullWidth={isMobile}
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
                fullWidth={isMobile}
              >
                Cancel
              </Button>
            )}

            {loading && <CircularProgress size={20} />}
          </Stack>
        </Stack>
      </form>

      <Divider sx={{ my: 2 }} />

      <Box flexGrow={1} sx={{ overflowY: 'auto', minHeight: 0 }}>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
            No items found.
          </Typography>
        ) : (
          <List dense>
            {items.map((item) => (
              <ListItem
                key={item.id}
                sx={{
                  py: 0.8,
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: editId === item.id ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background 0.2s ease',
                }}
                secondaryAction={
                  <Stack direction="row" spacing={0.5}>
                    <IconButton onClick={() => handleEdit(item)} disabled={loading} size="small" color="primary">
                      <Pencil size={16} />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)} disabled={loading} size="small" color="error">
                      <Trash2 size={16} />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontWeight: editId === item.id ? 600 : 400,
                    color: editId === item.id ? 'primary.main' : 'text.primary',
                    fontSize: 15,
                  }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
}

// ----------------------
// Dashboard Page Wrapper
// ----------------------
export function LookupManagerGrid({ managers }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialSearch = params.get('focus') || '';
  const [search, setSearch] = useState(initialSearch);

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh', pb: 6 }}>
      {/* Header Bar */}
      <AppBar
        position="static"
        elevation={1}
        color="inherit"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar sx={{ flexWrap: 'wrap', py: 1.5 }}>
          <Typography variant="h5" fontWeight={700} sx={{ flexGrow: 1 }}>
            Lookup Manager Dashboard
          </Typography>

          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', sm: 240 }, mt: { xs: 1, sm: 0 } }}
          />
        </Toolbar>
      </AppBar>

      {/* Content Grid */}
      <Box sx={{ p: { xs: 2, sm: 4 } }}>
        <Grid container spacing={3}>
          {managers
            .filter((m) => m.label.toLowerCase().includes(search.toLowerCase()))
            .map((props, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
                <LookupManager {...props} />
              </Grid>
            ))}
        </Grid>
      </Box>
    </Box>
  );
}

export default LookupManager;
