import { apiClient } from '../client';
import type { AuditLog, Page } from '../types';
import { mockAuditLogs } from '../../mocks/entities';
import { readMockCollection } from '../../mocks/storage';
import { queryString, usePageApiQuery } from './shared';

export interface AuditQueryParams {
  page?: number;
  size?: number;
  from?: string;
  to?: string;
  actorId?: string;
  targetType?: string;
}

export function useAuditApi(enabled = true, params: AuditQueryParams = {}) {
  const query = usePageApiQuery<AuditLog>(
    ['audit', params],
    () => apiClient.get<Page<AuditLog>>(`/audit${queryString(params)}`),
    () => {
      const all = readMockCollection('audit', mockAuditLogs);
      const start = (params.page ?? 0) * (params.size ?? 20);
      return all.slice(start, start + (params.size ?? (all.length || 20)));
    },
    enabled,
  );
  return query;
}
