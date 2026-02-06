const API_URL = process.env.REACT_APP_API_URL || "";

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
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf')) return res.blob();
  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function assertFetch(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required (pass AuthContext.fetchWithAuth)');
}

async function fetcher(fetchWithAuth, path) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`/api/reports${path}`);
  return handleResponse(res);
}

export const getMyProfile = (fetchWithAuth) => fetcher(fetchWithAuth, '/members/profile');
export const getMembersSummary = (fetchWithAuth) => fetcher(fetchWithAuth, '/members/summary');
export const getMembersGender = (fetchWithAuth) => fetcher(fetchWithAuth, '/members/gender');
export const getMembersType = (fetchWithAuth) => fetcher(fetchWithAuth, '/members/type');
export const getAgeDemographics = (fetchWithAuth) => fetcher(fetchWithAuth, '/members/ages');
export const getGrowthTrend = (fetchWithAuth) => fetcher(fetchWithAuth, '/members/growth');
export const getUpcomingBirthdays = (fetchWithAuth) => fetcher(fetchWithAuth, '/members/upcoming-birthdays');

export const exportMembersCSV = async (fetchWithAuth, params = {}) => {
  assertFetch(fetchWithAuth);
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const path = `/api/reports/members/export${qs ? `?${qs}` : ''}`;
  const res = await fetchWithAuth(path, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Export failed');
  }
  return res.blob();
};

export default {
  getMyProfile,
  getMembersSummary,
  getMembersGender,
  getMembersType,
  getAgeDemographics,
  getGrowthTrend,
  getUpcomingBirthdays,
  exportMembersCSV
};