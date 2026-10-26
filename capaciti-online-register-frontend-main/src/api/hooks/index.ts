import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import {
  ArrivalStatus,
  DepartureStatus,
  PromptStatus,
  TicketStatus,
  UserRole,
  WfhStatus,
  WorkMode,
  type AttendanceRecord,
  type AuditLog,
  type CampusHub,
  type DailyPrompt,
  type LoginCredentials,
  type LoginResult,
  type PromptCollection,
  type PromptSubmission,
  type PromptSubmissionResult,
  type SupportTicket,
  type TicketResolution,
  type User,
  type WfhDecision,
  type WfhRequest,
} from '../types';
import {
  mockAttendance,
  mockAuditLogs,
  mockCampuses,
  mockPrompts,
  mockTickets,
  mockUsers,
  mockWfhRequests,
} from '../../mocks/entities';

interface QueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  replaceData: (value: T) => void;
}

function useQuery<T>(initialData: T, request: () => Promise<T>, enabled = true, resetKey?: string): QueryState<T> {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;
  const requestRef = useRef(request);
  requestRef.current = request;
  const [data, replaceData] = useState(initialData);
  const [loading, setLoading] = useState(enabled && !useMocks);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (useMocks) {
      replaceData(initialDataRef.current);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      replaceData(await requestRef.current());
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('The request failed.'));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh, resetKey]);

  return { data, loading, error, refresh, replaceData };
}

export function useAuthApi() {
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    const result = useMocks
      ? { token: 'demo-token', user: mockUsers.find((user) => user.email === credentials.email) }
      : await apiClient.post<LoginResult>('/auth/login', credentials);
    if (!result.user) {
      throw new Error(useMocks ? 'No demo account exists for that email address.' : 'The login response did not include a user.');
    }
    if (useMocks && credentials.password !== 'Password123!') throw new Error('Invalid demo password.');
    return { token: result.token, user: result.user };
  }, []);
  const me = useCallback(() => apiClient.get<User>('/auth/me'), []);
  return { login, me };
}

export function useUsersApi(enabled = true) {
  const query = useQuery<User[]>(mockUsers, () => apiClient.get<User[]>('/users'), enabled);
  const create = async (user: Omit<User, 'id' | 'createdAt'>) => {
    if (useMocks) {
      const created: User = { ...user, id: `user-${Date.now()}`, createdAt: new Date().toISOString() };
      query.replaceData([created, ...query.data]);
      return created;
    }
    const created = await apiClient.post<User>('/users', user);
    await query.refresh();
    return created;
  };
  const update = async (id: string, updates: Partial<User>) => {
    if (useMocks) {
      query.replaceData(query.data.map((user) => user.id === id ? { ...user, ...updates } : user));
      return;
    }
    await apiClient.patch<User>(`/users/${id}`, updates);
    await query.refresh();
  };
  const setActive = async (id: string, active: boolean) => {
    if (useMocks) return update(id, { active });
    await apiClient.patch<User>(`/users/${id}/status`, { active });
    await query.refresh();
  };
  return { ...query, create, update, setActive };
}

export function useCampusesApi() {
  const query = useQuery<CampusHub[]>(mockCampuses, () => apiClient.get<CampusHub[]>('/campuses'));
  const update = (id: string, campus: CampusHub) => useMocks
    ? Promise.resolve(query.replaceData(query.data.map((item) => item.id === id ? campus : item)))
    : apiClient.put<CampusHub>(`/campuses/${id}`, campus);
  const whitelistCurrentIp = (id: string) => useMocks
    ? Promise.resolve()
    : apiClient.post<void>(`/campuses/${id}/whitelist/current-ip`);
  const removeWhitelist = (id: string, cidr: string) => useMocks
    ? Promise.resolve()
    : apiClient.delete<void>(`/campuses/${id}/whitelist?cidr=${encodeURIComponent(cidr)}`);
  return { ...query, update, whitelistCurrentIp, removeWhitelist };
}

