import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

/**
 * Shared configuration + response handler (consistent with other services)
 */
const API_URL = process.env.REACT_APP_API_URL || "";

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

function assertFetch(fetchWithAuth) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required (pass AuthContext.fetchWithAuth)");
}

/* Hook-based service for components that prefer hooks */
export function useTemplateService() {
  const { fetchWithAuth } = useContext(AuthContext);

  return {
    async getTemplates(params) {
      assertFetch(fetchWithAuth);
      const query = new URLSearchParams(params).toString();
      const res = await fetchWithAuth(`${API_URL}/api/notification-templates${query ? `?${query}` : ""}`);
      return handleResponse(res, "Failed to fetch templates");
    },
    async createTemplate(data) {
      assertFetch(fetchWithAuth);
      const res = await fetchWithAuth(`${API_URL}/api/notification-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res, "Failed to create template");
    },
    async updateTemplate(id, data) {
      assertFetch(fetchWithAuth);
      const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(res, "Failed to update template");
    },
    async deleteTemplate(id) {
      assertFetch(fetchWithAuth);
      const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return handleResponse(res, "Failed to delete template");
    },
    async previewTemplate(id, data) {
      assertFetch(fetchWithAuth);
      const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: data }),
      });
      return handleResponse(res, "Failed to preview template");
    },
    async copyTemplateToChurch(id, targetChurchId) {
      assertFetch(fetchWithAuth);
      const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}/copy-to`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetChurchId }),
      });
      return handleResponse(res, "Failed to copy template");
    }
  };
}

/* Template service functions (require fetchWithAuth as first arg) */
export async function listTemplates(fetchWithAuth, params = {}) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(`${API_URL}/api/notification-templates${query ? `?${query}` : ""}`);
  return handleResponse(res, "Failed to fetch templates");
}

export async function getTemplate(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}`);
  return handleResponse(res, "Failed to fetch template");
}

export async function createTemplate(fetchWithAuth, data) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notification-templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create template");
}

export async function updateTemplate(fetchWithAuth, id, data) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update template");
}

export async function deleteTemplate(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete template");
}

export async function previewTemplate(fetchWithAuth, id, payload) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: payload }),
  });
  return handleResponse(res, "Failed to preview template");
}

export async function copyTemplateToChurch(fetchWithAuth, id, targetChurchId) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/notification-templates/${encodeURIComponent(id)}/copy-to`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetChurchId }),
  });
  return handleResponse(res, "Failed to copy template");
}

export default {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewTemplate,
  copyTemplateToChurch,
};