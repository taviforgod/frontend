import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';

export const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || '';
const REFRESH_KEY = 'cmms_refresh_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [lookups, setLookups] = useState({});
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [accessToken, setAccessToken] = useState(() => {
    // Try to restore from localStorage so protected requests after reload are possible
    try {
      return localStorage.getItem('accessToken') || null;
    } catch {
      return null;
    }
  });

  // Use ref for immediate token updates (state updates are async)
  const accessTokenRef = useRef(accessToken);

  // Update ref whenever state changes
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  // Helper: Build id->label map
  const buildMap = (arr) => {
    if (!Array.isArray(arr)) return {};
    return arr.reduce((m, item) => {
      const id = item?.id ?? item?.value ?? item?.key;
      const label = item?.name ?? item?.label ?? item?.text ?? item?.title ?? String(item);
      if (typeof id !== 'undefined') m[id] = label;
      return m;
    }, {});
  };

  // token helpers
  const getStoredRefresh = () => {
    try {
      return window.localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  };

  const setStoredRefresh = (token) => {
    try {
      if (token) window.localStorage.setItem(REFRESH_KEY, token);
      else window.localStorage.removeItem(REFRESH_KEY);
    } catch {}
  };

  // Also persist accessToken in localStorage for reload-resilience
  const persistAccessToken = (token) => {
    setAccessToken(token);
    accessTokenRef.current = token; // Update ref immediately
    try {
      if (token) localStorage.setItem('accessToken', token);
      else localStorage.removeItem('accessToken');
    } catch {}
  };

  const clearTokens = () => {
    persistAccessToken(null);
    setStoredRefresh(null);
    accessTokenRef.current = null; // Clear ref immediately
  };

  // fetchWithAuth: injects Authorization header and auto-refreshes once on 401
  const fetchWithAuth = useCallback(
    async (input, opts = {}) => {
      // Protect against accidental calls where a function (eg. fetchWithAuth)
      // is passed as the `input` argument. Sending a function will coerce
      // to a string (function source) and produce malformed URLs (500s).
      if (typeof input === 'function') {
        console.error('fetchWithAuth called with a function as input', input);
        throw new Error('Invalid fetch input: function provided instead of URL or Request');
      }

      const url = typeof input === 'string' && !input.startsWith('http') ? `${API_URL}${input}` : input;
      const options = { ...(opts || {}) };
      options.headers = { ...(options.headers || {}) };

      if (accessTokenRef.current) {
        options.headers.Authorization = `Bearer ${accessTokenRef.current}`;
      }

      let res = await fetch(url, options);

      if (res.status !== 401) return res;

      // try refresh once
      const refreshToken = getStoredRefresh();
      if (!refreshToken) {
        clearTokens();
        setUser(null);
        return res;
      }

      try {
        const r = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!r.ok) {
          // refresh failed -> logout
          clearTokens();
          setUser(null);
          return res;
        }
        const payload = await r.json();
        if (payload.accessToken) persistAccessToken(payload.accessToken);
        if (payload.refreshToken) setStoredRefresh(payload.refreshToken);

        options.headers.Authorization = `Bearer ${payload.accessToken || accessToken}`;
        res = await fetch(url, options);
        return res;
      } catch (err) {
        clearTokens();
        setUser(null);
        return res;
      }
    },
    [accessToken]
  );

  // Fetch lookups dynamically (uses fetchWithAuth so protected endpoints are handled)
  const loadLookups = useCallback(async () => {
    setLoadingLookups(true);
    try {
      let data = null;
      try {
        const res = await fetchWithAuth('/api/lookups');
        if (res.ok) data = await res.json();
      } catch (e) {}

      // fallback to individual endpoints
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        const endpoints = {
          titles: ['/api/lookups/titles'],
          genders: ['/api/lookups/genders'],
          marital_statuses: ['/api/lookups/marital-statuses'],
          member_types: ['/api/lookups/member-types'],
          member_statuses: ['/api/lookups/member-statuses'],
          nationalities: ['/api/lookups/nationalities'],
          churches: ['/api/lookups/churches'],
          zones: ['/api/lookups/zones'],
          status_types: ['/api/lookups/status-types'],
        };

        data = {};
        await Promise.all(
          Object.keys(endpoints).map(async (key) => {
            for (const ep of endpoints[key]) {
              try {
                const r = await fetchWithAuth(ep);
                if (r.ok) {
                  data[key] = await r.json();
                  break;
                }
              } catch {}
            }
          })
        );
      }

      // Normalize into arrays
      const {
        titles = [],
        genders = [],
        marital_statuses = [],
        member_types = [],
        member_statuses = [],
        nationalities = [],
        churches = [],
        zones = [],
        status_types = [],
      } = data || {};

      const maps = {
        titlesMap: buildMap(titles),
        gendersMap: buildMap(genders),
        maritalStatusesMap: buildMap(marital_statuses),
        memberTypesMap: buildMap(member_types),
        memberStatusesMap: buildMap(member_statuses),
        nationalitiesMap: buildMap(nationalities),
        churchesMap: buildMap(churches),
        zonesMap: buildMap(zones),
        statusTypesMap: buildMap(status_types),
      };

      const normalized = { ...data, ...maps };
      setLookups(normalized);
      try {
        localStorage.setItem('lookups', JSON.stringify(normalized));
      } catch {}
    } catch (err) {
      console.error('Failed to load lookups:', err);
      setLookups({});
    } finally {
      setLoadingLookups(false);
    }
  }, [fetchWithAuth]);

  const normalizePermissions = (p) => {
    if (Array.isArray(p)) return p;
    if (typeof p === 'string' && p.trim()) {
      try {
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return p.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const normalizeUser = (u) => {
    if (!u) return null;
    const normalized = { ...u };
    const candidate = normalized.church_id ?? normalized.churchId ?? normalized.church ?? null;
    if (candidate !== null && candidate !== undefined && candidate !== '') {
      const n = Number(candidate);
      normalized.church_id = Number.isNaN(n) ? candidate : n;
    } else {
      try {
        const ls =
          typeof window !== 'undefined' && window.localStorage
            ? window.localStorage.getItem('church_id')
            : null;
        if (ls) {
          const n = Number(ls);
          normalized.church_id = Number.isNaN(n) ? ls : n;
        }
      } catch {}
    }
    if (normalized.permissions) normalized.permissions = normalizePermissions(normalized.permissions);
    return normalized;
  };

  // Load user + lookups on mount
  useEffect(() => {
    (async () => {
      try {
        const storedRefresh = getStoredRefresh();
        if (!storedRefresh) {
          await loadLookups();
          setUser(null);
          setReady(true);
          return;
        }

        let newAccessToken = null;
        try {
          const r = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefresh }),
          });
          if (r.ok) {
            const payload = await r.json();
            if (payload.accessToken) {
              newAccessToken = payload.accessToken;
              persistAccessToken(payload.accessToken);
              setAccessToken(payload.accessToken);
              accessTokenRef.current = payload.accessToken; // Update ref immediately
            }
            if (payload.refreshToken) setStoredRefresh(payload.refreshToken);
          } else {
            setStoredRefresh(null);
            persistAccessToken(null);
            setAccessToken(null);
          }
        } catch {
          setStoredRefresh(null);
          persistAccessToken(null);
          setAccessToken(null);
        }

        let data = null;
        if (newAccessToken) {
          // Use the new token directly for the API calls
          try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${newAccessToken}` }
            });
            if (res.ok) data = await res.json();
          } catch {}

          if (!data) {
            try {
              const res2 = await fetch(`${API_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${newAccessToken}` }
              });
              if (res2.ok) data = await res2.json();
            } catch {}
          }
        }

        try {
          const r = await fetchWithAuth('/api/members/me');
          if (r.ok) {
            const member = await r.json();
            data = data ? { ...data, member } : { member };
          }
        } catch {}

        if (data) data.permissions = normalizePermissions(data.permissions);
        setUser(normalizeUser(data));

        await loadLookups();
      } catch (err) {
        console.warn('AuthContext init failed:', err);
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  const login = async (identifier, password) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }
    const payload = await res.json();
    let newAccessToken = null;
    if (payload.accessToken) {
      newAccessToken = payload.accessToken;
      persistAccessToken(payload.accessToken);
      setAccessToken(payload.accessToken);
      accessTokenRef.current = payload.accessToken; // Update ref immediately
    }
    if (payload.refreshToken) setStoredRefresh(payload.refreshToken);

    let data = payload.user || null;
    if (!data && newAccessToken) {
      try {
        const r = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${newAccessToken}` }
        });
        if (r.ok) data = await r.json();
      } catch {}
    }
    if (!data && newAccessToken) {
      try {
        const r2 = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${newAccessToken}` }
        });
        if (r2.ok) data = await r2.json();
      } catch {}
    }

    if (data) data.permissions = normalizePermissions(data.permissions);
    setUser(normalizeUser(data));
    setReady(true);
    return data;
  };

  const logout = async () => {
    try {
      const refreshToken = getStoredRefresh();
      if (refreshToken) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
    } finally {
      clearTokens();
      setUser(null);
    }
  };

  const updateMember = async (patch) => {
    const res = await fetchWithAuth('/api/members/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update member');
    }
    const updated = await res.json();
    setUser((prev) => normalizeUser({ ...(prev || {}), member: updated }));
    return updated;
  };

  const refreshLookups = async () => {
    await loadLookups();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        lookups,
        loadingLookups,
        login,
        logout,
        setUser,
        updateMember,
        refreshLookups,
        fetchWithAuth,
        getAccessToken: () => accessToken,
        accessToken // make accessToken available directly for useLinkedMember or other hooks
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}