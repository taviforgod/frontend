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
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf')) return res.blob();

  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * All functions require fetchWithAuth (from AuthContext) as the first argument.
 * Example:
 *   const { fetchWithAuth } = useContext(AuthContext);
 *   await assignMentor(fetchWithAuth, payload);
 */

export const assignMentor = async (fetchWithAuth, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/mentorship/assign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to assign mentor');
};

export const getAssignmentsByMentor = async (fetchWithAuth, mentorId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/mentorship/mentor/${encodeURIComponent(mentorId)}`);
  return handleResponse(res, 'Failed to load assignments');
};

export const createSession = async (fetchWithAuth, payload) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/mentorship/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to create session');
};

export const getSessionsForAssignment = async (fetchWithAuth, assignmentId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/mentorship/sessions/${encodeURIComponent(assignmentId)}`);
  return handleResponse(res, 'Failed to load sessions');
};

export const removeAssignment = async (fetchWithAuth, assignmentId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/mentorship/assignment/${encodeURIComponent(assignmentId)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to remove assignment');
};

export const removeSession = async (fetchWithAuth, sessionId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/mentorship/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to remove session');
};

export const getAssignmentsByMentee = async (fetchWithAuth, menteeId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/mentorship/mentee/${encodeURIComponent(menteeId)}`);
  return handleResponse(res, 'Failed to fetch mentorship assignments');
};

export default {
  assignMentor,
  getAssignmentsByMentor,
  createSession,
  getSessionsForAssignment,
  removeAssignment,
  removeSession,
  getAssignmentsByMentee
};
