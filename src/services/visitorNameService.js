// frontend/services/visitorNameService.js
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

export const listVisitors = async () => {
  const res = await fetch(`${API_URL}/api/name-safe/visitors`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch visitors');
};

export const addVisitor = async (v) => {
  const res = await fetch(`${API_URL}/api/name-safe/visitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(v)
  });
  return handleResponse(res, 'Failed to add visitor');
};

export const updateVisitor = async (v) => {
  const res = await fetch(`${API_URL}/api/name-safe/visitors`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(v)
  });
  return handleResponse(res, 'Failed to update visitor');
};

export const deleteVisitor = async (v) => {
  const res = await fetch(`${API_URL}/api/name-safe/visitors`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(v)
  });
  if (!res.ok) {
    let errorMsg = 'Failed to delete visitor';
    try {
      const error = await res.json();
      errorMsg = error.error || error.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return true;
};

export const setFollowUpStatus = async (id, follow_up_status) => {
  const res = await fetch(`${API_URL}/api/name-safe/visitors/follow-up`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, follow_up_status })
  });
  return handleResponse(res, 'Failed to update follow-up status');
};

export const convertVisitorToMember = async ({ id, cell_group_name }) => {
  const res = await fetch(`${API_URL}/api/name-safe/visitors/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id, cell_group_name })
  });
  return handleResponse(res, 'Failed to convert visitor to member');
};