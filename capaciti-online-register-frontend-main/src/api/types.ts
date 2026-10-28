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

export enum AssessmentType {
  WEEKLY = 'WEEKLY',
  PROJECT = 'PROJECT',
}

export enum AssessmentStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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

export interface CreateUserRequest {
  email: string;
  fullName: string;
  temporaryPassword: string;
  role: UserRole;
  defaultMode: WorkMode;
  campusId: string | null;
  championId: string | null;
}

export interface UpdateUserRequest {
  fullName: string;
  defaultMode: WorkMode;
  campusId: string | null;
  championId: string | null;
  role: UserRole;
}

export interface UpdateUserStatusRequest {
  active: boolean;
}

export interface CampusHub {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
  whitelistedCidrs: string[];
}

export interface UpdateCampusRequest {
  name: string;
  latitude: number;
  longitude: number;
  radiusM: number;
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
  ipVerified: boolean | null;
  geoVerified: boolean | null;
  distanceM: number | null;
  aiQualityFlag: boolean;
}

export interface AttendanceActionResponse {
  attendance: AttendanceRecord;
  requiresReason: boolean;
  quality: QualityResult;
}

export interface ClockInRequest {
  draftKey: string;
  workMode: WorkMode;
  lateReason: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracyM?: number | null;
}

export interface ClockOutRequest {
  draftKey: string;
  earlyClockoutReason: string | null;
  lateClockoutNote: string | null;
  deliverableLink: string | null;
}

