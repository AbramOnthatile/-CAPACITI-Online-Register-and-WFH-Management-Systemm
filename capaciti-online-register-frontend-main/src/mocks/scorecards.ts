import type {
  AssessmentDetailDto,
  AssessmentSummaryDto,
  AttendanceSuggestionDto,
  CriterionScores,
  ScorecardEntryDto,
} from '../api/scorecardTypes';
import { overallPercent } from '../lib/scoring';

const candidates = [
  { id: 'candidate-1', fullName: 'Aphiwe Ndlovu' },
  { id: 'candidate-2', fullName: 'Mpho Mokoena' },
  { id: 'candidate-3', fullName: 'Thando Nkosi' },
  { id: 'candidate-4', fullName: 'Lerato Molefe' },
  { id: 'candidate-5', fullName: 'Sipho Dlamini' },
  { id: 'candidate-6', fullName: 'Naledi Khumalo' },
];

const assessmentSeeds: Omit<AssessmentDetailDto, 'entries' | 'attendanceSuggestions' | 'entryCount' | 'groupAveragePercent'>[] = [
  {
    id: 'assessment-week-2026-10-19',
    title: 'Weekly Scorecard — 19 October',
    type: 'WEEKLY',
    status: 'SUBMITTED',
    assessmentDate: '2026-10-23',
    periodStart: '2026-10-19',
    periodEnd: '2026-10-23',
    submittedAt: '2026-10-23T15:30:00+02:00',
    groupFeedback: 'The cohort showed steady progress this week. Continue sharing blockers early and reviewing work with peers.',
  },
  {
    id: 'assessment-project-alpha',
    title: 'Project Alpha Delivery Review',
    type: 'PROJECT',
    status: 'DRAFT',
    assessmentDate: '2026-10-30',
    periodStart: '2026-10-19',
    periodEnd: '2026-10-30',
    submittedAt: null,
    groupFeedback: '',
  },
  {
    id: 'assessment-week-2026-10-12',
    title: 'Weekly Scorecard — 12 October',
    type: 'WEEKLY',
    status: 'SUBMITTED',
    assessmentDate: '2026-10-16',
    periodStart: '2026-10-12',
    periodEnd: '2026-10-16',
    submittedAt: '2026-10-16T15:30:00+02:00',
    groupFeedback: 'Good collaboration across the group. Next week, focus on breaking delivery goals into smaller milestones.',
  },
  {
    id: 'assessment-project-beta',
    title: 'Project Beta Checkpoint',
    type: 'PROJECT',
    status: 'DRAFT',
    assessmentDate: '2026-11-06',
    periodStart: '2026-10-26',
    periodEnd: '2026-11-06',
    submittedAt: null,
    groupFeedback: '',
  },
  {
    id: 'assessment-week-2026-10-05',
    title: 'Weekly Scorecard — 5 October',
    type: 'WEEKLY',
    status: 'SUBMITTED',
    assessmentDate: '2026-10-09',
    periodStart: '2026-10-05',
    periodEnd: '2026-10-09',
    submittedAt: '2026-10-09T15:30:00+02:00',
    groupFeedback: 'Candidates demonstrated a positive start to the month. Maintain consistent attendance and communication.',
  },
];

function makeScores(assessmentIndex: number, candidateIndex: number, isDraft: boolean): CriterionScores {
  const base = 2 + ((assessmentIndex + candidateIndex) % 4);
  return {
    attendance: isDraft && candidateIndex === 5 ? null : Math.min(5, base),
    communication: isDraft && candidateIndex === 4 ? null : Math.min(5, 2 + ((base + 1) % 4)),
    accountability: Math.min(5, 2 + ((base + 2) % 4)),
    creativity: isDraft && candidateIndex === 3 ? null : Math.min(5, 2 + ((base + 3) % 4)),
    delivery: Math.min(5, 2 + ((base + assessmentIndex) % 4)),
    techSkills: Math.min(5, 2 + ((base + candidateIndex + 1) % 4)),
  };
}

function makeAttendanceSuggestion(candidateId: string, index: number): AttendanceSuggestionDto {
  const onTime = 3 + (index % 3);
  const lateExcused = index % 2;
  const lateUnexcused = index % 3 === 0 ? 1 : 0;
  const absent = index === 5 ? 1 : 0;
  const attendanceRate = onTime / (onTime + lateExcused + lateUnexcused + absent);
  return {
    candidateId,
    onTime,
    lateExcused,
    lateUnexcused,
    absent,
    suggestedScore: Math.max(1, Math.min(5, Math.round(attendanceRate * 5))),
  };
}

export const mockAssessmentDetails: AssessmentDetailDto[] = assessmentSeeds.map((seed, assessmentIndex) => {
  const entries: ScorecardEntryDto[] = candidates.map((candidate, candidateIndex) => {
    const scores = makeScores(assessmentIndex, candidateIndex, seed.status === 'DRAFT');
    return {
      candidateId: candidate.id,
      candidateName: candidate.fullName,
      scores,
      overallPercent: overallPercent(scores),
      feedback: seed.status === 'DRAFT' ? '' : 'Keep building on this progress and raise any blockers early.',
      feedbackStrengths: seed.status === 'DRAFT' ? '' : 'Communicates progress clearly and collaborates well with the team.',
      feedbackImprovements: seed.status === 'DRAFT' ? '' : 'Break larger tasks into smaller milestones and share progress regularly.',
    };
  });
  const scoredEntries = entries.filter((entry) => entry.overallPercent !== null);
  const groupAveragePercent = seed.status === 'DRAFT' || scoredEntries.length === 0
    ? null
    : Math.round(scoredEntries.reduce((sum, entry) => sum + (entry.overallPercent ?? 0), 0) / scoredEntries.length);

  return {
    ...seed,
    entryCount: entries.length,
    groupAveragePercent,
    entries,
    attendanceSuggestions: candidates.map((candidate, index) => makeAttendanceSuggestion(candidate.id, index)),
  };
});

export const mockAssessmentSummaries: AssessmentSummaryDto[] = mockAssessmentDetails.map(({
  entries: _entries,
  attendanceSuggestions: _attendanceSuggestions,
  groupFeedback: _groupFeedback,
  ...summary
}) => summary);
