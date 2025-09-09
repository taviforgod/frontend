const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let err = defaultMsg;
    try { const d = await res.json(); err = d.error || d.message || defaultMsg; } catch(e) {}
    throw new Error(err);
  }
  return res.json();
}

export const getMilestoneTemplates = async () => {
  const res = await fetch(`${API_URL}/api/milestone-templates`, { credentials: 'include' });
  return handleResponse(res, 'Failed to load templates');
};

export const getMilestonesByMember = async (memberId) => {
  const res = await fetch(`${API_URL}/api/milestone-records/${memberId}`, { credentials: 'include' });
  return handleResponse(res, 'Failed to load milestone records');
};

export const assignMilestone = async (payload) => {
  const res = await fetch(`${API_URL}/api/milestone-records`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to assign milestone');
};

export const deleteMilestone = async (id) => {
  const res = await fetch(`${API_URL}/api/milestone-records/${id}`, { method:'DELETE', credentials:'include' });
  if (!res.ok) throw new Error('Failed to delete');
  return true;
};

export const createMilestoneTemplate = async (payload) => {
  const res = await fetch(`${API_URL}/api/milestone-templates`, {
    method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to create template');
};

export const updateMilestoneTemplate = async (id, payload) => {
  const res = await fetch(`${API_URL}/api/milestone-templates/${id}`, {
    method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to update template');
};

export const deleteMilestoneTemplate = async (id) => {
  const res = await fetch(`${API_URL}/api/milestone-templates/${id}`, { method:'DELETE', credentials:'include' });
  if (!res.ok) throw new Error('Failed to delete');
  return true;
};
