const API_URL = process.env.REACT_APP_API_URL || '';

// Central response handler (consistent with other services in the repo)
async function handleResponse(res, defaultMsg = 'Request failed') {
  if (!res.ok) {
    let msg = defaultMsg;
    try {
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) {
        const body = await res.json();
        msg = body?.error || body?.message || msg;
      } else {
        const text = await res.text().catch(() => '');
        if (text) msg = text;
      }
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return null;

  const ct = (res.headers.get('content-type') || '').toLowerCase();
  if (ct.includes('application/octet-stream') || ct.includes('application/pdf') || ct.includes('sheet')) return res.blob();

  try {
    const text = await res.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function assertFetch(fetchWithAuth) {
  if (!fetchWithAuth || typeof fetchWithAuth !== 'function') {
    throw new Error('fetchWithAuth is required (pass AuthContext.fetchWithAuth)');
  }
}

/* List weekly reports */
export async function getWeeklyReports(fetchWithAuth, params = {}) {
  assertFetch(fetchWithAuth);
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports${qs ? `?${qs}` : ''}`);
  return handleResponse(res, 'Failed to list weekly reports');
}

/* Get one weekly report */
export async function getWeeklyReport(fetchWithAuth, id) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(id)}`);
  return handleResponse(res, 'Failed to fetch weekly report');
}

/* Create
   - payload should include:
     - meeting_date (YYYY-MM-DD)
     - cell_group_id
     - topic (string)
     - attendees: array of member IDs OR objects { member_id, joined_at? }
     - visitors: array of visitor IDs OR objects
     - absentees: array of { member_id?, visitor_id?, reason?, followup_action? }
     - numeric metrics as numbers
*/
export async function createWeeklyReport(fetchWithAuth, payload) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to create weekly report');
}

/* Update */
export async function updateWeeklyReport(fetchWithAuth, id, payload) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to update weekly report');
}

/* Delete */
export async function deleteWeeklyReport(fetchWithAuth, id) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to delete weekly report');
}

/* Export CSV -> returns Blob or string */
export async function exportWeeklyReportsCSV(fetchWithAuth, id) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(id)}/export/csv`);
  return handleResponse(res, 'Export CSV failed');
}

/* Export XLSX -> returns Blob */
export async function exportWeeklyReportsExcel(fetchWithAuth, id) {
  assertFetch(fetchWithAuth);
  if (!id) throw new Error('id required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(id)}/export/xlsx`);
  return handleResponse(res, 'Export XLSX failed');
}

/* Bulk Export XLSX -> returns Blob */
export async function exportWeeklyReportsBulkExcel(fetchWithAuth, churchId, nWeeks = 12) {
  assertFetch(fetchWithAuth);
  if (!churchId) throw new Error('church_id required');
  const qs = `?church_id=${encodeURIComponent(churchId)}&nWeeks=${encodeURIComponent(nWeeks)}`;
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/export/bulk${qs}`);
  return handleResponse(res, 'Export bulk XLSX failed');
}

/* Preview absentees for a group/date */
export async function previewAbsentees(fetchWithAuth, cell_group_id, meeting_date, attendee_ids = []) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cell_group_id, meeting_date, attendee_ids })
  });
  return handleResponse(res, 'Failed to preview absentees');
}


/* JSON-array helpers for a specific report */
// add attendee { member_id }
export async function addAttendee(fetchWithAuth, reportId, memberId) {
  assertFetch(fetchWithAuth);
  if (!reportId || !memberId) throw new Error('reportId and memberId required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(reportId)}/attendees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ member_id: memberId })
  });
  return handleResponse(res, 'Failed to add attendee');
}

// remove attendee
export async function removeAttendee(fetchWithAuth, reportId, memberId) {
  assertFetch(fetchWithAuth);
  if (!reportId || !memberId) throw new Error('reportId and memberId required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(reportId)}/attendees/${encodeURIComponent(memberId)}`, {
    method: 'DELETE'
  });
  return handleResponse(res, 'Failed to remove attendee');
}

