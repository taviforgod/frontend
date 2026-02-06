import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "";

/* Central response handler - consistent with other services */
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
export async function getPosts(fetchWithAuth, params = {}) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const query = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(`${API_URL}/api/message-board${query ? `?${query}` : ""}`);
  return handleResponse(res, "Failed to fetch posts");
}

export async function createPost(fetchWithAuth, data) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/message-board`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create post");
}

export async function updatePost(fetchWithAuth, id, data) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/message-board/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update post");
}

export async function deletePost(fetchWithAuth, id) {
  if (!fetchWithAuth) throw new Error("fetchWithAuth is required");
  const res = await fetchWithAuth(`${API_URL}/api/message-board/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  return handleResponse(res, "Failed to delete post");
}

/* Hook wrapper for convenience */
export function useMessageBoardService() {
  const { fetchWithAuth } = useContext(AuthContext);

  return {
    getPosts: (params) => getPosts(fetchWithAuth, params),
    createPost: (data) => createPost(fetchWithAuth, data),
    updatePost: (id, data) => updatePost(fetchWithAuth, id, data),
    deletePost: (id) => deletePost(fetchWithAuth, id),
  };
}

export default {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  useMessageBoardService,
};