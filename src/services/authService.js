// src/services/authService.js

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');

const REFRESH_KEY = 'cmms_refresh_token';

/* -------------------------------------------------------------------------- */
/*                               Helper Methods                               */
/* -------------------------------------------------------------------------- */

async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/json')) {
        const body = await res.json();
        errorMsg = body?.error || body?.message || defaultMsg;
      } else {
        const text = await res.text().catch(() => '');
        if (text) errorMsg = text;
      }
    } catch {
      // swallow parsing errors
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function buildUrl(url) {
  if (!API_URL) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_URL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
}

function fetchJson(url, opts = {}) {
  const defaultOpts = {
    headers: {},
    credentials: 'omit',
  };
  const merged = { ...defaultOpts, ...opts };

  // Add Bearer token if provided
  if (merged.token) {
    merged.headers = {
      ...merged.headers,
      Authorization: `Bearer ${merged.token}`,
    };
    delete merged.token;
  }

  // Auto-convert body to JSON if plain object
  if (merged.body && typeof merged.body === 'object' && !(merged.body instanceof FormData)) {
    merged.headers = {
      ...merged.headers,
      'Content-Type': 'application/json',
    };
    merged.body = JSON.stringify(merged.body);
  }

  return fetch(buildUrl(url), merged);
}

/* -------------------------------------------------------------------------- */
/*                              Auth API Methods                              */
/* -------------------------------------------------------------------------- */

// 🔐 Login
export const login = async (identifier, password) => {
  const res = await fetchJson('/api/auth/login', {
    method: 'POST',
    body: { identifier, password },
  });
  const data = await handleResponse(res, 'Invalid credentials');

  if (data?.refreshToken) {
    try {
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
    } catch {
      // ignore storage errors
    }
  }

  return data;
};

// 🆕 Register (no authentication needed)
export const register = async (data) => {
  const res = await fetchJson('/api/auth/register', {
    method: 'POST',
    body: data,
  });
  return handleResponse(res, 'Registration failed');
};

// 📱 Verify Phone
export async function verifyPhone(userId, code) {
  const res = await fetchJson('/api/auth/phone-verify', {
    method: 'POST',
    body: { userId, code },
  });
  return handleResponse(res, 'Phone verification failed');
}

// 📧 Verify Email
export async function verifyEmail(fetchFn, userId, code) {
  // Use fetchFn if provided, otherwise default to fetchJson
  const res = fetchFn
    ? await fetchFn('/api/auth/email-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      })
    : await fetchJson('/api/auth/email-verify', {
        method: 'POST',
        body: { userId, code },
      });

  return handleResponse(res, 'Email verification failed');
}


// 🔑 Forgot Password
export const forgotPassword = async (identifier) => {
  const res = await fetchJson('/api/auth/forgot-password', {
    method: 'POST',
    body: { identifier },
  });
  return handleResponse(res, 'Failed to send reset link');
};

// 🔐 Reset Password
export const resetPassword = async ({ userId, code, password }) => {
  const res = await fetchJson('/api/auth/reset-password', {
    method: 'POST',
    body: { userId, code, password },
  });
  return handleResponse(res, 'Failed to reset password');
};

// 🚪 Logout
export const logout = async () => {
  const refreshToken = (() => {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  })();

  if (refreshToken) {
    try {
      const res = await fetchJson('/api/auth/logout', {
        method: 'POST',
        body: { refreshToken },
      });
      await handleResponse(res, 'Logout failed');
    } catch (err) {
      console.error('Logout request failed:', err);
    }
  }

  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore storage errors
  }
};

// 🔁 Refresh Session
export const refreshSession = async (refreshToken) => {
  if (!refreshToken) throw new Error('Missing refresh token');

  const res = await fetchJson('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });

  return handleResponse(res, 'Failed to refresh session');
};

// 👤 Get Current User (via refresh token)
export const getCurrentUser = async () => {
  try {
    const refreshToken = (() => {
      try {
        return localStorage.getItem(REFRESH_KEY);
      } catch {
        return null;
      }
    })();

    if (!refreshToken) return null;

    let user = null;

    try {
      const res = await fetchJson('/api/auth/me', {
        method: 'GET',
        token: refreshToken,
      });
      user = await handleResponse(res, 'Failed to load user');
    } catch (err) {
      // If expired, try refresh flow
      try {
        const refreshed = await refreshSession(refreshToken);
        try {
          localStorage.setItem(REFRESH_KEY, refreshed.refreshToken);
        } catch {}
        user = refreshed.user;
      } catch (refreshErr) {
        await logout();
        return null;
      }
    }

    return user;
  } catch (err) {
    await logout();
    return null;
  }
};
