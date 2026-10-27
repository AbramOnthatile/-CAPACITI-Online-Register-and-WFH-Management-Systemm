import { ApiError, apiClient } from '../client';
import { useMocks } from '../mockMode';
import {
  PromptStatus,
  type DailyPrompt,
  type PromptCollection,
  type PromptSubmission,
  type PromptSubmissionResult,
} from '../types';
import { createMockPrompts, getSastDate, mockPrompts } from '../../mocks/entities';
import { mergeMockCollection, readMockCollection } from '../../mocks/storage';
import { qualityResult, useApiMutation, useApiQuery } from './shared';
import { queryClient } from './queryClient';

export const promptKeys = {
  root: ['prompts'] as const,
  today: (userId?: string) => ['prompts', 'today', userId ?? 'current'] as const,
  active: (userId?: string) => ['prompts', 'active', userId ?? 'current'] as const,
};

const draftId = () => globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2)}`;

function loadPrompts(userId?: string): DailyPrompt[] {
  const key = `prompts:${userId ?? 'demo'}`;
  const saved = readMockCollection(key, mockPrompts);
  return saved.every((prompt) => prompt.promptDate === getSastDate()) ? saved : createMockPrompts();
}

function collectionFrom(prompts: DailyPrompt[]): PromptCollection {
  return { serverTime: new Date().toISOString(), prompts };
}

export function usePromptsApi(enabled = true, userId?: string) {
  const todayKey = promptKeys.today(userId);
  const activeKey = promptKeys.active(userId);
  const pollingOptions = {
    refetchInterval: () => typeof document === 'undefined' || document.visibilityState === 'visible' ? 30_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  };
  const today = useApiQuery<PromptCollection>(
    todayKey,
    () => apiClient.get<PromptCollection>('/prompts/today'),
    () => collectionFrom(loadPrompts(userId)),
    { enabled, ...pollingOptions },
  );
  const active = useApiQuery<PromptCollection>(
    activeKey,
    () => apiClient.get<PromptCollection>('/prompts/active'),
    () => collectionFrom(loadPrompts(userId).filter((prompt) => prompt.status === PromptStatus.ACTIVE)),
    { enabled, ...pollingOptions },
  );

  const submitMutation = useApiMutation<PromptSubmissionResult, { id: string; submission: PromptSubmission }>(
    async ({ id, submission }) => {
      const request = { ...submission, draftKey: submission.draftKey || draftId() };
      if (!useMocks) return apiClient.post<PromptSubmissionResult>(`/prompts/${id}/submit`, request);
      const prompts = loadPrompts(userId);
      const prompt = prompts.find((item) => item.id === id);
      if (!prompt) throw new Error('The check-in prompt could not be found.');
      if (prompt.status !== PromptStatus.ACTIVE) throw new Error('This check-in is no longer accepting responses.');
      const attempt = prompt.attemptCount + 1;
      const submitted: DailyPrompt = {
        ...prompt,
        status: PromptStatus.SUBMITTED,
        submittedAt: new Date().toISOString(),
        attemptCount: attempt,
        response: request,
      };
      const updated = prompts.map((item) => item.id === id ? submitted : item);
      mergeMockCollection(`prompts:${userId ?? 'demo'}`, mockPrompts, updated);
      return {
        prompt: submitted,
        quality: qualityResult('Check-in submitted.', attempt),
      };
    },
    [promptKeys.root],
  );

  return {
    today: {
      data: today.data ?? collectionFrom([]),
      loading: today.isLoading,
      error: today.error,
      refresh: async () => { await today.refetch(); },
    },
    active: {
      data: active.data ?? collectionFrom([]),
      loading: active.isLoading,
      error: active.error,
      refresh: async () => { await active.refetch(); },
    },
    submit: async (id: string, submission: PromptSubmission) => {
      try {
        return await submitMutation.mutateAsync({ id, submission });
      } catch (error) {
        if (error instanceof ApiError && error.code === 'PROMPT_EXPIRED') {
          await queryClient.invalidateQueries({ queryKey: promptKeys.root });
        }
        throw error;
      }
    },
    refresh: async () => {
      await Promise.all([today.refetch(), active.refetch()]);
    },
  };
}

export async function getPromptCollection(kind: 'today' | 'active', userId?: string): Promise<PromptCollection> {
  const key = kind === 'today' ? promptKeys.today(userId) : promptKeys.active(userId);
  return queryClient.fetchQuery<PromptCollection>({
    queryKey: key,
    queryFn: () => useMocks
      ? Promise.resolve(collectionFrom(kind === 'today'
        ? loadPrompts(userId)
        : loadPrompts(userId).filter((prompt) => prompt.status === PromptStatus.ACTIVE)))
      : apiClient.get<PromptCollection>(`/prompts/${kind}`),
  });
}
