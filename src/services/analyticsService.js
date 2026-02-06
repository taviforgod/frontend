const API_URL = process.env.REACT_APP_API_URL || '';

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
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf') || ct.includes('sheet')) return res.blob();
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

function assertFetch(fetchWithAuth) {
  if (!fetchWithAuth || typeof fetchWithAuth !== 'function') throw new Error('fetchWithAuth required');
}

export async function getCellHealthDashboard(fetchWithAuth, weeks = 8) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/analytics/cell-health?weeks=${encodeURIComponent(weeks)}`);
  return handleResponse(res, 'Failed to fetch cell health');
}

export async function getConsolidatedReport(fetchWithAuth, month, year) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/analytics/consolidated?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
  return handleResponse(res, 'Failed to fetch consolidated report');
}

export async function getAbsenteeTrends(fetchWithAuth, weeks = 12) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/analytics/absentees?weeks=${encodeURIComponent(weeks)}`);
  return handleResponse(res, 'Failed to fetch absentee trends');
}

export async function getAtRiskMembers(fetchWithAuth, weeks = 12, threshold = 3) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/analytics/at-risk?weeks=${encodeURIComponent(weeks)}&threshold=${encodeURIComponent(threshold)}`);
  return handleResponse(res, 'Failed to fetch at-risk members');
}

export async function getDashboardMetrics(fetchWithAuth) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/analytics/dashboard-metrics`);
  return handleResponse(res, 'Failed to fetch dashboard metrics');
}

export async function getAdminSystemMetrics(fetchWithAuth) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/analytics/admin-system-metrics`);
  return handleResponse(res, 'Failed to fetch admin system metrics');
}

export default {
  getCellHealthDashboard,
  getConsolidatedReport,
  getAbsenteeTrends,
  getAtRiskMembers,
  getDashboardMetrics,
  getAdminSystemMetrics
};