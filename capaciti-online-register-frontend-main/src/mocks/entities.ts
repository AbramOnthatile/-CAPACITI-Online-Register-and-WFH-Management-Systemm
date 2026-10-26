import {
  ArrivalStatus,
  DepartureStatus,
  PromptStage,
  PromptStatus,
  TicketStatus,
  TicketType,
  UserRole,
  WfhStatus,
  WorkMode,
  type AttendanceRecord,
  type AuditLog,
  type CampusHub,
  type DailyPrompt,
  type SupportTicket,
  type User,
  type WfhRequest,
} from '../api/types';

export const mockUsers: User[] = [
  {
    id: 'user-candidate-1',
    email: 'candidate@capaciti.test',
    fullName: 'Aphiwe Ndlovu',
    role: UserRole.CANDIDATE,
    defaultMode: WorkMode.ON_SITE,
    campusId: 'campus-cape-town',
    campusName: 'Cape Town Campus',
    championId: 'user-champion-1',
    active: true,
    createdAt: '2026-01-05T08:00:00+02:00',
  },
  {
    id: 'user-candidate-2',
    email: 'mpho@capaciti.test',
    fullName: 'Mpho Mokoena',
    role: UserRole.CANDIDATE,
    defaultMode: WorkMode.WFH,
    campusId: 'campus-cape-town',
    campusName: 'Cape Town Campus',
    championId: 'user-champion-1',
    active: true,
    createdAt: '2026-01-05T08:00:00+02:00',
  },
  {
    id: 'user-champion-1',
    email: 'champion@capaciti.test',
    fullName: 'Lerato Dlamini',
    role: UserRole.TECH_CHAMP,
    defaultMode: WorkMode.ON_SITE,
    campusId: 'campus-cape-town',
    campusName: 'Cape Town Campus',
    championId: null,
    active: true,
    createdAt: '2025-12-01T08:00:00+02:00',
  },
  {
    id: 'user-admin-1',
    email: 'admin@capaciti.test',
    fullName: 'Musa Zulu',
    role: UserRole.ADMIN,
    defaultMode: WorkMode.ON_SITE,
    campusId: 'campus-cape-town',
    campusName: 'Cape Town Campus',
    championId: null,
    active: true,
    createdAt: '2025-11-01T08:00:00+02:00',
  },
];

export const mockCampuses: CampusHub[] = [
  {
    id: 'campus-cape-town',
    name: 'Cape Town Campus',
    latitude: -33.9249,
    longitude: 18.4241,
    radiusM: 150,
    whitelistedCidrs: [],
  },
];

export const mockAttendance: AttendanceRecord[] = [
  {
    id: 'attendance-1',
    userId: 'user-candidate-1',
    userName: 'Aphiwe Ndlovu',
    attendanceDate: '2026-10-23',
    workMode: WorkMode.ON_SITE,
    clockInAt: '2026-10-23T08:52:00+02:00',
    clockOutAt: null,
    arrivalStatus: ArrivalStatus.ON_TIME,
    departureStatus: null,
    lateReason: null,
    earlyClockoutReason: null,
    lateClockoutNote: null,
    deliverableLink: null,
    ipVerified: true,
    geoVerified: true,
    distanceM: 28,
    aiQualityFlag: false,
  },
  {
    id: 'attendance-2',
    userId: 'user-candidate-2',
    userName: 'Mpho Mokoena',
    attendanceDate: '2026-10-23',
    workMode: WorkMode.WFH,
    clockInAt: '2026-10-23T09:12:00+02:00',
    clockOutAt: null,
    arrivalStatus: ArrivalStatus.LATE_UNEXCUSED,
    departureStatus: null,
    lateReason: 'Connectivity delay',
    earlyClockoutReason: null,
    lateClockoutNote: null,
    deliverableLink: null,
    ipVerified: true,
    geoVerified: false,
    distanceM: null,
    aiQualityFlag: false,
  },
];

