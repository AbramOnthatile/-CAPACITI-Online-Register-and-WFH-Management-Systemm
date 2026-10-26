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
import { mockCheckinReviews, mockNotifications } from '../mocks/entities';
import { readMockCollection, writeMockValue } from '../mocks/storage';
import { useMocks } from '../api/mockMode';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN;
  const isCandidate = user?.role === UserRole.CANDIDATE;
  const isChampion = user?.role === UserRole.TECH_CHAMP;
  const usersApi = useUsersApi(isAdmin || (useMocks && Boolean(user)));
  const attendanceApi = useAttendanceApi(isCandidate ? user?.id : undefined, Boolean(user));
  const wfhApi = useWfhRequestsApi(isCandidate ? user?.id : undefined, Boolean(user));
  const promptsApi = usePromptsApi(isCandidate, user?.id);
  const ticketsApi = useTicketsApi(isCandidate ? user?.id : undefined, Boolean(user));
  const auditApi = useAuditApi(isAdmin);
  const campusesApi = useCampusesApi();
  const dashboardApi = useDashboardApi(isCandidate ? UserRole.CANDIDATE : UserRole.TECH_CHAMP, isCandidate || isChampion);
  const reportsApi = useReportsApi(isAdmin || isChampion);
  const [notificationRecords, setNotificationRecords] = useState(() => useMocks
    ? readMockCollection('notifications', mockNotifications)
    : []);
  const [notificationsLoading, setNotificationsLoading] = useState(isCandidate && !useMocks);
  const [notificationsError, setNotificationsError] = useState(null);
  const [checkinReviews, setCheckinReviews] = useState(() => readMockCollection('checkin-reviews', mockCheckinReviews));
  const notifications = isCandidate
    ? notificationRecords.filter((item) => !item.recipientId || item.recipientId === user.id)
    : [];

  useEffect(() => {
    if (!isCandidate || useMocks) {
      setNotificationsLoading(false);
      setNotificationsError(null);
      return undefined;
    }
    let active = true;
    setNotificationsLoading(true);
    apiClient.get('/notifications/me')
      .then((records) => {
        if (active) {
          setNotificationRecords(records);
          setNotificationsError(null);
        }
      })
      .catch((error) => {
        if (active) setNotificationsError(error instanceof Error ? error : new Error('Notifications could not be loaded.'));
      })
      .finally(() => {
        if (active) setNotificationsLoading(false);
      });
    return () => { active = false; };
  }, [isCandidate, user?.id]);

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
    if (!useMocks) {
      const updatedNotification = await apiClient.patch(`/notifications/${id}/read`);
      setNotificationRecords((current) => current.map((item) => item.id === id ? updatedNotification : item));
      return;
    }
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
    if (!useMocks) {
      const response = await apiClient.post('/announcements', { title, message });
      return response.recipientCount;
    }
    const candidates = usersApi.data.filter((candidate) => candidate.role === UserRole.CANDIDATE && candidate.active);
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
  }, [isChampion, usersApi.data]);

  const saveCheckinFeedback = useCallback((id, feedbackComment) => {
    const updated = checkinReviews.map((item) => item.id === id ? { ...item, feedbackComment } : item);
    if (!checkinReviews.some((item) => item.id === id)) throw new Error('The check-in review could not be found.');
    writeMockValue('checkin-reviews', updated);
    setCheckinReviews(updated);
  }, [checkinReviews]);

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
    startBreak: attendanceApi.startBreak,
    endBreak: attendanceApi.endBreak,
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
    notifications,
    notificationsLoading,
    notificationsError,
    markNotificationRead,
    createAnnouncement,
    checkinReviews,
    saveCheckinFeedback,
    isDemoMode: useMocks,
  }), [usersApi, attendanceApi, wfhApi, promptsApi, ticketsApi, auditApi, campusesApi, dashboardApi, reportsApi, notifications, notificationsLoading, notificationsError, checkinReviews, markNotificationRead, createAnnouncement, saveCheckinFeedback]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
