const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler
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
 * All functions expect `fetchWithAuth` (from AuthContext) as first argument.
 * Example: const { fetchWithAuth } = useContext(AuthContext);
 */

export const getFoundationByMember = async (fetchWithAuth, memberId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/foundation/member/${encodeURIComponent(memberId)}`, { method: 'GET' });
  return handleResponse(res, 'Failed to load foundation data');
};

export const enrollFoundation = async (fetchWithAuth, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/foundation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to enroll');
};

export const updateFoundation = async (fetchWithAuth, id, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/foundation/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to update');
};
export const getFoundationClasses = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/foundation/classes', { method: 'GET' });
  return handleResponse(res, 'Failed to load foundation classes');
};

export const addFoundationClass = async (fetchWithAuth, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/foundation/classes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to create class');
};

export const updateFoundationClass = async (fetchWithAuth, id, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/foundation/classes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to update class');
};
export const deleteFoundationClass = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/foundation/classes/${id}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete class');
};

// add this compatibility wrapper (some components import `deleteFoundation`)
export const deleteFoundation = async (fetchWithAuth, id) => {
  return deleteFoundationClass(fetchWithAuth, id);
};

