// frontend/src/services/cellService.js
const API_URL = process.env.REACT_APP_API_URL || '';

async function handleResponse(res, defaultMsg) {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const body = await res.json();
      errorMsg = body?.error || body?.message || defaultMsg;
    } catch {}
    throw new Error(errorMsg);
  }
  if (res.status === 204) return null;

  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function fetchJson(url, opts = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const merged = { credentials: 'include', ...opts, headers };

  if (merged.body && typeof merged.body === 'object' && !(merged.body instanceof FormData)) {
    merged.headers['Content-Type'] = 'application/json';
    merged.body = JSON.stringify(merged.body);
  }

  return fetch(url, merged);
}

// Zones
export const getZones = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/zones`), 'Failed to fetch zones');
export const createZone = async (data) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/zones`, { method: 'POST', body: data }), 'Failed to create zone');
export const updateZone = async (id, data) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/zones/${id}`, { method: 'PUT', body: data }), 'Failed to update zone');
export const deleteZone = async (id) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/zones/${id}`, { method: 'DELETE' }), 'Failed to delete zone');

// Status Types
export const getStatusTypes = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/status-types`), 'Failed to fetch status types');
export const createStatusType = async (data) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/status-types`, { method: 'POST', body: data }), 'Failed to create status type');
export const updateStatusType = async (id, data) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/status-types/${id}`, { method: 'PUT', body: data }), 'Failed to update status type');
export const deleteStatusType = async (id) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/status-types/${id}`, { method: 'DELETE' }), 'Failed to delete status type');

// Cell Groups
export const getCellGroups = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups`), 'Failed to fetch cell groups');
export const getCellGroupById = async (id) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/${id}`), 'Cell group not found');
export const createCellGroup = async (data) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups`, { method: 'POST', body: data }), 'Failed to create cell group');
export const updateCellGroup = async (id, data) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/${id}`, { method: 'PUT', body: data }), 'Failed to update cell group');
export const deleteCellGroup = async (id) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/${id}`, { method: 'DELETE' }), 'Failed to delete cell group');

// Cell Group Members
export const getCellGroupMembers = async (cellGroupId) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/${cellGroupId}/members`), 'Failed to fetch members');
export const addCellGroupMember = async (cellGroupId, member_ids, role = 'member') =>
  handleResponse(await fetchJson(`${API_URL}/api/cell-groups/${cellGroupId}/assign-members`, { method: 'POST', body: { member_ids, role } }), 'Failed to assign members');
export const removeCellGroupMember = async (cellGroupId, member_id) =>
  handleResponse(await fetchJson(`${API_URL}/api/cell-groups/${cellGroupId}/remove-member`, { method: 'DELETE', body: { member_id } }), 'Failed to remove member');
export const getUnassignedMembers = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/unassigned-members`), 'Failed to fetch unassigned members');

// Health History
export const getCellHealthHistory = async (cellGroupId) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/${cellGroupId}/health-history`), 'Failed to fetch health history');
export const addCellHealthHistory = async (data) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/health-history`, { method: 'POST', body: data }), 'Failed to add health history');

// Weekly Reports
export const getWeeklyReports = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/weekly-reports`), 'Failed to fetch weekly reports');
export const createWeeklyReport = async (data, absenteeThreshold) =>
  handleResponse(await fetchJson(`${API_URL}/api/cell-groups/weekly-reports?absentee_threshold=${absenteeThreshold}`, { method: 'POST', body: data }), 'Failed to create weekly report');
export const updateWeeklyReport = async (id, data) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/weekly-reports/${id}`, { method: 'PUT', body: data }), 'Failed to update weekly report');
export const deleteWeeklyReport = async (id) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/weekly-reports/${id}`, { method: 'DELETE' }), 'Failed to delete weekly report');
export const getLastWeeklyReport = async (cell_group_id) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/${cell_group_id}/last-report`), 'Failed to fetch last report');

// Export Reports
export const exportCellGroupsCSV = async () => (await fetchJson(`${API_URL}/api/cell-groups/export/cell-groups/csv`)).blob();
export const exportCellHealthPDF = async (cell_group_id) => (await fetchJson(`${API_URL}/api/cell-groups/export/cell-groups/${cell_group_id}/health/pdf`)).blob();
export const exportWeeklyReportsCSV = async (reportId) => (await fetchJson(`${API_URL}/api/cell-groups/weekly-reports/${reportId}/export/csv`)).blob();
export const exportWeeklyReportsExcel = async (reportId) => (await fetchJson(`${API_URL}/api/cell-groups/weekly-reports/${reportId}/export/excel`)).blob();

// Dashboards
export const getConsolidatedReport = async (month, year) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/consolidated-report?month=${month}&year=${year}`), 'Failed to fetch consolidated report');
export const getCellHealthDashboard = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/health-dashboard`), 'Failed to fetch health dashboard');
export const getAbsenteeTrends = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/absentees/trends`), 'Failed to fetch absentee trends');
export const getAtRiskMembers = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/absentees/at-risk`), 'Failed to fetch at-risk members');
export const getAbsenteeRetentionRate = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/absentees/retention-rate`), 'Failed to fetch retention rate');

// Notifications
export const getNotifications = async () => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/notifications`), 'Failed to fetch notifications');
export const markNotificationRead = async (id) => handleResponse(await fetchJson(`${API_URL}/api/cell-groups/notifications/${id}/read`, { method: 'POST' }), 'Failed to mark notification');
