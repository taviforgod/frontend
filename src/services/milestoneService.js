const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let err = defaultMsg;
    try {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        const d = await res.json();
        err = d?.error || d?.message || defaultMsg;
      } else {
        const text = await res.text().catch(() => '');
        if (text) err = text;
      }
    } catch {}
    throw new Error(err);
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

// All functions require fetchWithAuth (from AuthContext) as first arg.

export const getMilestoneTemplates = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestone-templates`, { method: 'GET' });
  return handleResponse(res, 'Failed to load templates');
};

export const getMilestonesByMember = async (fetchWithAuth, memberId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestone-records/${encodeURIComponent(memberId)}`, { method: 'GET' });
  return handleResponse(res, 'Failed to load milestone records');
};

export const assignMilestone = async (fetchWithAuth, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestone-records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to assign milestone');
};

export const deleteMilestone = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestone-records/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete milestone');
};

export const createMilestoneTemplate = async (fetchWithAuth, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestone-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to create template');
};

export const updateMilestoneTemplate = async (fetchWithAuth, id, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestone-templates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to update template');
};

export const deleteMilestoneTemplate = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestone-templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete template');
};

export default {
  getMilestoneTemplates,
  getMilestonesByMember,
  assignMilestone,
  deleteMilestone,
  createMilestoneTemplate,
  updateMilestoneTemplate,
  deleteMilestoneTemplate
};
