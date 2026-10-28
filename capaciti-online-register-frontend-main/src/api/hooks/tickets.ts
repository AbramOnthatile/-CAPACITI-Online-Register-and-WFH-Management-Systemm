import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import {
  TicketStatus,
  UserRole,
  type CreateTicketRequest,
  type Page,
  type SupportTicket,
  type TicketActionResponse,
  type TicketResolution,
  type TicketType,
  type WorkMode,
} from '../types';
import { mockTickets, mockUsers } from '../../mocks/entities';
import { mergeMockCollection, readMockCollection } from '../../mocks/storage';
import { pageFromContent, queryString, qualityResult, useApiMutation, usePageApiQuery } from './shared';

export interface TicketsQueryParams {
  page?: number;
  size?: number;
  status?: TicketStatus;
  type?: TicketType;
  workMode?: WorkMode;
  prolonged?: boolean;
}

export const ticketKeys = {
  root: ['tickets'] as const,
  list: (scope: string, params: TicketsQueryParams = {}) => ['tickets', scope, params] as const,
};

const draftId = () => globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function makeCreateRequest(request: CreateTicketRequest | Omit<CreateTicketRequest, 'draftKey'>): CreateTicketRequest {
  return { ...request, draftKey: 'draftKey' in request && request.draftKey ? request.draftKey : draftId() };
}

export function useTicketsApi(userId?: string, enabled = true, params: TicketsQueryParams = {}) {
  const myTickets = Boolean(userId);
  const key = ticketKeys.list(myTickets ? `me:${userId}` : 'all', params);
  const query = usePageApiQuery<SupportTicket>(
    key,
    () => apiClient.get<Page<SupportTicket>>(
      `${myTickets ? '/tickets/me' : '/tickets'}${queryString(params)}`,
    ),
    () => {
      const all = readMockCollection('tickets', mockTickets).filter((ticket) =>
        (!userId || ticket.userId === userId)
        && (!params.status || ticket.status === params.status)
        && (!params.type || ticket.type === params.type)
        && (!params.workMode || ('workMode' in ticket && ticket.workMode === params.workMode))
        && (params.prolonged === undefined || ticket.isProlonged === params.prolonged),
      );
      const start = (params.page ?? 0) * (params.size ?? 20);
      return all.slice(start, start + (params.size ?? (all.length || 20)));
    },
    enabled,
  );

  const createMutation = useApiMutation<TicketActionResponse, CreateTicketRequest | Omit<CreateTicketRequest, 'draftKey'>>(
    async (rawRequest) => {
      const request = makeCreateRequest(rawRequest);
      if (!useMocks) return apiClient.post<TicketActionResponse>('/tickets', request);
      const all = readMockCollection('tickets', mockTickets);
      const user = mockUsers.find((item) => item.id === userId)
        ?? mockUsers.find((item) => item.role === UserRole.CANDIDATE)
        ?? mockUsers[0];
      const created: SupportTicket = {
        id: `ticket-${Date.now()}`,
        userId: user.id,
        userName: user.fullName,
        type: request.type,
        title: request.title,
        description: request.description,
        attachmentUrl: request.attachmentUrl,
        status: TicketStatus.OPEN,
        isProlonged: false,
        resolvedByName: null,
        resolvedAt: null,
        resolutionNote: null,
        aiQualityFlag: false,
        createdAt: new Date().toISOString(),
        ageMinutes: 0,
      };
      mergeMockCollection('tickets', mockTickets, [created, ...all]);
      return { ticket: created, quality: qualityResult('Support ticket submitted.') };
    },
    [ticketKeys.root],
  );

  const resolveMutation = useApiMutation<SupportTicket, { id: string; request: TicketResolution }>(
    async ({ id, request }) => {
      if (!useMocks) return apiClient.patch<SupportTicket>(`/tickets/${id}/resolve`, request);
      const all = readMockCollection('tickets', mockTickets);
      const ticket = all.find((item) => item.id === id);
      if (!ticket) throw new Error('The support ticket could not be found.');
      const admin = mockUsers.find((user) => user.role === UserRole.ADMIN);
      const updated = {
        ...ticket,
        status: TicketStatus.RESOLVED,
        resolvedByName: admin?.fullName ?? null,
        resolvedAt: new Date().toISOString(),
        resolutionNote: request.resolutionNote,
      };
      mergeMockCollection('tickets', mockTickets, all.map((item) => item.id === id ? updated : item));
      return updated;
    },
    [ticketKeys.root],
  );

  return {
    ...query,
    create: createMutation.mutateAsync,
    resolve: (id: string, request: TicketResolution) => resolveMutation.mutateAsync({ id, request }),
  };
}
