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

export const getPermissions = async () => {
  const res = await fetch(`${API_URL}/api/permissions`, {
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to fetch permissions');
};

export const createPermission = async (name) => {
  const res = await fetch(`${API_URL}/api/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name })
  });
  return handleResponse(res, 'Failed to create permission');
};

export const updatePermission = async (id, name) => {
  const res = await fetch(`${API_URL}/api/permissions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name })
  });
  return handleResponse(res, 'Failed to update permission');
};

export const deletePermission = async (id) => {
  const res = await fetch(`${API_URL}/api/permissions/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to delete permission');
};