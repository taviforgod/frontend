import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
  Pagination,
  Chip,
  Modal,
  Fade,
  Backdrop,
  Card,
  CardContent,
} from "@mui/material";
import { Pencil, Trash2, Download } from "lucide-react";
import FileSaver from "file-saver";
import {
  getStatusTypes,
  createStatusType,
  updateStatusType,
  deleteStatusType,
} from "../services/cellModuleService";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  p: 4,
  minWidth: 320,
  maxWidth: "90vw",
};

export default function StatusTypesPage() {
  const [statuses, setStatuses] = useState([]);
  const [fields, setFields] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch {
      setError("Failed to load status types.");
    }
  }

  function handleChange(e) {
    setFields({ ...fields, [e.target.name]: e.target.value });
  }

  function openAddModal() {
    setEditId(null);
    setFields({ name: "", description: "" });
    setError("");
    setModalOpen(true);
  }

  function openEditModal(status) {
    setEditId(status.id);
    setFields({ name: status.name, description: status.description || "" });
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setError("");
    setIsSubmitting(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!fields.name.trim()) {
      setError("Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (editId) {
        await updateStatusType(editId, fields);
        setStatuses((prev) =>
          prev.map((s) => (s.id === editId ? { ...s, ...fields } : s))
        );
        setSnackbar({ open: true, message: "Status type updated.", severity: "success" });
      } else {
        const newStatus = await createStatusType(fields);
        setStatuses((prev) => [...prev, newStatus]);
        setSnackbar({ open: true, message: "Status type added.", severity: "success" });
      }
      closeModal();
    } catch (err) {
      setError(err.message || "Failed to save status type.");
    } finally {
      setIsSubmitting(false);
    }
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
      await deleteStatusType(statusToDelete.id);
      setStatuses((prev) => prev.filter((s) => s.id !== statusToDelete.id));
      setSnackbar({ open: true, message: "Status type deleted.", severity: "success" });
      cancelDelete();
    } catch {
      setSnackbar({ open: true, message: "Failed to delete status type.", severity: "error" });
    }
  }

  function handleExportCSV() {
    const headers = ["Name", "Description"];
    const rows = statuses.map((s) => [s.name, s.description || ""]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
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
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        Status Types
      </Typography>

      {/* Filters & Actions in a Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 0 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              size="small"
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <Button
              variant="outlined"
              startIcon={<Download size={20} />}
              onClick={handleExportCSV}
              sx={{ whiteSpace: "nowrap" }}
            >
              Export CSV
            </Button>
            <Button variant="contained" onClick={openAddModal} sx={{ whiteSpace: "nowrap" }}>
              Add Status
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Status List */}
      <Stack spacing={2}>
        {error && (
          <Alert severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        )}

        {paginatedStatuses.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 2, width: "100%", textAlign: "center" }}>
            {statuses.length === 0
              ? "No status types found. Add a new one."
              : "No status types match your search."}
          </Typography>
        ) : (
          paginatedStatuses.map((status) => (
            <Card
              key={status.id}
              sx={{
                borderRadius: 2,
                boxShadow: 1,
                bgcolor: "background.paper",
                mb: 1,
              }}
            >
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      aria-label="edit"
                      onClick={() => openEditModal(status)}
                      size="small"
                    >
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton
                      aria-label="delete"
                      onClick={() => confirmDelete(status)}
                      size="small"
                      color="error"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                }
                sx={{ borderRadius: 1 }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontWeight: "600" }}>{status.name}</Typography>
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
            </Card>
          ))
        )}

        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(e, page) => setCurrentPage(page)}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Stack>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 300 } }}
        aria-labelledby="status-modal-title"
      >
        <Fade in={modalOpen}>
          <Box component="form" onSubmit={handleSubmit} sx={modalStyle} noValidate autoComplete="off">
            <Typography id="status-modal-title" variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
              {editId ? "Edit Status Type" : "Add Status Type"}
            </Typography>
            <TextField
              label="Name"
              name="name"
              value={fields.name}
              onChange={handleChange}
              required
              fullWidth
              autoFocus
              sx={{ mb: 2 }}
              disabled={isSubmitting}
            />
            <TextField
              label="Description"
              name="description"
              value={fields.description}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              sx={{ mb: 3 }}
              disabled={isSubmitting}
            />
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{ minWidth: 90 }}
              >
                {editId ? "Update" : "Add"}
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>

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

      {/* Snackbar Alert for Success/Error */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
