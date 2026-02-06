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
    const txt = await res.text();
    if (!txt) return null;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

/**
 * All functions require `fetchWithAuth` (from AuthContext) as the first argument.
 * Example:
 *   const { fetchWithAuth } = useContext(AuthContext);
 *   await getPermissions(fetchWithAuth);
 */

export const getPermissions = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/permissions', { method: 'GET' });
  return handleResponse(res, 'Failed to fetch permissions');
};

export const createPermission = async (fetchWithAuth, name) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return handleResponse(res, 'Failed to create permission');
};

export const updatePermission = async (fetchWithAuth, id, name) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/permissions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  return handleResponse(res, 'Failed to update permission');
};

export const deletePermission = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/permissions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete permission');
};

export default {
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission
};