import type { ArrivalStatus, WorkMode } from '../../../lib/status';
import type { departureStatus, promptStatus, wfhStatus } from '../../../lib/status';

export type DepartureStatus = keyof typeof departureStatus;
export type PromptStatus = keyof typeof promptStatus;
export type WfhStatus = keyof typeof wfhStatus;

export type AttendanceRecord = {
  id: string;
  userId: string;
  userName: string;
  attendanceDate: string;
  workMode: WorkMode;
  clockInAt: string | null;
  clockOutAt: string | null;
  arrivalStatus: ArrivalStatus | null;
  departureStatus: DepartureStatus | null;
  lateReason: string | null;
  earlyClockoutReason: string | null;
  lateClockoutNote: string | null;
  deliverableLink: string | null;
  ipVerified: boolean | null;
  geoVerified: boolean | null;
  distanceM: number | null;
  aiQualityFlag: boolean;
};

export type PromptRecord = {
  id: string;
  stage: keyof typeof import('../../../lib/status').promptStage;
  promptDate: string;
  scheduledAt: string;
  expiresAt: string;
  status: PromptStatus;
  submittedAt: string | null;
  attemptCount: number;
  aiQualityFlag: boolean;
  response: Record<string, unknown> | null;
};

export type WfhRequest = {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: WfhStatus;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  aiQualityFlag: boolean;
  createdAt: string;
};

export type CandidateDashboardData = {
  serverTime: string;
  today: AttendanceRecord | null;
  recentAttendance: AttendanceRecord[];
  currentWfh: WfhRequest | null;
  recentWfhRequests: WfhRequest[];
  promptsToday: PromptRecord[];
  openTickets: number;
  prolongedTickets: number;
};

export type AttendanceActionResponse = {
  attendance: AttendanceRecord;
  requiresReason: boolean;
  feedbackMessage: string;
  flagged: boolean;
};

export type ClockInPayload = {
  latitude?: number;
  longitude?: number;
  accuracyM?: number;
};

export type ClockOutPayload = {
  earlyClockoutReason?: string;
  lateClockoutNote?: string;
  deliverableLink?: string;
};

export type CandidateIdentity = {
  firstName: string;
  campusName: string;
  workMode: WorkMode;
};

export type ReasonSubmission = {
  kind: 'late' | 'early';
  note: string;
  draftKey: string;
};

export type ReasonSubmissionResult = {
  quality: {
    accepted: boolean;
    feedbackMessage: string;
  };
  attendance?: AttendanceRecord;
};
