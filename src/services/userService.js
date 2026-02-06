const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let msg = defaultMsg;
    try {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        const body = await res.json();
        msg = body?.error || body?.message || defaultMsg;
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

// All functions expect fetchWithAuth (from AuthContext) as the first argument.

export const getUsers = async (fetchWithAuth) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth('/api/users', { method: 'GET' });
  return handleResponse(res, 'Failed to fetch users');
};

export const createUser = async (fetchWithAuth, data) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to create user');
};

export const updateUser = async (fetchWithAuth, id, data) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update user');
};

export const getProfile = async (fetchWithAuth) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth('/api/users/profile', { method: 'GET' });
  return handleResponse(res, 'Failed to fetch profile');
};

export const updateProfile = async (fetchWithAuth, data) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth('/api/users/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update profile');
};

export const getRoles = async (fetchWithAuth, userId) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(userId)}/roles`, { method: 'GET' });
  return handleResponse(res, 'Failed to fetch user roles');
};

export const assignRole = async (fetchWithAuth, userId, roleId) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(userId)}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleId })
  });
  return handleResponse(res, 'Failed to assign role');
};

export const removeRole = async (fetchWithAuth, userId, roleId) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(userId)}/roles/${encodeURIComponent(roleId)}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    let err = 'Failed to remove role';
    try {
      const body = await res.json();
      err = body?.error || body?.message || err;
    } catch {}
    throw new Error(err);
  }
  return res.status === 204 ? true : await res.json();
};

export const deleteUser = async (fetchWithAuth, id) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) {
    let err = 'Failed to delete user';
    try {
      const body = await res.json();
      err = body?.error || body?.message || err;
    } catch {}
    throw new Error(err);
  }
  return res.status === 204 ? true : await res.json();
};

export const activateUser = async (fetchWithAuth, id) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(id)}/activate`, { method: 'POST' });
  return handleResponse(res, 'Failed to activate user');
};

export const deactivateUser = async (fetchWithAuth, id) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(id)}/deactivate`, { method: 'POST' });
  return handleResponse(res, 'Failed to deactivate user');
};

export const lockUser = async (fetchWithAuth, id) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(id)}/lock`, { method: 'POST' });
  return handleResponse(res, 'Failed to lock user');
};

export const unlockUser = async (fetchWithAuth, id) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(id)}/unlock`, { method: 'POST' });
  return handleResponse(res, 'Failed to unlock user');
};

export const changeUserPassword = async (fetchWithAuth, id, password) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/users/${encodeURIComponent(id)}/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) throw new Error('Failed to change password');
  return res.json();
};

export default {
  getUsers,
  createUser,
  updateUser,
  getProfile,
  updateProfile,
  getRoles,
  assignRole,
  removeRole,
  deleteUser,
  activateUser,
  deactivateUser,
  lockUser,
  unlockUser,
  changeUserPassword
};
