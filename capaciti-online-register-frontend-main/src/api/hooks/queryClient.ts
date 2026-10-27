import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../client';

const nonRetryableStatuses = new Set([400, 401, 403, 404, 409]);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof ApiError && nonRetryableStatuses.has(error.status)) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});

export function clearApiQueryCache(): void {
  queryClient.clear();
}
