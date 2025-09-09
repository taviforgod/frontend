const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function getNotifications({ page=0, limit=50, status, channel, q } = {}) {
  const params = new URLSearchParams();
  params.set('page', page);
  params.set('limit', limit);
  if (status) params.set('status', status);
  if (channel) params.set('channel', channel);
  if (q) params.set('q', q);
  const res = await fetch(`${API_URL}/api/notifications?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to get notifications');
  return res.json();
}

export async function markRead(id) {
  return fetch(`${API_URL}/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
}

export async function markAllRead() {
  return fetch(`${API_URL}/api/notifications/mark-all-read`, { method: 'POST', credentials: 'include' });
}
