import { PromptStage, UserRole, WorkMode, type User } from '../api/types';

export const demoOnly = {
  notice: 'Demo only, not connected',
  championSidebarCaption: 'Supervising demo cohort',
  attendanceGuidance: 'Sample attendance guidance is illustrative only. Follow the attendance information returned by the connected service.',
  manualBreakDisplay: 'Not connected',
  demoAccounts: [
    { role: UserRole.CANDIDATE, title: 'Candidate', name: 'Aphiwe Ndlovu', email: 'candidate@capaciti.test', tag: 'Demo Candidate' },
    { role: UserRole.TECH_CHAMP, title: 'Tech Champion', name: 'Lerato Dlamini', email: 'champion@capaciti.test', tag: 'Demo Champion' },
    { role: UserRole.ADMIN, title: 'Administrator', name: 'Musa Zulu', email: 'admin@capaciti.test', tag: 'Demo Admin' },
  ],
  championDirectoryUsers: [
    {
      id: 'demo-user-1',
      email: 'aphiwe.ndlovu@capaciti.test',
      fullName: 'Aphiwe Ndlovu',
      role: UserRole.CANDIDATE,
      defaultMode: WorkMode.ON_SITE,
      campusId: 'demo-campus-1',
      campusName: 'Cape Town Campus',
      championId: 'demo-user-2',
      active: true,
      createdAt: '2026-10-01T08:00:00+02:00',
    },
    {
      id: 'demo-user-3',
      email: 'mpho.mokoena@capaciti.test',
      fullName: 'Mpho Mokoena',
      role: UserRole.CANDIDATE,
      defaultMode: WorkMode.WFH,
      campusId: null,
      campusName: null,
      championId: 'demo-user-2',
      active: true,
      createdAt: '2026-10-01T08:00:00+02:00',
    },
  ] satisfies User[],
  weeklyAllowance: '2 Days Max',
  sampleNotifications: [
    { id: 'notice-1', title: 'Daily standup reminder', message: 'Daily standup begins at 09:15.', timestamp: '2026-10-23T08:00:00+02:00', type: 'Reminder', read: false },
    { id: 'notice-2', title: 'Check-in reminder', message: 'Remember to submit your daily update.', timestamp: '2026-10-23T08:30:00+02:00', type: 'Announcement', read: true },
  ],
  profile: {
    location: 'Salt River, Cape Town',
    phone: '+27 82 456 7890',
    emergencyContact: 'Nomsa Ndlovu - +27 83 123 4567',
  },
  championCheckinReview: [
    { id: 'review-1', userName: 'Aphiwe Ndlovu', stage: PromptStage.EOD_WRAP_UP, promptDate: '2026-10-22', response: 'Completed the API integration work and noted one access blocker.', feedbackComment: 'Sample feedback: clear progress update.' },
    { id: 'review-2', userName: 'Mpho Mokoena', stage: PromptStage.MIDDAY_PULSE, promptDate: '2026-10-22', response: 'Progressing on the assigned data work.', feedbackComment: 'Sample feedback: share the next milestone.' },
  ],
  escalationQueue: [
    { id: 'demo-blocker-1', title: 'Repeated late arrivals', reason: 'Illustrative escalation record only.' },
    { id: 'demo-blocker-2', title: 'Missing clock-out', reason: 'Illustrative attendance follow-up only.' },
  ],
};
