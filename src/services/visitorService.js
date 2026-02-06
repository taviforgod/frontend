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

/**
 * All functions below should use fetchWithAuth from AuthContext,
 * never credentials/cookies. Pass fetchWithAuth as first argument.
 */

export async function listVisitors(fetchWithAuth, params = {}) {
  assertFetch(fetchWithAuth);
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const res = await fetchWithAuth(`/api/visitors${qs ? `?${qs}` : ''}`);
  return handleResponse(res, 'Failed to load visitors');
}

export async function getVisitor(fetchWithAuth, id) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`/api/visitors/${encodeURIComponent(id)}`);
  return handleResponse(res, 'Failed to load visitor');
}

export async function createVisitor(fetchWithAuth, data) {
  assertFetch(fetchWithAuth);
  if (!data || !data.church_id) throw new Error('church_id required');
  const res = await fetchWithAuth('/api/visitors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to create visitor');
}

export async function updateVisitor(fetchWithAuth, id, data) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`/api/visitors/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update visitor');
}

export async function deleteVisitor(fetchWithAuth, id) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`/api/visitors/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete visitor');
}

export async function convertVisitor(fetchWithAuth, id, cell_group_id = null) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`/api/visitors/${encodeURIComponent(id)}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cell_group_id,
      converted_at: new Date().toISOString()
    })
  });
  return handleResponse(res, 'Failed to convert visitor');
}

export const addFollowUp = async (fetchWithAuth, data) => {
  assertFetch(fetchWithAuth);
  if (!data?.visitor_id) throw new Error('visitor_id required');
  const res = await fetchWithAuth(`/api/visitors/${encodeURIComponent(data.visitor_id)}/follow-ups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add follow-up');
};

export const getFollowUpsForVisitor = async (fetchWithAuth, visitorId) => {
  assertFetch(fetchWithAuth);
  if (!visitorId) throw new Error('visitorId required');
  const res = await fetchWithAuth(`/api/visitors/${encodeURIComponent(visitorId)}/follow-ups`);
  return handleResponse(res, 'Failed to fetch follow-ups');
};

export default {
  listVisitors,
  getVisitor,
  createVisitor,
  updateVisitor,
  deleteVisitor,
  convertVisitor,
  addFollowUp,
  getFollowUpsForVisitor
};