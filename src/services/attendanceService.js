const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler
async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const error = await res.json();
      errorMsg = error.error || error.message || defaultMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  if (res.status === 204) return;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/octet-stream')) {
    return res.blob();
  }
  const text = await res.text();
  if (!text) return;
  return JSON.parse(text);
}

/**
 * All functions below require an authenticated fetch that automatically adds
 * the authorization bearer token, handles refresh if needed, and does NOT use cookies.
 * IMPORTANT: Pass `fetchWithAuth` from AuthContext as the first argument to every function.
 */

// Record attendance
export async function markAttendance(fetchWithAuth, data) {
  const res = await fetchWithAuth('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to record attendance');
}

// List attendance for a cell group
export async function getAttendance(fetchWithAuth, cellGroupId) {
  const res = await fetchWithAuth(`/api/attendance/${encodeURIComponent(cellGroupId)}`, {
    method: 'GET'
  });
  return handleResponse(res, 'Failed to fetch attendance');
}

// Fetch repeat absentees (consecutive >= 3)
export async function getRepeatAbsentees(fetchWithAuth, cellGroupId) {
  const res = await fetchWithAuth(`/api/attendance/${encodeURIComponent(cellGroupId)}/repeat-absentees`, {
    method: 'GET'
  });
  return handleResponse(res, 'Failed to fetch repeat absentees');
}
