import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import type { CampusHub, UpdateCampusRequest } from '../types';
import { mockCampuses } from '../../mocks/entities';
import { mergeMockCollection, readMockCollection } from '../../mocks/storage';
import { useApiMutation, useApiQuery } from './shared';

export const campusesQueryKey = ['campuses'] as const;

export function useCampusesApi(enabled = true) {
  const query = useApiQuery(
    campusesQueryKey,
    () => apiClient.get<CampusHub[]>('/campuses'),
    () => readMockCollection('campuses', mockCampuses),
    { enabled },
  );

  const updateMutation = useApiMutation<CampusHub, { id: string; request: UpdateCampusRequest }>(
    async ({ id, request }) => {
      if (!useMocks) return apiClient.put<CampusHub>(`/campuses/${id}`, request);
      const campuses = readMockCollection('campuses', mockCampuses);
      const updated = campuses.find((campus) => campus.id === id);
      if (!updated) throw new Error('The campus could not be found.');
      const result = { ...updated, ...request };
      mergeMockCollection('campuses', mockCampuses, campuses.map((campus) => campus.id === id ? result : campus));
      return result;
    },
    [campusesQueryKey],
  );

  const whitelistCurrentIpMutation = useApiMutation<CampusHub, string>(
    async (id) => {
      if (!useMocks) return apiClient.post<CampusHub>(`/campuses/${id}/whitelist/current-ip`);
      const campuses = readMockCollection('campuses', mockCampuses);
      const campus = campuses.find((item) => item.id === id);
      if (!campus) throw new Error('The campus could not be found.');
      const result = { ...campus, whitelistedCidrs: [...new Set([...campus.whitelistedCidrs, '127.0.0.1/32'])] };
      mergeMockCollection('campuses', mockCampuses, campuses.map((item) => item.id === id ? result : item));
      return result;
    },
    [campusesQueryKey],
  );

  const removeWhitelistMutation = useApiMutation<CampusHub, { id: string; cidr: string }>(
    async ({ id, cidr }) => {
      if (!useMocks) return apiClient.delete<CampusHub>(`/campuses/${id}/whitelist?cidr=${encodeURIComponent(cidr)}`);
      const campuses = readMockCollection('campuses', mockCampuses);
      const campus = campuses.find((item) => item.id === id);
      if (!campus) throw new Error('The campus could not be found.');
      const result = { ...campus, whitelistedCidrs: campus.whitelistedCidrs.filter((item) => item !== cidr) };
      mergeMockCollection('campuses', mockCampuses, campuses.map((item) => item.id === id ? result : item));
      return result;
    },
    [campusesQueryKey],
  );

  return {
    ...query,
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    update: (id: string, request: UpdateCampusRequest) => updateMutation.mutateAsync({ id, request }),
    whitelistCurrentIp: whitelistCurrentIpMutation.mutateAsync,
    removeWhitelist: (id: string, cidr: string) => removeWhitelistMutation.mutateAsync({ id, cidr }),
  };
}
