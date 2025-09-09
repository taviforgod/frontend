const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const error = await res.json();
      errorMsg = error.error || error.message || defaultMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return await res.json();
}

export const getRoles = async () => {
  const res = await fetch(`${API_URL}/api/roles`, {
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to fetch roles');
};

export const createRole = async (name) => {
  const res = await fetch(`${API_URL}/api/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name })
  });
  return handleResponse(res, 'Failed to create role');
};

export const removeRole = async (id) => {
  const res = await fetch(`${API_URL}/api/roles/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) {
    let errorMsg = 'Failed to delete role';
    try {
      const error = await res.json();
      errorMsg = error.error || error.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return true;
};

// For RBAC matrix
export const fetchPermissions = async () => {
  const res = await fetch(`${API_URL}/api/permissions`, {
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to fetch permissions');
};

export const fetchRolePermissions = async () => {
  // Backend should return [{role_id, permission_id}] for matrix
  const res = await fetch(`${API_URL}/api/roles/permissions-matrix`, {
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to fetch role-permission matrix');
};

export const updateRolePermission = async (roleId, permId) => {
  const res = await fetch(`${API_URL}/api/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ permissionId: permId })
  });
  return handleResponse(res, 'Failed to update role permission');
};

export const assignPermission = async (roleId, permId) => {
  const res = await fetch(`${API_URL}/api/roles/${roleId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ permissionId: permId })
  });
  return handleResponse(res, 'Failed to assign permission');
};

export const removePermission = async (roleId, permId) => {
  const res = await fetch(`${API_URL}/api/roles/${roleId}/permissions`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ permissionId: permId })
  });
  if (!res.ok) {
    let errorMsg = 'Failed to remove permission';
    try {
      const error = await res.json();
      errorMsg = error.error || error.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return true;
};

export const updateRole = async (id, name) => {
  const res = await fetch(`${API_URL}/api/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name })
  });
  return handleResponse(res, 'Failed to update role');
};