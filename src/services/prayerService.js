const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg = 'Request failed') {
  // treat 304 Not Modified as "no body / no update" — return null so callers can handle empty result
  if (res.status === 304) return null;

  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        const body = await res.json();
        errorMsg = body?.error || body?.message || defaultMsg;
      } else {
        const text = await res.text().catch(()=>'');
        if (text) errorMsg = text;
      }
    } catch {}
    const e = new Error(errorMsg);
    e.status = res.status;
    throw e;
  }
  if (res.status === 204) return null;
  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf')) return res.blob();
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch { return null; }
}

export async function getPrayerRequests(fetchWithAuth, params = {}) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');

  // remove unset params so we don't send "status=null" etc.
  const clean = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') clean[k] = v;
  });

  const qs = new URLSearchParams(clean).toString();
  const res = await fetchWithAuth(`/api/prayer/my${qs ? '?' + qs : ''}`);
  return handleResponse(res, 'Failed to fetch prayer requests');
}

export async function getPrayerById(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/prayer/${encodeURIComponent(id)}`);
  return handleResponse(res, 'Prayer request not found');
}

export async function createPrayerRequest(fetchWithAuth, data) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/prayer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to submit prayer request');
}

export async function assignPrayer(fetchWithAuth, id, assigned_to) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/prayer/${encodeURIComponent(id)}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigned_to })
  });
  return handleResponse(res, 'Failed to assign');
}

export async function addFollowup(fetchWithAuth, id, payload) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/prayer/${encodeURIComponent(id)}/followups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to add followup');
}

export async function closePrayer(fetchWithAuth, id, payload = {}) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth(`/api/prayer/${encodeURIComponent(id)}/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to close request');
}

export async function getUrgentCount(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/prayer/urgent-count');
  return handleResponse(res, 'Failed to fetch urgent count');
}

export default {
  getPrayerRequests, getPrayerById, createPrayerRequest, assignPrayer, addFollowup, closePrayer, getUrgentCount
};
