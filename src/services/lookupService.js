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

export async function getAllLookups() {
  const res = await fetch(`${API_URL}/api/lookups`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch lookups');
}

// Titles
export async function getTitles() {
  const res = await fetch(`${API_URL}/api/lookups/titles`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch titles');
}
export async function createTitle(name) {
  const res = await fetch(`${API_URL}/api/lookups/titles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create title');
}
export async function updateTitle(id, name) {
  const res = await fetch(`${API_URL}/api/lookups/titles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update title');
}
export async function deleteTitle(id) {
  const res = await fetch(`${API_URL}/api/lookups/titles/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete title');
}

// Genders
export async function getGenders() {
  const res = await fetch(`${API_URL}/api/lookups/genders`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch genders');
}
export async function createGender(name) {
  const res = await fetch(`${API_URL}/api/lookups/genders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create gender');
}
export async function updateGender(id, name) {
  const res = await fetch(`${API_URL}/api/lookups/genders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update gender');
}
export async function deleteGender(id) {
  const res = await fetch(`${API_URL}/api/lookups/genders/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete gender');
}

// Marital Statuses
export async function getMaritalStatuses() {
  const res = await fetch(`${API_URL}/api/lookups/marital-statuses`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch marital statuses');
}
export async function createMaritalStatus(name) {
  const res = await fetch(`${API_URL}/api/lookups/marital-statuses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create marital status');
}
export async function updateMaritalStatus(id, name) {
  const res = await fetch(`${API_URL}/api/lookups/marital-statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update marital status');
}
export async function deleteMaritalStatus(id) {
  const res = await fetch(`${API_URL}/api/lookups/marital-statuses/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete marital status');
}

// Member Types
export async function getMemberTypes() {
  const res = await fetch(`${API_URL}/api/lookups/member-types`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch member types');
}
export async function createMemberType(name) {
  const res = await fetch(`${API_URL}/api/lookups/member-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create member type');
}
export async function updateMemberType(id, name) {
  const res = await fetch(`${API_URL}/api/lookups/member-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update member type');
}
export async function deleteMemberType(id) {
  const res = await fetch(`${API_URL}/api/lookups/member-types/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete member type');
}

// Member Statuses
export async function getMemberStatuses() {
  const res = await fetch(`${API_URL}/api/lookups/member-statuses`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch member statuses');
}
export async function createMemberStatus(name) {
  const res = await fetch(`${API_URL}/api/lookups/member-statuses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create member status');
}
export async function updateMemberStatus(id, name) {
  const res = await fetch(`${API_URL}/api/lookups/member-statuses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update member status');
}
export async function deleteMemberStatus(id) {
  const res = await fetch(`${API_URL}/api/lookups/member-statuses/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete member status');
}

// Nationalities
export async function getNationalities() {
  const res = await fetch(`${API_URL}/api/lookups/nationalities`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch nationalities');
}
export async function createNationality(name) {
  const res = await fetch(`${API_URL}/api/lookups/nationalities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create nationality');
}
export async function updateNationality(id, name) {
  const res = await fetch(`${API_URL}/api/lookups/nationalities/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update nationality');
}
export async function deleteNationality(id) {
  const res = await fetch(`${API_URL}/api/lookups/nationalities/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete nationality');
}

// Churches
export async function getChurches() {
  const res = await fetch(`${API_URL}/api/lookups/churches`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch churches');
}
export async function createChurch(name) {
  const res = await fetch(`${API_URL}/api/lookups/churches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to create church');
}
export async function updateChurch(id, name) {
  const res = await fetch(`${API_URL}/api/lookups/churches/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name }),
  });
  return handleResponse(res, 'Failed to update church');
}
export async function deleteChurch(id) {
  const res = await fetch(`${API_URL}/api/lookups/churches/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse(res, 'Failed to delete church');
}