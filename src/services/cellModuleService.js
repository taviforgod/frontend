const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler
async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let errorMsg = defaultMsg;
    try {
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/json')) {
        const body = await res.json();
        errorMsg = body?.error || body?.message || defaultMsg;
      } else {
        const text = await res.text().catch(() => '');
        if (text) errorMsg = text;
      }
    } catch {}
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;

  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/octet-stream') || contentType.includes('application/pdf') || contentType.includes('spreadsheet') || contentType.includes('sheet')) {
    return res.blob();
  }

  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * IMPORTANT: pass `fetchWithAuth` from AuthContext as the first argument to each function.
 * Example: const res = await getCellGroups(fetchWithAuth, { zone: 'north' });
 */

// Zones
export const getZones = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/zones');
  return handleResponse(res, 'Failed to fetch zones');
};

// Status Types
export const getStatusTypes = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/status-types');
  return handleResponse(res, 'Failed to fetch status types');
};

// Cell Groups (list with optional params)
export const getCellGroups = async (fetchWithAuth, params = {}) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'undefined')
  );
  const qs = new URLSearchParams(filtered).toString();
  const res = await fetchWithAuth(`/api/cell-groups${qs ? '?' + qs : ''}`);
  return handleResponse(res, 'Failed to fetch cell groups');
};

export const getCellGroupById = async (fetchWithAuth, id) => {
  const res = await fetchWithAuth(`/api/cell-groups/${encodeURIComponent(id)}`);
  return handleResponse(res, 'Cell group not found');
};

export const createCellGroup = async (fetchWithAuth, data) => {
  const res = await fetchWithAuth('/api/cell-groups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to create cell group');
};

export const updateCellGroup = async (fetchWithAuth, id, data) => {
  const res = await fetchWithAuth(`/api/cell-groups/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update cell group');
};

export const deleteCellGroup = async (fetchWithAuth, id) => {
  const res = await fetchWithAuth(`/api/cell-groups/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete cell group');
};

// Cell Group Members
export const getCellGroupMembers = async (fetchWithAuth, cellGroupId, active = null) => {
  let path = `/api/cell-groups/${encodeURIComponent(cellGroupId)}/members`;
  if (active !== null) path += `?active=${encodeURIComponent(active)}`;
  const res = await fetchWithAuth(path);
  return handleResponse(res, 'Failed to fetch cell group members');
};

export const addCellGroupMember = async (fetchWithAuth, cellGroupId, member_ids, role = 'member') => {
  const res = await fetchWithAuth(`/api/cell-groups/${encodeURIComponent(cellGroupId)}/assign-members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_ids, role })
  });
  return handleResponse(res, 'Failed to assign member(s)');
};

export const removeCellGroupMember = async (fetchWithAuth, cellGroupId, member_id) => {
  const res = await fetchWithAuth(`/api/cell-groups/${encodeURIComponent(cellGroupId)}/remove-member`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id })
  });
  return handleResponse(res, 'Failed to remove member');
};

export const getUnassignedMembers = async (fetchWithAuth, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(`/api/cell-groups/unassigned-members${qs ? '?' + qs : ''}`);
  return handleResponse(res, 'Failed to fetch unassigned members');
};

// Health History
export const getCellHealthHistory = async (fetchWithAuth, cellGroupId) => {
  const res = await fetchWithAuth(`/api/cell-groups/${encodeURIComponent(cellGroupId)}/health-history`);
  return handleResponse(res, 'Failed to fetch cell health history');
};
export const addCellHealthHistory = async (fetchWithAuth, data) => {
  const res = await fetchWithAuth('/api/cell-groups/health-history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to add cell health history');
};

// Weekly Reports
export const getWeeklyReports = async (fetchWithAuth, params = {}) => {
  const qs = new URLSearchParams(params).toString();
  const res = await fetchWithAuth(`/api/cell-groups/weekly-reports${qs ? '?' + qs : ''}`);
  return handleResponse(res, 'Failed to fetch weekly reports');
};

export const createWeeklyReport = async (fetchWithAuth, data, absenteeThreshold) => {
  const qs = absenteeThreshold !== undefined && absenteeThreshold !== null ? `?absentee_threshold=${encodeURIComponent(absenteeThreshold)}` : '';
  const res = await fetchWithAuth(`/api/cell-groups/weekly-reports${qs}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to create weekly report');
};

export const updateWeeklyReport = async (fetchWithAuth, id, data) => {
  const res = await fetchWithAuth(`/api/cell-groups/weekly-reports/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res, 'Failed to update weekly report');
};

export const deleteWeeklyReport = async (fetchWithAuth, reportId) => {
  const res = await fetchWithAuth(`/api/cell-groups/weekly-reports/${encodeURIComponent(reportId)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete weekly report');
};

// Consolidated/Health Dashboards
export const getConsolidatedReport = async (fetchWithAuth, month, year) => {
  const res = await fetchWithAuth(`/api/cell-groups/consolidated-report?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`);
  return handleResponse(res, 'Failed to fetch consolidated report');
};
export const getCellHealthDashboard = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/health-dashboard');
  return handleResponse(res, 'Failed to fetch health dashboard');
};

// Notifications
export const getNotifications = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/notifications');
  return handleResponse(res, 'Failed to fetch notifications');
};
export const markNotificationRead = async (fetchWithAuth, id) => {
  const res = await fetchWithAuth(`/api/cell-groups/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST'
  });
  return handleResponse(res, 'Failed to mark notification as read');
};

// Export (blob responses)
export const exportCellGroupsCSV = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/export/cell-groups/csv');
  return handleResponse(res, 'Failed to export CSV');
};

export const exportCellHealthPDF = async (fetchWithAuth, cell_group_id) => {
  const res = await fetchWithAuth(`/api/cell-groups/export/cell-groups/${encodeURIComponent(cell_group_id)}/health/pdf`);
  return handleResponse(res, 'Failed to export PDF');
};

// Reports - convenience helpers
export const getLastWeeklyReport = async (fetchWithAuth, cell_group_id) => {
  const res = await fetchWithAuth(`/api/cell-groups/${encodeURIComponent(cell_group_id)}/last-report`);
  return handleResponse(res, 'Failed to fetch last report');
};

export const exportWeeklyReportsCSV = async (fetchWithAuth, reportId) => {
  const res = await fetchWithAuth(`/api/cell-groups/weekly-reports/${encodeURIComponent(reportId)}/export/csv`);
  return handleResponse(res, 'Failed to export CSV');
};

export const exportWeeklyReportsExcel = async (fetchWithAuth, reportId) => {
  const res = await fetchWithAuth(`/api/cell-groups/weekly-reports/${encodeURIComponent(reportId)}/export/excel`);
  return handleResponse(res, 'Failed to export Excel');
};

// Absentee Trends Dashboard
export const getAbsenteeTrends = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/absentees/trends');
  return handleResponse(res, 'Failed to fetch absentee trends');
};

// At Risk Member List
export const getAtRiskMembers = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/absentees/at-risk');
  return handleResponse(res, 'Failed to fetch at-risk members');
};

// Absentee Retention Rate
export const getAbsenteeRetentionRate = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/absentees/retention-rate');
  return handleResponse(res, 'Failed to fetch absentee retention rate');
};

// My Cell Group
export const getMyCellGroup = async (fetchWithAuth) => {
  const res = await fetchWithAuth('/api/cell-groups/my');
  return handleResponse(res, 'Failed to fetch your cell group');
};

