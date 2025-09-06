const API_URL = process.env.REACT_APP_API_URL || '';

export async function getMilestoneTemplates() {
  const res = await fetch(`${API_URL}/api/milestone-templates`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch milestone templates');
  return await res.json();
}

export async function createMilestoneTemplate(data) {
  const res = await fetch(`${API_URL}/api/milestone-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to create milestone template');
  return await res.json();
}

export async function updateMilestoneTemplate(id, data) {
  const res = await fetch(`${API_URL}/api/milestone-templates/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to update milestone template');
  return await res.json();
}

export async function deleteMilestoneTemplate(id) {
  const res = await fetch(`${API_URL}/api/milestone-templates/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to delete milestone template');
  return await res.json();
}