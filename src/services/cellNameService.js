const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const error = await res.json();
      errorMsg = error.error || error.message || defaultMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return await res.json();
}

// Cell Groups
export async function getCellGroups() {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch cell groups');
}
export async function createCellGroup(name) {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create cell group');
}
export async function updateCellGroup(id, name) {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update cell group');
}
export async function deleteCellGroup(id) {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete cell group');
}

// Cell Group Members
export async function getGroupMembers(groupId) {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups/${groupId}/members`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch group members');
}
export async function addGroupMember(groupId, member) {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups/${groupId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(member),
  });
  return handleResponse(res, 'Failed to add group member');
}
export async function updateGroupMember(groupId, memberId, member) {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups/${groupId}/members/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(member),
  });
  return handleResponse(res, 'Failed to update group member');
}
export async function deleteGroupMember(groupId, memberId) {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups/${groupId}/members/${memberId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete group member');
}

// Weekly Reports
export async function getWeeklyReports() {
  const res = await fetch(`${API_URL}/api/name-safe/weekly-reports`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch weekly reports');
}
export async function createWeeklyReport(payload) {
  const res = await fetch(`${API_URL}/api/name-safe/weekly-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Failed to create weekly report');
}
export async function getLastReport(groupId) {
  const res = await fetch(`${API_URL}/api/name-safe/cell-groups/${groupId}/last-report`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch last report');
}