import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { LoginCredentials, LoginResult, User } from '../types';
import { queryClient } from './queryClient';

const authMeKey = ['auth', 'me'] as const;

export function useAuthApi() {
  const loginMutation = useMutation<LoginResult, Error, LoginCredentials>({
    mutationFn: (credentials) => apiClient.post<LoginResult>('/auth/login', credentials),
    retry: false,
    onSuccess: async ({ user }) => {
      queryClient.setQueryData(authMeKey, user);
    },
  });

  const me = () => queryClient.fetchQuery<User>({
    queryKey: authMeKey,
    queryFn: () => apiClient.get<User>('/auth/me'),
  });

  return { login: loginMutation.mutateAsync, me };
}
