const API_URL = process.env.REACT_APP_API_URL || '';

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

// All functions require fetchWithAuth (AuthContext.fetchWithAuth) as first arg.

export const getRoles = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/roles');
  return handleResponse(res, 'Failed to fetch roles');
};

export const addRole = async (fetchWithAuth, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add role');
};

export const addPromotion = async (fetchWithAuth, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/promotions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add promotion');
};

export const getEvaluations = async (fetchWithAuth, leaderId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/evaluations/${encodeURIComponent(leaderId)}`);
  return handleResponse(res, 'Failed to fetch evaluations');
};

export const addEvaluation = async (fetchWithAuth, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/evaluations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add evaluation');
};

// Readiness endpoints
export const getReadiness = async (fetchWithAuth, leaderId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/${encodeURIComponent(leaderId)}/readiness`);
  return handleResponse(res, 'Failed to fetch readiness');
};

export const getPendingApprovals = async (fetchWithAuth, opts = {}) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const params = new URLSearchParams();
  if (typeof opts.limit !== 'undefined') params.set('limit', String(opts.limit));
  if (typeof opts.page !== 'undefined') params.set('page', String(opts.page));
  if (opts.search) params.set('search', String(opts.search));
  if (typeof opts.minScore !== 'undefined' && opts.minScore !== null) params.set('minScore', String(opts.minScore));
  if (typeof opts.maxScore !== 'undefined' && opts.maxScore !== null) params.set('maxScore', String(opts.maxScore));
  if (opts.status) params.set('status', String(opts.status));
  if (typeof opts.zoneId !== 'undefined' && opts.zoneId !== null) params.set('zoneId', String(opts.zoneId));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetchWithAuth(`/api/leadership/approvals/pending${qs}`);
  return handleResponse(res, 'Failed to fetch pending approvals');
};

export const getZones = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  try {
    const res = await fetchWithAuth('/api/zones');
    return handleResponse(res, 'Failed to fetch zones');
  } catch (err) {
    // fallback to 'my-zones' if user lacks permission to view all zones
    try {
      const res2 = await fetchWithAuth('/api/zones/my-zones');
      return handleResponse(res2, 'Failed to fetch zones');
    } catch (err2) {
      throw err;
    }
  }
};

export const requestApproval = async (fetchWithAuth, leaderId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/${encodeURIComponent(leaderId)}/request-approval`, {
    method: 'POST'
  });
  return handleResponse(res, 'Failed to request approval');
};

export const approveLeader = async (fetchWithAuth, leaderId, payload = {}) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/${encodeURIComponent(leaderId)}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to approve leader');
};

export const rejectLeader = async (fetchWithAuth, leaderId, payload = {}) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/${encodeURIComponent(leaderId)}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to reject leader');
};

export const getAlerts = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/alerts');
  return handleResponse(res, 'Failed to fetch alerts');
};

export const addAlert = async (fetchWithAuth, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add alert');
};

// Milestone templates
export const getMilestoneTemplates = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/milestone-templates');
  return handleResponse(res, 'Failed to fetch milestone templates');
};

export const addMilestoneTemplate = async (fetchWithAuth, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/milestone-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add milestone template');
};

// Milestone records
export const getMilestoneRecords = async (fetchWithAuth, memberId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestone-records/${encodeURIComponent(memberId)}`);
  return handleResponse(res, 'Failed to fetch milestone records');
};

export const addMilestoneRecord = async (fetchWithAuth, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/milestone-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add milestone record');
};

export const addExitRecord = async (fetchWithAuth, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/exit-records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add exit record');
};

export const getLeadershipSummary = async (fetchWithAuth) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/summary');
  return handleResponse(res, 'Failed to fetch leadership summary');
};

export const getMentorshipAssignments = async (fetchWithAuth, mentorId) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/mentorship/mentor/${encodeURIComponent(mentorId)}`);
  return handleResponse(res, 'Failed to fetch mentorship assignments');
};

// --- Update / Delete operations ---

export const updateRole = async (fetchWithAuth, id, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/roles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update role');
};

export const deleteRole = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/roles/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete role');
};

export const updatePromotion = async (fetchWithAuth, id, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/promotions/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update promotion');
};

export const deletePromotion = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/promotions/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete promotion');
};

export const updateEvaluation = async (fetchWithAuth, id, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/evaluations/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update evaluation');
};

export const deleteEvaluation = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/evaluations/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete evaluation');
};

export const resolveAlert = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/alerts/${encodeURIComponent(id)}/resolve`, {
    method: 'PATCH'
  });
  return handleResponse(res, 'Failed to resolve alert');
};

export const deleteAlert = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/alerts/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete alert');
};

export const updateExitRecord = async (fetchWithAuth, id, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/exit-records/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update exit record');
};

export const deleteExitRecord = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/exit-records/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete exit record');
};

export const updateMilestoneTemplate = async (fetchWithAuth, id, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/milestones/templates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update milestone template');
};

export const deleteMilestoneTemplate = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/milestones/templates/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete milestone template');
};

export const updateMilestoneRecord = async (fetchWithAuth, id, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/milestones/records/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update milestone record');
};

export const deleteMilestoneRecord = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/milestones/records/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete milestone record');
};

export const updateMentorshipAssignment = async (fetchWithAuth, id, data) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/mentorship/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update mentorship assignment');
};

export const deleteMentorshipAssignment = async (fetchWithAuth, id) => {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/leadership/mentorship/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete mentorship assignment');
};

export default {
  getRoles,
  addRole,
  addPromotion,
  getEvaluations,
  addEvaluation,
  getReadiness,
  requestApproval,
  approveLeader,
  rejectLeader,
  getAlerts,
  addAlert,
  getMilestoneTemplates,
  addMilestoneTemplate,
  getMilestoneRecords,
  addMilestoneRecord,
  addExitRecord,
  getLeadershipSummary,
  getMentorshipAssignments,
  updateRole,
  deleteRole,
  updatePromotion,
  deletePromotion,
  updateEvaluation,
  deleteEvaluation,
  resolveAlert,
  deleteAlert,
  updateExitRecord,
  deleteExitRecord,
  updateMilestoneTemplate,
  deleteMilestoneTemplate,
  updateMilestoneRecord,
  deleteMilestoneRecord,
  updateMentorshipAssignment,
  deleteMentorshipAssignment
};