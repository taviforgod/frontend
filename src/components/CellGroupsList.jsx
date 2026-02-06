import React, { useEffect, useState, useContext } from "react";
import {
  Typography,
  Button,
  Grid,
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
  Autocomplete,
} from "@mui/material";
import {
  Pencil,
  Users,
  Heart,
  FileDown,
  Trash2,
} from "lucide-react";
import {
  listCellGroups,
  createCellGroup,
  updateCellGroup,
  deleteCellGroup,
  listZones,
  listLeaders,
} from "../services/cellService";
import { getStatusTypes } from "../services/lookupService";
import dayjs from "dayjs"; 
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export default function CellGroupsList() {
  const theme = useTheme();
  const navigate = useNavigate();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const { fetchWithAuth } = useContext(AuthContext);

  const [groups, setGroups] = useState([]);
  const [zones, setZones] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [statusTypes, setStatusTypes] = useState([]);
  const [form, setForm] = useState({
    name: "",
    zone: null,
    leader: null,
    status_id: "",
    next_meeting_date: null,
  });
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Load cell groups, zones, leaders
  useEffect(() => {
    (async () => {
      try {
        setGroups(await listCellGroups(fetchWithAuth));
        setZones(await listZones(fetchWithAuth));
        setLeaders(await listLeaders(fetchWithAuth));
        setStatusTypes(await getStatusTypes(fetchWithAuth));
      } catch (err) {
        setSnackbar({
          open: true,
          message: "Error loading data",
          severity: "error",
        });
      }
    })();
  }, [fetchWithAuth]);

  const handleSubmit = async () => {
    try {
      if (editId) {
        // Update existing group
        const updatedGroup = await updateCellGroup(editId, {
          name: form.name,
          zone_id: form.zone?.id,
          leader_id: form.leader?.id,
          status_id: form.status_id || null,
          next_meeting_date: form.next_meeting_date
            ? dayjs(form.next_meeting_date).format("YYYY-MM-DD")
            : null,
        });
        setGroups(groups.map(g => g.id === editId ? updatedGroup : g));
        setSnackbar({
          open: true,
          message: "Cell group updated.",
          severity: "success",
        });
      } else {
        // Create new group
        const newGroup = await createCellGroup({
          name: form.name,
          zone_id: form.zone?.id,
          leader_id: form.leader?.id,
          status_id: form.status_id || null,
          next_meeting_date: form.next_meeting_date
            ? dayjs(form.next_meeting_date).format("YYYY-MM-DD")
            : null,
        });
        setGroups([...groups, newGroup]);
        setSnackbar({
          open: true,
          message: "Cell group created.",
          severity: "success",
        });
      }
      setOpen(false);
      setForm({
        name: "",
        zone: null,
        leader: null,
        status_id: "",
        next_meeting_date: null,
      });
      setEditId(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error saving cell group: " + err.message,
        severity: "error",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this cell group?")) return;
    try {
      await deleteCellGroup(id);
      setGroups(groups.filter(g => g.id !== id));
      setSnackbar({
        open: true,
        message: "Cell group deleted.",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error deleting cell group: " + err.message,
        severity: "error",
      });
    }
  };

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

  const filteredGroups = groups.filter((cg) => {
    const matchesSearch =
      (cg.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (cg.leader_name || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      !statusFilter || cg.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Add this function to map group data to form state
  function openEditDialog(group) {
    setEditId(group.id);
    setForm({
      name: group.name || "",
      zone: zones.find(z => z.id === group.zone_id) || null,
      leader: leaders.find(l => l.id === group.leader_id) || null,
      status_id: group.status_id || "",
      next_meeting_date: group.next_meeting_date ? dayjs(group.next_meeting_date) : null,
    });
    setOpen(true);
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
        {/* Header */}
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 400 }}>
          Cell Groups
        </Typography>

        {/* Search and Filter */}
        <Card sx={{ mb: 3, p: 2 }}>
          <CardContent
            sx={{
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
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
            <Button
              variant="contained"
              onClick={() => {
                setEditId(null);
                setOpen(true);
              }}
              startIcon={<Pencil size={18} />}
            >
              Add Cell Group
            </Button>
          </CardContent>
        </Card>

        {/* Cell Groups List */}
        <Grid container spacing={2}>
          {filteredGroups.map((g) => (
            <Grid item xs={12} md={6} lg={4} key={g.id}>
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
                {/* Group Header */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    {g.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    {g.name}
                  </Typography>
                </Box>

                {/* Group Details */}
                <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                  <Chip label={g.zone_name || "No Zone"} variant="outlined" size="small" />
                  <Chip label={g.status || "Unknown"} size="small" color={getStatusColor(g.status)} />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Leader: {g.leader_name || "-"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Members: {g.members_count ?? 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Next Meeting:{" "}
                  {g.next_meeting_date
                    ? dayjs(g.next_meeting_date).format("YYYY-MM-DD")
                    : "-"}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                {/* Actions */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Edit">
                    <IconButton onClick={() => openEditDialog(g)}>
                      <Pencil size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Members">
                    <IconButton onClick={() => navigate(`/cell-groups/${g.id}?tab=members`)}>
                      <Users size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Health">
                    <IconButton onClick={() => navigate(`/cell-groups/${g.id}?tab=health`)}>
                      <Heart size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export PDF">
                    <IconButton>
                      <FileDown size={18} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => handleDelete(g.id)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* No Groups Message */}
        {filteredGroups.length === 0 && (
          <Box sx={{ mt: 5, textAlign: "center", width: "100%" }}>
            <Typography variant="body1" color="text.secondary">
              No cell groups found.
            </Typography>
          </Box>
        )}

        {/* Add/Edit Group Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
          <DialogTitle>{editId ? "Edit Cell Group" : "Add Cell Group"}</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Group Name"
              fullWidth
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <Autocomplete
              options={zones}
              getOptionLabel={(option) => option.name || ""}
              value={form.zone}
              onChange={(e, value) => setForm({ ...form, zone: value })}
              renderInput={(params) => (
                <TextField {...params} label="Zone" margin="dense" />
              )}
              sx={{ mt: 2 }}
            />

            <Autocomplete
              options={leaders}
              getOptionLabel={(option) =>
                option ? `${option.first_name} ${option.surname}` : ""
              }
              value={form.leader}
              onChange={(e, value) => setForm({ ...form, leader: value })}
              renderInput={(params) => (
                <TextField {...params} label="Leader" margin="dense" />
              )}
              sx={{ mt: 2 }}
            />

            <FormControl fullWidth margin="dense" sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status_id}
                label="Status"
                onChange={(e) => setForm({ ...form, status_id: e.target.value })}
              >
                <MenuItem value="">Select Status</MenuItem>
                {statusTypes.map((st) => (
                  <MenuItem key={st.id} value={st.id}>
                    {st.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="Next Meeting Date"
              value={form.next_meeting_date}
              onChange={(date) => setForm({ ...form, next_meeting_date: date })}
              slotProps={{ textField: { margin: "dense", fullWidth: true } }}
              sx={{ mt: 2, width: "100%" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for Notifications */}
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
    </LocalizationProvider>
  );
}
