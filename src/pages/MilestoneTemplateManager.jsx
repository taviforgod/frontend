import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Checkbox, IconButton, Tooltip,
  FormControlLabel, Card, CardContent, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { Pencil, Trash2 } from 'lucide-react';
import ConfirmDialog from '../Shared/ConfirmDialog';
import SnackbarAlert from '../Shared/SnackbarAlert';
import { getMilestoneTemplates, createMilestoneTemplate, updateMilestoneTemplate, deleteMilestoneTemplate } from '../api/milestoneTemplates';

export default function MilestoneTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', required_for_promotion: false });
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await getMilestoneTemplates();
      setTemplates(Array.isArray(data) ? data : []);
    } catch {
      showSnackbar('Failed to load milestone templates', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpen = (template = null) => {
    setSelectedTemplate(template);
    if (template) {
      setForm({
        name: template.name,
        description: template.description,
        required_for_promotion: template.required_for_promotion,
      });
    } else {
      setForm({ name: '', description: '', required_for_promotion: false });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTemplate(null);
  };

  const handleSubmit = async () => {
    try {
      if (selectedTemplate) {
        await updateMilestoneTemplate(selectedTemplate.id, form);
        showSnackbar('Template updated successfully');
      } else {
        await createMilestoneTemplate(form);
        showSnackbar('Template created successfully');
      }
      handleClose();
      loadTemplates();
    } catch {
      showSnackbar('Save operation failed', 'error');
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({ open: true, id });
  };

  const confirmDeletion = async () => {
    try {
      await deleteMilestoneTemplate(confirmDialog.id);
      showSnackbar('Template deleted');
      loadTemplates();
    } catch {
      showSnackbar('Delete failed', 'error');
    } finally {
      setConfirmDialog({ open: false, id: null });
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container sx={{ mt: 4 }}>
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3 }}>
        <CardContent sx={{ p: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: 1 }}>
            <TextField
              label="Search Templates"
              value={search}
              onChange={e => setSearch(e.target.value)}
              fullWidth
              size="small"
            />
          </Box>
          <Button variant="contained" onClick={() => handleOpen()}>
            Create New Template
          </Button>
        </CardContent>
      </Card>

      {/* Each template in its own card */}
      <Box>
        {filteredTemplates.length === 0 ? (
          <Card sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
            <CardContent>
              <Typography sx={{ p: 2 }}>No templates found.</Typography>
            </CardContent>
          </Card>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              sx={{
                mb: 2,
                borderRadius: 2,
                boxShadow: 2,
                bgcolor: "background.paper",
              }}
            >
              <CardContent>
                <ListItem
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                    px: 0,
                  }}
                  secondaryAction={
                    <Box>
                      <Tooltip title="Edit Template">
                        <IconButton onClick={() => handleOpen(template)}>
                          <Pencil size={20} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Template">
                        <IconButton color="error" onClick={() => handleDelete(template.id)}>
                          <Trash2 size={20} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ minWidth: 120 }}>{template.name}</Typography>
                        <Typography variant="body2" color="text.secondary">{template.description}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Required for Promotion: {template.required_for_promotion ? 'Yes' : 'No'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Create/Edit Template Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={form.required_for_promotion}
                onChange={(e) => setForm({ ...form, required_for_promotion: e.target.checked })}
              />
            }
            label="Required for Promotion"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {selectedTemplate ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        onConfirm={confirmDeletion}
        title="Confirm Deletion"
        description="Are you sure you want to delete this milestone template?"
      />

      {/* Snackbar */}
      <SnackbarAlert
        open={snackbar.open}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        severity={snackbar.severity}
        message={snackbar.message}
      />
    </Container>
  );
}
