// Absentee Follow-up Service
// Handles API calls for absentee follow-up management

const API_BASE = '/api/absentee-followups';

/**
 * Get absentee follow-ups with optional filters
 */
export const getAbsenteeFollowups = async (filters = {}) => {
  const queryParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      queryParams.append(key, value);
    }
  });

  const response = await fetch(`${API_BASE}?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch absentee follow-ups');
  }

  return response.json();
};

/**
 * Get a specific absentee follow-up by ID
 */
export const getAbsenteeFollowup = async (id) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch absentee follow-up');
  }

  return response.json();
};

/**
 * Create a new absentee follow-up
 */
export const createAbsenteeFollowup = async (followupData) => {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(followupData)
  });

  if (!response.ok) {
    throw new Error('Failed to create absentee follow-up');
  }

  return response.json();
};

/**
 * Update an absentee follow-up
 */
export const updateAbsenteeFollowup = async (id, updates) => {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update absentee follow-up');
  }

  return response.json();
};

/**
 * Assign a follow-up to a member
 */
export const assignFollowup = async (id, assignmentData) => {
  const response = await fetch(`${API_BASE}/${id}/assign`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(assignmentData)
  });

  if (!response.ok) {
    throw new Error('Failed to assign follow-up');
  }

  return response.json();
};

/**
 * Add a contact attempt to a follow-up
 */
export const addContactAttempt = async (id, attemptData) => {
  const response = await fetch(`${API_BASE}/${id}/contact-attempts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(attemptData)
  });

  if (!response.ok) {
    throw new Error('Failed to add contact attempt');
  }

  return response.json();
};

/**
 * Resolve a follow-up
 */
export const resolveFollowup = async (id, resolutionData) => {
  const response = await fetch(`${API_BASE}/${id}/resolve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resolutionData)
  });

  if (!response.ok) {
    throw new Error('Failed to resolve follow-up');
  }

  return response.json();
};

/**
 * Generate follow-ups from weekly report absentees
 */
export const generateFollowupsFromWeeklyReport = async (weeklyReportId) => {
  const response = await fetch(`${API_BASE}/generate-from-report`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ weekly_report_id: weeklyReportId })
  });

  if (!response.ok) {
    throw new Error('Failed to generate follow-ups from weekly report');
  }

  return response.json();
};

/**
 * Get follow-up statistics
 */
export const getFollowupStats = async () => {
  const response = await fetch(`${API_BASE}/stats/overview`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch follow-up statistics');
  }

  return response.json();
};

/**
 * Get overdue follow-ups
 */
export const getOverdueFollowups = async () => {
  const response = await fetch(`${API_BASE}/overdue/list`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch overdue follow-ups');
  }

  return response.json();
};