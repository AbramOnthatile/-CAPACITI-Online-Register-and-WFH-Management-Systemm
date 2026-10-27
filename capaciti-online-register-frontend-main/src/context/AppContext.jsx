import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
import { mockCheckinReviews, mockNotifications, mockTickets, mockUsers } from '../mocks/entities';
import { readMockCollection, writeMockValue } from '../mocks/storage';
import { useMocks } from '../api/mockMode';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isCandidate = user?.role === UserRole.CANDIDATE;
  const isChampion = user?.role === UserRole.TECH_CHAMP;
  const canLoadAttendance = Boolean(user) && (isCandidate || isChampion || useMocks);
  const canLoadRequests = Boolean(user) && (isCandidate || isChampion || useMocks);
  const usersApi = useUsersApi(isAdmin || (useMocks && Boolean(user)), { page: 0, size: 100 });
  const attendanceApi = useAttendanceApi(isCandidate ? user?.id : undefined, canLoadAttendance, { page: 0, size: 100 });
  const wfhApi = useWfhRequestsApi(isCandidate ? user?.id : undefined, canLoadRequests, { page: 0, size: 100 });
  const promptsApi = usePromptsApi(isCandidate, user?.id);
  const ticketsApi = useTicketsApi(isCandidate ? user?.id : undefined, canLoadRequests, { page: 0, size: 100 });
  const auditApi = useAuditApi(isAdmin, { page: 0, size: 100 });
  const campusesApi = useCampusesApi(isAdmin || useMocks);
  const dashboardApi = useDashboardApi(isCandidate ? UserRole.CANDIDATE : UserRole.TECH_CHAMP, isCandidate || isChampion);
  const reportsApi = useReportsApi(isAdmin || isChampion);
  const [notificationRecords, setNotificationRecords] = useState(() => readMockCollection('notifications', mockNotifications));
  const [notificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [checkinReviews, setCheckinReviews] = useState(() => readMockCollection('checkin-reviews', mockCheckinReviews));
  const notifications = isCandidate
    ? notificationRecords.filter((item) => !item.recipientId || item.recipientId === user.id)
    : [];

  useEffect(() => {
    if (!useMocks) return undefined;
    const syncMockData = (event) => {
      if (event.detail === 'notifications') setNotificationRecords(readMockCollection('notifications', mockNotifications));
      if (event.detail === 'checkin-reviews') setCheckinReviews(readMockCollection('checkin-reviews', mockCheckinReviews));
    };
    window.addEventListener('capaciti-demo:update', syncMockData);
    return () => window.removeEventListener('capaciti-demo:update', syncMockData);
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    if (!isCandidate) throw new Error('Only candidates can update their notification status.');
    if (!useMocks) throw new Error('Notifications are demo-only and cannot be changed in live mode.');
    const current = readMockCollection('notifications', mockNotifications);
    const notification = current.find((item) => item.id === id);
    if (!notification || (notification.recipientId && notification.recipientId !== user.id)) {
      throw new Error('The notification could not be found.');
    }
    const updated = current.map((item) => item.id === id ? { ...item, read: true } : item);
    writeMockValue('notifications', updated);
    setNotificationRecords(updated);
  }, [isCandidate, user?.id]);

  const createAnnouncement = useCallback(async ({ title, message }) => {
    if (!isChampion) throw new Error('Only Tech Champions can publish announcements.');
    if (!useMocks) throw new Error('Announcements are demo-only and cannot be published in live mode.');
    const candidates = mockUsers.filter((candidate) => candidate.role === UserRole.CANDIDATE && candidate.active);
    if (candidates.length === 0) throw new Error('There are no active candidates to receive this announcement.');

    const timestamp = new Date().toISOString();
    const current = readMockCollection('notifications', mockNotifications);
    const announcementNotifications = candidates.map((candidate, index) => ({
      id: `announcement-${Date.now()}-${index}`,
      recipientId: candidate.id,
      title,
      message,
      timestamp,
      type: 'Announcement',
      read: false,
    }));
    const updated = [...current, ...announcementNotifications];
    writeMockValue('notifications', updated);
    setNotificationRecords(updated);
    return candidates.length;
  }, [isChampion]);

  const saveCheckinFeedback = useCallback((id, feedbackComment) => {
    if (!useMocks) throw new Error('Check-in reviews are demo-only and cannot be updated in live mode.');
    const updated = checkinReviews.map((item) => item.id === id ? { ...item, feedbackComment } : item);
    if (!checkinReviews.some((item) => item.id === id)) throw new Error('The check-in review could not be found.');
    writeMockValue('checkin-reviews', updated);
    setCheckinReviews(updated);
  }, [checkinReviews]);

  const value = useMemo(() => ({
    users: isChampion && !useMocks ? readMockCollection('users', mockUsers) : usersApi.data,
    usersLoading: isChampion ? false : usersApi.loading,
    usersError: isChampion ? null : usersApi.error,
    createUser: usersApi.create,
    updateUser: usersApi.update,
    setUserActive: usersApi.setActive,
    attendance: attendanceApi.records.data,
    attendanceToday: attendanceApi.today.data,
    attendanceLoading: attendanceApi.records.loading || attendanceApi.today.loading,
    attendanceError: attendanceApi.records.error || attendanceApi.today.error,
    refreshAttendance: async () => {
      await Promise.all([attendanceApi.records.refresh(), attendanceApi.today.refresh()]);
    },
    clockIn: attendanceApi.clockIn,
    clockOut: attendanceApi.clockOut,
    startBreak: attendanceApi.startBreak,
    endBreak: attendanceApi.endBreak,
    wfh: wfhApi.data,
    wfhLoading: wfhApi.loading,
    wfhError: wfhApi.error,
    refreshWfh: wfhApi.refresh,
    addWFHRequest: wfhApi.create,
    cancelWFHRequest: wfhApi.cancel,
    updateWFHRequest: wfhApi.decide,
    prompts: promptsApi.today.data.prompts,
    promptServerTime: promptsApi.today.data.serverTime,
    activePrompts: promptsApi.active.data.prompts,
    activePromptServerTime: promptsApi.active.data.serverTime,
    promptsLoading: promptsApi.today.loading || promptsApi.active.loading,
    submitPrompt: promptsApi.submit,
    refreshPrompts: promptsApi.refresh,
    tickets: isAdmin && !useMocks ? readMockCollection('tickets', mockTickets) : ticketsApi.data,
    ticketsLoading: isAdmin ? false : ticketsApi.loading,
    ticketsError: isAdmin ? null : ticketsApi.error,
    createTicket: ticketsApi.create,
    resolveTicket: isAdmin && !useMocks
      ? async () => { throw new Error('Ticket resolution is demo-only for administrator accounts.'); }
      : ticketsApi.resolve,
    audit: auditApi.data,
    auditLoading: auditApi.loading,
    auditError: auditApi.error,
    campuses: campusesApi.data,
    campusesLoading: campusesApi.isLoading,
    campusesError: campusesApi.error,
    dashboard: dashboardApi.data,
    dashboardLoading: dashboardApi.loading,
    dashboardError: dashboardApi.error,
    promptsError: promptsApi.today.error || promptsApi.active.error,
    refreshDashboard: dashboardApi.refresh,
    refreshReports: async () => {
      await Promise.all([
        reportsApi.overview.refresh(),
        reportsApi.attendanceSummary.refresh(),
        reportsApi.wfhSummary.refresh(),
      ]);
    },
    refreshAudit: auditApi.refresh,
    refreshUsers: usersApi.refresh,
    refreshCampuses: campusesApi.refresh,
    refreshTickets: ticketsApi.refresh,
    reports: reportsApi.overview.data,
    reportsLoading: reportsApi.overview.isLoading || reportsApi.attendanceSummary.isLoading || reportsApi.wfhSummary.isLoading,
    attendanceSummary: reportsApi.attendanceSummary.data,
    wfhSummary: reportsApi.wfhSummary.data,
    reportsError: reportsApi.overview.error || reportsApi.attendanceSummary.error || reportsApi.wfhSummary.error,
    notifications,
    notificationsLoading,
    notificationsError,
    markNotificationRead,
    createAnnouncement,
    checkinReviews,
    saveCheckinFeedback,
    isDemoMode: useMocks,
  }), [isAdmin, isChampion, usersApi, attendanceApi, wfhApi, promptsApi, ticketsApi, auditApi, campusesApi, dashboardApi, reportsApi, notifications, notificationsLoading, notificationsError, checkinReviews, markNotificationRead, createAnnouncement, saveCheckinFeedback]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
