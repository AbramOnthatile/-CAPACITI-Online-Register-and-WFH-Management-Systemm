export { useAuthApi } from './auth';
export { useUsersApi, usersQueryKey, type UsersQueryParams } from './users';
export { useCampusesApi, campusesQueryKey } from './campuses';
export { useAttendanceApi, attendanceKeys, type AttendanceQueryParams } from './attendance';
export { useWfhRequestsApi, wfhKeys, type WfhQueryParams } from './wfh';
export { usePromptsApi, usePromptReviewsApi, promptKeys, getPromptCollection } from './prompts';
export { useTicketsApi, ticketKeys, type TicketsQueryParams } from './tickets';
export { useNotificationsApi, notificationKeys } from './notifications';
export { useDashboardApi, dashboardKeys } from './dashboard';
export { useReportsApi, reportKeys } from './reports';
export { useAuditApi, type AuditQueryParams } from './audit';
export { useFilesApi, signedUrlKey } from './files';
export {
  useScorecards,
  getMyScorecards,
  getMyScorecard,
  useMyScorecardsQuery,
  useMyScorecardQuery,
  scorecardKeys,
  type AssessmentsQueryParams,
} from './scorecards';
export { queryClient, clearApiQueryCache } from './queryClient';
