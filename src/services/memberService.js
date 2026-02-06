const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler
async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        const body = await res.json();
        errorMsg = body?.error || body?.message || defaultMsg;
      } else {
        const text = await res.text().catch(() => '');
        if (text) errorMsg = text;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
    return res.blob();
  }

  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * All functions require an authenticated fetch (fetchWithAuth from AuthContext)
 * passed as the first argument.
 */

export async function getMembers(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/members');
  return handleResponse(res, 'Failed to fetch members');
}

export async function getMemberById(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(id)}`);
  return handleResponse(res, 'Member not found');
}

export async function createMember(fetchWithAuth, data) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to create member');
}

export const updateMember = async (fetchWithAuth, id, payload) => {
  // ensure JSON is sent
  const res = await fetchWithAuth(`/api/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Update failed');
  return await res.json();
};

export async function deleteMember(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete member');
}

export async function exportMembers(fetchWithAuth, params = {}) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const res = await fetchWithAuth(`/api/members/export${qs ? `?${qs}` : ''}`, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Export failed');
  }
  return res.blob();
}

export async function importMembers(fetchWithAuth, formData) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/members/import', {
    method: 'POST',
    body: formData
  });
  return handleResponse(res, 'Import failed');
}

export async function checkDuplicate(fetchWithAuth, field, value) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(
    `/api/members/check-duplicate?field=${encodeURIComponent(field)}&value=${encodeURIComponent(value)}`
  );
  return handleResponse(res, 'Duplicate check failed');
}

export async function searchMembers(fetchWithAuth, query) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/search?q=${encodeURIComponent(query)}`);
  return handleResponse(res, 'Failed to search members');
}

export async function uploadProfilePhoto(fetchWithAuth, memberId, file) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const formData = new FormData();
  formData.append('profile_photo', file);
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(memberId)}/profile-photo`, {
    method: 'POST',
    body: formData
  });
  return handleResponse(res, 'Failed to upload profile photo');
}

// ====== Relationships & Departments ======
export async function getMemberRelationships(fetchWithAuth, memberId) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(memberId)}/relationships`);
  return handleResponse(res, 'Failed to fetch relationships');
}

export async function createRelationship(fetchWithAuth, memberId, payload) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(memberId)}/relationships`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Failed to create relationship');
}

export async function deleteRelationship(fetchWithAuth, memberId, relId) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(memberId)}/relationships/${encodeURIComponent(relId)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete relationship');
}

export async function getMemberDepartments(fetchWithAuth, memberId) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(memberId)}/departments`);
  return handleResponse(res, 'Failed to fetch departments');
}

export async function assignDepartment(fetchWithAuth, memberId, payload) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(memberId)}/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Failed to assign department');
}

export async function removeDepartment(fetchWithAuth, memberId, assignmentId) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/${encodeURIComponent(memberId)}/departments/${encodeURIComponent(assignmentId)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to remove department');
}

export async function getDepartments(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/departments`);
  return handleResponse(res, 'Failed to fetch departments list');
}

export async function createDepartment(fetchWithAuth, payload) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Failed to create department');
}

// Added: update and delete department wrappers
export async function updateDepartment(fetchWithAuth, id, payload) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/departments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Failed to update department');
}

export async function deleteDepartment(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/members/departments/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete department');
}

export default {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  exportMembers,
  importMembers,
  checkDuplicate,
  searchMembers,
  uploadProfilePhoto,
  getMemberRelationships,
  createRelationship,
  deleteRelationship,
  getMemberDepartments,
  assignDepartment,
  removeDepartment,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};