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
  if (res.status === 204) return; // No Content
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/octet-stream')) {
    return res.blob();
  }
  const text = await res.text();
  if (!text) return;
  return JSON.parse(text);
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

// Create member (JSON only)
export async function createMember(data) {
  const res = await fetch(`${API_URL}/api/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to create member');
}

// Update member (JSON only)
export async function updateMember(id, data) {
  const res = await fetch(`${API_URL}/api/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
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
  const res = await fetch(`${API_URL}/api/members/search?q=${encodeURIComponent(query)}`, { credentials: 'include' });
  return handleResponse(res, 'Failed to search members');
}

// Upload profile photo for a member
export async function uploadProfilePhoto(memberId, file) {
  const formData = new FormData();
  formData.append('profile_photo', file);
  const res = await fetch(`${API_URL}/api/members/${memberId}/profile-photo`, {
    method: 'POST',
    body: formData,
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to upload profile photo');
}