// frontend/src/services/evangelismService.js

const API = process.env.REACT_APP_API_URL || "";

// ===========================
// Helper - Handle Response
// ===========================
async function handleResponse(res, defaultMsg = "Request failed") {
  if (!res.ok) {
    let detail = null;
    try {
      detail = await res.json();
    } catch (err) {}

    throw new Error(
      (detail && (detail.error || detail.message)) || defaultMsg
    );
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

// ===========================
// Wrapper - Auth Fetch
// ===========================
async function authFetch(fetchWithAuth, url, options = {}, errorMsg) {
  if (typeof fetchWithAuth !== "function") {
    throw new Error("fetchWithAuth is not a function");
  }
  const res = await fetchWithAuth(url, options);
  return handleResponse(res, errorMsg);
}

// ===========================
// CONTACTS
// ===========================
export const listContacts = async (fetchWithAuth, filters = {}) => {
  const qs = new URLSearchParams(filters).toString();
  return authFetch(
    fetchWithAuth,
    `/api/evangelism/contacts${qs ? `?${qs}` : ""}`,
    {},
    "Failed to list contacts"
  );
};

export const createContact = async (fetchWithAuth, data) =>
  authFetch(
    fetchWithAuth,
    "/api/evangelism/contacts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Failed to create contact"
  );

export const updateContact = async (fetchWithAuth, id, data) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/contacts/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Failed to update contact"
  );

export const updateContactStatus = async (fetchWithAuth, id, status) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/contacts/${encodeURIComponent(id)}/status`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
    "Failed to update status"
  );

export const deleteContact = async (fetchWithAuth, id) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/contacts/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete contact"
  );

export const assignBulk = async (fetchWithAuth, ids, userId) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/contacts/assign-bulk`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, assigned_to_user_id: userId }),
    },
    "Failed to assign contacts"
  );

export const convertToVisitor = async (fetchWithAuth, id) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/contacts/${encodeURIComponent(id)}/convert-to-visitor`,
    { method: "POST" },
    "Failed to convert contact"
  );

export const markAttended = async (fetchWithAuth, id, opts = {}) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/contacts/${encodeURIComponent(id)}/attended`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    },
    "Failed to mark attended"
  );

// ===========================
// EVENTS
// ===========================
export const listEvents = async (fetchWithAuth) =>
  authFetch(fetchWithAuth, `/api/evangelism/events`, {}, "Failed to list events");

export const createEvent = async (fetchWithAuth, data) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/events`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Failed to create event"
  );

export const updateEvent = async (fetchWithAuth, id, data) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/events/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "Failed to update event"
  );

export const deleteEvent = async (fetchWithAuth, id) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/events/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Failed to delete event"
  );

export const inviteContactsToEvent = async (
  fetchWithAuth,
  eventId,
  contactIds,
  options = {}
) =>
  authFetch(
    fetchWithAuth,
    `/api/evangelism/events/${encodeURIComponent(eventId)}/invite`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_ids: contactIds, ...options }),
    },
    "Failed to invite contacts"
  );

// Export optimized duplicate
export const sendInvites = inviteContactsToEvent;

// ===========================
// IMPORT/EXPORT
// ===========================
export const importContactsCSV = async (file, fetchWithAuth) => {
  const form = new FormData();
  form.append("file", file);

  const res = await fetchWithAuth(`/api/evangelism/contacts/import`, {
    method: "POST",
    body: form,
  });

  return handleResponse(res, "Failed to import contacts");
};

export const exportContactsCSV = async (fetchWithAuth) => {
  const res = await fetchWithAuth(`/api/evangelism/contacts/export/csv`);
  if (!res.ok) throw new Error("Failed to export CSV");
  return res.blob();
};

export const exportContactsExcel = async (fetchWithAuth) => {
  const res = await fetchWithAuth(`/api/evangelism/contacts/export/excel`);
  if (!res.ok) throw new Error("Failed to export Excel");
  return res.blob();
};
