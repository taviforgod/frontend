const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler
async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let msg = defaultMsg;
    try {
      const err = await res.json();
      msg = err.error || err.message || msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf')) {
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

/**
 * All functions expect `fetchWithAuth` (from AuthContext) as the first arg.
 * Example: const { fetchWithAuth } = useContext(AuthContext);
 */

// Try both API route styles:
// 1. Modern:  /api/cell/visitors/:visitorId/followups
// 2. Legacy:  /api/cell/followups/:visitorId
export async function getFollowUpsForVisitor(fetchWithAuth, visitorId) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const modern = `/api/cell/visitors/${encodeURIComponent(visitorId)}/followups`;
  const legacy = `/api/cell/followups/${encodeURIComponent(visitorId)}`;

  let res = await fetchWithAuth(modern);
  if (res.status === 404) res = await fetchWithAuth(legacy);
  return handleResponse(res, 'Failed to fetch follow-ups');
}

export async function createFollowUp(fetchWithAuth, payload) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const modern = payload?.visitor_id
    ? `/api/cell/visitors/${encodeURIComponent(payload.visitor_id)}/follow-ups`
    : null;
  const legacy = '/api/cell/followups';

  // Prefer modern route when available
  const path = modern || legacy;
  const res = await fetchWithAuth(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res, 'Failed to create follow-up');
}

export async function listDueFollowUps(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  // Legacy-only endpoint
  const res = await fetchWithAuth('/api/cell/followups/due');
  return handleResponse(res, 'Failed to fetch due follow-ups');
}

export default { getFollowUpsForVisitor, createFollowUp, listDueFollowUps };
