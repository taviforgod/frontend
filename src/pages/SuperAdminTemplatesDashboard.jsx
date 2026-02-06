import React, { useEffect, useState, useContext } from "react";
import DOMPurify from "dompurify";
import { useTemplateService } from "../services/templateService";
import { AuthContext } from "../contexts/AuthContext";
import {
  Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Select, MenuItem, Box, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Snackbar, Alert
} from "@mui/material";

export default function SuperAdminTemplatesDashboard() {
  const { fetchWithAuth, lookups } = useContext(AuthContext);
  const service = useTemplateService(fetchWithAuth);

  const [templates, setTemplates] = useState([]);
  const [churchId, setChurchId] = useState("");
  const [targetChurchId, setTargetChurchId] = useState("");
  const [preview, setPreview] = useState("");
  const [previewId, setPreviewId] = useState("");
  const [openPreview, setOpenPreview] = useState(false);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  async function loadTemplates() {
    setLoading(true);
    try {
      const params = {};
      if (churchId) params.church_id = churchId;
      const data = await service.getTemplates(params);
      setTemplates(data.templates || []);
    } catch (err) {
      console.error("Failed to load templates", err);
      setTemplates([]);
      setSnack({ open: true, message: "Failed to load templates", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchId]);

  const handlePreview = async (id) => {
    setActionLoading(true);
    try {
      const data = await service.previewTemplate(id, { user: { name: "Sample" } });
      const raw = data.preview || "";
      setPreview(DOMPurify.sanitize(raw));
      setPreviewId(id);
      setOpenPreview(true);
    } catch (err) {
      console.error("Preview failed", err);
      setSnack({ open: true, message: "Preview failed", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopy = async (id) => {
    if (!targetChurchId) {
      setSnack({ open: true, message: "Please select a target church", severity: "warning" });
      return;
    }
    if (!window.confirm("Copy this template to target church?")) return;

    setActionLoading(true);
    try {
      await service.copyTemplateToChurch(id, targetChurchId);
      setSnack({ open: true, message: "Template copied!", severity: "success" });
      await loadTemplates();
    } catch (err) {
      console.error("Copy failed", err);
      setSnack({ open: true, message: "Failed to copy template", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 3 }}>
      <Typography variant="h5">Super Admin: Template Master Dashboard</Typography>

      <Box sx={{ mt: 2, mb: 2, display: "flex", gap: 2, alignItems: "center" }}>
        <Select value={churchId} onChange={(e) => setChurchId(e.target.value)} displayEmpty>
          <MenuItem value="">All Churches</MenuItem>
          {Object.entries((lookups?.churchesMap || {})).map(([id, label]) => (
            <MenuItem value={id} key={id}>
              {label}
            </MenuItem>
          ))}
        </Select>

        <Select
          sx={{ minWidth: 220 }}
          value={targetChurchId}
          onChange={(e) => setTargetChurchId(e.target.value)}
          displayEmpty
        >
          <MenuItem value="">Target Church</MenuItem>
          {Object.entries((lookups?.churchesMap || {})).map(([id, label]) => (
            <MenuItem value={id} key={id}>
              {label}
            </MenuItem>
          ))}
        </Select>

        <Box sx={{ ml: "auto" }}>
          <Button variant="contained" onClick={loadTemplates} disabled={loading}>
            {loading ? <CircularProgress size={18} /> : "Reload"}
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Church</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((tpl) => (
              <TableRow key={tpl.id}>
                <TableCell>{tpl.name}</TableCell>
                <TableCell>{tpl.channel}</TableCell>
                <TableCell>{(lookups?.churchesMap || {})[tpl.church_id] || tpl.church_id}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handlePreview(tpl.id)} disabled={actionLoading}>
                    Preview
                  </Button>
                  <Button size="small" onClick={() => handleCopy(tpl.id)} disabled={actionLoading}>
                    Copy to Target
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {templates.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>No templates found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>Preview Template</DialogTitle>
        <DialogContent>
          <Box border={1} p={2}>
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}