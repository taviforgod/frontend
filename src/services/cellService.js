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

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/json')) {
    return res.json();
  }
  // non-json -> return text or null
  try {
    const txt = await res.text();
    return txt || null;
  } catch {
    return null;
  }
}

export async function listCellGroups() {
  const res = await fetch(`${API_URL}/api/cell/cell-groups`);
  return handleResponse(res, 'Failed to fetch cell groups');
}

export async function getCellGroup(id) {
  const res = await fetch(`${API_URL}/api/cell/cell-groups/${id}`);
  return handleResponse(res, 'Failed to fetch cell group');
}

export async function createCellGroup(payload) {
  const res = await fetch(`${API_URL}/api/cell/cell-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to create cell group');
}

export async function updateCellGroup(id, payload) {
  const res = await fetch(`${API_URL}/api/cell/cell-groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to update cell group');
}

export async function setNextMeetingDate(id, date) {
  const res = await fetch(`${API_URL}/api/cell/cell-groups/${id}/next-meeting`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ next_meeting_date: date })
  });
  return handleResponse(res, 'Failed to set next meeting date');
}

export async function getCellHealth(id) {
  if (!id) throw new Error('getCellHealth: cell group id is required');
  const res = await fetch(`${API_URL}/api/cell/cell-groups/${encodeURIComponent(id)}/health`);
  return handleResponse(res, 'Failed to fetch cell health');
}

export async function getAllCellHealth() {
  const groups = await listCellGroups();
  if (!Array.isArray(groups) || groups.length === 0) return [];

  const results = await Promise.all(groups.map(async g => {
    try {
      return await getCellHealth(g.id);
    } catch (err) {
      return { id: g.id, name: g.name || '', error: err.message || 'Failed' };
    }
  }));
  return results;
}

export async function getOverviewMetrics() {
  const res = await fetch(`${API_URL}/api/cell/overview`);
  return handleResponse(res, 'Failed to fetch overview metrics');
}

export async function getUpcomingMeetings() {
  const res = await fetch(`${API_URL}/api/cell/upcoming-meetings`);
  return handleResponse(res, 'Failed to fetch upcoming meetings');
}

export async function listZones() {
  const res = await fetch(`${API_URL}/api/cell/zones`);
  return handleResponse(res, 'Failed to fetch zones');
}

export async function listLeaders() {
  const res = await fetch(`${API_URL}/api/cell/members/leaders`);
  return handleResponse(res, 'Failed to fetch leaders');
}

export async function deleteCellGroup(id) {
  const res = await fetch(`${API_URL}/api/cell/cell-groups/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete cell group');
  return true;
}

export async function listCellGroupMembers(cellId) {
  const res = await fetch(`${API_URL}/api/cell/groups/${cellId}/members`);
  return handleResponse(res, 'Failed to fetch cell group members');
}

export async function addCellGroupMember(cellId, data) {
  const res = await fetch(`${API_URL}/api/cell/groups/${cellId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to add member');
}

export async function removeCellGroupMember(cellId, memberId) {
  const res = await fetch(`${API_URL}/api/cell/groups/${cellId}/members/${memberId}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to remove member');
}

export const getCellMeetings = async (cellId, { limit = 10, offset = 0 } = {}) => {
  if (!cellId) throw new Error('getCellMeetings: cellId is required');
  const url = `${API_URL}/api/cells/${encodeURIComponent(cellId)}/meetings?limit=${limit}&offset=${offset}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse(res, `getCellMeetings failed`);
};
