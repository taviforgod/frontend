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
  // For file downloads, use blob
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/octet-stream')) {
    return res.blob();
  }
  return await res.json();
}

// Get all members
export async function getMembers() {
  const res = await fetch(`${API_URL}/api/members`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch members');
}

// Get member by ID
export async function getMemberById(id) {
  const res = await fetch(`${API_URL}/api/members/${id}`, { credentials: 'include' });
  return handleResponse(res, 'Member not found');
}

// Create member
export async function createMember(data) {
  const res = await fetch(`${API_URL}/api/members`, {
    method: 'POST',
    body: data,
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to create member');
}

// Update member
export async function updateMember(id, data) {
  const res = await fetch(`${API_URL}/api/members/${id}`, {
    method: 'PUT',
    body: data,
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to update member');
}

// Delete member
export async function deleteMember(id) {
  const res = await fetch(`${API_URL}/api/members/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to delete member');
}

// Export members (CSV)
export async function exportMembers() {
  const res = await fetch(`${API_URL}/api/members/export`, { credentials: 'include' });
  if (!res.ok) throw new Error('Export failed');
  return res.blob();
}

// Import members (CSV)
export async function importMembers(formData) {
  const res = await fetch(`${API_URL}/api/members/import`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  return handleResponse(res, 'Import failed');
}

// Check for duplicate email or phone
export async function checkDuplicate(field, value) {
  const res = await fetch(
    `${API_URL}/api/members/check-duplicate?field=${field}&value=${encodeURIComponent(value)}`,
    { credentials: 'include' }
  );
  return handleResponse(res, 'Duplicate check failed');
}

// Search members by name or member_no
export async function searchMembers(query) {
  const res = await fetch(`${API_URL}/api/members?q=${encodeURIComponent(query)}`, { credentials: 'include' });
  return handleResponse(res, 'Failed to search members');
}