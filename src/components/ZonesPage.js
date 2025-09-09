import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Modal,
  TextField,
  Stack,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
  Chip,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
} from "../services/cellModuleService";
import Snackbar from "@mui/material/Snackbar";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  minWidth: 360,
  borderRadius: 3,
  maxWidth: "90vw",
  maxHeight: "90vh",
  overflowY: "auto",
};

export default function ZonesPage() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [zones, setZones] = useState([]);
  const [fields, setFields] = useState({
    name: "",
    description: "",
    status: "active",
  });
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [zoneToDelete, setZoneToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState("name");
  const itemsPerPage = 5;

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
    try {
      setIsLoading(true);
      const data = await getZones();
      setZones(data);
      setError("");
    } catch (err) {
      setError("Failed to load zones.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleChange(e) {
    setFields({ ...fields, [e.target.name]: e.target.value });
  }

  function openAddModal() {
    setFields({ name: "", description: "", status: "active" });
    setEditId(null);
    setModalOpen(true);
    setError("");
  }

  function openEditModal(zone) {
    setFields({
      name: zone.name,
      description: zone.description || "",
      status: zone.status || "active",
    });
    setEditId(zone.id);
    setModalOpen(true);
    setError("");
  }

  function closeModal() {
    setModalOpen(false);
    setFields({ name: "", description: "", status: "active" });
    setEditId(null);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!fields.name.trim()) {
      setError("Zone name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (editId) {
        await updateZone(editId, fields);
        setZones((prev) =>
          prev.map((z) => (z.id === editId ? { ...z, ...fields } : z))
        );
      } else {
        const newZone = await createZone(fields);
        setZones((prev) => [...prev, newZone]);
      }
      closeModal();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function confirmDelete(zone) {
    setZoneToDelete(zone);
    setDeleteDialogOpen(true);
  }

  function cancelDelete() {
    setZoneToDelete(null);
    setDeleteDialogOpen(false);
  }

  async function handleDeleteConfirmed() {
    if (!zoneToDelete) return;
    setIsDeleting(true);
    try {
      await deleteZone(zoneToDelete.id);
      setZones((prev) => prev.filter((z) => z.id !== zoneToDelete.id));
      setSnackbar({
        open: true,
        message: "Zone deleted successfully.",
        severity: "success",
      });
      cancelDelete();
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete zone.",
        severity: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  function handlePageChange(event, page) {
    setCurrentPage(page);
  }

  const filteredZones = zones.filter(
    (zone) =>
      zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (zone.description &&
        zone.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedZones = [...filteredZones].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "status")
      return (a.status || "").localeCompare(b.status || "");
    return 0;
  });

  const totalPages = Math.ceil(sortedZones.length / itemsPerPage);
  const paginatedZones = sortedZones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box sx={{ mt: 3, px: { xs: 2, sm: 4, md: 6 } }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Zones
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Filters Card */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 0 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
          >
            <TextField
              label="Search zones"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              fullWidth
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortKey}
                label="Sort by"
                onChange={(e) => setSortKey(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={openAddModal}
              sx={{ minWidth: 140, whiteSpace: "nowrap" }}
              size={isSmallScreen ? "medium" : "large"}
            >
              Add Zone
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* List, Pagination, Dialogs */}
      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : paginatedZones.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
          {zones.length === 0
            ? 'No zones found. Click "Add Zone" to create one.'
            : "No zones match your search."}
        </Typography>
      ) : (
        <>
          <List disablePadding>
            {paginatedZones.map((zone) => (
              <ListItem
                key={zone.id}
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      aria-label="Edit zone"
                      onClick={() => openEditModal(zone)}
                      color="primary"
                      size="small"
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton
                      aria-label="Delete zone"
                      onClick={() => confirmDelete(zone)}
                      color="error"
                      size="small"
                      sx={{
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                }
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  boxShadow: "0 1px 5px rgba(0,0,0,0.05)",
                  bgcolor: "background.paper",
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600 }}
                        noWrap
                      >
                        {zone.name}
                      </Typography>
                      {zone.status && (
                        <Chip
                          label={
                            zone.status.charAt(0).toUpperCase() +
                            zone.status.slice(1)
                          }
                          color={
                            zone.status === "active" ? "success" : "default"
                          }
                          size="small"
                          sx={{ fontWeight: "bold" }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    zone.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        noWrap
                      >
                        {zone.description}
                      </Typography>
                    )
                  }
                />
              </ListItem>
            ))}
          </List>

          {totalPages > 1 && (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        aria-labelledby="zone-modal-title"
        closeAfterTransition
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={modalStyle}
          noValidate
          autoComplete="off"
        >
          <Typography
            id="zone-modal-title"
            variant="h6"
            sx={{ mb: 3, fontWeight: "bold" }}
          >
            {editId ? "Edit Zone" : "Add Zone"}
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Name"
              name="name"
              value={fields.name}
              onChange={handleChange}
              required
              autoFocus
              fullWidth
            />
            <TextField
              label="Description"
              name="description"
              value={fields.description}
              onChange={handleChange}
              multiline
              minRows={2}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={fields.status}
                onChange={handleChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            {error && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {error}
              </Alert>
            )}
            <Stack
              direction="row"
              spacing={2}
              justifyContent="flex-end"
              sx={{ pt: 1 }}
            >
              <Button
                variant="outlined"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{ minWidth: 100 }}
              >
                {isSubmitting ? "Saving..." : editId ? "Update" : "Add"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title" sx={{ fontWeight: "bold" }}>
          Delete Zone
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the zone{" "}
            <strong>"{zoneToDelete?.name}"</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirmed}
            color="error"
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Alert */}
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
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
