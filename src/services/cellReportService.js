// src/services/cellReportService.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function handleResponse(res, defaultMsg='Request failed') {
  if (!res.ok) {
    let msg = defaultMsg;
    try { const err = await res.json(); msg = err.error || err.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Create a weekly report (leader-submitted)
 * POST /api/cell-reports/:id/weekly-reports
 */
export async function createWeeklyReport(cellId, payload) {
  const res = await fetch(`${API_URL}/api/cell-reports/${cellId}/weekly-reports`, {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to create weekly report');
}

/**
 * Record attendance (bulk)
 * POST /api/cell-reports/:id/attendance
 * payload: { meeting_date: 'YYYY-MM-DD', attendanceList: [{ member_id, status }] }
 */
export async function recordAttendance(cellId, payload) {
  const res = await fetch(`${API_URL}/api/cell-reports/${cellId}/attendance`, {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  return handleResponse(res, 'Failed to record attendance');
}

/**
 * Get attendance for meeting date
 * GET /api/cell-reports/:id/attendance/:date
 */
export async function getAttendanceByMeeting(cellId, date) {
  const res = await fetch(`${API_URL}/api/cell-reports/${cellId}/attendance/${encodeURIComponent(date)}`, {
    credentials: 'include'
  });
  return handleResponse(res, 'Failed to fetch attendance for meeting');
}

/**
 * Get latest absentees for cell
 * GET /api/cell-reports/:id/absentees/latest
 */
export async function getLatestAbsentees(cellId) {
  const res = await fetch(`${API_URL}/api/cell-reports/${cellId}/absentees/latest`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch latest absentees');
}

/**
 * Church-wide absentee summary
 * GET /api/cell-reports/reports/absentees
 */
export async function getAbsenteeSummary() {
  const res = await fetch(`${API_URL}/api/cell-reports/reports/absentees`, { credentials: 'include' });
  return handleResponse(res, 'Failed to fetch absentee summary');
}

/**
 * Health / 8-week summary endpoint (if you use it)
 * GET /api/cell/overview   (your existing overview endpoint)
 * Use existing services if present (getOverviewMetrics/getCellHealth etc)
 */
