// src/services/exportService.js
const API_URL = process.env.REACT_APP_API_URL || '';

/**
 * Export exits.
 * IMPORTANT: pass fetchWithAuth (from AuthContext) as the first argument.
 * Example: const { fetchWithAuth } = useContext(AuthContext);
 *          const blob = await exportExits(fetchWithAuth, { fromDate, toDate, format: 'csv' });
 */
export const exportExits = async (fetchWithAuth, { fromDate, toDate, format = 'csv' } = {}) => {
  const params = Object.fromEntries(
    Object.entries({ fromDate, toDate, format }).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );
  const qs = new URLSearchParams(params).toString();
  const path = `/api/export/exits${qs ? `?${qs}` : ''}`;

  const res = await fetchWithAuth(path, { method: 'GET' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || 'Export failed');
  }
  return res.blob();
};

export default { exportExits };
