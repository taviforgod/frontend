const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler
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
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf')) {
    return res.blob();
  }

  try {
    const txt = await res.text();
    if (!txt) return null;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

/**
 * All functions require `fetchWithAuth` (from AuthContext) as first arg.
 */

// Get milestones for a member
export async function getMilestonesByMember(fetchWithAuth, memberId) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestones/${encodeURIComponent(memberId)}`);
  return handleResponse(res, 'Failed to fetch milestones');
}

// Assign a milestone to a member
export async function assignMilestone(fetchWithAuth, { member_id, template_id }) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/milestones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id, template_id })
  });
  return handleResponse(res, 'Failed to assign milestone');
}

// Delete a milestone
export async function deleteMilestone(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/milestones/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return handleResponse(res, 'Failed to delete milestone');
}

export default { getMilestonesByMember, assignMilestone, deleteMilestone };