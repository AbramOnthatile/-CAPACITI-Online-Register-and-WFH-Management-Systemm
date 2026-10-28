import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Notification } from '../types';
import { apiQueryOptions, useApiMutation } from './shared';

export interface AnnouncementRequest {
  title: string;
  message: string;
}

export interface AnnouncementResult {
  recipientCount: number;
}

export const notificationKeys = {
  mine: ['notifications', 'me'] as const,
};

// Live API only; AppContext keeps the mock-mode notification store.
export function useNotificationsApi(enabled: boolean) {
  const query = useQuery<Notification[], Error>({
    queryKey: notificationKeys.mine,
    queryFn: () => apiClient.get<Notification[]>('/notifications/me'),
    enabled,
    ...apiQueryOptions,
  });

  const markReadMutation = useApiMutation<Notification, string>(
    (id) => apiClient.patch<Notification>(`/notifications/${id}/read`),
    [notificationKeys.mine],
  );

  const announceMutation = useApiMutation<AnnouncementResult, AnnouncementRequest>(
    (request) => apiClient.post<AnnouncementResult>('/announcements', request),
    [],
  );

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refresh: async () => { await query.refetch(); },
    markRead: markReadMutation.mutateAsync,
    announce: announceMutation.mutateAsync,
  };
}
