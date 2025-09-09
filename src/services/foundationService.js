const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let err = defaultMsg;
    try { const d = await res.json(); err = d.error || d.message || defaultMsg; } catch(e) {}
    throw new Error(err);
  }
  return res.json();
}

export const getFoundationByMember = async (memberId) => {
  const res = await fetch(`${API_URL}/api/foundation/${memberId}`, { credentials: 'include' });
  return handleResponse(res, 'Failed to load foundation data');
};

export const enrollFoundation = async (payload) => {
  const res = await fetch(`${API_URL}/api/foundation`, {
    method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to enroll');
};

export const updateFoundation = async (id, payload) => {
  const res = await fetch(`${API_URL}/api/foundation/${id}`, {
    method:'PUT', headers:{'Content-Type':'application/json'}, credentials:'include', body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to update');
};
