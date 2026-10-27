import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useMocks } from '../mockMode';
import { ApiError } from '../client';
import type { Page } from '../types';

export const apiQueryOptions = {
  retry: (failureCount: number, error: unknown) => {
    if (error instanceof ApiError && [400, 401, 403, 404, 409].includes(error.status)) return false;
    return failureCount < 1;
  },
};

export function useApiQuery<T>(
  queryKey: QueryKey,
  request: () => Promise<T>,
  mock: () => T,
  options: Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> = {},
) {
  return useQuery<T, Error>({
    queryKey,
    queryFn: () => useMocks ? mock() : request(),
    ...apiQueryOptions,
    ...options,
  });
}

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidates: QueryKey[],
) {
  const cache = useQueryClient();
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    retry: false,
    onSuccess: async () => {
      await Promise.all(invalidates.map((queryKey) => cache.invalidateQueries({ queryKey })));
    },
  });
}

export function pageFromContent<T>(content: T[], number = 0, size = content.length || 20): Page<T> {
  return {
    content,
    totalElements: content.length,
    totalPages: content.length ? 1 : 0,
    number,
    size,
  };
}

export function usePageApiQuery<T>(
  queryKey: QueryKey,
  request: () => Promise<Page<T>>,
  mock: () => T[],
  enabled = true,
) {
  const cache = useQueryClient();
  const query = useApiQuery(
    queryKey,
    request,
    () => pageFromContent(mock()),
    { enabled },
  );
  const page = query.data ?? pageFromContent<T>([]);
  return {
    ...query,
    page,
    data: page.content,
    loading: query.isLoading,
    refresh: async () => { await query.refetch(); },
    replaceData: (content: T[]) => cache.setQueryData(queryKey, pageFromContent(content, page.number, page.size)),
  };
}

export function queryString(parameters: object): string {
  const search = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      search.set(key, String(value));
    }
  });
  const serialized = search.toString();
  return serialized ? `?${serialized}` : '';
}

export function qualityResult(
  feedbackMessage: string,
  attempt = 1,
  flagged = false,
) {
  return {
    accepted: true,
    isValid: !flagged,
    feedbackMessage,
    attempt,
    flagged,
  };
}

export function unwrapPage<T>(value: Page<T> | T[]): Page<T> {
  return Array.isArray(value) ? pageFromContent(value) : value;
}
