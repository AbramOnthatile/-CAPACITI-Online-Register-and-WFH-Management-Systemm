import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import { useMocks } from '../mockMode';
import {
  AssessmentStatus,
  type AssessmentDetailDto,
  type AssessmentSummaryDto,
  type AssessmentType,
  type CreateAssessmentRequest,
  type EntryRequest,
  type MyScorecardDto,
  type Page,
  type SaveEntriesRequest,
  type ScorecardEntryDto,
} from '../types';
import { mockAssessmentDetails } from '../../mocks/scorecards';
import { getMockMyScorecards } from '../../mocks/candidateScorecards';
import { readMockCollection, writeMockValue } from '../../mocks/storage';
import type { AssessmentDetailDto as UiAssessmentDetail, MyScorecardDto as UiMyScorecard, SaveEntriesRequest as UiSaveEntriesRequest } from '../scorecardTypes';
import { overallPercent } from '../../lib/scoring';
import { queryClient } from './queryClient';
import { queryString, useApiMutation, useApiQuery, usePageApiQuery } from './shared';

const storageKey = 'mentor-scorecards';

export interface AssessmentsQueryParams {
  page?: number;
  size?: number;
  type?: AssessmentType;
  status?: AssessmentStatus;
  from?: string;
  to?: string;
}

export const scorecardKeys = {
  root: ['assessments'] as const,
  list: (params: AssessmentsQueryParams = {}) => ['assessments', params] as const,
  detail: (id: string) => ['assessments', 'detail', id] as const,
  mine: (userId?: string) => ['scorecards', 'me', userId ?? 'current'] as const,
  myDetail: (userId: string | undefined, id: string) => ['scorecards', 'me', userId ?? 'current', id] as const,
};

function loadAssessments(): UiAssessmentDetail[] {
  return readMockCollection(storageKey, mockAssessmentDetails);
}

function summaryOf(assessment: UiAssessmentDetail): AssessmentSummaryDto {
  return {
    id: assessment.id,
    title: assessment.title,
    type: assessment.type,
    status: assessment.status,
    assessmentDate: assessment.assessmentDate,
    periodStart: assessment.periodStart ?? null,
    periodEnd: assessment.periodEnd ?? null,
    entryCount: assessment.entryCount,
    groupAveragePercent: assessment.groupAveragePercent,
    submittedAt: assessment.submittedAt,
  };
}

function detailOf(assessment: UiAssessmentDetail): AssessmentDetailDto {
  return {
    ...summaryOf(assessment),
    groupFeedback: assessment.groupFeedback ?? null,
    entries: assessment.entries.map((entry) => ({
      candidateId: entry.candidateId,
      candidateName: entry.candidateName,
      scores: entry.scores,
      overallPercent: entry.overallPercent,
      feedback: entry.feedback ?? null,
      feedbackStrengths: entry.feedbackStrengths ?? null,
      feedbackImprovements: entry.feedbackImprovements ?? null,
    })),
    attendanceSuggestions: assessment.attendanceSuggestions,
  };
}

function mappedScores(entry: ScorecardEntryDto): EntryRequest {
  return {
    candidateId: entry.candidateId,
    attendanceScore: entry.scores.attendance,
    communicationScore: entry.scores.communication,
    accountabilityScore: entry.scores.accountability,
    creativityScore: entry.scores.creativity,
    deliveryScore: entry.scores.delivery,
    techSkillsScore: entry.scores.techSkills,
    feedback: entry.feedback,
    feedbackStrengths: entry.feedbackStrengths,
    feedbackImprovements: entry.feedbackImprovements,
  };
}

function normalizeSaveRequest(request: SaveEntriesRequest | UiSaveEntriesRequest): SaveEntriesRequest {
  return {
    groupFeedback: request.groupFeedback,
    entries: request.entries.map((entry) => 'scores' in entry
      ? mappedScores(entry as ScorecardEntryDto)
      : entry),
  };
}

function updateGroupAverage(assessment: UiAssessmentDetail): UiAssessmentDetail {
  const percentages = assessment.entries
    .map((entry) => overallPercent(entry.scores))
    .filter((percent): percent is number => percent !== null);
  return {
    ...assessment,
    entryCount: assessment.entries.length,
    groupAveragePercent: percentages.length
      ? Math.round(percentages.reduce((total, percent) => total + percent, 0) / percentages.length)
      : null,
    entries: assessment.entries.map((entry) => ({ ...entry, overallPercent: overallPercent(entry.scores) })),
  };
}

