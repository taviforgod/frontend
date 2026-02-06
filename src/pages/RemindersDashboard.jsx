import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useJobService } from "../services/jobService";
import {
  Box, Paper, Typography, Table, TableHead, TableRow, TableCell, TableBody, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Snackbar, Alert
} from "@mui/material";

export default function RemindersDashboard() {
  const { fetchWithAuth } = useContext(AuthContext);
  const { getJobs, createJob, updateJob, deleteJob } = useJobService(fetchWithAuth);

  const [jobs, setJobs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ job_type: "", title: "", message: "", schedule: "", config: "{}" });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "info" });

  async function loadJobs() {
    setLoading(true);
    try {
      const data = await getJobs({ limit: 50 });
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to load jobs", err);
      setJobs([]);
      setSnack({ open: true, message: "Failed to load jobs", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadJobs(); }, []);

  const openDialog = (j) => {
    if (j) {
      setEditId(j.id);
      setForm({
        job_type: j.job_type || "",
        title: j.title || "",
        message: j.message || "",
        schedule: j.schedule || "",
        config: JSON.stringify(j.config || {})
      });
    } else {
      setEditId(null);
      setForm({ job_type: "", title: "", message: "", schedule: "", config: "{}" });
    }
    setOpen(true);
  };
  const closeDialog = () => setOpen(false);

  const handleSave = async () => {
    setActionLoading(true);
    try {
      // validate minimal fields
      if (!form.job_type || !form.title) {
        setSnack({ open: true, message: "Job type and title are required", severity: "warning" });
        return;
      }

      let parsedConfig = {};
      try {
        parsedConfig = JSON.parse(form.config || "{}");
      } catch (e) {
        setSnack({ open: true, message: "Config must be valid JSON", severity: "error" });
        return;
      }

      const payload = { job_type: form.job_type, title: form.title, message: form.message, schedule: form.schedule, config: parsedConfig };

      if (editId) await updateJob(editId, payload);
      else await createJob(payload);

      await loadJobs();
      closeDialog();
      setSnack({ open: true, message: editId ? "Job updated" : "Job created", severity: "success" });
    } catch (err) {
      console.error("Save job failed", err);
      setSnack({ open: true, message: "Failed to save job", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete job?")) return;
    setActionLoading(true);
    try {
      await deleteJob(id);
      await loadJobs();
      setSnack({ open: true, message: "Job deleted", severity: "success" });
    } catch (err) {
      console.error("Delete failed", err);
      setSnack({ open: true, message: "Failed to delete job", severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2, mt: 4 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Reminders & Jobs</Typography>
      <Button variant="contained" onClick={() => openDialog()} disabled={loading || actionLoading}>
        {loading ? <CircularProgress size={18} /> : "Add Reminder / Job"}
      </Button>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}><CircularProgress /></Box>
      ) : (
        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Schedule</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map(j => (
              <TableRow key={j.id}>
                <TableCell>{j.job_type}</TableCell>
                <TableCell>{j.title}</TableCell>
                <TableCell>{j.message}</TableCell>
                <TableCell>{j.schedule}</TableCell>
                <TableCell>{j.status}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openDialog(j)} disabled={actionLoading}>Edit</Button>
                  <Button size="small" color="error" onClick={() => handleDelete(j.id)} disabled={actionLoading}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? "Edit Job/Reminder" : "Add New Job/Reminder"}</DialogTitle>
        <DialogContent>
          <TextField label="Job Type" fullWidth margin="normal" value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))} />
          <TextField label="Title" fullWidth margin="normal" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <TextField label="Message" fullWidth margin="normal" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          <TextField label="Schedule (cron)" fullWidth margin="normal" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} />
          <TextField label="Config (JSON)" fullWidth multiline minRows={2} margin="normal" value={form.config} onChange={e => setForm(f => ({ ...f, config: e.target.value }))} />
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