// add visitor (object or id)
export async function addVisitor(fetchWithAuth, reportId, visitorObj) {
  assertFetch(fetchWithAuth);
  if (!reportId || !visitorObj) throw new Error('reportId and visitorObj required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(reportId)}/visitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(visitorObj)
  });
  return handleResponse(res, 'Failed to add visitor');
}

// add absentee (object with member_id?, visitor_id?, reason, followup_action?)
export async function addAbsentee(fetchWithAuth, reportId, absenteeObj) {
  assertFetch(fetchWithAuth);
  if (!reportId || !absenteeObj) throw new Error('reportId and absenteeObj required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/${encodeURIComponent(reportId)}/absentees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(absenteeObj)
  });
  return handleResponse(res, 'Failed to add absentee');
}

/* Analytics endpoints */
export async function getTopCellForWeek(fetchWithAuth, churchId, meetingDate) {
  assertFetch(fetchWithAuth);
  if (!churchId || !meetingDate) throw new Error('churchId and meetingDate required');
  const qs = `?church_id=${encodeURIComponent(churchId)}&meeting_date=${encodeURIComponent(meetingDate)}`;
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/top-cell${qs}`);
  return handleResponse(res, 'Failed to get top cell for week');
}

export async function getBottomCellForWeek(fetchWithAuth, churchId, meetingDate) {
  assertFetch(fetchWithAuth);
  if (!churchId || !meetingDate) throw new Error('churchId and meetingDate required');
  const qs = `?church_id=${encodeURIComponent(churchId)}&meeting_date=${encodeURIComponent(meetingDate)}`;
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/bottom-cell${qs}`);
  return handleResponse(res, 'Failed to get bottom cell for week');
}

export async function getLeaderboards(fetchWithAuth, churchId, startDate, endDate, limit = 10) {
  assertFetch(fetchWithAuth);
  if (!churchId || !startDate || !endDate) throw new Error('churchId, startDate and endDate required');
  const qs = `?church_id=${encodeURIComponent(churchId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}&limit=${encodeURIComponent(limit)}`;
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/leaderboards${qs}`);
  return handleResponse(res, 'Failed to get leaderboards');
}

/* Weekly trends */
export async function getWeeklyTrends(fetchWithAuth, churchId, nWeeks = 12) {
  assertFetch(fetchWithAuth);
  if (!churchId) throw new Error('church_id required');
  const qs = `?church_id=${encodeURIComponent(churchId)}&nWeeks=${encodeURIComponent(nWeeks)}`;
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/trends${qs}`);
  return handleResponse(res, 'Failed to get weekly trends');
}

/* Get weekly report summary for the logged-in user */
export async function getMyWeeklyReportSummary(fetchWithAuth) {
  assertFetch(fetchWithAuth);
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/my`);
  return handleResponse(res, 'Failed to fetch my weekly report summary');
}

/* Get Meeting Schedule and Attendance */
export async function getMeetingScheduleAndAttendance(fetchWithAuth, cellGroupId) {
  assertFetch(fetchWithAuth);
  if (!cellGroupId) throw new Error('cellGroupId required');
  const res = await fetchWithAuth(`${API_URL}/api/weekly-reports/meeting-schedule?cell_group_id=${encodeURIComponent(cellGroupId)}`);
  return handleResponse(res, 'Failed to fetch meeting schedule and attendance');
}

export default {
  getWeeklyReports,
  getWeeklyReport,
  createWeeklyReport,
  updateWeeklyReport,
  deleteWeeklyReport,
  exportWeeklyReportsCSV,
  exportWeeklyReportsExcel,
  exportWeeklyReportsBulkExcel,
  previewAbsentees,
  addAttendee,
  removeAttendee,
  addVisitor,
  addAbsentee,
  getTopCellForWeek,
  getBottomCellForWeek,
  getLeaderboards,
  getWeeklyTrends,
  getMyWeeklyReportSummary,
  getMeetingScheduleAndAttendance
};