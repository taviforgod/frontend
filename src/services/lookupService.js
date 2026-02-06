const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const error = await res.json();
      errorMsg = error.error || error.message || defaultMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  return await res.json();
}

/**
 * SECURE REFACTOR: All functions below take fetchWithAuth from AuthContext as the
 * first parameter, and NEVER use credentials/cookies. Calls are authenticated via tokens.
 */

// --- Generic ---
export async function getAllLookups(fetchWithAuth) {
  const res = await fetchWithAuth('/api/lookups');
  return handleResponse(res, 'Failed to fetch lookups');
}

// --- Titles ---
export async function getTitles(fetchWithAuth) {
  const res = await fetchWithAuth('/api/lookups/titles');
  return handleResponse(res, 'Failed to fetch titles');
}
export async function createTitle(fetchWithAuth, name) {
  const res = await fetchWithAuth('/api/lookups/titles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create title');
}
export async function updateTitle(fetchWithAuth, id, name) {
  const res = await fetchWithAuth(`/api/lookups/titles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update title');
}
export async function deleteTitle(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/titles/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete title');
}

// --- Genders ---
export async function getGenders(fetchWithAuth) {
  const res = await fetchWithAuth('/api/lookups/genders');
  return handleResponse(res, 'Failed to fetch genders');
}
export async function createGender(fetchWithAuth, name) {
  const res = await fetchWithAuth('/api/lookups/genders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create gender');
}
export async function updateGender(fetchWithAuth, id, name) {
  const res = await fetchWithAuth(`/api/lookups/genders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update gender');
}
export async function deleteGender(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/genders/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete gender');
}

// --- Marital Statuses ---
export async function getMaritalStatuses(fetchWithAuth) {
  const res = await fetchWithAuth('/api/lookups/marital-statuses');
  return handleResponse(res, 'Failed to fetch marital statuses');
}
export async function createMaritalStatus(fetchWithAuth, name) {
  const res = await fetchWithAuth('/api/lookups/marital-statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create marital status');
}
export async function updateMaritalStatus(fetchWithAuth, id, name) {
  const res = await fetchWithAuth(`/api/lookups/marital-statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update marital status');
}
export async function deleteMaritalStatus(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/marital-statuses/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete marital status');
}

// --- Member Types ---
export async function getMemberTypes(fetchWithAuth) {
  const res = await fetchWithAuth('/api/lookups/member-types');
  return handleResponse(res, 'Failed to fetch member types');
}
export async function createMemberType(fetchWithAuth, name) {
  const res = await fetchWithAuth('/api/lookups/member-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create member type');
}
export async function updateMemberType(fetchWithAuth, id, name) {
  const res = await fetchWithAuth(`/api/lookups/member-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update member type');
}
export async function deleteMemberType(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/member-types/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete member type');
}

// --- Member Statuses ---
export async function getMemberStatuses(fetchWithAuth) {
  const res = await fetchWithAuth('/api/lookups/member-statuses');
  return handleResponse(res, 'Failed to fetch member statuses');
}
export async function createMemberStatus(fetchWithAuth, name) {
  const res = await fetchWithAuth('/api/lookups/member-statuses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create member status');
}
export async function updateMemberStatus(fetchWithAuth, id, name) {
  const res = await fetchWithAuth(`/api/lookups/member-statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update member status');
}
export async function deleteMemberStatus(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/member-statuses/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete member status');
}

// --- Nationalities ---
export async function getNationalities(fetchWithAuth) {
  const res = await fetchWithAuth('/api/lookups/nationalities');
  return handleResponse(res, 'Failed to fetch nationalities');
}
export async function createNationality(fetchWithAuth, name) {
  const res = await fetchWithAuth('/api/lookups/nationalities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create nationality');
}
export async function updateNationality(fetchWithAuth, id, name) {
  const res = await fetchWithAuth(`/api/lookups/nationalities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update nationality');
}
export async function deleteNationality(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/nationalities/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete nationality');
}

// --- Churches ---
export async function getChurches(fetchWithAuth) {
  const res = await fetchWithAuth('/api/lookups/churches');
  return handleResponse(res, 'Failed to fetch churches');
}
export async function createChurch(fetchWithAuth, name) {
  const res = await fetchWithAuth('/api/lookups/churches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create church');
}
export async function updateChurch(fetchWithAuth, id, name) {
  const res = await fetchWithAuth(`/api/lookups/churches/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update church');
}
export async function deleteChurch(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/churches/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete church');
}

// --- Zones ---
export async function getZones(fetchWithAuth, church_id) {
  const url = church_id
    ? `/api/lookups/zones?church_id=${church_id}`
    : '/api/lookups/zones';
  const res = await fetchWithAuth(url);
  return handleResponse(res, 'Failed to fetch zones');
}
export async function createZone(fetchWithAuth, data) {
  const res = await fetchWithAuth('/api/lookups/zones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to create zone');
}
export async function updateZone(fetchWithAuth, id, data) {
  const res = await fetchWithAuth(`/api/lookups/zones/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to update zone');
}
export async function deleteZone(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/zones/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete zone');
}

// --- Status Types ---
export async function getStatusTypes(fetchWithAuth, church_id) {
  const url = church_id
    ? `/api/lookups/status-types?church_id=${church_id}`
    : '/api/lookups/status-types';
  const res = await fetchWithAuth(url);
  return handleResponse(res, 'Failed to fetch status types');
}
export async function createStatusType(fetchWithAuth, data) {
  const res = await fetchWithAuth('/api/lookups/status-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to create status type');
}
export async function updateStatusType(fetchWithAuth, id, data) {
  const res = await fetchWithAuth(`/api/lookups/status-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse(res, 'Failed to update status type');
}
export async function deleteStatusType(fetchWithAuth, id) {
  const res = await fetchWithAuth(`/api/lookups/status-types/${id}`, {
    method: 'DELETE',
  });
  return handleResponse(res, 'Failed to delete status type');
}