import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import {
  WfhStatus,
  type CreateWfhRequest,
  type Page,
  type WfhActionResponse,
  type WfhDecision,
  type WfhRequest,
} from '../types';
import { mockUsers, mockWfhRequests } from '../../mocks/entities';
import { mergeMockCollection, readMockCollection } from '../../mocks/storage';
import { validateWfhAllowance } from '../../lib/wfhPolicy';
import { queryString, qualityResult, useApiMutation, useApiQuery, usePageApiQuery } from './shared';
import { queryClient } from './queryClient';

export interface WfhQueryParams {
  page?: number;
  size?: number;
  status?: WfhStatus;
  userId?: string;
  from?: string;
  to?: string;
}

export const wfhKeys = {
  root: ['wfh-requests'] as const,
  list: (scope: string, params: WfhQueryParams = {}) => ['wfh-requests', scope, params] as const,
  detail: (id: string) => ['wfh-requests', 'detail', id] as const,
};

const draftId = () => globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function makeCreateRequest(request: CreateWfhRequest | Omit<CreateWfhRequest, 'draftKey'>): CreateWfhRequest {
  return { ...request, draftKey: 'draftKey' in request && request.draftKey ? request.draftKey : draftId() };
}

export function useWfhRequestsApi(userId?: string, enabled = true, params: WfhQueryParams = {}) {
  const myRequests = Boolean(userId);
  const queryParams = { ...params, ...(userId ? { userId } : {}) };
  const key = wfhKeys.list(myRequests ? `me:${userId}` : 'all', queryParams);
  const query = usePageApiQuery<WfhRequest>(
    key,
    () => apiClient.get<Page<WfhRequest>>(
      `${myRequests ? '/wfh-requests/me' : '/wfh-requests'}${queryString(params)}`,
    ),
    () => {
      const all = readMockCollection('wfh-requests', mockWfhRequests).filter((request) =>
        (!userId || request.userId === userId)
        && (!params.status || request.status === params.status)
        && (!params.userId || request.userId === params.userId)
        && (!params.from || request.startDate >= params.from)
        && (!params.to || request.endDate <= params.to),
      );
      const start = (params.page ?? 0) * (params.size ?? 20);
      return all.slice(start, start + (params.size ?? (all.length || 20)));
    },
    enabled,
  );

  const createMutation = useApiMutation<WfhActionResponse, CreateWfhRequest | Omit<CreateWfhRequest, 'draftKey'>>(
    async (rawRequest) => {
      const request = makeCreateRequest(rawRequest);
      if (!useMocks) return apiClient.post<WfhActionResponse>('/wfh-requests', request);
      const all = readMockCollection('wfh-requests', mockWfhRequests);
      validateWfhAllowance(all.filter((item) => !userId || item.userId === userId), request);
      const user = mockUsers.find((item) => item.id === userId) ?? mockUsers[0];
      const created: WfhRequest = {
        ...request,
        id: `wfh-${Date.now()}`,
        userId: user.id,
        userName: user.fullName,
        status: WfhStatus.PENDING,
        reviewedByName: null,
        reviewedAt: null,
        reviewComment: null,
        aiQualityFlag: false,
        createdAt: new Date().toISOString(),
      };
      mergeMockCollection('wfh-requests', mockWfhRequests, [created, ...all]);
      return { request: created, quality: qualityResult('WFH request submitted.') };
    },
    [wfhKeys.root],
  );

  const cancelMutation = useApiMutation<WfhRequest, string>(
    async (id) => {
      if (!useMocks) return apiClient.patch<WfhRequest>(`/wfh-requests/${id}/cancel`);
      const all = readMockCollection('wfh-requests', mockWfhRequests);
      const item = all.find((request) => request.id === id);
      if (!item) throw new Error('The WFH request could not be found.');
      const updated = { ...item, status: WfhStatus.CANCELLED };
      mergeMockCollection('wfh-requests', mockWfhRequests, all.map((request) => request.id === id ? updated : request));
      return updated;
    },
    [wfhKeys.root],
  );

  const decisionMutation = useApiMutation<WfhRequest, { id: string; decision: WfhDecision }>(
    async ({ id, decision }) => {
      if (!useMocks) return apiClient.patch<WfhRequest>(`/wfh-requests/${id}/decision`, decision);
      const all = readMockCollection('wfh-requests', mockWfhRequests);
      const item = all.find((request) => request.id === id);
      if (!item) throw new Error('The WFH request could not be found.');
      const champion = mockUsers.find((user) => user.role === 'TECH_CHAMP');
      const updated = {
        ...item,
        status: decision.status,
        reviewComment: decision.reviewComment,
        reviewedByName: champion?.fullName ?? null,
        reviewedAt: new Date().toISOString(),
      };
      mergeMockCollection('wfh-requests', mockWfhRequests, all.map((request) => request.id === id ? updated : request));
      return updated;
    },
    [wfhKeys.root],
  );

  return {
    ...query,
    create: createMutation.mutateAsync,
    cancel: cancelMutation.mutateAsync,
    decide: (id: string, decision: WfhDecision) => decisionMutation.mutateAsync({ id, decision }),
    getById: (id: string) => queryClient.fetchQuery<WfhRequest | null>({
      queryKey: wfhKeys.detail(id),
      queryFn: () => useMocks
        ? Promise.resolve(readMockCollection('wfh-requests', mockWfhRequests).find((item) => item.id === id) ?? null)
        : apiClient.get<WfhRequest>(`/wfh-requests/${id}`),
    }),
  };
}
