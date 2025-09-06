import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  List, ListItem, ListItemText, ListItemIcon, Checkbox,
  Snackbar, Alert, CircularProgress, Box
} from "@mui/material";
import { getPermissions } from "../../services/permissionService";
import {
  assignPermission,
  removePermission,
  fetchRolePermissions
} from "../../services/roleService";

export default function AssignPermissionsDialog({ open, onClose, role, refreshRole }) {
  const [perms, setPerms] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [disabled, setDisabled] = useState(false);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    if (open && role) {
      setLoading(true);
      Promise.all([
        getPermissions(),
        fetchRolePermissions(role.id)
      ])
        .then(([allPerms, rolePerms]) => {
          setPerms(allPerms);
          setSelected(rolePerms.map(p => p.id));
        })
        .catch(err => {
          console.error("Failed to load permissions", err);
          showSnackbar("Error loading permissions", "error");
        })
        .finally(() => setLoading(false));
    }
  }, [open, role]);

  const handleToggle = async (permId) => {
    if (!role || disabled) return;
    setDisabled(true);
    const isSelected = selected.includes(permId);

    try {
      if (isSelected) {
        await removePermission(role.id, permId);
        setSelected(prev => prev.filter(id => id !== permId));
        showSnackbar("Permission removed");
      } else {
        await assignPermission(role.id, permId);
        setSelected(prev => [...prev, permId]);
        showSnackbar("Permission assigned");
      }

      refreshRole && refreshRole();
    } catch (err) {
      console.error(err);
      showSnackbar("Error updating permission", "error");
    } finally {
      setDisabled(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={() => onClose(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Permissions to {role?.name}</DialogTitle>
        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress />
            </Box>
          ) : (
            <List dense>
              {perms.map((perm) => (
                <ListItem
                  key={perm.id}
                  button
                  onClick={() => handleToggle(perm.id)}
                  disabled={disabled}
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      checked={selected.includes(perm.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={perm.name} secondary={perm.description} />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(true)} disabled={disabled}>Done</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
