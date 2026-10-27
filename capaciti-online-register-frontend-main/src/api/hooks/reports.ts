import { apiClient } from '../client';
import {
  type AttendanceSummaryDto,
  type OverviewReportDto,
  type WfhSummaryDto,
} from '../types';
import { useApiQuery } from './shared';

function reportDate(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date());
}

function emptyOverview(): OverviewReportDto {
  const date = reportDate();
  return {
    from: date,
    to: date,
    totalCandidates: 0,
    attendanceRatePercent: 0,
    onTimeRatePercent: 0,
    lateCount: 0,
    absentCount: 0,
    wfhDays: 0,
    pendingWfh: 0,
    approvedWfh: 0,
    rejectedWfh: 0,
    openTickets: 0,
    prolongedBlockers: 0,
    aiFlaggedSubmissions: 0,
  };
}

function emptyAttendanceSummary(): AttendanceSummaryDto {
  const date = reportDate();
  return {
    from: date,
    to: date,
    arrivalCounts: {},
    departureCounts: {},
    workModeCounts: {},
    trend: [],
    candidates: [],
  };
}

function emptyWfhSummary(): WfhSummaryDto {
  const date = reportDate();
  return {
    from: date,
    to: date,
    requestCounts: {},
    wfhAttendanceDays: 0,
    promptCompletion: [],
    ticketsOpened: 0,
    ticketsResolved: 0,
    prolongedBlockers: 0,
  };
}

export const reportKeys = {
  root: ['reports'] as const,
  overview: ['reports', 'overview'] as const,
  attendance: ['reports', 'attendance-summary'] as const,
  wfh: ['reports', 'wfh-summary'] as const,
};

export function useReportsApi(enabled = true) {
  const overview = useApiQuery<OverviewReportDto>(
    reportKeys.overview,
    () => apiClient.get<OverviewReportDto>('/reports/overview'),
    emptyOverview,
    { enabled },
  );
  const attendanceSummary = useApiQuery<AttendanceSummaryDto>(
    reportKeys.attendance,
    () => apiClient.get<AttendanceSummaryDto>('/reports/attendance-summary'),
    emptyAttendanceSummary,
    { enabled },
  );
  const wfhSummary = useApiQuery<WfhSummaryDto>(
    reportKeys.wfh,
    () => apiClient.get<WfhSummaryDto>('/reports/wfh-summary'),
    emptyWfhSummary,
    { enabled },
  );
  return {
    overview: { ...overview, loading: overview.isLoading, refresh: async () => { await overview.refetch(); } },
    attendanceSummary: { ...attendanceSummary, loading: attendanceSummary.isLoading, refresh: async () => { await attendanceSummary.refetch(); } },
    wfhSummary: { ...wfhSummary, loading: wfhSummary.isLoading, refresh: async () => { await wfhSummary.refetch(); } },
  };
}
