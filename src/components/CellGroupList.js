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
  useTheme 
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
  const theme = useTheme(); // <-- Use theme
  const [cellGroups, setCellGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCellGroups();
  }, []);

  async function loadCellGroups() {
    try {
      // const groups = await getCellGroups(); // REMOVE this line
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

  async function handleDelete(group) {
    await deleteCellGroup(group.id);
    await loadCellGroups();
  }

  async function handleExportCSV() {
    const blob = await exportCellGroupsCSV();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cell_groups.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleExportPDF(group) {
    const blob = await exportCellHealthPDF(group.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cell_health_history.pdf";
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Filter cell groups by search
  const filteredGroups = cellGroups.filter(cg =>
    (cg.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (cg.leader || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3, backgroundColor: theme.palette.background.default }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 400, color: theme.palette.text.primary }}>
        Cell Groups
      </Typography>

      {/* Search and Add Card */}
      <Card sx={{
        mb: 3,
        width: "100%",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        background: theme.palette.background.paper,
        boxShadow: "none"
      }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
          <TextField
            placeholder="Search cell group or leader..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 200 }}
            InputProps={{
              style: {
                background: theme.palette.background.paper,
                color: theme.palette.text.primary
              }
            }}
          />
          <Button
            variant="contained"
            onClick={() => handleEdit(null)}
            startIcon={<Pencil size={18} />}
            sx={{
              background: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': { background: theme.palette.primary.dark }
            }}
          >
            Add Cell Group
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportCSV}
            startIcon={<FileDown size={18} />}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              background: theme.palette.background.paper,
              '&:hover': { background: theme.palette.action.hover }
            }}
          >
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
                transition: "box-shadow 0.2s, border-color 0.2s",
                "&:hover": {
                  boxShadow: 2,
                  borderColor: theme.palette.primary.main,
                },
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 400, color: theme.palette.text.primary }}>
                {cg.name}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Zone: {cg.zone || "-"}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Leader: {cg.leader || "-"}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Status: {cg.status || "-"}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Health Score: {cg.health_score}
              </Typography>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Members: {cg.members_count ?? 0}
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Box sx={{ display: "flex", justifyContent: "flex-start", gap: 1 }}>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleEdit(cg)}>
                    <Pencil size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Members">
                  <IconButton size="small" onClick={() => handleMembers(cg)}>
                    <Users size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Health">
                  <IconButton size="small" onClick={() => handleHealth(cg)}>
                    <Heart size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export PDF">
                  <IconButton size="small" onClick={() => handleExportPDF(cg)}>
                    <FileDown size={18} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" color="error" onClick={() => handleDelete(cg)}>
                    <Trash2 size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Modals */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <Box sx={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%,0)",
          width: 400,
          bgcolor: theme.palette.background.paper,
          boxShadow: 24,
          p: 4
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
        <Box sx={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%,0)",
          width: 500,
          bgcolor: theme.palette.background.paper,
          boxShadow: 24,
          p: 4
        }}>
          <MembersModal cellGroup={selectedGroup} onClose={() => setMembersOpen(false)} />
        </Box>
      </Modal>

      <Modal open={healthOpen} onClose={() => setHealthOpen(false)}>
        <Box sx={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translate(-50%,0)",
          width: 500,
          bgcolor: theme.palette.background.paper,
          boxShadow: 24,
          p: 4
        }}>
          <HealthHistoryModal cellGroup={selectedGroup} onClose={() => setHealthOpen(false)} />
        </Box>
      </Modal>
    </Box>
  );
}
