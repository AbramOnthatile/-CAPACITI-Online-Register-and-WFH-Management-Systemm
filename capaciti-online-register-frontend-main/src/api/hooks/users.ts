import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import type {
  CreateUserRequest,
  Page,
  UpdateUserRequest,
  UpdateUserStatusRequest,
  User,
} from '../types';
import { mockUsers } from '../../mocks/entities';
import { mergeMockCollection, readMockCollection } from '../../mocks/storage';
import { pageFromContent, queryString, useApiMutation, usePageApiQuery } from './shared';

export interface UsersQueryParams {
  page?: number;
  size?: number;
  role?: User['role'];
  active?: boolean;
  text?: string;
}

export const usersQueryKey = (params: UsersQueryParams = {}) => ['users', params] as const;

export function useUsersApi(enabled = true, params: UsersQueryParams = {}) {
  const cache = useQueryClient();
  const key = usersQueryKey(params);
  const list = usePageApiQuery<User>(
    key,
    () => apiClient.get<Page<User>>(`/users${queryString(params)}`),
    () => {
      let users = readMockCollection('users', mockUsers);
      if (params.role) users = users.filter((user) => user.role === params.role);
      if (params.active !== undefined) users = users.filter((user) => user.active === params.active);
      if (params.text) users = users.filter((user) => `${user.fullName} ${user.email}`.toLowerCase().includes(params.text!.toLowerCase()));
      const start = (params.page ?? 0) * (params.size ?? 20);
      return users.slice(start, start + (params.size ?? (users.length || 20)));
    },
    enabled,
  );

  const createMutation = useApiMutation<User, CreateUserRequest>(
    async (request) => {
      if (!useMocks) return apiClient.post<User>('/users', request);
      const created: User = {
        id: `user-${Date.now()}`,
        email: request.email,
        fullName: request.fullName,
        role: request.role,
        defaultMode: request.defaultMode,
        campusId: request.campusId,
        campusName: null,
        championId: request.championId,
        active: true,
        createdAt: new Date().toISOString(),
      };
      mergeMockCollection('users', mockUsers, [created, ...readMockCollection('users', mockUsers)]);
      return created;
    },
    [['users']],
  );

  const updateMutation = useApiMutation<User, { id: string; request: UpdateUserRequest }>(
    async ({ id, request }) => {
      if (!useMocks) return apiClient.patch<User>(`/users/${id}`, request);
      const users = readMockCollection('users', mockUsers);
      const updated = users.map((user) => user.id === id ? { ...user, ...request } : user);
      mergeMockCollection('users', mockUsers, updated);
      const result = updated.find((user) => user.id === id);
      if (!result) throw new Error('The user could not be found.');
      return result;
    },
    [['users']],
  );

  const statusMutation = useApiMutation<User, { id: string; request: UpdateUserStatusRequest }>(
    async ({ id, request }) => {
      if (!useMocks) return apiClient.patch<User>(`/users/${id}/status`, request);
      const users = readMockCollection('users', mockUsers);
      const updated = users.find((user) => user.id === id);
      if (!updated) throw new Error('The user could not be found.');
      const result = { ...updated, active: request.active };
      mergeMockCollection('users', mockUsers, users.map((user) => user.id === id ? result : user));
      return result;
    },
    [['users']],
  );

  return {
    ...list,
    create: createMutation.mutateAsync,
    update: (id: string, request: UpdateUserRequest) => updateMutation.mutateAsync({ id, request }),
    setActive: (id: string, active: boolean) => statusMutation.mutateAsync({ id, request: { active } }),
    replaceData: (users: User[]) => {
      list.replaceData(users);
      cache.setQueryData(key, pageFromContent(users));
    },
  };
}
