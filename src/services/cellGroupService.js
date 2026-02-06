const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler
async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/json')) {
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
 * IMPORTANT: pass `fetchWithAuth` from AuthContext as the first argument to each function.
 * Example: const res = await getCellGroups(fetchWithAuth, { zone: 'north' });
 */

// List cell groups with optional query params
export const getCellGroups = async (fetchWithAuth, params = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined')
  );
  const qs = new URLSearchParams(filtered).toString();
  const res = await fetchWithAuth(`/api/cell-groups${qs ? '?' + qs : ''}`);
  return handleResponse(res, 'Failed to fetch cell groups');
};

export const getCellGroupById = async (fetchWithAuth, id) => {
  const res = await fetchWithAuth(`/api/cell-groups/${encodeURIComponent(id)}`);
  return handleResponse(res, 'Failed to fetch cell group');
};

export const getCellMembers = async (fetchWithAuth, cellGroupId, active = null) => {
  let path = `/api/cell-groups/${encodeURIComponent(cellGroupId)}/members`;
  if (active !== null) path += `?active=${encodeURIComponent(active)}`;
  const res = await fetchWithAuth(path);
  return handleResponse(res, 'Failed to fetch cell members');
};

export const getCellGroupFormLookups = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/form-lookups');
  return handleResponse(res, 'Failed to fetch form lookups');
};

export const getUnassignedMembers = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/unassigned-members');
  return handleResponse(res, 'Failed to fetch unassigned members');
};

export const addCellMember = async (fetchWithAuth, { cell_group_id, member_id, role_id = null }) => {
  const res = await fetchWithAuth('/api/cell-groups/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cell_group_id, member_id, role_id })
  });
  return handleResponse(res, 'Failed to add member');
};

export const bulkAddCellMembers = async (fetchWithAuth, { cell_group_id, member_ids = [], role_id = null }) => {
  const res = await fetchWithAuth('/api/cell-groups/members/bulk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cell_group_id, member_ids, role_id })
  });
  return handleResponse(res, 'Failed to add members');
};

export const removeCellMember = async (fetchWithAuth, { cell_group_id, member_id }) => {
  const res = await fetchWithAuth('/api/cell-groups/members', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cell_group_id, member_id })
  });
  return handleResponse(res, 'Failed to remove member');
};

export const changeCellMemberRole = async (fetchWithAuth, { cell_group_id, member_id, role_id }) => {
  const res = await fetchWithAuth('/api/cell-groups/members/role', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cell_group_id, member_id, role_id })
  });
  return handleResponse(res, 'Failed to change role');
};

export const saveCellGroup = async (fetchWithAuth, data) => {
  if (!data || typeof data !== 'object') throw new Error('No data provided to saveCellGroup');
  const path = data.id ? `/api/cell-groups/${encodeURIComponent(data.id)}` : '/api/cell-groups';
  const res = await fetchWithAuth(path, {
    method: data.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to save cell group');
};

export const getMyCellGroups = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/my');
  return handleResponse(res, 'Failed to fetch my cell groups');
};