export function useAttendanceApi(userId?: string, enabled = true) {
  const todayMock = mockAttendance.find((record) => !userId || record.userId === userId) ?? null;
  const today = useQuery<AttendanceRecord | null>(
    todayMock,
    () => apiClient.get<AttendanceRecord | null>('/attendance/today'), enabled, userId,
  );
  const records = useQuery<AttendanceRecord[]>(
    mockAttendance.filter((record) => !userId || record.userId === userId),
    () => apiClient.get<AttendanceRecord[]>(userId ? '/attendance/me' : '/attendance'), enabled, userId,
  );
  const clockIn = async (workMode: WorkMode, lateReason?: string) => {
    if (!useMocks) {
      const record = await apiClient.post<AttendanceRecord>('/attendance/clock-in', { workMode, lateReason });
      today.replaceData(record);
      await records.refresh();
      return record;
    }
    const user = mockUsers.find((item) => item.id === userId) ?? mockUsers[0];
    const timestamp = new Date().toISOString();
    const record: AttendanceRecord = {
      id: `attendance-${Date.now()}`,
      userId: user.id,
      userName: user.fullName,
      attendanceDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date(timestamp)),
      workMode,
      clockInAt: timestamp,
      clockOutAt: null,
      arrivalStatus: ArrivalStatus.ON_TIME,
      departureStatus: null,
      lateReason: lateReason ?? null,
      earlyClockoutReason: null,
      lateClockoutNote: null,
      deliverableLink: null,
      ipVerified: true,
      geoVerified: workMode === WorkMode.ON_SITE,
      distanceM: workMode === WorkMode.ON_SITE ? 24 : null,
      aiQualityFlag: false,
    };
    today.replaceData(record);
    records.replaceData([record, ...records.data]);
    return record;
  };
  const clockOut = async (notes?: { earlyClockoutReason?: string; lateClockoutNote?: string; deliverableLink?: string }) => {
    if (!useMocks) {
      const record = await apiClient.post<AttendanceRecord>('/attendance/clock-out', notes);
      today.replaceData(record);
      await records.refresh();
      return record;
    }
    if (!today.data) throw new Error('Clock in before clocking out.');
    const record: AttendanceRecord = {
      ...today.data,
      clockOutAt: new Date().toISOString(),
      departureStatus: DepartureStatus.ON_TIME,
      earlyClockoutReason: notes?.earlyClockoutReason ?? null,
      lateClockoutNote: notes?.lateClockoutNote ?? null,
      deliverableLink: notes?.deliverableLink ?? today.data.deliverableLink,
    };
    today.replaceData(record);
    records.replaceData(records.data.map((item) => item.id === record.id ? record : item));
    return record;
  };
  const excuse = async (id: string, reason: string) => {
    if (useMocks) {
      let updated: AttendanceRecord | null = null;
      records.replaceData(records.data.map((record) => {
        if (record.id !== id) return record;
        updated = { ...record, arrivalStatus: ArrivalStatus.LATE_EXCUSED, lateReason: reason };
        return updated;
      }));
      if (today.data?.id === id && updated) today.replaceData(updated);
      if (!updated) throw new Error('The attendance record could not be found.');
      return updated;
    }
    const updated = await apiClient.patch<AttendanceRecord>(`/attendance/${id}/excuse`, { reason });
    await records.refresh();
    if (today.data?.id === id) today.replaceData(updated);
    return updated;
  };
  const getById = (id: string) => useMocks
    ? Promise.resolve(records.data.find((record) => record.id === id) ?? null)
    : apiClient.get<AttendanceRecord>(`/attendance/${id}`);
  return { today, records, clockIn, clockOut, excuse, getById };
}

export function useWfhRequestsApi(userId?: string, enabled = true) {
  const path = userId ? '/wfh-requests/me' : '/wfh-requests';
  const query = useQuery<WfhRequest[]>(
    mockWfhRequests.filter((item) => !userId || item.userId === userId),
    () => apiClient.get<WfhRequest[]>(path), enabled, userId,
  );
  const create = async (request: Pick<WfhRequest, 'startDate' | 'endDate' | 'reason' | 'readiness'>) => {
    if (useMocks) {
      const created: WfhRequest = {
        ...request,
        id: `wfh-${Date.now()}`,
        userId: userId ?? mockUsers[0].id,
        userName: mockUsers.find((user) => user.id === userId)?.fullName ?? mockUsers[0].fullName,
        status: WfhStatus.PENDING,
        reviewedByName: null,
        reviewedAt: null,
        reviewComment: null,
        aiQualityFlag: false,
        createdAt: new Date().toISOString(),
      };
      query.replaceData([created, ...query.data]);
      return created;
    }
    const created = await apiClient.post<WfhRequest>('/wfh-requests', request);
    await query.refresh();
    return created;
  };
  const cancel = async (id: string) => {
    if (useMocks) {
      query.replaceData(query.data.map((item) => item.id === id ? { ...item, status: WfhStatus.CANCELLED } : item));
      return;
    }
    await apiClient.patch<WfhRequest>(`/wfh-requests/${id}/cancel`);
    await query.refresh();
  };
  const decide = async (id: string, decision: WfhDecision) => {
    if (useMocks) {
      query.replaceData(query.data.map((item) => item.id === id
        ? {
          ...item,
          status: decision.status,
          reviewedByName: mockUsers.find((user) => user.role === UserRole.TECH_CHAMP)?.fullName ?? null,
          reviewComment: decision.reviewComment,
          reviewedAt: new Date().toISOString(),
        }
        : item));
      return;
    }
    await apiClient.patch<WfhRequest>(`/wfh-requests/${id}/decision`, decision);
    await query.refresh();
  };
  const getById = (id: string) => useMocks
    ? Promise.resolve(query.data.find((item) => item.id === id) ?? null)
    : apiClient.get<WfhRequest>(`/wfh-requests/${id}`);
  return { ...query, create, cancel, decide, getById };
}

