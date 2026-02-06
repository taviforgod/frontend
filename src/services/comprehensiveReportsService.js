/**
 * Comprehensive Reports Service
 * Handles API calls for advanced reporting across all CMMS modules.
 */

const API_BASE = process.env.REACT_APP_API_BASE || process.env.REACT_APP_API_URL || '';

function buildUrl(path) {
  if (path.startsWith('http')) return path;
  return `${API_BASE}${path}`;
}

// ---- Report Templates ---- //

export async function getReportTemplates(fetchWithAuth, params = {}) {
  const query = new URLSearchParams(params).toString();
  return await fetchWithAuth(buildUrl(`/api/comprehensive-reports/templates?${query}`));
}

export async function createReportTemplate(fetchWithAuth, templateData) {
  return await fetchWithAuth(buildUrl('/api/comprehensive-reports/templates'), {
    method: 'POST',
    body: JSON.stringify(templateData)
  });
}

// ---- Report Generation ---- //

export async function generateReport(fetchWithAuth, reportData) {
  return await fetchWithAuth(buildUrl('/api/comprehensive-reports/generate'), {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
}

export async function generateQuickReport(fetchWithAuth, reportData) {
  return await fetchWithAuth(buildUrl('/api/comprehensive-reports/generate-quick'), {
    method: 'POST',
    body: JSON.stringify(reportData)
  });
}

export async function generateScheduledReports(fetchWithAuth, churchId) {
  return await fetchWithAuth(buildUrl('/api/comprehensive-reports/generate-scheduled'), {
    method: 'POST',
    body: JSON.stringify({ church_id: churchId })
  });
}

// ---- Report Retrieval ---- //

export async function getGeneratedReports(fetchWithAuth, params = {}) {
  const query = new URLSearchParams(params).toString();
  return await fetchWithAuth(buildUrl(`/api/comprehensive-reports/reports?${query}`));
}

export async function getReportById(fetchWithAuth, reportId) {
  return await fetchWithAuth(buildUrl(`/api/comprehensive-reports/reports/${reportId}`));
}

// ---- Report Export ---- //

export async function exportReport(fetchWithAuth, reportId, format = 'json') {
  const response = await fetch(buildUrl(`/api/comprehensive-reports/reports/${reportId}/export?format=${format}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Export failed');
  }

  if (format === 'json') {
    return await response.json();
  } else {
    // For CSV and other formats, return blob
    return await response.blob();
  }
}

// ---- Analytics Dashboard ---- //

export async function getReportAnalytics(fetchWithAuth, churchId) {
  return await fetchWithAuth(buildUrl(`/api/comprehensive-reports/analytics/dashboard?church_id=${churchId}`));
}

// ---- Report Type Constants ---- //

export const REPORT_TYPES = {
  // Financial Reports
  GIVING_SUMMARY: 'giving_summary',
  GIVING_TRENDS: 'giving_trends',
  FINANCIAL_OVERVIEW: 'financial_overview',

  // Attendance & Growth Reports
  ATTENDANCE_REPORT: 'attendance_report',
  GROWTH_METRICS: 'growth_metrics',
  CELL_PERFORMANCE: 'cell_performance',

  // Ministry Health Reports
  CELL_HEALTH_ASSESSMENT: 'cell_health_assessment',
  MINISTRY_EFFECTIVENESS: 'ministry_effectiveness',
  HEALTH_TRENDS: 'health_trends',

  // Leadership Reports
  LEADERSHIP_PIPELINE: 'leadership_pipeline',
  LEADERSHIP_DEVELOPMENT: 'leadership_development',
  MULTIPLICATION_READINESS: 'multiplication_readiness',

  // Discipleship Reports
  FOUNDATION_SCHOOL_PROGRESS: 'foundation_school_progress',
  SPIRITUAL_GROWTH_TRACKING: 'spiritual_growth_tracking',
  BAPTISM_PREPARATION: 'baptism_preparation',

  // Crisis Care Reports
  CRISIS_CASE_SUMMARY: 'crisis_case_summary',
  CRISIS_INTERVENTION_OUTCOMES: 'crisis_intervention_outcomes',
  CRISIS_RESOURCE_UTILIZATION: 'crisis_resource_utilization',

  // Personal Growth Reports
  GROWTH_PLAN_PROGRESS: 'growth_plan_progress',
  BURNOUT_RISK_ASSESSMENT: 'burnout_risk_assessment',
  WELLNESS_TRACKING: 'wellness_tracking',

  // Relationship Reports
  CONFLICT_RESOLUTION: 'conflict_resolution',
  CELEBRATION_EVENTS: 'celebration_events',
  COMMUNITY_ENGAGEMENT: 'community_engagement',

  // Outreach Reports
  OUTREACH_EVENTS: 'outreach_events',
  EVANGELISM_IMPACT: 'evangelism_impact',
  BAPTISM_REGISTER: 'baptism_register',

  // Comprehensive Reports
  MONTHLY_MINISTRY_OVERVIEW: 'monthly_ministry_overview',
  QUARTERLY_CHURCH_REPORT: 'quarterly_church_report',
  ANNUAL_MINISTRY_REVIEW: 'annual_ministry_review'
};

export const REPORT_CATEGORIES = {
  FINANCIAL: 'Financial',
  ATTENDANCE: 'Attendance & Growth',
  MINISTRY_HEALTH: 'Ministry Health',
  LEADERSHIP: 'Leadership',
  DISCIPLESHIP: 'Discipleship',
  CRISIS_CARE: 'Crisis Care',
  PERSONAL_GROWTH: 'Personal Growth',
  RELATIONSHIPS: 'Relationships',
  OUTREACH: 'Outreach',
  COMPREHENSIVE: 'Comprehensive'
};

export const REPORT_TYPE_LABELS = {
  // Financial Reports
  [REPORT_TYPES.GIVING_SUMMARY]: 'Giving Summary',
  [REPORT_TYPES.GIVING_TRENDS]: 'Giving Trends',
  [REPORT_TYPES.FINANCIAL_OVERVIEW]: 'Financial Overview',

  // Attendance & Growth Reports
  [REPORT_TYPES.ATTENDANCE_REPORT]: 'Attendance Report',
  [REPORT_TYPES.GROWTH_METRICS]: 'Growth Metrics',
  [REPORT_TYPES.CELL_PERFORMANCE]: 'Cell Performance',

  // Ministry Health Reports
  [REPORT_TYPES.CELL_HEALTH_ASSESSMENT]: 'Cell Health Assessment',
  [REPORT_TYPES.MINISTRY_EFFECTIVENESS]: 'Ministry Effectiveness',
  [REPORT_TYPES.HEALTH_TRENDS]: 'Health Trends',

  // Leadership Reports
  [REPORT_TYPES.LEADERSHIP_PIPELINE]: 'Leadership Pipeline',
  [REPORT_TYPES.LEADERSHIP_DEVELOPMENT]: 'Leadership Development',
  [REPORT_TYPES.MULTIPLICATION_READINESS]: 'Multiplication Readiness',

  // Discipleship Reports
  [REPORT_TYPES.FOUNDATION_SCHOOL_PROGRESS]: 'Foundation School Progress',
  [REPORT_TYPES.SPIRITUAL_GROWTH_TRACKING]: 'Spiritual Growth Tracking',
  [REPORT_TYPES.BAPTISM_PREPARATION]: 'Baptism Preparation',

  // Crisis Care Reports
  [REPORT_TYPES.CRISIS_CASE_SUMMARY]: 'Crisis Case Summary',
  [REPORT_TYPES.CRISIS_INTERVENTION_OUTCOMES]: 'Crisis Intervention Outcomes',
  [REPORT_TYPES.CRISIS_RESOURCE_UTILIZATION]: 'Crisis Resource Utilization',

  // Personal Growth Reports
  [REPORT_TYPES.GROWTH_PLAN_PROGRESS]: 'Growth Plan Progress',
  [REPORT_TYPES.BURNOUT_RISK_ASSESSMENT]: 'Burnout Risk Assessment',
  [REPORT_TYPES.WELLNESS_TRACKING]: 'Wellness Tracking',

  // Relationship Reports
  [REPORT_TYPES.CONFLICT_RESOLUTION]: 'Conflict Resolution',
  [REPORT_TYPES.CELEBRATION_EVENTS]: 'Celebration Events',
  [REPORT_TYPES.COMMUNITY_ENGAGEMENT]: 'Community Engagement',

  // Outreach Reports
  [REPORT_TYPES.OUTREACH_EVENTS]: 'Outreach Events',
  [REPORT_TYPES.EVANGELISM_IMPACT]: 'Evangelism Impact',
  [REPORT_TYPES.BAPTISM_REGISTER]: 'Baptism Register',

  // Comprehensive Reports
  [REPORT_TYPES.MONTHLY_MINISTRY_OVERVIEW]: 'Monthly Ministry Overview',
  [REPORT_TYPES.QUARTERLY_CHURCH_REPORT]: 'Quarterly Church Report',
  [REPORT_TYPES.ANNUAL_MINISTRY_REVIEW]: 'Annual Ministry Review'
};

// ---- Utility Functions ---- //

export function getReportCategory(reportType) {
  const categoryMap = {
    [REPORT_TYPES.GIVING_SUMMARY]: REPORT_CATEGORIES.FINANCIAL,
    [REPORT_TYPES.GIVING_TRENDS]: REPORT_CATEGORIES.FINANCIAL,
    [REPORT_TYPES.FINANCIAL_OVERVIEW]: REPORT_CATEGORIES.FINANCIAL,

    [REPORT_TYPES.ATTENDANCE_REPORT]: REPORT_CATEGORIES.ATTENDANCE,
    [REPORT_TYPES.GROWTH_METRICS]: REPORT_CATEGORIES.ATTENDANCE,
    [REPORT_TYPES.CELL_PERFORMANCE]: REPORT_CATEGORIES.ATTENDANCE,

    [REPORT_TYPES.CELL_HEALTH_ASSESSMENT]: REPORT_CATEGORIES.MINISTRY_HEALTH,
    [REPORT_TYPES.MINISTRY_EFFECTIVENESS]: REPORT_CATEGORIES.MINISTRY_HEALTH,
    [REPORT_TYPES.HEALTH_TRENDS]: REPORT_CATEGORIES.MINISTRY_HEALTH,

    [REPORT_TYPES.LEADERSHIP_PIPELINE]: REPORT_CATEGORIES.LEADERSHIP,
    [REPORT_TYPES.LEADERSHIP_DEVELOPMENT]: REPORT_CATEGORIES.LEADERSHIP,
    [REPORT_TYPES.MULTIPLICATION_READINESS]: REPORT_CATEGORIES.LEADERSHIP,

    [REPORT_TYPES.FOUNDATION_SCHOOL_PROGRESS]: REPORT_CATEGORIES.DISCIPLESHIP,
    [REPORT_TYPES.SPIRITUAL_GROWTH_TRACKING]: REPORT_CATEGORIES.DISCIPLESHIP,
    [REPORT_TYPES.BAPTISM_PREPARATION]: REPORT_CATEGORIES.DISCIPLESHIP,

    [REPORT_TYPES.CRISIS_CASE_SUMMARY]: REPORT_CATEGORIES.CRISIS_CARE,
    [REPORT_TYPES.CRISIS_INTERVENTION_OUTCOMES]: REPORT_CATEGORIES.CRISIS_CARE,
    [REPORT_TYPES.CRISIS_RESOURCE_UTILIZATION]: REPORT_CATEGORIES.CRISIS_CARE,

    [REPORT_TYPES.GROWTH_PLAN_PROGRESS]: REPORT_CATEGORIES.PERSONAL_GROWTH,
    [REPORT_TYPES.BURNOUT_RISK_ASSESSMENT]: REPORT_CATEGORIES.PERSONAL_GROWTH,
    [REPORT_TYPES.WELLNESS_TRACKING]: REPORT_CATEGORIES.PERSONAL_GROWTH,

    [REPORT_TYPES.CONFLICT_RESOLUTION]: REPORT_CATEGORIES.RELATIONSHIPS,
    [REPORT_TYPES.CELEBRATION_EVENTS]: REPORT_CATEGORIES.RELATIONSHIPS,
    [REPORT_TYPES.COMMUNITY_ENGAGEMENT]: REPORT_CATEGORIES.RELATIONSHIPS,

    [REPORT_TYPES.OUTREACH_EVENTS]: REPORT_CATEGORIES.OUTREACH,
    [REPORT_TYPES.EVANGELISM_IMPACT]: REPORT_CATEGORIES.OUTREACH,
    [REPORT_TYPES.BAPTISM_REGISTER]: REPORT_CATEGORIES.OUTREACH,

    [REPORT_TYPES.MONTHLY_MINISTRY_OVERVIEW]: REPORT_CATEGORIES.COMPREHENSIVE,
    [REPORT_TYPES.QUARTERLY_CHURCH_REPORT]: REPORT_CATEGORIES.COMPREHENSIVE,
    [REPORT_TYPES.ANNUAL_MINISTRY_REVIEW]: REPORT_CATEGORIES.COMPREHENSIVE
  };

  return categoryMap[reportType] || REPORT_CATEGORIES.COMPREHENSIVE;
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
}

export function formatPercentage(value) {
  return `${(value || 0).toFixed(1)}%`;
}

export function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num || 0);
}

export function getTrendIcon(trend) {
  switch (trend) {
    case 'up': return '📈';
    case 'down': return '📉';
    default: return '➡️';
  }
}

export function getStatusColor(status) {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'info';
    case 'pending': return 'warning';
    case 'failed': return 'error';
    default: return 'default';
  }
}