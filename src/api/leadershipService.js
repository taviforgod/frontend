const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const body = await res.json();
      errorMsg = body?.error || body?.message || defaultMsg;
    } catch {}
    const e = new Error(errorMsg);
    e.status = res.status;
    throw e;
  }
  return res.json();
}

export async function getRoles(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error('fetchWithAuth is required');
  const res = await fetchWithAuth('/api/leadership/roles');
  return handleResponse(res, 'Failed to fetch roles');
}

export default { getRoles };
