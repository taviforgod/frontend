// src/components/MemberAssignModal.jsx
import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Autocomplete, Snackbar, Alert, Box, CircularProgress
} from '@mui/material';
import { getRoles as fetchRoles } from '../services/roleService'; // new
import { AuthContext } from '../contexts/AuthContext'; // <-- Add this import

export default function MemberAssignModal({
  open,
  onClose,
  onAssign,
  roles = [],
  members = [],
  loading = false,
  multiple = false,
}) {
  const [member, setMember] = useState(multiple ? [] : null);
  const [role, setRole] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'error' });
  const [localLoading, setLocalLoading] = useState(false);
  const { fetchWithAuth } = useContext(AuthContext); // <-- Use fetchWithAuth if needed

  // local fallback roles (use parent-provided roles if present)
  const [localRoles, setLocalRoles] = useState(Array.isArray(roles) ? roles : []);
  useEffect(() => {
    setLocalRoles(Array.isArray(roles) && roles.length ? roles : []);
  }, [roles]);

  // fetch roles when opened and no roles were provided by parent
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (open && (!Array.isArray(roles) || roles.length === 0)) {
        setLocalLoading(true);
        try {
          // Use fetchWithAuth if available
          const data = fetchWithAuth ? await fetchRoles(fetchWithAuth) : await fetchRoles();
          if (!mounted) return;
          setLocalRoles(Array.isArray(data) ? data : []);
        } catch (e) {
          if (!mounted) return;
          setLocalRoles([]);
        } finally {
          if (mounted) setLocalLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, [open, roles, fetchWithAuth]);

  useEffect(() => {
    if (!open) {
      setMember(multiple ? [] : null);
      setRole(null);
      setLocalLoading(false);
    } else {
      // reset state when opened
      setMember(multiple ? [] : null);
      setRole(null);
    }
  }, [open, multiple]);

  // normalize roles to a predictable shape: { id, name, description, raw }
  const rolesSource = Array.isArray(localRoles) && localRoles.length ? localRoles : (Array.isArray(roles) ? roles : []);
  const normalizedRoles = (Array.isArray(rolesSource) ? rolesSource : []).map(r => {
    // handle primitive strings
    if (typeof r === 'string') return { id: null, name: r, description: '', raw: r };
    const id = r?.id ?? r?.value ?? r?.role_id ?? (typeof r?.id === 'string' && /^\d+$/.test(r.id) ? Number(r.id) : null);
    const name = r?.name ?? r?.label ?? r?.role ?? r?.description ?? (r?.role_name ?? '') ?? (r?.roleType ?? '') ?? '';
    return { id: id != null ? Number(id) : null, name: String(name || '').trim(), description: r?.description ?? '', raw: r };
  }).filter(x => x && (x.name !== '' || x.id !== null)); // keep items with a label or id
  

  useEffect(() => {
    // debug: inspect incoming props and normalized roles
    
  }, [open, members, roles, normalizedRoles]);

  const handleAssign = () => {
    // validate: at least one member selected; role required per your UI
    if ((multiple ? (member.length === 0) : !member) || !role) {
      setSnack({ open: true, message: 'Select member(s) and role', severity: 'error' });
      return;
    }
    // prepare payload
    if (multiple) {
      const member_ids = member.map(m => m.id);
      onAssign({ member_ids, role_id: role.id });
    } else {
      onAssign({ member_id: member.id, role_id: role.id });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={() => !loading && onClose()} fullWidth maxWidth="sm">
        <DialogTitle>{multiple ? "Bulk Assign Members" : "Assign Member to Cell Group"}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <Autocomplete
              multiple={multiple}
              options={members || []}
              getOptionLabel={m => m ? `${m.first_name || m.firstName || ''} ${m.surname || m.lastName || ''} ${m.email ? `(${m.email})` : ''}`.trim() : ''}
              value={member}
              onChange={(e, v) => setMember(v)}
              renderInput={(params) => <TextField {...params} label={multiple ? "Members" : "Member"} placeholder="Search member by name" />}
              isOptionEqualToValue={(a, b) => (a?.id || a?.member_id || null) === (b?.id || b?.member_id || null)}
              disabled={loading}
              noOptionsText="No members found"
            />
            <Autocomplete
              options={normalizedRoles}
              getOptionLabel={r => r?.name || String(r?.raw || '')}
              renderOption={(props, option) => (
                <li {...props}>
                  {option.name || JSON.stringify(option.raw)}
                </li>
              )}
              value={role}
              onChange={(e, v) => setRole(v)}
              renderInput={(params) => <TextField {...params} label="Role (required)" />}
              isOptionEqualToValue={(a, b) => (a?.id ?? a?.name) === (b?.id ?? b?.name)}
              disabled={loading}
              noOptionsText={roles && roles.length ? "No matching role labels" : "No roles available"}
            />
          </Box>

          {(!Array.isArray(members) || members.length === 0) && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="info">No members available to assign. Load members from the parent or refresh the lookups.</Alert>
            </Box>
          )}
          {(!Array.isArray(normalizedRoles) || normalizedRoles.length === 0) && (
            <Box sx={{ mt: 1 }}>
              <Alert severity="info">No roles available. Create roles or ensure the parent passes roles props.</Alert>
            </Box>
          )}

          {loading && (
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}><CircularProgress size={24} /></Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose()} disabled={loading}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={loading || (!members?.length && !multiple) || !normalizedRoles.length}>
            {loading ? "Assigning..." : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}

MemberAssignModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  roles: PropTypes.array,
  members: PropTypes.array,
  loading: PropTypes.bool,
  multiple: PropTypes.bool
};
