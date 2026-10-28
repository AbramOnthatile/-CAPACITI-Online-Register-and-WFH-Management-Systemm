import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import {
  ArrivalStatus,
  DepartureStatus,
  UserRole,
  WorkMode,
  type AttendanceActionResponse,
  type AttendanceRecord,
  type ClockInRequest,
  type ClockOutRequest,
  type ExcuseRequest,
  type Page,
} from '../types';
import { mockAttendance, mockUsers } from '../../mocks/entities';
import { readMockCollection } from '../../mocks/storage';
import { queryClient } from './queryClient';
import {
  queryString,
  qualityResult,
  useApiMutation,
  useApiQuery,
  usePageApiQuery,
} from './shared';

export interface AttendanceQueryParams {
  page?: number;
  size?: number;
  userId?: string;
  from?: string;
  to?: string;
  workMode?: WorkMode;
  status?: ArrivalStatus | DepartureStatus;
}

export const attendanceKeys = {
  root: ['attendance'] as const,
  today: (userId?: string) => ['attendance', 'today', userId ?? 'current'] as const,
  list: (scope: string, params: AttendanceQueryParams = {}) => ['attendance', scope, params] as const,
  detail: (id: string) => ['attendance', 'detail', id] as const,
};

const draftId = () => globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function makeClockInRequest(value: ClockInRequest | WorkMode, lateReason?: string): ClockInRequest {
  return typeof value === 'string'
    ? { draftKey: draftId(), workMode: value, lateReason: lateReason ?? null, latitude: null, longitude: null, accuracyM: null }
    : value;
}

function makeClockOutRequest(value?: ClockOutRequest | Partial<Omit<ClockOutRequest, 'draftKey'>>): ClockOutRequest {
  const request: Partial<ClockOutRequest> = value ?? {};
  return {
    draftKey: request.draftKey || draftId(),
    earlyClockoutReason: request.earlyClockoutReason ?? null,
    lateClockoutNote: request.lateClockoutNote ?? null,
    deliverableLink: request.deliverableLink ?? null,
  };
}

function createMockAction(record: AttendanceRecord): AttendanceActionResponse {
  return { attendance: record, requiresReason: false, quality: qualityResult('Attendance saved.') };
}