export function usePromptsApi(enabled = true) {
  const collection = useQuery<PromptCollection>(
    { prompts: mockPrompts, serverTime: '2026-10-23T09:00:00+02:00' },
    () => apiClient.get<PromptCollection>('/prompts/today'), enabled,
  );
  const active = useQuery<PromptCollection>(
    { prompts: mockPrompts.filter((prompt) => prompt.status === PromptStatus.ACTIVE), serverTime: '2026-10-23T09:00:00+02:00' },
    () => apiClient.get<PromptCollection>('/prompts/active'), enabled,
  );
  const submit = async (id: string, submission: PromptSubmission): Promise<PromptSubmissionResult> => {
    if (useMocks) {
      const result: PromptSubmissionResult = {
        id,
        status: PromptStatus.SUBMITTED,
        submittedAt: '2026-10-23T09:05:00+02:00',
        attemptCount: 1,
        aiQualityFlag: false,
        response: submission.response,
        quality: { accepted: true, isValid: true, feedbackMessage: 'Submission accepted.', attempt: 1, flagged: false },
      };
      collection.replaceData({
        ...collection.data,
        prompts: collection.data.prompts.map((prompt) => prompt.id === id
          ? { ...prompt, status: PromptStatus.SUBMITTED, submittedAt: result.submittedAt, response: submission.response }
          : prompt),
      });
      return result;
    }
    const result = await apiClient.post<PromptSubmissionResult>(`/prompts/${id}/submit`, submission);
    await Promise.all([collection.refresh(), active.refresh()]);
    return result;
  };
  return { today: collection, active, submit };
}

export function useTicketsApi(userId?: string, enabled = true) {
  const query = useQuery<SupportTicket[]>(
    mockTickets.filter((ticket) => !userId || ticket.userId === userId),
    () => apiClient.get<SupportTicket[]>(userId ? '/tickets/me' : '/tickets'), enabled, userId,
  );
  const create = async (ticket: Pick<SupportTicket, 'type' | 'workMode' | 'title' | 'description' | 'attachmentUrl'>) => {
    if (useMocks) {
      const created: SupportTicket = {
        ...ticket,
        id: `ticket-${Date.now()}`,
        userId: userId ?? mockUsers[0].id,
        userName: mockUsers.find((user) => user.id === userId)?.fullName ?? mockUsers[0].fullName,
        status: TicketStatus.OPEN,
        isProlonged: false,
        resolvedByName: null,
        resolvedAt: null,
        resolutionNote: null,
        aiQualityFlag: false,
        createdAt: new Date().toISOString(),
        ageMinutes: 0,
      };
      query.replaceData([created, ...query.data]);
      return created;
    }
    const created = await apiClient.post<SupportTicket>('/tickets', ticket);
    await query.refresh();
    return created;
  };
  const resolve = async (id: string, resolution: TicketResolution) => {
    if (useMocks) {
      query.replaceData(query.data.map((ticket) => ticket.id === id
        ? {
          ...ticket,
          status: TicketStatus.RESOLVED,
          resolvedByName: mockUsers.find((user) => user.role === UserRole.ADMIN)?.fullName ?? null,
          resolutionNote: resolution.resolutionNote,
          resolvedAt: new Date().toISOString(),
        }
        : ticket));
      return;
    }
    await apiClient.patch<SupportTicket>(`/tickets/${id}/resolve`, resolution);
    await query.refresh();
  };
  return { ...query, create, resolve };
}

export function useDashboardApi(role: UserRole.CANDIDATE | UserRole.TECH_CHAMP, enabled = true) {
  const path = role === UserRole.CANDIDATE ? '/dashboard/candidate' : '/dashboard/champion';
  return useQuery<unknown>(null, () => apiClient.get<unknown>(path), enabled, role);
}

export function useReportsApi(enabled = true) {
  const overview = useQuery<unknown>(null, () => apiClient.get<unknown>('/reports/overview'), enabled);
  const attendanceSummary = useQuery<unknown>(null, () => apiClient.get<unknown>('/reports/attendance-summary'), enabled);
  const wfhSummary = useQuery<unknown>(null, () => apiClient.get<unknown>('/reports/wfh-summary'), enabled);
  return { overview, attendanceSummary, wfhSummary };
}

export function useAuditApi(enabled = true) {
  return useQuery<AuditLog[]>(mockAuditLogs, () => apiClient.get<AuditLog[]>('/audit'), enabled);
}

export function useFilesApi() {
  return {
    getSignedUrl: (): Promise<unknown> => {
      if (useMocks) return Promise.reject(new Error('Signed file URLs are unavailable in mock mode.'));
      return apiClient.get<unknown>('/files/signed-url');
    },
  };
}
