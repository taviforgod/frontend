import React, { useEffect, useState } from "react";
import {
  Typography, Button, TextField, List, ListItem, ListItemText, IconButton,
  Box, Stack, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Alert, Pagination, Snackbar, Chip
} from "@mui/material";
import {
  Edit,
  Trash2,
  Download,
} from "lucide-react";
import FileSaver from "file-saver";
import {
  getStatusTypes, createStatusType, updateStatusType, deleteStatusType
} from "../services/cellModuleService";

export default function StatusTypesPage() {
  const [statuses, setStatuses] = useState([]);
  const [fields, setFields] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    loadStatuses();
  }, []);

  async function loadStatuses() {
    try {
      const data = await getStatusTypes();
      setStatuses(data);
      setError("");
    } catch (err) {
      setError("Failed to load status types.");
    }
  }

  function handleChange(e) {
    setFields({ ...fields, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!fields.name.trim()) {
      setError("Name is required.");
      return;
    }

    try {
      if (editId) {
        setStatuses(prev => prev.map(s => s.id === editId ? { ...s, ...fields } : s));
        await updateStatusType(editId, fields);
        setSuccessMessage("Status type updated.");
      } else {
        const newStatus = await createStatusType(fields);
        setStatuses(prev => [...prev, newStatus]);
        setSuccessMessage("Status type added.");
      }

      setSnackbarOpen(true);
      setFields({ name: "", description: "" });
      setEditId(null);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to save status type.");
    }
  }

  function handleEdit(status) {
    setFields({ name: status.name, description: status.description || "" });
    setEditId(status.id);
  }

  function confirmDelete(status) {
    setStatusToDelete(status);
    setDeleteDialogOpen(true);
  }

  function cancelDelete() {
    setStatusToDelete(null);
    setDeleteDialogOpen(false);
  }

  async function handleDeleteConfirmed() {
    if (!statusToDelete) return;

    try {
      setStatuses(prev => prev.filter(s => s.id !== statusToDelete.id));
      await deleteStatusType(statusToDelete.id);
      setSuccessMessage("Status type deleted.");
      setSnackbarOpen(true);
      cancelDelete();
    } catch (err) {
      setError("Failed to delete status type.");
    }
  }

  function handleExportCSV() {
    const headers = ["Name", "Description"];
    const rows = statuses.map(s => [s.name, s.description || ""]);
    const csv = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    FileSaver.saveAs(blob, "status_types.csv");
  }

  const filteredStatuses = statuses.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredStatuses.length / itemsPerPage);
  const paginatedStatuses = filteredStatuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box sx={{ mt: 3, px: { xs: 1, sm: 2, md: 4 } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Status Types</Typography>

      {/* Filters List */}
      <List sx={{ mb: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 1, p: 2 }}>
        <ListItem>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" sx={{ width: "100%" }}>
            <TextField
              label="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              fullWidth
              size="small"
            />
            <Button
              variant="outlined"
              startIcon={<Download size={20} />}
              onClick={handleExportCSV}
              sx={{ whiteSpace: "nowrap" }}
            >
              Export CSV
            </Button>
          </Stack>
        </ListItem>
      </List>

      {/* Main Content List */}
      <List sx={{ bgcolor: "background.paper", borderRadius: 2, boxShadow: 1, p: 2 }}>
        <ListItem>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
              <TextField
                label="Name"
                name="name"
                value={fields.name}
                onChange={handleChange}
                required
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <TextField
                label="Description"
                name="description"
                value={fields.description}
                onChange={handleChange}
                sx={{ flexGrow: 2, minWidth: 300 }}
              />
              <Button type="submit" variant="contained" sx={{ whiteSpace: "nowrap" }}>
                {editId ? "Update" : "Add"}
              </Button>
              {editId && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditId(null);
                    setFields({ name: "", description: "" });
                    setError("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </Stack>
          </form>
        </ListItem>

        {error && (
          <ListItem>
            <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>
          </ListItem>
        )}

        {paginatedStatuses.length === 0 ? (
          <ListItem>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              {statuses.length === 0
                ? "No status types found. Add a new one."
                : "No status types match your search."}
            </Typography>
          </ListItem>
        ) : (
          paginatedStatuses.map((status) => (
            <ListItem
              key={status.id}
              secondaryAction={
                <>
                  <IconButton
                    edge="end"
                    aria-label="edit"
                    onClick={() => handleEdit(status)}
                  >
                    <Edit size={20} />
                  </IconButton>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => confirmDelete(status)}
                  >
                    <Trash2 size={20} />
                  </IconButton>
                </>
              }
              sx={{ mb: 1 }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {status.name}
                    {status.category && (
                      <Chip
                        label={status.category}
                        color={
                          status.category.toLowerCase() === "critical"
                            ? "error"
                            : status.category.toLowerCase() === "warning"
                            ? "warning"
                            : "default"
                        }
                        size="small"
                      />
                    )}
                  </Box>
                }
                secondary={status.description}
              />
            </ListItem>
          ))
        )}

        {totalPages > 1 && (
          <ListItem>
            <Box sx={{ mt: 2, display: "flex", justifyContent: "center", width: "100%" }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
              />
            </Box>
          </ListItem>
        )}
      </List>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Delete Status Type</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{statusToDelete?.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>Cancel</Button>
          <Button onClick={handleDeleteConfirmed} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={successMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