export const mockWfhRequests: WfhRequest[] = [
  {
    id: 'wfh-1',
    userId: 'user-candidate-1',
    userName: 'Aphiwe Ndlovu',
    startDate: '2026-10-27',
    endDate: '2026-10-27',
    reason: 'Transport disruption affecting the commute.',
    readiness: {
      stableInternet: true,
      powerBackup: true,
      quietWorkspace: true,
      laptopReady: true,
    },
    status: WfhStatus.PENDING,
    reviewedByName: null,
    reviewedAt: null,
    reviewComment: null,
    aiQualityFlag: false,
    createdAt: '2026-10-22T10:20:00+02:00',
  },
  {
    id: 'wfh-2',
    userId: 'user-candidate-2',
    userName: 'Mpho Mokoena',
    startDate: '2026-10-20',
    endDate: '2026-10-20',
    reason: 'Working from home for focused project work.',
    readiness: {
      stableInternet: true,
      powerBackup: false,
      quietWorkspace: true,
      laptopReady: true,
    },
    status: WfhStatus.APPROVED,
    reviewedByName: 'Lerato Dlamini',
    reviewedAt: '2026-10-18T14:00:00+02:00',
    reviewComment: 'Approved.',
    aiQualityFlag: false,
    createdAt: '2026-10-17T09:00:00+02:00',
  },
];

export const getSastDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date());

export const createMockPrompts = (): DailyPrompt[] => {
  const todayDate = getSastDate();
  const promptExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  return [
    PromptStage.MORNING_KICKOFF,
    PromptStage.MIDDAY_PULSE,
    PromptStage.EOD_WRAP_UP,
  ].map((stage, index) => ({
    id: `prompt-${index + 1}`,
    stage,
    promptDate: todayDate,
    scheduledAt: new Date().toISOString(),
    expiresAt: promptExpiry,
    status: PromptStatus.ACTIVE,
    submittedAt: null,
    attemptCount: 0,
    aiQualityFlag: false,
    response: null,
  }));
};

export const mockPrompts: DailyPrompt[] = createMockPrompts();

export const mockNotifications = [
  { id: 'notice-1', title: 'Daily standup reminder', message: 'Daily standup begins at 09:15.', timestamp: new Date().toISOString(), type: 'Reminder', read: false },
  { id: 'notice-2', title: 'Welcome to CAPACITI', message: 'Use your dashboard to record attendance, submit check-ins, and manage WFH requests.', timestamp: new Date().toISOString(), type: 'Announcement', read: true },
];

export interface MockCheckinReview {
  id: string;
  userName: string;
  stage: PromptStage;
  promptDate: string;
  response: string;
  feedbackComment: string;
}

export const mockCheckinReviews: MockCheckinReview[] = [
  { id: 'review-1', userName: 'Aphiwe Ndlovu', stage: PromptStage.EOD_WRAP_UP, promptDate: getSastDate(), response: 'Completed the API integration work and noted one access blocker.', feedbackComment: '' },
  { id: 'review-2', userName: 'Mpho Mokoena', stage: PromptStage.MIDDAY_PULSE, promptDate: getSastDate(), response: 'Progressing on the assigned data work.', feedbackComment: '' },
];

export const mockTickets: SupportTicket[] = [
  {
    id: 'ticket-1',
    userId: 'user-candidate-1',
    userName: 'Aphiwe Ndlovu',
    type: TicketType.BLOCKER,
    workMode: WorkMode.ON_SITE,
    title: 'Waiting for development environment access',
    description: 'Repository access is needed to continue the assigned work.',
    attachmentUrl: null,
    status: TicketStatus.OPEN,
    isProlonged: false,
    resolvedByName: null,
    resolvedAt: null,
    resolutionNote: null,
    aiQualityFlag: false,
    createdAt: '2026-10-23T08:45:00+02:00',
    ageMinutes: 285,
  },
  {
    id: 'ticket-2',
    userId: 'user-candidate-2',
    userName: 'Mpho Mokoena',
    type: TicketType.IT_ISSUE,
    workMode: WorkMode.WFH,
    title: 'Laptop VPN connection issue',
    description: 'VPN disconnects when accessing development resources.',
    attachmentUrl: null,
    status: TicketStatus.OPEN,
    isProlonged: true,
    resolvedByName: null,
    resolvedAt: null,
    resolutionNote: null,
    aiQualityFlag: false,
    createdAt: '2026-10-22T09:30:00+02:00',
    ageMinutes: 1425,
  },
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit-1',
    actorId: 'user-candidate-1',
    actorName: 'Aphiwe Ndlovu',
    action: 'ATTENDANCE_CLOCK_IN',
    targetType: 'AttendanceRecord',
    targetId: 'attendance-1',
    details: { workMode: WorkMode.ON_SITE },
    createdAt: '2026-10-23T08:52:00+02:00',
  },
  {
    id: 'audit-2',
    actorId: 'user-champion-1',
    actorName: 'Lerato Dlamini',
    action: 'WFH_REQUEST_REVIEWED',
    targetType: 'WfhRequest',
    targetId: 'wfh-2',
    details: { status: WfhStatus.APPROVED },
    createdAt: '2026-10-18T14:00:00+02:00',
  },
];
