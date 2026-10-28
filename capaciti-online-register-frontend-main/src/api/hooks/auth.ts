import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import type { LoginCredentials, LoginResult, User } from '../types';
import { mockUsers } from '../../mocks/entities';
import { readMockCollection } from '../../mocks/storage';
import { queryClient } from './queryClient';

const authMeKey = ['auth', 'me'] as const;

export function useAuthApi() {
  const loginMutation = useMutation<LoginResult, Error, LoginCredentials>({
    mutationFn: async (credentials) => {
      if (!useMocks) return apiClient.post<LoginResult>('/auth/login', credentials);
      if (!credentials.password) throw new Error('Enter a password.');
      const user = readMockCollection('users', mockUsers).find((item) => item.email === credentials.email);
      if (!user) throw new Error('No demo account exists for that email address.');
      if (!user.active) throw new Error('This account is inactive. Ask an administrator to reactivate it.');
      return {
        token: 'demo-token',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        user,
      };
    },
    retry: false,
    onSuccess: async ({ user }) => {
      queryClient.setQueryData(authMeKey, user);
    },
  });

  const me = () => queryClient.fetchQuery<User>({
    queryKey: authMeKey,
    queryFn: () => useMocks
      ? Promise.resolve(readMockCollection('users', mockUsers)[0])
      : apiClient.get<User>('/auth/me'),
  });

  return { login: loginMutation.mutateAsync, me };
}
