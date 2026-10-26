export type AssessmentType = 'WEEKLY' | 'PROJECT';
export type AssessmentStatus = 'DRAFT' | 'SUBMITTED';

export type ScoreCriterion =
  | 'attendance'
  | 'communication'
  | 'accountability'
  | 'creativity'
  | 'delivery'
  | 'techSkills';

export type CriterionScores = Record<ScoreCriterion, number | null>;

export interface AssessmentSummaryDto {
  id: string;
  title: string;
  type: AssessmentType;
  status: AssessmentStatus;
  assessmentDate: string;
  periodStart: string;
  periodEnd: string;
  entryCount: number;
  groupAveragePercent: number | null;
  submittedAt: string | null;
}

export interface ScorecardEntryDto {
  candidateId: string;
  candidateName: string;
  scores: CriterionScores;
  overallPercent: number | null;
  feedback: string;
  feedbackStrengths: string;
  feedbackImprovements: string;
}

export interface AttendanceSuggestionDto {
  candidateId: string;
  onTime: number;
  lateExcused: number;
  lateUnexcused: number;
  absent: number;
  suggestedScore: number;
}

export interface AssessmentDetailDto extends AssessmentSummaryDto {
  groupFeedback: string;
  entries: ScorecardEntryDto[];
  attendanceSuggestions: AttendanceSuggestionDto[];
}

export interface SaveEntriesRequest {
  entries: ScorecardEntryDto[];
  groupFeedback: string;
}

export interface MyScorecardDto {
  assessmentId: string;
  title: string;
  type: AssessmentType;
  assessmentDate: string;
  scores: CriterionScores;
  overallPercent: number;
  feedback: string;
  feedbackStrengths: string;
  feedbackImprovements: string;
  groupFeedback: string;
}
