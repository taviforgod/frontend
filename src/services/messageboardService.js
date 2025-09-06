const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function listBoards() {
  const res = await fetch(`${API_URL}/api/messageboard/boards`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to list boards');
  return res.json();
}

export async function listMessages(board_id, { page=0, limit=50 } = {}) {
  const params = new URLSearchParams({ page, limit });
  const res = await fetch(`${API_URL}/api/messageboard/boards/${board_id}/messages?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to list messages');
  return res.json();
}

export async function postMessage(board_id, content, metadata = {}) {
  const res = await fetch(`${API_URL}/api/messageboard/boards/${board_id}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board_id, content, metadata })
  });
  if (!res.ok) {
    const err = await res.json().catch(()=>({message:'failed'}));
    throw new Error(err.message || 'Failed to post message');
  }
  return res.json();
}
