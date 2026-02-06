/**
 * Dashboard API Service
 * Centralized API calls for dashboard data across all roles
 */

export const dashboardAPI = {
  // ==================== CELL LEADER ====================
  
  async getMyCellGroups(fetchWithAuth) {
    return fetchWithAuth('/api/cell-groups/my-cells');
  },

  async getCellMembers(cellGroupId, fetchWithAuth) {
    return fetchWithAuth(`/api/members/cell/${cellGroupId}`);
  },

  async getCellHealthScore(cellGroupId, fetchWithAuth) {
    return fetchWithAuth(`/api/cell-groups/${cellGroupId}/health`);
  },

  async getWeeklyReports(cellGroupId, fetchWithAuth) {
    return fetchWithAuth(`/api/weekly-reports/cell/${cellGroupId}`);
  },

  async createWeeklyReport(data, fetchWithAuth) {
    return fetchWithAuth('/api/weekly-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async recordAttendance(data, fetchWithAuth) {
    return fetchWithAuth('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async listContacts(cellGroupId, fetchWithAuth) {
    return fetchWithAuth(`/api/evangelism/${cellGroupId}/contacts`);
  },

  async getCellGiving(cellGroupId, fetchWithAuth) {
    return fetchWithAuth(`/api/giving/cell/${cellGroupId}`);
  },

  // ==================== MEMBER ====================

  async getMyMember(fetchWithAuth) {
    return fetchWithAuth('/api/members/me');
  },

  async getMemberBaptismStatus(memberId, fetchWithAuth) {
    return fetchWithAuth(`/api/baptism/candidates/${memberId}`);
  },

  async getMemberGiving(memberId, fetchWithAuth) {
    return fetchWithAuth(`/api/giving/member/${memberId}`);
  },

  async getLeadershipOpportunities(memberId, fetchWithAuth) {
    return fetchWithAuth(`/api/leadership/opportunities/${memberId}`);
  },

  async getUpcomingEvents(fetchWithAuth) {
    return fetchWithAuth('/api/events/upcoming');
  },

  async getCellAnnouncements(cellGroupId, fetchWithAuth) {
    return fetchWithAuth(`/api/announcements/cell/${cellGroupId}`);
  },

  async getMySpirtualJourney(memberId, fetchWithAuth) {
    return fetchWithAuth(`/api/spiritual-growth/member/${memberId}`);
  },

  // ==================== BIBLE TEACHER ====================

  async getMyTeachingSchedule(fetchWithAuth) {
    return fetchWithAuth('/api/bible-teaching/my-schedule');
  },

  async createTeachingSession(data, fetchWithAuth) {
    return fetchWithAuth('/api/bible-teaching', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getTeachingMaterials(fetchWithAuth) {
    return fetchWithAuth('/api/bible-teaching/materials');
  },

  async uploadTeachingMaterial(formData, fetchWithAuth) {
    return fetchWithAuth('/api/bible-teaching/materials', {
      method: 'POST',
      body: formData
    });
  },

  async getTeachingStats(fetchWithAuth) {
    return fetchWithAuth('/api/bible-teaching/stats');
  },

  async getAssignedCells(fetchWithAuth) {
    return fetchWithAuth('/api/bible-teaching/cells');
  },

  // ==================== PFCC LEADER ====================

  async getMyZone(fetchWithAuth) {
    return fetchWithAuth('/api/zones/my-zone');
  },

  async getZoneStats(zoneId, fetchWithAuth) {
    return fetchWithAuth(`/api/zones/${zoneId}/stats`);
  },

  async getZoneCells(zoneId, fetchWithAuth) {
    return fetchWithAuth(`/api/zones/${zoneId}/cells`);
  },

  async getAtRiskCells(zoneId, fetchWithAuth) {
    return fetchWithAuth(`/api/zones/${zoneId}/at-risk`);
  },

  async getCellDetail(cellGroupId, fetchWithAuth) {
    return fetchWithAuth(`/api/cell-groups/${cellGroupId}/detail`);
  },

  async getOverdueReports(zoneId, fetchWithAuth) {
    return fetchWithAuth(`/api/zones/${zoneId}/overdue-reports`);
  },

  async getZoneEvangelismMetrics(zoneId, fetchWithAuth) {
    return fetchWithAuth(`/api/zones/${zoneId}/evangelism`);
  },

  async getZoneLeadershipNeeds(zoneId, fetchWithAuth) {
    return fetchWithAuth(`/api/zones/${zoneId}/leadership-needs`);
  },

  async getZoneFoundationSchool(zoneId, fetchWithAuth) {
    return fetchWithAuth(`/api/zones/${zoneId}/foundation-school`);
  },

  // ==================== GENERAL ====================

  async getAnalyticsDashboard(fetchWithAuth) {
    return fetchWithAuth('/api/analytics/dashboard-metrics');
  },

  async getCrisisFollowups(fetchWithAuth) {
    return fetchWithAuth('/api/crisis-followups/my-list');
  },

  async createFollowupTask(data, fetchWithAuth) {
    return fetchWithAuth('/api/crisis-followups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  async getAbsenteeFollowups(fetchWithAuth) {
    return fetchWithAuth('/api/absentee-followup/my-list');
  },

  async getPrayerRequests(fetchWithAuth) {
    return fetchWithAuth('/api/prayers/open');
  },

  async recordPrayer(data, fetchWithAuth) {
    return fetchWithAuth('/api/prayers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
};

export default dashboardAPI;