export function useAttendanceApi(userId?: string, enabled = true, params: AttendanceQueryParams = {}) {
  const cache = useQueryClient();
  const scopedParams = { ...params, ...(userId ? { userId } : {}) };
  const todayKey = attendanceKeys.today(userId);
  const todayQuery = useApiQuery<AttendanceRecord | null>(
    todayKey,
    () => apiClient.get<AttendanceRecord | null>('/attendance/today'),
    () => {
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date());
      return readMockCollection('attendance', mockAttendance).find((record) =>
        record.attendanceDate === date && (!userId || record.userId === userId),
      ) ?? null;
    },
    { enabled: enabled && Boolean(userId) },
  );
  const records = usePageApiQuery<AttendanceRecord>(
    attendanceKeys.list(userId ? `me:${userId}` : 'all', scopedParams),
    () => apiClient.get<Page<AttendanceRecord>>(
      `${userId ? '/attendance/me' : '/attendance'}${queryString(params)}`,
    ),
    () => {
      const all = readMockCollection('attendance', mockAttendance).filter((record) =>
        (!userId || record.userId === userId)
        && (!params.workMode || record.workMode === params.workMode)
        && (!params.status || record.arrivalStatus === params.status || record.departureStatus === params.status)
        && (!params.from || record.attendanceDate >= params.from)
        && (!params.to || record.attendanceDate <= params.to),
      );
      const start = (params.page ?? 0) * (params.size ?? 20);
      return all.slice(start, start + (params.size ?? (all.length || 20)));
    },
    enabled,
  );
  const invalidate = [attendanceKeys.root, ['dashboard']];

  const clockInMutation = useApiMutation<AttendanceActionResponse, ClockInRequest>(
    async (request) => {
      if (!useMocks) return apiClient.post<AttendanceActionResponse>('/attendance/clock-in', request);
      const user = readMockCollection('users', mockUsers).find((entry) => entry.id === userId)
        ?? readMockCollection('users', mockUsers).find((entry) => entry.role === UserRole.CANDIDATE)
        ?? mockUsers[0];
      const timestamp = new Date().toISOString();
      const record: AttendanceRecord = {
        id: `attendance-${Date.now()}`,
        userId: user.id,
        userName: user.fullName,
        attendanceDate: new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date(timestamp)),
        workMode: request.workMode,
        clockInAt: timestamp,
        clockOutAt: null,
        arrivalStatus: ArrivalStatus.ON_TIME,
        departureStatus: null,
        lateReason: request.lateReason,
        earlyClockoutReason: null,
        lateClockoutNote: null,
        deliverableLink: null,
        ipVerified: true,
        geoVerified: request.workMode === WorkMode.ON_SITE,
        distanceM: request.workMode === WorkMode.ON_SITE ? 24 : null,
        aiQualityFlag: false,
      };
      return createMockAction(record);
    },
    invalidate,
  );

  const clockOutMutation = useApiMutation<AttendanceActionResponse, ClockOutRequest>(
    async (request) => {
      if (!useMocks) return apiClient.post<AttendanceActionResponse>('/attendance/clock-out', request);
      const current = todayQuery.data;
      if (!current) throw new Error('Clock in before clocking out.');
      const record: AttendanceRecord = {
        ...current,
        clockOutAt: new Date().toISOString(),
        departureStatus: DepartureStatus.ON_TIME,
        earlyClockoutReason: request.earlyClockoutReason,
        lateClockoutNote: request.lateClockoutNote,
        deliverableLink: request.deliverableLink,
      };
      return createMockAction(record);
    },
    invalidate,
  );

  const excuseMutation = useApiMutation<AttendanceRecord, { id: string; request: ExcuseRequest }>(
    async ({ id, request }) => {
      if (!useMocks) return apiClient.patch<AttendanceRecord>(`/attendance/${id}/excuse`, request);
      const recordsFromStorage = readMockCollection('attendance', mockAttendance);
      const current = recordsFromStorage.find((entry) => entry.id === id);
      if (!current) throw new Error('The attendance record could not be found.');
      return { ...current, arrivalStatus: ArrivalStatus.LATE_EXCUSED, lateReason: request.reason };
    },
    invalidate,
  );

  return {
    today: {
      data: todayQuery.data ?? null,
      loading: todayQuery.isLoading,
      error: todayQuery.error,
      refresh: async () => { await todayQuery.refetch(); },
      replaceData: (record: AttendanceRecord | null) => cache.setQueryData(todayKey, record),
    },
    records,
    clockIn: (value: ClockInRequest | WorkMode, lateReason?: string) =>
      clockInMutation.mutateAsync(makeClockInRequest(value, lateReason)),
    clockOut: (value?: ClockOutRequest | Omit<ClockOutRequest, 'draftKey'>) =>
      clockOutMutation.mutateAsync(makeClockOutRequest(value)),
    excuse: (id: string, reason: string) => excuseMutation.mutateAsync({ id, request: { reason } }),
    getById: (id: string) => queryClient.fetchQuery<AttendanceRecord | null>({
      queryKey: attendanceKeys.detail(id),
      queryFn: () => useMocks
        ? Promise.resolve(readMockCollection('attendance', mockAttendance).find((item) => item.id === id) ?? null)
        : apiClient.get<AttendanceRecord>(`/attendance/${id}`),
    }),
    startBreak: async () => { throw new Error('Break tracking is not included in the attendance API.'); },
    endBreak: async () => { throw new Error('Break tracking is not included in the attendance API.'); },
  };
}
