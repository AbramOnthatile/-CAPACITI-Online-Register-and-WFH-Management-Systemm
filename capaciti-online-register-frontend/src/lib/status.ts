import type { LucideIcon } from 'lucide-react';
import { icons } from '../components/icons';

export type StatusTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral';

type StatusItem = {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
};

export const arrivalStatus = {
  ON_TIME: { label: 'On time', tone: 'success', icon: icons.check },
  LATE_UNEXCUSED: { label: 'Late (unexcused)', tone: 'warning', icon: icons.warning },
  LATE_EXCUSED: { label: 'Late (excused)', tone: 'info', icon: icons.clockIn },
  ABSENT_UNEXCUSED: { label: 'Absent (unexcused)', tone: 'danger', icon: icons.close },
} satisfies Record<string, StatusItem>;

export const departureStatus = {
  ON_TIME: { label: 'On time', tone: 'success', icon: icons.check },
  PARTIAL_DAY: { label: 'Partial day', tone: 'warning', icon: icons.clockOut },
  LATE_CLOCKOUT: { label: 'Late clock-out', tone: 'primary', icon: icons.clockOut },
} satisfies Record<string, StatusItem>;

export const wfhStatus = {
  PENDING: { label: 'Pending', tone: 'warning', icon: icons.clockIn },
  APPROVED: { label: 'Approved', tone: 'success', icon: icons.check },
  REJECTED: { label: 'Rejected', tone: 'danger', icon: icons.close },
  CANCELLED: { label: 'Cancelled', tone: 'neutral', icon: icons.close },
} satisfies Record<string, StatusItem>;

export const promptStatus = {
  SCHEDULED: { label: 'Scheduled', tone: 'info', icon: icons.clockIn },
  ACTIVE: { label: 'Active', tone: 'success', icon: icons.prompts },
  SUBMITTED: { label: 'Submitted', tone: 'primary', icon: icons.check },
  EXPIRED: { label: 'Expired', tone: 'neutral', icon: icons.clockOut },
} satisfies Record<string, StatusItem>;

export const promptStage = {
  MORNING_KICKOFF: { label: 'Morning Kickoff', tone: 'warning', icon: icons.clockIn },
  MIDDAY_PULSE: { label: 'Midday Pulse', tone: 'info', icon: icons.clock },
  EOD_WRAP_UP: { label: 'EOD Wrap-Up', tone: 'primary', icon: icons.clockOut },
} satisfies Record<string, StatusItem>;

export const ticketStatus = {
  OPEN: { label: 'Open', tone: 'warning', icon: icons.tickets },
  RESOLVED: { label: 'Resolved', tone: 'success', icon: icons.check },
} satisfies Record<string, StatusItem>;

export const ticketType = {
  BLOCKER: { label: 'Blocker', tone: 'danger', icon: icons.alert },
  IT_ISSUE: { label: 'IT issue', tone: 'info', icon: icons.wifi },
  ACCOUNT: { label: 'Account', tone: 'primary', icon: icons.users },
  HR: { label: 'HR', tone: 'neutral', icon: icons.users },
  GENERAL: { label: 'General', tone: 'neutral', icon: icons.tickets },
} satisfies Record<string, StatusItem>;

export const workMode = {
  ON_SITE: { label: 'On-site', tone: 'primary', icon: icons.mode.onSite },
  WFH: { label: 'Work from home', tone: 'info', icon: icons.mode.wfh },
} satisfies Record<string, StatusItem>;

export type ArrivalStatus = keyof typeof arrivalStatus;
export type WorkMode = keyof typeof workMode;

export type ChartColorKey =
  | 'ON_TIME'
  | 'LATE_UNEXCUSED'
  | 'LATE_EXCUSED'
  | 'ABSENT_UNEXCUSED'
  | 'PARTIAL_DAY'
  | 'LATE_CLOCKOUT'
  | 'ON_SITE'
  | 'WFH';

const chartColors: Record<ChartColorKey, string> = {
  ON_TIME: '#12A150',
  LATE_UNEXCUSED: '#D98A06',
  LATE_EXCUSED: '#0891B2',
  ABSENT_UNEXCUSED: '#D92D3A',
  PARTIAL_DAY: '#EA580C',
  LATE_CLOCKOUT: '#8B5CF6',
  ON_SITE: '#5B16D0',
  WFH: '#2563EB',
};

export const chartColor = (key: ChartColorKey): string => chartColors[key];
