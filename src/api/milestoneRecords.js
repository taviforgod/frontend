const API_URL = process.env.REACT_APP_API_URL || '';

export async function getMilestonesByMember(memberId) {
  const res = await fetch(`${API_URL}/api/milestones/${memberId}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch milestones');
  return await res.json();
}

export async function assignMilestone({ member_id, template_id }) {
  const res = await fetch(`${API_URL}/api/milestones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id, template_id }),
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to assign milestone');
  return await res.json();
}

export async function deleteMilestone(id) {
  const res = await fetch(`${API_URL}/api/milestones/${id}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to delete milestone');
  return await res.json();
}