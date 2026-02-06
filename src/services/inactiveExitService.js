// src/services/inactiveExitService.js
const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler - returns json/blob/null and throws on !ok
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
 * IMPORTANT: All functions require `fetchWithAuth` from AuthContext as the first argument.
 * Example: const { fetchWithAuth } = useContext(AuthContext);
 */

// list exits
export const listExits = async (fetchWithAuth, params = {}) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '')).toString();
  const res = await fetchWithAuth(`/api/exits${qs ? '?' + qs : ''}`);
  return handleResponse(res, 'Failed to list exits');
};

// get exit
export const getExit = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/exits/${encodeURIComponent(id)}`);
  return handleResponse(res, 'Failed to fetch exit');
};

// create exit
export const createExit = async (fetchWithAuth, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/exits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to create exit');
};

// update exit
export const updateExit = async (fetchWithAuth, id, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/exits/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update exit');
};

// delete exit
export const deleteExit = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/exits/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete exit');
};

// reinstate exit (updates member status to active)
export const reinstateExit = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/exits/${encodeURIComponent(id)}/reinstate`, { method: 'POST' });
  return handleResponse(res, 'Failed to reinstate exit');
};

// generate suggestions
export const generateSuggestions = async (fetchWithAuth, months = 6) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/exits/suggestions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ months })
  });
  return handleResponse(res, 'Failed to generate suggestions');
};

// Bulk operations
export const bulkDeleteExits = async (fetchWithAuth, ids) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/exits/bulk/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res, 'Failed to bulk delete exits');
};

export const bulkReinstateExits = async (fetchWithAuth, ids) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/exits/bulk/reinstate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return handleResponse(res, 'Failed to bulk reinstate exits');
};

// Statistics
export const getExitStatistics = async (fetchWithAuth, params = {}) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '')).toString();
  const res = await fetchWithAuth(`/api/exits/stats/overview${qs ? '?' + qs : ''}`);
  return handleResponse(res, 'Failed to get exit statistics');
};

// Data integrity functions
export const findInconsistentExits = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/exits/consistency/check');
  return handleResponse(res, 'Failed to find inconsistent exits');
};

export const fixInconsistentExit = async (fetchWithAuth, exit_id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/exits/consistency/fix', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exit_id })
  });
  return handleResponse(res, 'Failed to fix inconsistent exit');
};

export const getMemberExitHistory = async (fetchWithAuth, memberId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/exits/member/${encodeURIComponent(memberId)}/history`);
  return handleResponse(res, 'Failed to get member exit history');
};

export default {
  listExits, getExit, createExit, updateExit, deleteExit, reinstateExit, generateSuggestions,
  bulkDeleteExits, bulkReinstateExits, getExitStatistics, findInconsistentExits,
  fixInconsistentExit, getMemberExitHistory
};
