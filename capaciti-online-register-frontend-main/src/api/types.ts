export enum UserRole {
  CANDIDATE = 'CANDIDATE',
  TECH_CHAMP = 'TECH_CHAMP',
  ADMIN = 'ADMIN',
}

export enum WorkMode {
  ON_SITE = 'ON_SITE',
  WFH = 'WFH',
}

export enum ArrivalStatus {
  ON_TIME = 'ON_TIME',
  LATE_UNEXCUSED = 'LATE_UNEXCUSED',
  LATE_EXCUSED = 'LATE_EXCUSED',
  ABSENT_UNEXCUSED = 'ABSENT_UNEXCUSED',
}

export enum DepartureStatus {
  ON_TIME = 'ON_TIME',
  PARTIAL_DAY = 'PARTIAL_DAY',
  LATE_CLOCKOUT = 'LATE_CLOCKOUT',
}

export enum WfhStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum PromptStage {
  MORNING_KICKOFF = 'MORNING_KICKOFF',
  MIDDAY_PULSE = 'MIDDAY_PULSE',
  EOD_WRAP_UP = 'EOD_WRAP_UP',
}

export enum PromptStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  SUBMITTED = 'SUBMITTED',
  EXPIRED = 'EXPIRED',
}

export enum TicketType {
  IT_ISSUE = 'IT_ISSUE',
  BLOCKER = 'BLOCKER',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  defaultMode: WorkMode;
  campusId: string | null;
  campusName: string | null;
  championId: string | null;
  active: boolean;
  createdAt: string;
}

export interface CampusHub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  whitelistedCidrs: string[];
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  attendanceDate: string;
  workMode: WorkMode;
  clockInAt: string | null;
  clockOutAt: string | null;
  arrivalStatus: ArrivalStatus;
  departureStatus: DepartureStatus | null;
  lateReason: string | null;
  earlyClockoutReason: string | null;
  lateClockoutNote: string | null;
  deliverableLink: string | null;
  ipVerified: boolean;
  geoVerified: boolean;
  distanceM: number | null;
  aiQualityFlag: boolean;
  breaks?: AttendanceBreak[];
}

export interface AttendanceBreak {
  type: 'TEA' | 'LUNCH';
  startedAt: string;
  endedAt: string | null;
}

export interface WfhReadiness {
  stableInternet: boolean;
  powerBackup: boolean;
  quietWorkspace: boolean;
  laptopReady: boolean;
}

export interface WfhRequest {
  id: string;
  userId: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  readiness: WfhReadiness;
  status: WfhStatus;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  aiQualityFlag: boolean;
  createdAt: string;
}

export interface DailyPrompt {
  id: string;
  stage: PromptStage;
  promptDate: string;
  scheduledAt: string;
  expiresAt: string;
  status: PromptStatus;
  submittedAt: string | null;
  attemptCount: number;
  aiQualityFlag: boolean;
  response: Record<string, unknown> | null;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  type: TicketType;
  workMode: WorkMode;
  title: string;
  description: string;
  attachmentUrl: string | null;
  status: TicketStatus;
  isProlonged: boolean;
  resolvedByName: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  aiQualityFlag: boolean;
  createdAt: string;
  ageMinutes: number;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
}

export interface PromptSubmission {
  deliverables?: string[];
  standupConfirmed?: boolean;
  powerStatus?: 'STABLE' | 'UNSTABLE' | 'DOWN';
  ispStatus?: 'STABLE' | 'UNSTABLE' | 'DOWN';
  progressStatus?: 'ON_TRACK' | 'DELAYED' | 'BLOCKED';
  blockerNote?: string;
  workLink?: string;
}

export interface PromptSubmissionResult {
  prompt: DailyPrompt;
  quality: {
    accepted: boolean;
    isValid: boolean;
    feedbackMessage: string | null;
    attempt: number;
    flagged: boolean;
  };
}

export interface PromptCollection {
  prompts: DailyPrompt[];
  serverTime: string;
}

export interface WfhDecision {
  status: WfhStatus.APPROVED | WfhStatus.REJECTED;
  reviewComment: string;
}

export interface TicketResolution {
  resolutionNote: string;
}

export interface Notification {
  id: string;
  recipientId?: string;
  title: string;
  message: string;
  timestamp: string;
  type: string;
  read: boolean;
}

export interface AnnouncementResponse {
  recipientCount: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: User;
}
