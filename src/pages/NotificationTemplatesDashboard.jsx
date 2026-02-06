import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useTemplateService } from "../services/templateService";
import DOMPurify from "dompurify";
import {
  Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Typography,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem,
  CircularProgress, Snackbar, Alert
} from '@mui/material';

export default function NotificationTemplatesDashboard() {
  const { fetchWithAuth } = useContext(AuthContext);
  const service = useTemplateService(fetchWithAuth);

  const [templates, setTemplates] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', channel: '', subject: '', body: '', description: '' });
  const [preview, setPreview] = useState('');
  const [targetChurchId, setTargetChurchId] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await service.getTemplates({});
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("Failed to load templates", err);
      setTemplates([]);
      setSnack({ open: true, message: "Failed to load templates", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTemplates(); }, []);

  const openDialog = (tpl) => {
    setEditId(tpl?.id || null);
    setForm(tpl ? { ...tpl } : { name: '', channel: '', subject: '', body: '', description: '' });
    setOpen(true);
    setPreview('');
  };
  const closeDialog = () => setOpen(false);

  async function handleSave() {
    setActionLoading(true);
    try {
      if (!form.name || !form.channel) {
        setSnack({ open: true, message: "Name and Channel are required", severity: "warning" });
        return;
      }
      if (editId) await service.updateTemplate(editId, form);
      else await service.createTemplate(form);
      await loadTemplates();
      closeDialog();
      setSnack({ open: true, message: "Template saved", severity: "success" });
    } catch (err) {
      console.error("Save template failed", err);
      setSnack({ open: true, message: "Failed to save template", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePreview() {
    setActionLoading(true);
    try {
      const data = await service.previewTemplate(editId, { ...form, user: { name: "Sample" }, meetingDate: "2025-12-01" });
      const raw = data.preview || '';
      const clean = DOMPurify.sanitize(raw);
      setPreview(clean);
    } catch (err) {
      console.error("Preview failed", err);
      setPreview('');
      setSnack({ open: true, message: "Preview failed", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCopy(id) {
    if (!window.confirm("Copy this template?")) return;
    setActionLoading(true);
    try {
      await service.copyTemplateToChurch(id, targetChurchId);
      await loadTemplates();
      setSnack({ open: true, message: "Template copied", severity: "success" });
    } catch (err) {
      console.error("Copy failed", err);
      setSnack({ open: true, message: "Failed to copy template", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete template?")) return;
    setActionLoading(true);
    try {
      await service.deleteTemplate(id);
      await loadTemplates();
      setSnack({ open: true, message: "Template deleted", severity: "success" });
    } catch (err) {
      console.error("Delete failed", err);
      setSnack({ open: true, message: "Failed to delete template", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Paper sx={{ p: 2, mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Notification Templates</Typography>

      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
        <Button variant="contained" onClick={() => openDialog()} disabled={loading || actionLoading}>
          {loading ? <CircularProgress size={20} /> : "Add Template"}
        </Button>
        <TextField
          label="Target Church ID for Copy"
          value={targetChurchId}
          onChange={e => setTargetChurchId(e.target.value)}
          size="small"
        />
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}><CircularProgress /></Box>
      ) : (
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map(tpl => (
              <TableRow key={tpl.id}>
                <TableCell>{tpl.name}</TableCell>
                <TableCell>{tpl.channel}</TableCell>
                <TableCell>{tpl.subject}</TableCell>
                <TableCell>{tpl.description}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openDialog(tpl)} disabled={actionLoading}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(tpl.id)} disabled={actionLoading}>Delete</Button>
                  <Button size="small" color="primary" onClick={() => handleCopy(tpl.id)} disabled={actionLoading}>Copy</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? "Edit Template" : "Add Template"}</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth required margin="normal" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <Select fullWidth required margin="normal" value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
            <MenuItem value=""><em>Select channel</em></MenuItem>
            <MenuItem value="email">Email</MenuItem>
            <MenuItem value="in_app">In App</MenuItem>
            <MenuItem value="sms">SMS</MenuItem>
            <MenuItem value="whatsapp">WhatsApp</MenuItem>
            <MenuItem value="reminder">Reminder</MenuItem>
          </Select>
          <TextField label="Subject" fullWidth margin="normal" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          <TextField label="Body (Handlebars/HTML/text)" fullWidth multiline minRows={5} margin="normal" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          <TextField label="Description" fullWidth margin="normal" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button onClick={handlePreview} disabled={actionLoading}>{actionLoading ? <CircularProgress size={18} /> : "Preview"}</Button>
            <Button onClick={() => { setPreview(''); }} disabled={actionLoading}>Clear Preview</Button>
          </Box>

          {preview ? (
            <Box border={1} mt={2} p={2} dangerouslySetInnerHTML={{ __html: preview }} />
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={actionLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={18} /> : (editId ? "Save" : "Add")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack(s => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}