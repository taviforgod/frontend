const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler (consistent with other services)
async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let msg = defaultMsg;
    try {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        const body = await res.json();
        msg = body?.error || body?.message || msg;
      } else {
        const text = await res.text().catch(() => '');
        if (text) msg = text;
      }
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf')) return res.blob();

  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function assertFetch(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required (pass AuthContext.fetchWithAuth)');
}

/**
 * All functions below take fetchWithAuth (AuthContext.fetchWithAuth) as the first parameter.
 * Always use token-based authentication; never use cookies/credentials.
 */

// Get all roles
export const getRoles = async (fetchWithAuth) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth('/api/roles');
  return handleResponse(res, 'Failed to fetch roles');
};

// Create a new role
export const createRole = async (fetchWithAuth, name) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth('/api/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return handleResponse(res, 'Failed to create role');
};

// Remove a role
export const removeRole = async (fetchWithAuth, id) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/roles/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) {
    let errorMsg = 'Failed to delete role';
    try {
      const body = await res.json();
      errorMsg = body?.error || body?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return true;
};

// List all permissions
export const fetchPermissions = async (fetchWithAuth) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth('/api/permissions');
  return handleResponse(res, 'Failed to fetch permissions');
};

// All role-permission matrix entries
export const fetchRolePermissions = async (fetchWithAuth) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth('/api/roles/permissions-matrix');
  return handleResponse(res, 'Failed to fetch role-permission matrix');
};

// Update permission for a role (add)
export const updateRolePermission = async (fetchWithAuth, roleId, permId) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissionId: permId })
  });
  return handleResponse(res, 'Failed to update role permission');
};

// added alias for older callers expecting assignPermission
export const assignPermission = updateRolePermission;

// Remove a permission from a role
export const removePermission = async (fetchWithAuth, roleId, permId) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/roles/${encodeURIComponent(roleId)}/permissions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissionId: permId })
  });
  if (!res.ok) {
    let errorMsg = 'Failed to remove permission';
    try {
      const body = await res.json();
      errorMsg = body?.error || body?.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return true;
};

// Update role name
export const updateRole = async (fetchWithAuth, id, name) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/roles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return handleResponse(res, 'Failed to update role');
};

export default {
  getRoles,
  createRole,
  removeRole,
  fetchPermissions,
  fetchRolePermissions,
  updateRolePermission,
  removePermission,
  updateRole
};