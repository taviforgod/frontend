import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Pagination,
  InputAdornment,
} from "@mui/material";
import { getRoles, removeRole as deleteRole, updateRole, createRole } from "../../services/roleService";
import { AuthContext } from "../../contexts/AuthContext";
import { Edit, Trash2, Plus, Search } from "lucide-react";

/**
 * Roles page (RBAC) - lists roles and descriptions
 */
export default function Roles() {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10; // adjust as needed (5 columns x 2 rows = 10 per page)

  // search state
  const [search, setSearch] = useState("");

  // filtered list based on search
  const filteredRoles = roles.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(r.name || "").toLowerCase().includes(q) ||
      String(r.description || "").toLowerCase().includes(q)
    );
  });

  // pagination helper based on filtered list
  const totalPages = Math.max(1, Math.ceil((Array.isArray(filteredRoles) ? filteredRoles.length : 0) / perPage));

  // Edit/Create dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteRoleId, setDeleteRoleId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getRoles(fetchWithAuth);
        if (!mounted) return;
        setRoles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch roles", err);
        if (mounted) setRoles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // Open dialog for create
  const handleCreateClick = () => {
    setEditRole(null);
    setEditName("");
    setEditDescription("");
    setEditDialogOpen(true);
  };

  // Open dialog for edit
  const handleEditClick = (role) => {
    setEditRole(role);
    setEditName(role.name);
    setEditDescription(role.description || "");
    setEditDialogOpen(true);
  };

  // Save handler for both create and edit
  const handleEditSave = async () => {
    if (!editName.trim()) {
      alert("Role name is required");
      return;
    }
    try {
      if (editRole) {
        // Edit
        await updateRole(fetchWithAuth, editRole.id, { name: editName, description: editDescription });
        setRoles((prev) =>
          prev.map((r) =>
            r.id === editRole.id ? { ...r, name: editName, description: editDescription } : r
          )
        );
      } else {
        // Create
        const newRole = await createRole(fetchWithAuth, { name: editName, description: editDescription });
        setRoles((prev) => [newRole, ...(Array.isArray(prev) ? prev : [])]);
      }
    } catch (err) {
      alert(editRole ? "Failed to update role" : "Failed to create role");
    }
    setEditDialogOpen(false);
    setEditRole(null);
  };

  const handleDeleteClick = (roleId) => {
    setDeleteRoleId(roleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteRole(fetchWithAuth, deleteRoleId);
      setRoles((prev) => (Array.isArray(prev) ? prev.filter((r) => r.id !== deleteRoleId) : []));
    } catch (err) {
      alert("Failed to delete role");
    }
    setDeleteDialogOpen(false);
    setDeleteRoleId(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    // add horizontal padding and center container so cards have left/right margins
    <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, maxWidth: 1280, mx: "auto" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Roles</Typography>
      </Box>

      {/* Search + Add card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 1,
              alignItems: "center",
              flexWrap: "nowrap",
            }}
          >
            <TextField
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search roles by name or description..."
              size="small"
              sx={{ flex: "1 1 0", minWidth: 0 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={14} />
                  </InputAdornment>
                )
              }}
            />
            <Button
              variant="contained"
              startIcon={<Plus size={16} />}
              onClick={() => {
                setEditRole(null);
                setEditName("");
                setEditDescription("");
                setEditDialogOpen(true);
              }}
              sx={{ whiteSpace: "nowrap", flex: "0 0 auto" }}
            >
              Add Role
            </Button>
          </Box>
        </CardContent>
      </Card>

      {roles.length === 0 && !loading ? (
        <Typography color="text.secondary">No roles found.</Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(5, 1fr)", // 5 cards per row on desktop (lg and up)
              },
              // keep a little vertical padding so cards don't touch edges
              py: 1
            }}
          >
            {filteredRoles
              .slice((page - 1) * perPage, page * perPage)
              .map((r) => (
                 <Card key={r.id}>
                   <CardContent>
                     <Typography variant="h6">{r.name}</Typography>
                     <Typography variant="body2" color="text.secondary">
                       {r.description || "No description"}
                     </Typography>
                     <Box display="flex" justifyContent="flex-end" mt={2}>
                       <Tooltip title="Edit Role">
                         <IconButton aria-label="edit" onClick={() => handleEditClick(r)}>
                           <Edit size={20} />
                           </IconButton>
                       </Tooltip>
                       <Tooltip title="Delete Role">
                         <IconButton aria-label="delete" onClick={() => handleDeleteClick(r.id)}>
                           <Trash2 size={20} />
                         </IconButton>
                       </Tooltip>
                     </Box>
                   </CardContent>
                 </Card>
               ))}
          </Box>

          {/* Pagination - always render when there are roles (will show single page if needed) */}
          {Array.isArray(filteredRoles) && filteredRoles.length > 0 && (
             <Box display="flex" justifyContent="center" mt={3}>
               <Pagination
                count={totalPages}
                 page={page}
                 onChange={(_, p) => {
                   setPage(p);
                   window.scrollTo({ top: 0, behavior: "smooth" });
                 }}
                 color="primary"
                 showFirstButton
                 showLastButton
                 disabled={totalPages === 1}
               />
             </Box>
           )}
         </>
       )}

      {/* Create/Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>{editRole ? "Edit Role" : "Create Role"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">
            {editRole ? "Save" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Role</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this role?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
