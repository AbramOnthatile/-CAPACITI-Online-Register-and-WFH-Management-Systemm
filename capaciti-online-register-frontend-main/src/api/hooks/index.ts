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
  type AttendanceBreak,
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
import type { MockCheckinReview } from '../../mocks/entities';
import {
  mockAttendance,
  mockAuditLogs,
  mockCampuses,
  mockCheckinReviews,
  mockPrompts,
  createMockPrompts,
  getSastDate,
  mockTickets,
  mockUsers,
  mockWfhRequests,
} from '../../mocks/entities';
import { mergeMockCollection, readMockCollection, writeMockValue } from '../../mocks/storage';
import { validateWfhAllowance } from '../../lib/wfhPolicy';

interface QueryState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  replaceData: (value: T) => void;
}

interface MockPersistence<T> {
  load: () => T;
  save: (value: T) => void;
}

function useQuery<T>(
  initialData: T,
  request: () => Promise<T>,
  enabled = true,
  resetKey?: string,
  persistence?: MockPersistence<T>,
): QueryState<T> {
  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;
  const requestRef = useRef(request);
  requestRef.current = request;
  const persistenceRef = useRef(persistence);
  persistenceRef.current = persistence;
  const [data, setData] = useState(() => useMocks && persistenceRef.current
    ? persistenceRef.current.load()
    : initialData);
  const [loading, setLoading] = useState(enabled && !useMocks);
  const [error, setError] = useState<Error | null>(null);
  const replaceData = useCallback((value: T) => {
    if (useMocks) persistenceRef.current?.save(value);
    setData(value);
  }, []);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (useMocks) {
      try {
        replaceData(persistenceRef.current?.load() ?? initialDataRef.current);
        setError(null);
      } catch (caught) {
        setError(caught instanceof Error ? caught : new Error('The saved demo data could not be loaded.'));
      } finally {
        setLoading(false);
      }
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
  }, [enabled, replaceData]);

  useEffect(() => {
    void refresh();
  }, [refresh, resetKey]);

  return { data, loading, error, refresh, replaceData };
}

export function useAuthApi() {
  const login = useCallback(async (credentials: LoginCredentials): Promise<LoginResult> => {
    const result = useMocks
      ? { token: 'demo-token', user: readMockCollection('users', mockUsers).find((user) => user.email === credentials.email) }
      : await apiClient.post<LoginResult>('/auth/login', credentials);
    if (!result.user) {
      throw new Error(useMocks ? 'No demo account exists for that email address.' : 'The login response did not include a user.');
    }
    if (useMocks && credentials.password !== 'Password123!') throw new Error('Invalid demo password.');
    if (!result.user.active) throw new Error('This account is inactive. Ask an administrator to reactivate it.');
    return { token: result.token, user: result.user };
  }, []);
  const me = useCallback(() => apiClient.get<User>('/auth/me'), []);
  return { login, me };
}

export function useUsersApi(enabled = true) {
  const persistence = {
    load: () => readMockCollection('users', mockUsers),
    save: (users: User[]) => mergeMockCollection('users', mockUsers, users),
  };
  const query = useQuery<User[]>(mockUsers, () => apiClient.get<User[]>('/users'), enabled, undefined, persistence);
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
  const persistence = {
    load: () => readMockCollection('campuses', mockCampuses),
    save: (campuses: CampusHub[]) => mergeMockCollection('campuses', mockCampuses, campuses),
  };
  const query = useQuery<CampusHub[]>(mockCampuses, () => apiClient.get<CampusHub[]>('/campuses'), true, undefined, persistence);
  const update = (id: string, campus: CampusHub) => useMocks
    ? Promise.resolve(query.replaceData(query.data.map((item) => item.id === id ? campus : item)))
    : apiClient.put<CampusHub>(`/campuses/${id}`, campus);
  const whitelistCurrentIp = (id: string) => {
    if (useMocks) {
      const campus = query.data.find((item) => item.id === id);
      if (!campus) return Promise.reject(new Error('The campus could not be found.'));
      return update(id, { ...campus, whitelistedCidrs: [...new Set([...campus.whitelistedCidrs, '127.0.0.1/32'])] });
    }
    return apiClient.post<void>(`/campuses/${id}/whitelist/current-ip`);
  };
  const removeWhitelist = (id: string, cidr: string) => {
    if (useMocks) {
      const campus = query.data.find((item) => item.id === id);
      if (!campus) return Promise.reject(new Error('The campus could not be found.'));
      return update(id, { ...campus, whitelistedCidrs: campus.whitelistedCidrs.filter((item) => item !== cidr) });
    }
    return apiClient.delete<void>(`/campuses/${id}/whitelist?cidr=${encodeURIComponent(cidr)}`);
  };
  return { ...query, update, whitelistCurrentIp, removeWhitelist };
}

