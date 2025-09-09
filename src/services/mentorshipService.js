const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let err = defaultMsg;
    try { const d = await res.json(); err = d.error || d.message || defaultMsg; } catch(e) {}
    throw new Error(err);
  }
  return res.json();
}

export const assignMentor = async (payload) => {
  const res = await fetch(`${API_URL}/api/mentorship/assign`, {
    method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to assign mentor');
};

export const getAssignmentsByMentor = async (mentorId) => {
  const res = await fetch(`${API_URL}/api/mentorship/mentor/${mentorId}`, { credentials: 'include' });
  return handleResponse(res, 'Failed to load assignments');
};

export const createSession = async (payload) => {
  const res = await fetch(`${API_URL}/api/mentorship/sessions`, {
    method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to create session');
};

export const getSessionsForAssignment = async (assignmentId) => {
  const res = await fetch(`${API_URL}/api/mentorship/sessions/${assignmentId}`, { credentials: 'include' });
  return handleResponse(res, 'Failed to load sessions');
};

// Remove mentee (assignment)
export const removeAssignment = async (assignmentId) => {
  const res = await fetch(`${API_URL}/api/mentorship/assignment/${assignmentId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to remove assignment');
};

// Remove session
export const removeSession = async (sessionId) => {
  const res = await fetch(`${API_URL}/api/mentorship/sessions/${sessionId}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to remove session');
};
