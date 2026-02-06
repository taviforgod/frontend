// src/services/publicLookups.js
// src/services/publicLookups.js
export async function getChurchesPublic() {
  const API_URL =
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
  const res = await fetch(`${API_URL}/api/lookups/churches`);
  if (!res.ok) throw new Error('Failed to load churches');
  return res.json();
}
