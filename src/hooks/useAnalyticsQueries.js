import { useQuery } from '@tanstack/react-query';
import * as analyticsService from '../services/analyticsService';

// NOTE: pass fetchWithAuth from AuthContext into each hook.

// Cell health
export function useCellHealthQuery(fetchWithAuth, { weeks = 8 } = {}, options = {}) {
  return useQuery(['analytics', 'cellHealth', weeks], () => analyticsService.getCellHealthDashboard(fetchWithAuth, weeks), {
    enabled: Boolean(fetchWithAuth),
    staleTime: 1000 * 60,
    ...options
  });
}

// Consolidated monthly report
export function useConsolidatedReportQuery(fetchWithAuth, month, year, options = {}) {
  return useQuery(['analytics', 'consolidated', month, year], () => analyticsService.getConsolidatedReport(fetchWithAuth, month, year), {
    enabled: Boolean(fetchWithAuth) && Boolean(month) && Boolean(year),
    staleTime: 1000 * 60,
    ...options
  });
}

// Absentee trends
export function useAbsenteeTrendsQuery(fetchWithAuth, { weeks = 12 } = {}, options = {}) {
  return useQuery(['analytics', 'absentees', weeks], () => analyticsService.getAbsenteeTrends(fetchWithAuth, weeks), {
    enabled: Boolean(fetchWithAuth),
    staleTime: 1000 * 60,
    ...options
  });
}

// At-risk members
export function useAtRiskMembersQuery(fetchWithAuth, { weeks = 12, threshold = 3 } = {}, options = {}) {
  return useQuery(['analytics', 'atRisk', weeks, threshold], () => analyticsService.getAtRiskMembers(fetchWithAuth, weeks, threshold), {
    enabled: Boolean(fetchWithAuth),
    staleTime: 1000 * 60,
    ...options
  });
}