function toUiScorecard(scorecard: MyScorecardDto): UiMyScorecard {
  return {
    ...scorecard,
    overallPercent: scorecard.overallPercent ?? 0,
    feedback: scorecard.feedback ?? '',
    feedbackStrengths: scorecard.feedbackStrengths ?? '',
    feedbackImprovements: scorecard.feedbackImprovements ?? '',
    groupFeedback: scorecard.groupFeedback ?? '',
  };
}

export function useScorecards(params: AssessmentsQueryParams = {}) {
  const cache = useQueryClient();
  const query = usePageApiQuery<AssessmentSummaryDto>(
    scorecardKeys.list(params),
    () => apiClient.get<Page<AssessmentSummaryDto>>(`/assessments${queryString(params)}`),
    () => {
      const all = loadAssessments().filter((assessment) =>
        (!params.type || assessment.type === params.type)
        && (!params.status || assessment.status === params.status)
        && (!params.from || assessment.assessmentDate >= params.from)
        && (!params.to || assessment.assessmentDate <= params.to),
      );
      const start = (params.page ?? 0) * (params.size ?? 20);
      return all.slice(start, start + (params.size ?? (all.length || 20))).map(summaryOf);
    },
  );

  const createMutation = useApiMutation<AssessmentDetailDto, CreateAssessmentRequest>(
    async (request) => {
      if (!useMocks) return apiClient.post<AssessmentDetailDto>('/assessments', request);
      const current = loadAssessments();
      const template = current[0];
      if (!template) throw new Error('No scorecard template is available.');
      const created: UiAssessmentDetail = {
        ...template,
        id: `assessment-${Date.now()}`,
        ...request,
        status: AssessmentStatus.DRAFT,
        entryCount: template.entries.length,
        groupAveragePercent: null,
        submittedAt: null,
        groupFeedback: '',
        entries: template.entries.map((entry) => ({
          ...entry,
          scores: {
            attendance: null,
            communication: null,
            accountability: null,
            creativity: null,
            delivery: null,
            techSkills: null,
          },
          overallPercent: null,
          feedback: '',
          feedbackStrengths: '',
          feedbackImprovements: '',
        })),
      };
      writeMockValue(storageKey, [created, ...current]);
      return detailOf(created);
    },
    [scorecardKeys.root],
  );

  const saveMutation = useApiMutation<AssessmentDetailDto, { id: string; request: SaveEntriesRequest | UiSaveEntriesRequest }>(
    async ({ id, request: rawRequest }) => {
      const request = normalizeSaveRequest(rawRequest);
      if (!useMocks) return apiClient.put<AssessmentDetailDto>(`/assessments/${id}/entries`, request);
      const current = loadAssessments();
      const index = current.findIndex((assessment) => assessment.id === id);
      if (index < 0) throw new Error('Scorecard not found.');
      if (current[index].status === AssessmentStatus.SUBMITTED) throw new Error('Submitted scorecards are read-only. Reopen it before editing.');
      const byId = new Map(request.entries.map((entry) => [entry.candidateId, entry]));
      const updatedEntries = current[index].entries.map((entry) => {
        const saved = byId.get(entry.candidateId);
        if (!saved) return entry;
        return {
          ...entry,
          scores: {
            attendance: saved.attendanceScore,
            communication: saved.communicationScore,
            accountability: saved.accountabilityScore,
            creativity: saved.creativityScore,
            delivery: saved.deliveryScore,
            techSkills: saved.techSkillsScore,
          },
          feedback: saved.feedback ?? '',
          feedbackStrengths: saved.feedbackStrengths ?? '',
          feedbackImprovements: saved.feedbackImprovements ?? '',
        };
      });
      current[index] = updateGroupAverage({ ...current[index], entries: updatedEntries, groupFeedback: request.groupFeedback ?? '' });
      writeMockValue(storageKey, current);
      return detailOf(current[index]);
    },
    [scorecardKeys.root],
  );

  const statusMutation = useApiMutation<AssessmentDetailDto, { id: string; action: 'submit' | 'reopen' }>(
    async ({ id, action }) => {
      if (!useMocks) {
        const suffix = action === 'submit' ? 'submit' : 'reopen';
        return apiClient.post<AssessmentDetailDto>(`/assessments/${id}/${suffix}`);
      }
      const current = loadAssessments();
      const index = current.findIndex((assessment) => assessment.id === id);
      if (index < 0) throw new Error('Scorecard not found.');
      current[index] = updateGroupAverage({
        ...current[index],
        status: action === 'submit' ? AssessmentStatus.SUBMITTED : AssessmentStatus.DRAFT,
        submittedAt: action === 'submit' ? new Date().toISOString() : null,
      });
      writeMockValue(storageKey, current);
      return detailOf(current[index]);
    },
    [scorecardKeys.root],
  );

  const deleteMutation = useApiMutation<void, string>(
    async (id) => {
      if (!useMocks) return apiClient.delete<void>(`/assessments/${id}`);
      const current = loadAssessments();
      const assessment = current.find((item) => item.id === id);
      if (!assessment) throw new Error('Scorecard not found.');
      if (assessment.status !== AssessmentStatus.DRAFT) throw new Error('Only draft scorecards can be deleted.');
      writeMockValue(storageKey, current.filter((item) => item.id !== id));
    },
    [scorecardKeys.root],
  );

  return {
    ...query,
    assessments: query.data,
    loading: query.isLoading,
    error: query.error,
    refresh: async () => { await query.refetch(); },
    getAssessment: (id: string) => queryClient.fetchQuery<AssessmentDetailDto>({
      queryKey: scorecardKeys.detail(id),
      queryFn: async () => {
        if (!useMocks) return apiClient.get<AssessmentDetailDto>(`/assessments/${id}`);
        const assessment = loadAssessments().find((item) => item.id === id);
        if (!assessment) throw new Error('Scorecard not found.');
        return detailOf(assessment);
      },
    }),
    createAssessment: createMutation.mutateAsync,
    saveAssessment: (id: string, request: SaveEntriesRequest | UiSaveEntriesRequest) => saveMutation.mutateAsync({ id, request }),
    setAssessmentStatus: (id: string, action: 'submit' | 'reopen') => statusMutation.mutateAsync({ id, action }),
    deleteAssessment: deleteMutation.mutateAsync,
    replaceData: (assessments: AssessmentSummaryDto[]) => {
      cache.setQueryData(scorecardKeys.list(params), {
        content: assessments,
        totalElements: assessments.length,
        totalPages: assessments.length ? 1 : 0,
        number: params.page ?? 0,
        size: params.size ?? (assessments.length || 20),
      });
    },
  };
}

