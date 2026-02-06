// src/services/exitTypeMapService.js
const API_URL = process.env.REACT_APP_API_URL || '';

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
  try {
    const txt = await res.text();
    if (!txt) return null;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

export const listMappings = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/admin/exit-type-mappings');
  return handleResponse(res, 'Failed to load mappings');
};

export const getMapping = async (fetchWithAuth, exit_type) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/admin/exit-type-mappings/${encodeURIComponent(exit_type)}`);
  return handleResponse(res, 'Failed to get mapping');
};

export const upsertMapping = async (fetchWithAuth, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/admin/exit-type-mappings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to save mapping');
};

export const deleteMapping = async (fetchWithAuth, exit_type) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/admin/exit-type-mappings/${encodeURIComponent(exit_type)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete mapping');
};

export default { listMappings, getMapping, upsertMapping, deleteMapping };
