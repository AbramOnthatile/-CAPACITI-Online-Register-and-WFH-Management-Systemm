import { createContext, useContext, useMemo } from 'react';
import { UserRole } from '../api/types';
import {
  useAttendanceApi,
  useAuditApi,
  useCampusesApi,
  useDashboardApi,
  usePromptsApi,
  useReportsApi,
  useTicketsApi,
  useUsersApi,
  useWfhRequestsApi,
} from '../api/hooks';
import { demoOnly } from '../mocks/demoOnly';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isCandidate = user?.role === UserRole.CANDIDATE;
  const isChampion = user?.role === UserRole.TECH_CHAMP;
  const usersApi = useUsersApi(isAdmin);
  const attendanceApi = useAttendanceApi(isCandidate ? user?.id : undefined, Boolean(user));
  const wfhApi = useWfhRequestsApi(isCandidate ? user?.id : undefined, Boolean(user));
  const promptsApi = usePromptsApi(isCandidate);
  const ticketsApi = useTicketsApi(isCandidate ? user?.id : undefined, Boolean(user));
  const auditApi = useAuditApi(isAdmin);
  const campusesApi = useCampusesApi();
  const dashboardApi = useDashboardApi(isCandidate ? UserRole.CANDIDATE : UserRole.TECH_CHAMP, isCandidate || isChampion);
  const reportsApi = useReportsApi(isAdmin || isChampion);

  const value = useMemo(() => ({
    users: usersApi.data,
    usersLoading: usersApi.loading,
    usersError: usersApi.error,
    createUser: usersApi.create,
    updateUser: usersApi.update,
    setUserActive: usersApi.setActive,
    attendance: attendanceApi.records.data,
    attendanceToday: attendanceApi.today.data,
    attendanceLoading: attendanceApi.records.loading || attendanceApi.today.loading,
    attendanceError: attendanceApi.records.error || attendanceApi.today.error,
    clockIn: attendanceApi.clockIn,
    clockOut: attendanceApi.clockOut,
    wfh: wfhApi.data,
    wfhLoading: wfhApi.loading,
    wfhError: wfhApi.error,
    addWFHRequest: wfhApi.create,
    cancelWFHRequest: wfhApi.cancel,
    updateWFHRequest: wfhApi.decide,
    prompts: promptsApi.today.data.prompts,
    promptServerTime: promptsApi.today.data.serverTime,
    activePrompts: promptsApi.active.data.prompts,
    submitPrompt: promptsApi.submit,
    tickets: ticketsApi.data,
    ticketsLoading: ticketsApi.loading,
    ticketsError: ticketsApi.error,
    createTicket: ticketsApi.create,
    resolveTicket: ticketsApi.resolve,
    audit: auditApi.data,
    auditLoading: auditApi.loading,
    auditError: auditApi.error,
    campuses: campusesApi.data,
    campusesError: campusesApi.error,
    dashboard: dashboardApi.data,
    dashboardLoading: dashboardApi.loading,
    dashboardError: dashboardApi.error,
    promptsError: promptsApi.today.error || promptsApi.active.error,
    reports: reportsApi.overview.data,
    attendanceSummary: reportsApi.attendanceSummary.data,
    wfhSummary: reportsApi.wfhSummary.data,
    reportsError: reportsApi.overview.error || reportsApi.attendanceSummary.error || reportsApi.wfhSummary.error,
    demoOnly,
  }), [usersApi, attendanceApi, wfhApi, promptsApi, ticketsApi, auditApi, campusesApi, dashboardApi, reportsApi]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
