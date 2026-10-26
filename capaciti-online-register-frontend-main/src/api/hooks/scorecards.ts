import { useCallback, useEffect, useState } from 'react';
import type {
  AssessmentDetailDto,
  AssessmentSummaryDto,
  AssessmentType,
  MyScorecardDto,
  SaveEntriesRequest,
} from '../scorecardTypes';
import { mockAssessmentDetails } from '../../mocks/scorecards';
import { getMockMyScorecards } from '../../mocks/candidateScorecards';
import { readMockCollection, writeMockValue } from '../../mocks/storage';
import { overallPercent } from '../../lib/scoring';

const storageKey = 'mentor-scorecards';

function loadMockAssessments(): AssessmentDetailDto[] {
  return readMockCollection(storageKey, mockAssessmentDetails);
}

function updateGroupAverage(assessment: AssessmentDetailDto): AssessmentDetailDto {
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

export function useScorecards() {
  const [data, setData] = useState<AssessmentSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(loadMockAssessments());
    } catch (caught) {
      setError(caught instanceof Error ? caught : new Error('Scorecards could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const sync = (event: CustomEvent<string>) => {
      if (event.detail === storageKey) void refresh();
    };
    window.addEventListener('capaciti-demo:update', sync as EventListener);
    return () => window.removeEventListener('capaciti-demo:update', sync as EventListener);
  }, [refresh]);

  const getAssessment = useCallback(async (id: string) => {
    const assessment = loadMockAssessments().find((item) => item.id === id);
    if (!assessment) throw new Error('Scorecard not found.');
    return assessment;
  }, []);

  const createAssessment = useCallback(async (input: {
    title: string;
    type: AssessmentType;
    assessmentDate: string;
    periodStart: string;
    periodEnd: string;
  }) => {
    const template = loadMockAssessments()[0];
    const created: AssessmentDetailDto = {
      id: `assessment-${Date.now()}`,
      ...input,
      status: 'DRAFT',
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
      attendanceSuggestions: template.attendanceSuggestions.map((suggestion) => ({ ...suggestion })),
    };
    const updated = [created, ...loadMockAssessments()];
    writeMockValue(storageKey, updated);
    setData(updated);
    return created;
  }, [refresh]);

  const saveAssessment = useCallback(async (id: string, request: SaveEntriesRequest) => {
    const current = loadMockAssessments();
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Scorecard not found.');
    if (current[index].status === 'SUBMITTED') throw new Error('Submitted scorecards are read-only. Reopen it before editing.');
    current[index] = updateGroupAverage({ ...current[index], ...request });
    writeMockValue(storageKey, current);
    setData(current);
    return current[index];
  }, [refresh]);

  const setAssessmentStatus = useCallback(async (id: string, action: 'submit' | 'reopen') => {
    const current = loadMockAssessments();
    const index = current.findIndex((item) => item.id === id);
    if (index === -1) throw new Error('Scorecard not found.');
    const updated = updateGroupAverage(current[index]);
    updated.status = action === 'submit' ? 'SUBMITTED' : 'DRAFT';
    updated.submittedAt = action === 'submit' ? new Date().toISOString() : null;
    current[index] = updated;
    writeMockValue(storageKey, current);
    setData(current);
    return updated;
  }, [refresh]);

  const deleteAssessment = useCallback(async (id: string) => {
    const current = loadMockAssessments();
    const assessment = current.find((item) => item.id === id);
    if (!assessment) throw new Error('Scorecard not found.');
    if (assessment.status !== 'DRAFT') throw new Error('Only draft scorecards can be deleted.');
    const updated = current.filter((item) => item.id !== id);
    writeMockValue(storageKey, updated);
    setData(updated);
  }, [refresh]);

  return { assessments: data, loading, error, refresh, getAssessment, createAssessment, saveAssessment, setAssessmentStatus, deleteAssessment };
}

export async function getMyScorecards(candidateId: string | undefined): Promise<MyScorecardDto[]> {
  return getMockMyScorecards(candidateId);
}

export async function getMyScorecard(
  candidateId: string | undefined,
  assessmentId: string,
): Promise<MyScorecardDto> {
  const scorecard = getMockMyScorecards(candidateId).find((item) => item.assessmentId === assessmentId);
  if (!scorecard) throw new Error('Scorecard not found.');
  return scorecard;
}
