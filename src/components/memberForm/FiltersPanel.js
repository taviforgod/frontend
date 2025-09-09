import React, { useState } from 'react';
import { Box, TextField, Button, Grid, MenuItem, Card, CardContent } from '@mui/material';
import { RefreshCcwDot, Download, Upload, Plus, FilePlus } from 'lucide-react';
import SnackbarAlert from '../../Shared/SnackbarAlert';
import { exportMembers, importMembers, getMembers } from '../../services/memberService';

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' }
];

export default function FiltersPanel({ onFilter, onAddMember }) {
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [importing, setImporting] = useState(false);

  // Add a ref for the file input (optional, for programmatic click)
  const fileInputRef = React.useRef();

  const handleChange = (e) => {
    setFilters(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSearch = async () => {
    try {
      const members = await getMembers();
      let filtered = members;
      if (filters.search) {
        filtered = filtered.filter(m =>
          (m.first_name + ' ' + m.surname + ' ' + m.email + ' ' + m.contact_primary)
            .toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      if (filters.status) {
        filtered = filtered.filter(m => m.status === filters.status);
      }
      if (onFilter) onFilter(filtered);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to filter members', severity: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportMembers();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'members.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Exported successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await importMembers(formData);
      setSnackbar({ open: true, message: 'Import successful!', severity: 'success' });
      handleSearch();
    } catch (err) {
      setSnackbar({ open: true, message: 'Import failed', severity: 'error' });
    } finally {
      setImporting(false);
      // Reset file input so same file can be uploaded again if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Optional: handler to trigger file input for bulk upload
  const handleBulkUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                name="search"
                label="Search"
                value={filters.search}
                onChange={handleChange}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                name="status"
                label="Status"
                value={filters.status}
                onChange={handleChange}
                fullWidth
              >
                {statusOptions.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 1,
                  width: '100%',
                }}
              >
                {/* Removed Filter button */}
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<Download size={18} />}
                  onClick={handleExport}
                  size="small"
                  fullWidth
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  startIcon={<FilePlus size={18} />}
                  onClick={handleBulkUploadClick}
                  disabled={importing}
                  size="small"
                  fullWidth
                >
                  Bulk Upload
                </Button>
                <input
                  type="file"
                  accept=".csv"
                  hidden
                  ref={fileInputRef}
                  onChange={handleImport}
                  aria-label="Bulk upload CSV"
                />
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Plus size={18} />}
                  onClick={onAddMember}
                  size="small"
                  fullWidth
                >
                  Add Member
                </Button>
              </Box>
            </Grid>
          </Grid>
          <SnackbarAlert
            open={snackbar.open}
            message={snackbar.message}
            severity={snackbar.severity}
            onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          />
        </Box>
      </CardContent>
    </Card>
  );
}