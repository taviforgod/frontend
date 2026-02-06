import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "";

/* Central response handler (same style as other services) */
async function handleResponse(res, defaultMsg = "Request failed") {
  if (!res.ok) {
    let msg = defaultMsg;
    try {
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("application/json")) {
        const body = await res.json();
        msg = body?.error || body?.message || msg;
      } else {
        const text = await res.text().catch(() => "");
        if (text) msg = text;
      }
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/octet-stream") || ct.includes("application/pdf")) {
    return res.blob();
  }

  try {
    const txt = await res.text();
    if (!txt) return null;
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

/* Service functions (require fetchWithAuth as first arg) */
export async function listNotifications(fetchWithAuth, params = {}) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(`${API_URL}/api/notifications${query ? `?${query}` : ""}`);
  return handleResponse(res, "Failed to fetch notifications");
}

export async function markNotificationRead(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notifications/${encodeURIComponent(id)}/read`, {
    method: "POST",
  });
  return handleResponse(res, "Failed to mark notification read");
}

export async function markAllNotificationsRead(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notifications/mark-all-read`, {
    method: "POST",
  });
  return handleResponse(res, "Failed to mark all notifications read");
}

export async function createNotification(fetchWithAuth, data) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notifications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create notification");
}

export async function deleteNotification(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notifications/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete notification");
}

/* React hook wrapper for convenience (used across the app) */
export function useNotificationService() {
  const { fetchWithAuth } = useContext(AuthContext);

  return {
    listNotifications: (params) => listNotifications(fetchWithAuth, params),
    markNotificationRead: (id) => markNotificationRead(fetchWithAuth, id),
    markAllNotificationsRead: () => markAllNotificationsRead(fetchWithAuth),
    createNotification: (data) => createNotification(fetchWithAuth, data),
    deleteNotification: (id) => deleteNotification(fetchWithAuth, id),
  };
}

export default {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification,
  deleteNotification,
  useNotificationService,
};