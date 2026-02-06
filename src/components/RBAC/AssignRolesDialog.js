import React, { useEffect, useState, useContext } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemText, ListItemIcon, Checkbox, CircularProgress, Box, Snackbar, Alert
} from "@mui/material";
import { getRoles } from "../../services/roleService";
import { getRoles as getUserRoles, assignRole, removeRole } from "../../services/userService";
import { AuthContext } from "../../contexts/AuthContext";

export default function AssignRolesDialog({ open, onClose, user }) {
  const { fetchWithAuth } = useContext(AuthContext) || {};
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  useEffect(() => {
    if (open && user) {
      setLoading(true);
      Promise.all([
        getRoles(fetchWithAuth),
        getUserRoles(fetchWithAuth, user.id)
      ])
        .then(([allRoles, userRoles]) => {
          setRoles(allRoles);
          setSelected(userRoles.map(r => r.id));
        })
        .catch(() => {
          setSnack({ open: true, message: "Failed to load roles", severity: "error" });
        })
        .finally(() => setLoading(false));
    }
  }, [open, user, fetchWithAuth]);

  const handleToggle = (roleId) => {
    setSelected((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userRoles = await getUserRoles(fetchWithAuth, user.id);
      for (const role of roles) {
        const hasRole = selected.includes(role.id);
        const userHadRole = userRoles.some(r => r.id === role.id);
        if (hasRole && !userHadRole) {
          await assignRole(fetchWithAuth, user.id, role.id);
        } else if (!hasRole && userHadRole) {
          await removeRole(fetchWithAuth, user.id, role.id);
        }
      }
      setSnack({ open: true, message: "Roles updated", severity: "success" });
      onClose(true);
    } catch (err) {
      setSnack({ open: true, message: "Failed to update roles", severity: "error" });
      onClose(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={() => onClose()} fullWidth maxWidth="xs">
        <DialogTitle>Assign Roles to {user?.email || user?.name}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {roles.map((role) => (
                <ListItem key={role.id} button onClick={() => handleToggle(role.id)}>
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selected.includes(role.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={role.name} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose()} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loading} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}