export function useAttendanceApi(userId?: string, enabled = true) {
  const allAttendance = useMocks ? readMockCollection('attendance', mockAttendance) : mockAttendance;
  const todayDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date());
  const todayMock = allAttendance.find((record) =>
    record.attendanceDate === todayDate && (!userId || record.userId === userId),
  ) ?? null;
  const today = useQuery<AttendanceRecord | null>(
    todayMock,
    () => apiClient.get<AttendanceRecord | null>('/attendance/today'), enabled, userId,
  );
  const attendancePersistence = {
    load: () => readMockCollection('attendance', mockAttendance).filter((record) => !userId || record.userId === userId),
    save: (records: AttendanceRecord[]) => mergeMockCollection('attendance', mockAttendance, records),
  };
  const records = useQuery<AttendanceRecord[]>(
    mockAttendance.filter((record) => !userId || record.userId === userId),
    () => apiClient.get<AttendanceRecord[]>(userId ? '/attendance/me' : '/attendance'), enabled, userId,
    attendancePersistence,
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
    if (today.data.breaks?.some((item) => !item.endedAt)) throw new Error('End your active break before clocking out.');
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
  const updateBreaks = (breaks: AttendanceBreak[]) => {
    if (!useMocks) throw new Error('Break tracking is not available through the configured API.');
    if (!today.data?.clockInAt || today.data.clockOutAt) throw new Error('Clock in before recording a break.');
    const record = { ...today.data, breaks };
    today.replaceData(record);
    records.replaceData(records.data.map((item) => item.id === record.id ? record : item));
    return record;
  };
  const startBreak = (type: AttendanceBreak['type']) => {
    if (today.data?.breaks?.some((item) => !item.endedAt)) throw new Error('End your active break before starting another.');
    return updateBreaks([...(today.data?.breaks ?? []), { type, startedAt: new Date().toISOString(), endedAt: null }]);
  };
  const endBreak = () => {
    const breaks = today.data?.breaks ?? [];
    const activeIndex = breaks.findIndex((item) => !item.endedAt);
    if (activeIndex < 0) throw new Error('There is no active break to end.');
    return updateBreaks(breaks.map((item, index) => index === activeIndex ? { ...item, endedAt: new Date().toISOString() } : item));
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
  return { today, records, clockIn, clockOut, startBreak, endBreak, excuse, getById };
}

export function useWfhRequestsApi(userId?: string, enabled = true) {
  const path = userId ? '/wfh-requests/me' : '/wfh-requests';
  const persistence = {
    load: () => readMockCollection('wfh-requests', mockWfhRequests).filter((item) => !userId || item.userId === userId),
    save: (requests: WfhRequest[]) => mergeMockCollection('wfh-requests', mockWfhRequests, requests),
  };
  const query = useQuery<WfhRequest[]>(
    mockWfhRequests.filter((item) => !userId || item.userId === userId),
    () => apiClient.get<WfhRequest[]>(path), enabled, userId, persistence,
  );
  const create = async (request: Pick<WfhRequest, 'startDate' | 'endDate' | 'reason' | 'readiness'>) => {
    if (useMocks) {
      validateWfhAllowance(query.data, request);
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

export function usePromptsApi(enabled = true, userId?: string) {
  const storageKey = `prompts:${userId ?? 'demo'}`;
  const loadPrompts = () => {
    const saved = readMockCollection(storageKey, mockPrompts);
    return saved.every((prompt) => prompt.promptDate === getSastDate()) ? saved : createMockPrompts();
  };
  const persistence = {
    load: loadPrompts,
    save: (prompts: DailyPrompt[]) => mergeMockCollection(storageKey, mockPrompts, prompts),
  };
  const activePersistence = {
    load: () => loadPrompts().filter((prompt) => prompt.status === PromptStatus.ACTIVE),
    save: (prompts: DailyPrompt[]) => mergeMockCollection(storageKey, mockPrompts, prompts),
  };
  const collection = useQuery<PromptCollection>(
    { prompts: mockPrompts, serverTime: new Date().toISOString() },
    () => apiClient.get<PromptCollection>('/prompts/today'), enabled, userId,
    {
      load: () => ({ prompts: persistence.load(), serverTime: new Date().toISOString() }),
      save: (data) => persistence.save(data.prompts),
    },
  );
  const active = useQuery<PromptCollection>(
    { prompts: mockPrompts.filter((prompt) => prompt.status === PromptStatus.ACTIVE), serverTime: new Date().toISOString() },
    () => apiClient.get<PromptCollection>('/prompts/active'), enabled, userId,
    {
      load: () => ({ prompts: activePersistence.load(), serverTime: new Date().toISOString() }),
      save: (data) => activePersistence.save(data.prompts),
    },
  );
  const submit = async (id: string, submission: PromptSubmission): Promise<PromptSubmissionResult> => {
    if (useMocks) {
      const prompt = collection.data.prompts.find((item) => item.id === id);
      if (!prompt) throw new Error('The check-in prompt could not be found.');
      if (prompt.status !== PromptStatus.ACTIVE) throw new Error('This check-in is no longer accepting responses.');
      const result: PromptSubmissionResult = {
        id,
        status: PromptStatus.SUBMITTED,
        submittedAt: new Date().toISOString(),
        attemptCount: prompt.attemptCount + 1,
        aiQualityFlag: false,
        response: submission.response,
        quality: { accepted: true, isValid: true, feedbackMessage: 'Submission accepted.', attempt: 1, flagged: false },
      };
      collection.replaceData({
        ...collection.data,
        prompts: collection.data.prompts.map((prompt) => prompt.id === id
          ? { ...prompt, status: PromptStatus.SUBMITTED, submittedAt: result.submittedAt, attemptCount: result.attemptCount, response: submission.response }
          : prompt),
      });
      active.replaceData({
        ...active.data,
        prompts: active.data.prompts.filter((prompt) => prompt.id !== id),
      });
      const candidate = mockUsers.find((user) => user.id === userId) ?? mockUsers[0];
      const savedReviews = readMockCollection('checkin-reviews', mockCheckinReviews);
      const review: MockCheckinReview = {
        id: `review-${Date.now()}`,
        userName: candidate.fullName,
        stage: prompt.stage,
        promptDate: prompt.promptDate,
        response: submission.response,
        feedbackComment: '',
      };
      writeMockValue('checkin-reviews', [review, ...savedReviews]);
      return result;
    }
    const result = await apiClient.post<PromptSubmissionResult>(`/prompts/${id}/submit`, submission);
    await Promise.all([collection.refresh(), active.refresh()]);
    return result;
  };
  return { today: collection, active, submit };
}

export function useTicketsApi(userId?: string, enabled = true) {
  const persistence = {
    load: () => readMockCollection('tickets', mockTickets).filter((ticket) => !userId || ticket.userId === userId),
    save: (tickets: SupportTicket[]) => mergeMockCollection('tickets', mockTickets, tickets),
  };
  const query = useQuery<SupportTicket[]>(
    mockTickets.filter((ticket) => !userId || ticket.userId === userId),
    () => apiClient.get<SupportTicket[]>(userId ? '/tickets/me' : '/tickets'), enabled, userId, persistence,
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
  return useQuery<unknown>({ role, generatedAt: new Date().toISOString() }, () => apiClient.get<unknown>(path), enabled, role);
}

export function useReportsApi(enabled = true) {
  const overview = useQuery<unknown>(null, () => apiClient.get<unknown>('/reports/overview'), enabled);
  const attendanceSummary = useQuery<unknown>(null, () => apiClient.get<unknown>('/reports/attendance-summary'), enabled);
  const wfhSummary = useQuery<unknown>(null, () => apiClient.get<unknown>('/reports/wfh-summary'), enabled);
  return { overview, attendanceSummary, wfhSummary };
}

export function useAuditApi(enabled = true) {
  const persistence = {
    load: () => readMockCollection('audit', mockAuditLogs),
    save: (logs: AuditLog[]) => mergeMockCollection('audit', mockAuditLogs, logs),
  };
  return useQuery<AuditLog[]>(mockAuditLogs, () => apiClient.get<AuditLog[]>('/audit'), enabled, undefined, persistence);
}

export function useFilesApi() {
  return {
    getSignedUrl: (): Promise<unknown> => {
      if (useMocks) return Promise.reject(new Error('Signed file URLs are unavailable in mock mode.'));
      return apiClient.get<unknown>('/files/signed-url');
    },
  };
}
