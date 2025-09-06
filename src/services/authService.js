// frontend/src/services/authService.js
const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Central response handler:
 * - returns JSON where possible
 * - returns Blob for binary responses (files)
 * - returns null for 204 No Content
 * - throws Error with server message when !res.ok
 */
async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      // try to parse JSON error body
      const body = await res.json();
      errorMsg = body?.error || body?.message || defaultMsg;
    } catch (e) {
      // body not JSON — fall back to defaultMsg
    }
    throw new Error(errorMsg);
  }

  // No content
  if (res.status === 204) return null;

  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  // Binary / file response
  if (contentType.includes('application/octet-stream') ||
      contentType.includes('application/pdf') ||
      contentType.includes('application/vnd.openxmlformats-officedocument') // excel
  ) {
    return res.blob();
  }

  // Default: JSON
  try {
    return await res.json();
  } catch (e) {
    // If JSON parsing fails but status is OK, return null
    return null;
  }
}

/**
 * Helper to perform fetch with JSON body and credentials included
 */
function fetchJson(url, opts = {}) {
  const defaultOpts = {
    credentials: 'include',
    headers: {}
  };

  const merged = { ...defaultOpts, ...opts };

  if (merged.body && typeof merged.body === 'object' && !(merged.body instanceof FormData)) {
    merged.headers = { ...merged.headers, 'Content-Type': 'application/json' };
    merged.body = JSON.stringify(merged.body);
  }

  return fetch(url, merged);
}

/** AUTH API */

export const login = async (email, password) => {
  const res = await fetchJson(`${API_URL}/api/auth/login`, {
    method: 'POST',
    body: { email, password }
  });
  return handleResponse(res, 'Invalid credentials');
};

export const register = async (data) => {
  const res = await fetchJson(`${API_URL}/api/auth/register`, {
    method: 'POST',
    body: data
  });
  return handleResponse(res, 'Registration failed');
};

export const verifyPhone = async (userId, code) => {
  const res = await fetchJson(`${API_URL}/api/auth/verify-phone`, {
    method: 'POST',
    body: { userId, code }
  });
  return handleResponse(res, 'Invalid code');
};

export const forgotPassword = async (email) => {
  const res = await fetchJson(`${API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    body: { email }
  });
  return handleResponse(res, 'Failed to send reset link');
};

export const resetPassword = async ({ token, password }) => {
  const res = await fetchJson(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    body: { token, password }
  });
  return handleResponse(res, 'Failed to reset password');
};

export const logout = async () => {
  const res = await fetchJson(`${API_URL}/api/auth/logout`, {
    method: 'POST'
  });
  return handleResponse(res, 'Logout failed');
};

/**
 * Returns the current authenticated user or null if not authenticated.
 * Expects server route: GET /api/auth/me (protected)
 */
export const getCurrentUser = async () => {
  const res = await fetchJson(`${API_URL}/api/auth/me`, { method: 'GET' });
  // handleResponse will return parsed JSON user object or throw if non-2xx
  try {
    return await handleResponse(res, 'Failed to fetch current user');
  } catch (err) {
    // if 401/403 or not authenticated, return null instead of throwing
    return null;
  }
};

/**
 * Optional: Refresh session (if your backend supports refresh)
 * Example: POST /api/auth/refresh — returns new session cookie
 */
export const refreshSession = async () => {
  const res = await fetchJson(`${API_URL}/api/auth/refresh`, { method: 'POST' });
  return handleResponse(res, 'Failed to refresh session');
};
