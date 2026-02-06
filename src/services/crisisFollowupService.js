/**
 * Enhanced Crisis Management Service
 * Handles comprehensive crisis case management, assessments, interventions, and recovery tracking.
 */

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';

function buildUrl(path) {
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

// ---- Core Case Management ---- //

export async function getCrisisFollowups(fetchWithAuth, params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(buildUrl(`/api/crisis-followups?${query}`));
  if (!res.ok) throw new Error('Failed to fetch crisis followups');
  return await res.json();
}

export async function getCrisisFollowupById(fetchWithAuth, id) {
  const res = await fetchWithAuth(buildUrl(`/api/crisis-followups/${id}`));
  if (!res.ok) throw new Error('Failed to fetch crisis followup');
  return await res.json();
}

export async function getCaseDetails(fetchWithAuth, id) {
  const res = await fetchWithAuth(buildUrl(`/api/crisis-followups/${id}/details`));
  if (!res.ok) throw new Error('Failed to fetch case details');
  return await res.json();
}

export async function createCrisisFollowup(fetchWithAuth, data) {
  return await fetchWithAuth(buildUrl('/api/crisis-followups'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

export async function updateCrisisFollowup(fetchWithAuth, id, data) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

export async function deleteCrisisFollowup(fetchWithAuth, id) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${id}`), {
    method: 'DELETE'
  });
}

// ---- Crisis Assessments ---- //

export async function createCrisisAssessment(fetchWithAuth, caseId, assessmentData) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/assessments`), {
    method: 'POST',
    body: JSON.stringify(assessmentData)
  });
}

export async function getCrisisAssessments(fetchWithAuth, caseId) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/assessments`));
}

// ---- Intervention Plans ---- //

export async function createInterventionPlan(fetchWithAuth, caseId, planData) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/intervention-plans`), {
    method: 'POST',
    body: JSON.stringify(planData)
  });
}

export async function getInterventionPlans(fetchWithAuth, caseId) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/intervention-plans`));
}

// ---- Follow-up Sessions ---- //

export async function createFollowupSession(fetchWithAuth, caseId, sessionData) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/sessions`), {
    method: 'POST',
    body: JSON.stringify(sessionData)
  });
}

export async function getFollowupSessions(fetchWithAuth, caseId) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/sessions`));
}

// ---- Crisis Referrals ---- //

export async function createCrisisReferral(fetchWithAuth, caseId, referralData) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/referrals`), {
    method: 'POST',
    body: JSON.stringify(referralData)
  });
}

export async function getCrisisReferrals(fetchWithAuth, caseId) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/referrals`));
}

// ---- Recovery Milestones ---- //

export async function createRecoveryMilestone(fetchWithAuth, caseId, milestoneData) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/milestones`), {
    method: 'POST',
    body: JSON.stringify(milestoneData)
  });
}

export async function getRecoveryMilestones(fetchWithAuth, caseId) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/${caseId}/milestones`));
}

export async function updateMilestoneProgress(fetchWithAuth, milestoneId, progressData) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/milestones/${milestoneId}/progress`), {
    method: 'PUT',
    body: JSON.stringify(progressData)
  });
}

// ---- Crisis Resources ---- //

export async function getCrisisResources(fetchWithAuth, params = {}) {
  const query = new URLSearchParams(params).toString();
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/resources?${query}`));
}

// ---- Dashboard & Reporting ---- //

export async function getCrisisSummary(fetchWithAuth, church_id) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/summary?church_id=${church_id}`));
}

export async function getUrgentCases(fetchWithAuth, church_id) {
  return await fetchWithAuth(buildUrl(`/api/crisis-followups/urgent?church_id=${church_id}`));
}
