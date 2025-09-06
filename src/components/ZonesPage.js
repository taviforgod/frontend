import React, { useEffect, useState } from "react";
import {
  Typography, Button, List, ListItem, ListItemText, IconButton,
  Box, Modal, TextField, Stack, Alert, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Pagination, Chip, CircularProgress,
  MenuItem, Select, FormControl, InputLabel, Card, CardContent
} from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";
import {
  getZones, createZone, updateZone, deleteZone
} from "../services/cellModuleService";

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper', boxShadow: 24, p: 4,
  minWidth: 320, borderRadius: 2
};

export default function ZonesPage() {
  const [zones, setZones] = useState([]);
  const [fields, setFields] = useState({ name: "", description: "", status: "active" });
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
  }

  function openEditModal(zone) {
    setFields({
      name: zone.name,
      description: zone.description || "",
      status: zone.status || "active"
    });
    setEditId(zone.id);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFields({ name: "", description: "", status: "active" });
    setEditId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!fields.name.trim()) {
      setError("Zone name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editId) {
        setZones(prev => prev.map(z => z.id === editId ? { ...z, ...fields } : z));
        await updateZone(editId, fields);
      } else {
        const newZone = await createZone(fields);
        setZones(prev => [...prev, newZone]);
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
      setZones(prev => prev.filter(z => z.id !== zoneToDelete.id));
      await deleteZone(zoneToDelete.id);
      cancelDelete();
    } catch (err) {
      setError("Failed to delete zone.");
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
      (zone.description && zone.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedZones = [...filteredZones].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    if (sortKey === "status") return (a.status || "").localeCompare(b.status || "");
    return 0;
  });

  const totalPages = Math.ceil(sortedZones.length / itemsPerPage);
  const paginatedZones = sortedZones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Box sx={{ mt: 3, px: { xs: 1, sm: 2, md: 4 } }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Zones</Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* Top Card: Search, Add Button, Sort */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
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
            <FormControl size="small" sx={{ minWidth: 120 }}>
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
            <Button variant="contained" onClick={openAddModal} sx={{ minWidth: 120 }}>
              Add Zone
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Bottom Card: List, Pagination, Dialogs */}
      <Card elevation={2}>
        <CardContent>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : paginatedZones.length === 0 ? (
            <Typography color="text.secondary">
              {zones.length === 0
                ? 'No zones found. Click "Add Zone" to create one.'
                : "No zones match your search."}
            </Typography>
          ) : (
            <>
              <List>
                {paginatedZones.map((zone) => (
                  <ListItem
                    key={zone.id}
                    secondaryAction={
                      <>
                        <IconButton aria-label="Edit zone" onClick={() => openEditModal(zone)}>
                          <Pencil size={18} />
                        </IconButton>
                        <IconButton aria-label="Delete zone" onClick={() => confirmDelete(zone)}>
                          <Trash2 size={18} />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {zone.name}
                          {zone.status && (
                            <Chip
                              label={zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}
                              color={zone.status === "active" ? "success" : "default"}
                              size="small"
                            />
                          )}
                        </Box>
                      }
                      secondary={zone.description}
                    />
                  </ListItem>
                ))}
              </List>

              {totalPages > 1 && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal open={modalOpen} onClose={closeModal} aria-labelledby="zone-modal">
        <Box component="form" onSubmit={handleSubmit} sx={modalStyle}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {editId ? "Edit Zone" : "Add Zone"}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Name"
              name="name"
              value={fields.name}
              onChange={handleChange}
              required
              autoFocus
            />
            <TextField
              label="Description"
              name="description"
              value={fields.description}
              onChange={handleChange}
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
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editId ? "Update" : "Add"}
              </Button>
              <Button variant="outlined" onClick={closeModal}>
                Cancel
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
        <DialogTitle id="delete-dialog-title">Delete Zone</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the zone{" "}
            <strong>"{zoneToDelete?.name}"</strong>?
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
    </Box>
  );
}
