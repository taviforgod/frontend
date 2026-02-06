import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, FormControl, InputLabel,
  Select, MenuItem, Alert, CircularProgress, IconButton, Tooltip
} from '@mui/material';
import { Edit, Delete, Add, Preview } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const NotificationTemplates = () => {
  const { fetchWithAuth } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    channel: 'email',
    subject_template: '',
    body_template: '',
    description: '',
    variables: [],
    is_default: false
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/notifications/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError('Failed to load notification templates');
      console.error('Load templates error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name || '',
        channel: template.channel || 'email',
        subject_template: template.subject_template || '',
        body_template: template.body_template || '',
        description: template.description || '',
        variables: template.variables ? JSON.parse(template.variables) : [],
        is_default: template.is_default || false
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        channel: 'email',
        subject_template: '',
        body_template: '',
        description: '',
        variables: [],
        is_default: false
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      channel: 'email',
      subject_template: '',
      body_template: '',
      description: '',
      variables: [],
      is_default: false
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const templateData = {
        ...formData,
        variables: JSON.stringify(formData.variables)
      };

      const url = editingTemplate
        ? `/api/notifications/templates/${editingTemplate.id}`
        : '/api/notifications/templates';

      const method = editingTemplate ? 'PUT' : 'POST';

      const response = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData)
      });

      if (response.ok) {
        setSuccess(`Template ${editingTemplate ? 'updated' : 'created'} successfully`);
        handleCloseDialog();
        loadTemplates();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(`Failed to ${editingTemplate ? 'update' : 'create'} template`);
      }
    } catch (err) {
      setError(`Failed to ${editingTemplate ? 'update' : 'create'} template`);
      console.error('Save template error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetchWithAuth(`/api/notifications/templates/${templateId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Template deleted successfully');
        loadTemplates();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (err) {
      setError('Failed to delete template');
      console.error('Delete template error:', err);
    }
  };

  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const addVariable = () => {
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, '']
    }));
  };

  const updateVariable = (index, value) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((v, i) => i === index ? value : v)
    }));
  };

  const removeVariable = (index) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const renderPreviewContent = (template) => {
    if (!template) return '';

    let subject = template.subject_template || '';
    let body = template.body_template || '';

    // Replace variables with sample data for preview
    const sampleData = {
      first_name: 'John',
      church_name: 'Your Church',
      meeting_name: 'Sunday Service',
      meeting_date: '2024-12-29',
      meeting_time: '10:00 AM',
      prayer_subject: 'Family Healing',
      prayer_details: 'Please pray for healing and strength for our family.',
      event_name: 'Christmas Celebration',
      event_date: '2024-12-25'
    };

    Object.keys(sampleData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, sampleData[key]);
      body = body.replace(regex, sampleData[key]);
    });

    return { subject, body };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Notification Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage email, SMS, and push notification templates for automated communications.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          New Template
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Default</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template.id}>
                <TableCell>
                  <Typography variant="body1" fontWeight={500}>
                    {template.name}
                  </Typography>
                  {template.subject_template && (
                    <Typography variant="caption" color="text.secondary">
                      {template.subject_template}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={template.channel}
                    size="small"
                    color={
                      template.channel === 'email' ? 'primary' :
                      template.channel === 'sms' ? 'secondary' :
                      template.channel === 'push' ? 'success' : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {template.description || 'No description'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {template.is_default && (
                    <Chip label="Default" size="small" color="primary" />
                  )}
                </TableCell>
                <TableCell>
                  <Tooltip title="Preview">
                    <IconButton
                      size="small"
                      onClick={() => handlePreview(template)}
                    >
                      <Preview />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Template Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create New Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>Channel</InputLabel>
              <Select
                value={formData.channel}
                onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value }))}
                label="Channel"
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
                <MenuItem value="push">Push Notification</MenuItem>
                <MenuItem value="in_app">In-App</MenuItem>
              </Select>
            </FormControl>

            {(formData.channel === 'email' || formData.channel === 'push') && (
              <TextField
                label="Subject Template"
                value={formData.subject_template}
                onChange={(e) => setFormData(prev => ({ ...prev, subject_template: e.target.value }))}
                fullWidth
                placeholder="Use {{variable}} for dynamic content"
              />
            )}

            <TextField
              label="Body Template"
              value={formData.body_template}
              onChange={(e) => setFormData(prev => ({ ...prev, body_template: e.target.value }))}
              fullWidth
              multiline
              rows={6}
              placeholder="Use {{variable}} for dynamic content"
              required
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={2}
            />

            <Box>
              <Typography variant="h6" gutterBottom>
                Variables
              </Typography>
              {formData.variables.map((variable, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    placeholder="variable_name"
                    value={variable}
                    onChange={(e) => updateVariable(index, e.target.value)}
                    size="small"
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => removeVariable(index)}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button
                variant="outlined"
                size="small"
                onClick={addVariable}
                startIcon={<Add />}
              >
                Add Variable
              </Button>
            </Box>

            <FormControlLabel
              control={
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                />
              }
              label="Set as default template"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.name || !formData.body_template}
          >
            {saving ? <CircularProgress size={16} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          {previewTemplate && (
            <Box>
              {renderPreviewContent(previewTemplate).subject && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6">Subject:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {renderPreviewContent(previewTemplate).subject}
                  </Typography>
                </Box>
              )}
              <Typography variant="h6">Body:</Typography>
              <Box sx={{
                border: '1px solid #ccc',
                borderRadius: 1,
                p: 2,
                mt: 1,
                whiteSpace: 'pre-wrap',
                maxHeight: 300,
                overflow: 'auto'
              }}>
                {renderPreviewContent(previewTemplate).body}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationTemplates;