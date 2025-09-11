// frontend/src/services/authService.js
const API_URL = process.env.REACT_APP_API_URL || '';

/** Handle response safely */
async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const body = await res.json();
      errorMsg = body?.error || body?.message || defaultMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf')) {
    return res.blob();
  }

  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/** Fetch wrapper that attaches credentials and optional Bearer token */
function fetchJson(url, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(opts.headers || {}) };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const merged = {
    credentials: 'include',
    ...opts,
    headers,
  };

  if (merged.body && typeof merged.body === 'object' && !(merged.body instanceof FormData)) {
    merged.headers['Content-Type'] = 'application/json';
    merged.body = JSON.stringify(merged.body);
  }

  return fetch(url, merged);
}

/** AUTH API */
export const login = async (identifier, password) => {
  const res = await fetchJson(`${API_URL}/api/auth/login`, {
    method: 'POST',
    body: { identifier, password },
  });
  const data = await handleResponse(res, 'Invalid credentials');
  if (data?.token) localStorage.setItem('token', data.token);
  return data;
};

export const register = async (data) => {
  const res = await fetchJson(`${API_URL}/api/auth/register`, {
    method: 'POST',
    body: data,
  });
  return handleResponse(res, 'Registration failed');
};

export const verifyPhone = async (userId, code) => {
  const res = await fetchJson(`${API_URL}/api/auth/verify-phone`, {
    method: 'POST',
    body: { userId, code },
  });
  return handleResponse(res, 'Invalid code');
};

export const forgotPassword = async (identifier) => {
  const res = await fetchJson(`${API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    body: { identifier },
  });
  return handleResponse(res, 'Failed to send reset link');
};

export const resetPassword = async ({ token, password }) => {
  const res = await fetchJson(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    body: { token, password },
  });
  return handleResponse(res, 'Failed to reset password');
};

export const logout = async () => {
  localStorage.removeItem('token');
  const res = await fetchJson(`${API_URL}/api/auth/logout`, { method: 'POST' });
  return handleResponse(res, 'Logout failed');
};

export const getCurrentUser = async () => {
  const res = await fetchJson(`${API_URL}/api/auth/me`, { method: 'GET' });
  try {
    return await handleResponse(res, 'Failed to fetch current user');
  } catch {
    return null;
  }
};

export const refreshSession = async () => {
  const res = await fetchJson(`${API_URL}/api/auth/refresh`, { method: 'POST' });
  return handleResponse(res, 'Failed to refresh session');
};
