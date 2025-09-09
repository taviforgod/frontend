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
  if (res.status === 204) return; // No Content, nothing to parse
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/octet-stream")) {
    return res.blob();
  }
  // If response is empty, don't try to parse JSON
  const text = await res.text();
  if (!text) return;
  return JSON.parse(text);
}

// Zones
export const getZones = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/zones`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch zones");
};

// Status Types
export const getStatusTypes = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/status-types`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch status types");
};

// Cell Groups
export const getCellGroups = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch cell groups");
};
export const getCellGroupById = async (id) => {
  const res = await fetch(`${API_URL}/api/cell-groups/${id}`, { credentials: "include" });
  return handleResponse(res, "Cell group not found");
};
export const createCellGroup = async (data) => {
  const res = await fetch(`${API_URL}/api/cell-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create cell group");
};
export const updateCellGroup = async (id, data) => {
  const res = await fetch(`${API_URL}/api/cell-groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update cell group");
};
export const deleteCellGroup = async (id) => {
  const res = await fetch(`${API_URL}/api/cell-groups/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res, "Failed to delete cell group");
};

// Cell Group Members
export const getCellGroupMembers = async (cellGroupId) => {
  const res = await fetch(`${API_URL}/api/cell-groups/${cellGroupId}/members`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch cell group members");
};
export const addCellGroupMember = async (cellGroupId, member_ids, role = "member") => {
  const res = await fetch(`${API_URL}/api/cell-groups/${cellGroupId}/assign-members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ member_ids, role }),
  });
  return handleResponse(res, "Failed to assign member(s)");
};
export const removeCellGroupMember = async (cellGroupId, member_id) => {
  const res = await fetch(`${API_URL}/api/cell-groups/${cellGroupId}/remove-member`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ member_id }), 
  });
  return handleResponse(res, "Failed to remove member");
};
export const getUnassignedMembers = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/unassigned-members`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch unassigned members");
};

// Health History
export const getCellHealthHistory = async (cellGroupId) => {
  const res = await fetch(`${API_URL}/api/cell-groups/${cellGroupId}/health-history`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch cell health history");
};
export const addCellHealthHistory = async (data) => {
  const res = await fetch(`${API_URL}/api/cell-groups/health-history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to add cell health history");
};

// Weekly Reports
export const getWeeklyReports = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/weekly-reports`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch weekly reports");
};
export const createWeeklyReport = async (data, absenteeThreshold) => {
  const res = await fetch(`${API_URL}/api/cell-groups/weekly-reports?absentee_threshold=${absenteeThreshold}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create weekly report");
};
export const updateWeeklyReport = async (id, data) => {
  const res = await fetch(`${API_URL}/api/cell-groups/weekly-reports/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update weekly report");
};

// Consolidated/Health Dashboards
export const getConsolidatedReport = async (month, year) => {
  const res = await fetch(`${API_URL}/api/cell-groups/consolidated-report?month=${month}&year=${year}`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch consolidated report");
};
export const getCellHealthDashboard = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/health-dashboard`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch health dashboard");
};

// Notifications
export const getNotifications = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/notifications`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch notifications");
};
export const markNotificationRead = async (id) => {
  const res = await fetch(`${API_URL}/api/cell-groups/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  });
  return handleResponse(res, "Failed to mark notification as read");
};

// Export
export async function exportCellGroupsCSV() {
  const res = await fetch(`${API_URL}/api/cell-groups/export/cell-groups/csv`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed');
  return res.blob();
}

export async function exportCellHealthPDF(cell_group_id) {
  const res = await fetch(`${API_URL}/api/cell-groups/export/cell-groups/${cell_group_id}/health/pdf`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed');
  return res.blob();
}

// Zones CRUD
export const createZone = async (data) => {
  const res = await fetch(`${API_URL}/api/cell-groups/zones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create zone");
};
export const updateZone = async (id, data) => {
  const res = await fetch(`${API_URL}/api/cell-groups/zones/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update zone");
};
export const deleteZone = async (id) => {
  const res = await fetch(`${API_URL}/api/cell-groups/zones/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res, "Failed to delete zone");
};

// Status Types CRUD
export const createStatusType = async (data) => {
  const res = await fetch(`${API_URL}/api/cell-groups/status-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to create status type");
};
export const updateStatusType = async (id, data) => {
  const res = await fetch(`${API_URL}/api/cell-groups/status-types/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return handleResponse(res, "Failed to update status type");
};
export const deleteStatusType = async (id) => {
  const res = await fetch(`${API_URL}/api/cell-groups/status-types/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  return handleResponse(res, "Failed to delete status type");
};

// Reports
export async function getLastWeeklyReport(cell_group_id) {
  const res = await fetch(`${API_URL}/api/cell-groups/${cell_group_id}/last-report`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch last report');
  return res.json();
}

export async function exportWeeklyReportsCSV(reportId) {
  const res = await fetch(`${API_URL}/api/cell-groups/weekly-reports/${reportId}/export/csv`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to export CSV');
  return res.blob();
}

export async function exportWeeklyReportsExcel(reportId) {
  const res = await fetch(`${API_URL}/api/cell-groups/weekly-reports/${reportId}/export/excel`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to export Excel');
  return res.blob();
}

export async function deleteWeeklyReport(reportId) {
  const res = await fetch(`${API_URL}/api/cell-groups/weekly-reports/${reportId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error('Failed to delete weekly report');
  return true;
}

// Absentee Trends Dashboard
export const getAbsenteeTrends = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/absentees/trends`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch absentee trends");
};

// At Risk Member List
export const getAtRiskMembers = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/absentees/at-risk`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch at-risk members");
};

// Absentee Retention Rate
export const getAbsenteeRetentionRate = async () => {
  const res = await fetch(`${API_URL}/api/cell-groups/absentees/retention-rate`, { credentials: "include" });
  return handleResponse(res, "Failed to fetch absentee retention rate");
};

