// src/services/exitInterviewService.js
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
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf')) {
    return res.blob();
  }

  try {
    const txt = await res.text();
    if (!txt) return null;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

// ================= Create Interview =================
export const createInterview = async (fetchWithAuth, data) => {
  if (typeof fetchWithAuth !== 'function') {
    throw new Error('fetchWithAuth must be provided from AuthContext');
  }

  const res = await fetchWithAuth(`${API_URL}/api/exit-interviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to save interview');
};

// ================= Get Interview by ID =================
export const getInterview = async (fetchWithAuth, id) => {
  const res = await fetchWithAuth(`${API_URL}/api/exit-interviews/${encodeURIComponent(id)}`);
  return handleResponse(res, 'Failed to fetch interview');
};

// ================= List Interviews =================
export const listInterviews = async (fetchWithAuth, params = {}) => {
  let qs = '';
  if (typeof params === 'string') qs = params;
  else qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined && v !== null && v !== '')).toString();
  const res = await fetchWithAuth(`${API_URL}/api/exit-interviews${qs ? '?'+qs : ''}`);
  return handleResponse(res, 'Failed to list interviews');
};

// ================= Update Interview =================
export const updateInterview = async (fetchWithAuth, id, data) => {
  if (typeof fetchWithAuth !== 'function') {
    throw new Error('fetchWithAuth must be provided from AuthContext');
  }

  const res = await fetchWithAuth(`${API_URL}/api/exit-interviews/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to update interview');
};

// ================= Delete Interview =================
export const deleteInterview = async (fetchWithAuth, id) => {
  if (typeof fetchWithAuth !== 'function') {
    throw new Error('fetchWithAuth must be provided from AuthContext');
  }

  const res = await fetchWithAuth(`${API_URL}/api/exit-interviews/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete interview');
};

// ================= Get Interview Templates =================
export const getInterviewTemplates = async (fetchWithAuth) => {
  if (typeof fetchWithAuth !== 'function') {
    throw new Error('fetchWithAuth must be provided from AuthContext');
  }

  const res = await fetchWithAuth(`${API_URL}/api/exit-interviews/templates/list`);
  return handleResponse(res, 'Failed to fetch interview templates');
};

export default { createInterview, getInterview, listInterviews, updateInterview, deleteInterview, getInterviewTemplates };