export interface ExcuseRequest {
  reason: string;
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

export interface WfhActionResponse {
  request: WfhRequest;
  quality: QualityResult;
}

export interface CreateWfhRequest {
  draftKey: string;
  startDate: string;
  endDate: string;
  reason: string;
  readiness: WfhReadiness;
}

export interface WfhDecision {
  approved: boolean;
  comment: string | null;
}

export interface DailyPrompt {
  id: string;
  stage: PromptStage;
  promptDate: string;
  scheduledAt: string | number;
  expiresAt: string | number;
  status: PromptStatus;
  submittedAt: string | null;
  attemptCount: number;
  aiQualityFlag: boolean;
  response: Record<string, unknown> | null;
}

export interface PromptReview {
  id: string;
  userId: string;
  userName: string;
  stage: PromptStage;
  promptDate: string;
  status: PromptStatus;
  submittedAt: string | null;
  aiQualityFlag: boolean;
  response: Record<string, unknown> | null;
}

export interface PromptCollection {
  serverTime: string;
  prompts: DailyPrompt[];
}

export interface PromptSubmission {
  draftKey: string;
  deliverables: string[] | null;
  standupConfirmed: boolean | null;
  powerStatus: string | null;
  ispStatus: string | null;
  progressStatus: string | null;
  blockerNote: string | null;
  workLink: string | null;
}

export interface QualityResult {
  accepted: boolean;
  isValid: boolean;
  feedbackMessage: string | null;
  attempt: number;
  flagged: boolean;
}

export interface PromptSubmissionResult {
  prompt: DailyPrompt;
  quality: QualityResult;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  type: TicketType;
  title: string;
  description: string;
  attachmentUrl: string | null;
  workMode: WorkMode;
  status: TicketStatus;
  isProlonged: boolean;
  resolvedByName: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
  aiQualityFlag: boolean;
  createdAt: string;
  ageMinutes: number;
}

export interface TicketActionResponse {
  ticket: SupportTicket;
  quality: QualityResult;
}

export interface CreateTicketRequest {
  draftKey: string;
  type: TicketType;
  title: string;
  description: string;
  attachmentUrl: string | null;
}

export interface TicketResolution {
  resolutionNote: string;
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

export interface CandidateDashboardDto {
  serverTime: string;
  today: AttendanceRecord | null;
  recentAttendance: AttendanceRecord[];
  currentWfh: WfhRequest | null;
  recentWfhRequests: WfhRequest[];
  promptsToday: DailyPrompt[];
  openTickets: number;
  prolongedTickets: number;
}

export interface AttentionItemDto {
  userId: string;
  userName: string;
  reason: string;
  severity: string;
}

export interface ChampionDashboardDto {
  date: string;
  serverTime: string;
  expectedCandidates: number;
  clockedIn: number;
  onTime: number;
  late: number;
  absent: number;
  notYetClockedIn: number;
  onSite: number;
  wfh: number;
  wfhApprovedToday: number;
  pendingWfhRequests: number;
  openTickets: number;
  prolongedBlockers: number;
  promptsSubmitted: number;
  promptsMissed: number;
  aiFlaggedToday: number;
  needsAttention: AttentionItemDto[];
}

export interface OverviewReportDto {
  from: string;
  to: string;
  totalCandidates: number;
  attendanceRatePercent: number;
  onTimeRatePercent: number;
  lateCount: number;
  absentCount: number;
  wfhDays: number;
  pendingWfh: number;
  approvedWfh: number;
  rejectedWfh: number;
  openTickets: number;
  prolongedBlockers: number;
  aiFlaggedSubmissions: number;
}

export interface DailyTrendDto {
  date: string;
  present: number;
  late: number;
  absent: number;
}

export interface CandidateAttendanceRowDto {
  userId: string;
  userName: string;
  daysPresent: number;
  onTime: number;
  late: number;
  absent: number;
  partialDay: number;
  lateClockout: number;
}

export interface AttendanceSummaryDto {
  from: string;
  to: string;
  arrivalCounts: Record<string, number>;
  departureCounts: Record<string, number>;
  workModeCounts: Record<string, number>;
  trend: DailyTrendDto[];
  candidates: CandidateAttendanceRowDto[];
}

export interface PromptStageStatDto {
  stage: string;
  submitted: number;
  expired: number;
  other: number;
}

export interface WfhSummaryDto {
  from: string;
  to: string;
  requestCounts: Record<string, number>;
  wfhAttendanceDays: number;
  promptCompletion: PromptStageStatDto[];
  ticketsOpened: number;
  ticketsResolved: number;
  prolongedBlockers: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: string;
  read: boolean;
}

export interface AnnouncementResponse {
  recipientCount: number;
}

export interface SignedUrlResponse {
  url: string;
  expiresInSeconds: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  expiresAt: string;
  user: User;
}

export interface ApiErrorEnvelope {
  code: string;
  message: string;
  fieldErrors: Record<string, string>;
}

export interface AssessmentSummaryDto {
  id: string;
  title: string;
  type: AssessmentType;
  status: AssessmentStatus;
  assessmentDate: string;
  periodStart: string | null;
  periodEnd: string | null;
  entryCount: number;
  groupAveragePercent: number | null;
  submittedAt: string | null;
}

export interface ScorecardScores {
  attendance: number | null;
  communication: number | null;
  accountability: number | null;
  creativity: number | null;
  delivery: number | null;
  techSkills: number | null;
}

export interface ScorecardEntryDto {
  candidateId: string;
  candidateName: string;
  scores: ScorecardScores;
  overallPercent: number | null;
  feedback: string | null;
  feedbackStrengths: string | null;
  feedbackImprovements: string | null;
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
  groupFeedback: string | null;
  entries: ScorecardEntryDto[];
  attendanceSuggestions: AttendanceSuggestionDto[];
}

export interface CreateAssessmentRequest {
  title: string;
  type: AssessmentType;
  assessmentDate: string;
  periodStart: string | null;
  periodEnd: string | null;
}

export interface EntryRequest {
  candidateId: string;
  attendanceScore: number | null;
  communicationScore: number | null;
  accountabilityScore: number | null;
  creativityScore: number | null;
  deliveryScore: number | null;
  techSkillsScore: number | null;
  feedback: string | null;
  feedbackStrengths: string | null;
  feedbackImprovements: string | null;
}

export interface SaveEntriesRequest {
  groupFeedback: string | null;
  entries: EntryRequest[];
}

export interface MyScorecardDto {
  assessmentId: string;
  title: string;
  type: AssessmentType;
  assessmentDate: string;
  scores: ScorecardScores;
  overallPercent: number | null;
  feedback: string | null;
  feedbackStrengths: string | null;
  feedbackImprovements: string | null;
  groupFeedback: string | null;
}
