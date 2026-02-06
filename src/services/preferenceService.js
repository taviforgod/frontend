import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "";

// Central response handler
async function handleResponse(res, defaultMsg = "Request failed") {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (contentType.includes("application/json")) {
        const body = await res.json();
        errorMsg = body?.error || body?.message || defaultMsg;
      } else {
        const text = await res.text().catch(() => "");
        if (text) errorMsg = text;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/octet-stream") || contentType.includes("application/pdf")) {
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

// Ensure fetchWithAuth exists
function assertFetch(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required (pass AuthContext.fetchWithAuth)");
}

/**
 * Get user notification preferences
 * Auto-creates defaults if none exist
 */
export const fetchGetPreferences = async (fetchWithAuth) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/notification-preferences`);
  return handleResponse(res, "Failed to fetch preferences");
};

/**
 * Update preferences
 * If user has no preferences yet, backend auto-creates
 */
export const fetchUpdatePreferences = async (fetchWithAuth, data) => {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/notification-preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update preferences");
};

/**
 * Hook wrapper for components
 */
export function usePreferenceService() {
  const { fetchWithAuth } = useContext(AuthContext);
  if (!fetchWithAuth) throw new Error("fetchWithAuth is missing in AuthContext");

  return {
    getPreferences: () => fetchGetPreferences(fetchWithAuth),
    updatePreferences: (data) => fetchUpdatePreferences(fetchWithAuth, data),

    /**
     * Alias for backward compatibility: auto-upsert
     */
    createPreferences: (data) => fetchUpdatePreferences(fetchWithAuth, data),
  };
}

export default { usePreferenceService, fetchGetPreferences, fetchUpdatePreferences, createPreferences: fetchUpdatePreferences };