export function useMyScorecardsQuery(candidateId?: string) {
  return useApiQuery<UiMyScorecard[]>(
    scorecardKeys.mine(candidateId),
    async () => (await apiClient.get<MyScorecardDto[]>('/scorecards/me')).map(toUiScorecard),
    () => getMockMyScorecards(candidateId),
    { enabled: Boolean(candidateId) },
  );
}

export function useMyScorecardQuery(candidateId: string | undefined, assessmentId?: string) {
  return useApiQuery<UiMyScorecard>(
    scorecardKeys.myDetail(candidateId, assessmentId ?? ''),
    async () => toUiScorecard(await apiClient.get<MyScorecardDto>(`/scorecards/${assessmentId}`)),
    () => {
      const scorecard = getMockMyScorecards(candidateId).find((item) => item.assessmentId === assessmentId);
      if (!scorecard) throw new Error('Scorecard not found.');
      return scorecard;
    },
    { enabled: Boolean(candidateId && assessmentId) },
  );
}

export function getMyScorecards(candidateId?: string): Promise<UiMyScorecard[]> {
  return queryClient.fetchQuery<UiMyScorecard[]>({
    queryKey: scorecardKeys.mine(candidateId),
    queryFn: async () => useMocks
      ? getMockMyScorecards(candidateId)
      : (await apiClient.get<MyScorecardDto[]>('/scorecards/me')).map(toUiScorecard),
  });
}

export function getMyScorecard(candidateId: string | undefined, assessmentId: string): Promise<UiMyScorecard> {
  return queryClient.fetchQuery<UiMyScorecard>({
    queryKey: scorecardKeys.myDetail(candidateId, assessmentId),
    queryFn: async () => {
      if (useMocks) {
        const result = getMockMyScorecards(candidateId).find((item) => item.assessmentId === assessmentId);
        if (!result) throw new Error('Scorecard not found.');
        return result;
      }
      return toUiScorecard(await apiClient.get<MyScorecardDto>(`/scorecards/${assessmentId}`));
    },
  });
}
