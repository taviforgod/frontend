import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Grid,
  Modal,
  Box,
  IconButton,
  Tooltip,
  Divider,
  Card,
  CardContent,
  TextField,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Chip,
  Avatar,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from "@mui/material";
import {
  Pencil,
  Users,
  Heart,
  FileDown,
  Trash2,
} from "lucide-react";
import {
  getCellHealthDashboard,
  deleteCellGroup,
  exportCellGroupsCSV,
  exportCellHealthPDF,
} from "../services/cellModuleService";
import CellGroupModal from "./CellGroupModal";
import MembersModal from "./MembersModal";
import HealthHistoryModal from "./HealthHistoryModal";

export default function CellGroupList() {
  const theme = useTheme();
  const [cellGroups, setCellGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    loadCellGroups();
  }, []);

  async function loadCellGroups() {
    try {
      const groups = await getCellHealthDashboard();
      setCellGroups(groups);
    } catch (err) {
      setCellGroups([]);
    }
  }

  function handleEdit(group) {
    setSelectedGroup(group);
    setEditOpen(true);
  }

  function handleMembers(group) {
    setSelectedGroup(group);
    setMembersOpen(true);
  }

  function handleHealth(group) {
    setSelectedGroup(group);
    setHealthOpen(true);
  }

  function handleDelete(group) {
    setGroupToDelete(group);
    setConfirmOpen(true);
  }

  async function handleDeleteConfirmed() {
    try {
      await deleteCellGroup(groupToDelete.id);
      await loadCellGroups();
      setSnackbar({
        open: true,
        message: "Cell group deleted successfully.",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to delete cell group.",
        severity: "error",
      });
    } finally {
      setConfirmOpen(false);
      setGroupToDelete(null);
    }
  }

  async function handleExportCSV() {
    try {
      const blob = await exportCellGroupsCSV();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cell_groups.csv";
      a.click();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: "CSV exported.", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Export failed.", severity: "error" });
    }
  }

  async function handleExportPDF(group) {
    try {
      const blob = await exportCellHealthPDF(group.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cell_health_history.pdf";
      a.click();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: "PDF exported.", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Export failed.", severity: "error" });
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "default";
      case "critical":
        return "error";
      default:
        return "warning";
    }
  };

  const getHealthColor = (score) => {
    if (score >= 80) return "green";
    if (score >= 50) return "orange";
    return "red";
  };

  const filteredGroups = cellGroups.filter((cg) => {
    const matchesSearch =
      (cg.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (cg.leader || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      !statusFilter || cg.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const modalStyle = {
    position: "absolute",
    top: "10%",
    left: "50%",
    transform: "translate(-50%, 0)",
    width: { xs: "90%", sm: 400, md: 500 },
    bgcolor: theme.palette.background.paper,
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
  };

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 400 }}>
        Cell Groups
      </Typography>

      <Card sx={{ mb: 3, p: 2 }}>
        <CardContent sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField
            placeholder="Search cell group or leader..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" onClick={() => handleEdit(null)} startIcon={<Pencil size={18} />}>
            Add Cell Group
          </Button>
          <Button variant="outlined" onClick={handleExportCSV} startIcon={<FileDown size={18} />}>
            Export All CSV
          </Button>
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {filteredGroups.map((cg) => (
          <Grid item xs={12} md={6} lg={4} key={cg.id}>
            <Box
              sx={{
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                backgroundColor: theme.palette.background.paper,
                transition: "0.2s",
                "&:hover": {
                  boxShadow: 3,
                  transform: "translateY(-4px)",
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                  {cg.name?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 500 }}>{cg.name}</Typography>
              </Box>

              <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                <Chip label={cg.zone || "No Zone"} variant="outlined" size="small" />
                <Chip label={cg.status || "Unknown"} size="small" color={getStatusColor(cg.status)} />
              </Box>

              <Typography variant="body2" color="text.secondary">Leader: {cg.leader || "-"}</Typography>
              <Typography variant="body2" color="text.secondary">Members: {cg.members_count ?? 0}</Typography>

              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Box sx={{
                  width: 10, height: 10, borderRadius: "50%",
                  backgroundColor: getHealthColor(cg.health_score),
                }} />
                <Typography variant="body2" color="text.secondary">
                  Health Score: {cg.health_score}
                </Typography>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", gap: 1 }}>
                <Tooltip title="Edit"><IconButton onClick={() => handleEdit(cg)}><Pencil size={18} /></IconButton></Tooltip>
                <Tooltip title="Members"><IconButton onClick={() => handleMembers(cg)}><Users size={18} /></IconButton></Tooltip>
                <Tooltip title="Health"><IconButton onClick={() => handleHealth(cg)}><Heart size={18} /></IconButton></Tooltip>
                <Tooltip title="Export PDF"><IconButton onClick={() => handleExportPDF(cg)}><FileDown size={18} /></IconButton></Tooltip>
                <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDelete(cg)}><Trash2 size={18} /></IconButton></Tooltip>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {filteredGroups.length === 0 && (
        <Box sx={{ mt: 5, textAlign: 'center', width: '100%' }}>
          <Typography variant="body1" color="text.secondary">No cell groups found.</Typography>
        </Box>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <Box sx={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%, 0)",
          width: "90%",
          maxWidth: 960,
          bgcolor: theme.palette.background.paper,
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
          overflowY: "auto",
          maxHeight: "90vh"
        }}>
          <CellGroupModal
            cellGroup={selectedGroup}
            onSave={async () => {
              setEditOpen(false);
              await loadCellGroups();
            }}
            onCancel={() => setEditOpen(false)}
          />
        </Box>
      </Modal>

      <Modal open={membersOpen} onClose={() => setMembersOpen(false)}>
        <Box sx={modalStyle}>
          <MembersModal cellGroup={selectedGroup} onClose={() => setMembersOpen(false)} />
        </Box>
      </Modal>

      <Modal open={healthOpen} onClose={() => setHealthOpen(false)}>
        <Box sx={modalStyle}>
          <HealthHistoryModal cellGroup={selectedGroup} onClose={() => setHealthOpen(false)} />
        </Box>
      </Modal>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Cell Group?</DialogTitle>
        <DialogContent>
          Are you sure you want to delete <b>{groupToDelete?.name}</b>? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirmed}>Delete</Button>
        </DialogActions>
      </Dialog>

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
