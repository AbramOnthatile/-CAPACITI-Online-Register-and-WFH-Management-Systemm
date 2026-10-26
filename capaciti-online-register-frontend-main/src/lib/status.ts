import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle2,
  Clock3,
  Home,
  type LucideIcon,
  MessageCircle,
  Moon,
  ShieldCheck,
  TicketCheck,
  UserRound,
} from 'lucide-react';
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
} from '../api/types';
import type { AssessmentStatus } from '../api/scorecardTypes';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
type AppStatus = UserRole | WorkMode | ArrivalStatus | DepartureStatus | WfhStatus | PromptStage | PromptStatus | TicketType | TicketStatus | AssessmentStatus;

export interface StatusMetadata {
  label: string;
  tone: StatusTone;
  icon: LucideIcon;
}

export const statusMetadata: Record<
  AppStatus,
  StatusMetadata
> = {
  DRAFT: { label: 'Draft', tone: 'warning', icon: Clock3 },
  [UserRole.CANDIDATE]: { label: 'Candidate', tone: 'primary', icon: UserRound },
  [UserRole.TECH_CHAMP]: { label: 'Tech Champion', tone: 'info', icon: ShieldCheck },
  [UserRole.ADMIN]: { label: 'Admin', tone: 'danger', icon: ShieldCheck },
  [WorkMode.ON_SITE]: { label: 'On-site', tone: 'info', icon: Building2 },
  [WorkMode.WFH]: { label: 'Work from home', tone: 'primary', icon: Home },
  [ArrivalStatus.ON_TIME]: { label: 'On time', tone: 'success', icon: CheckCircle2 },
  [ArrivalStatus.LATE_UNEXCUSED]: { label: 'Late · unexcused', tone: 'warning', icon: Clock3 },
  [ArrivalStatus.LATE_EXCUSED]: { label: 'Late · excused', tone: 'info', icon: Clock3 },
  [ArrivalStatus.ABSENT_UNEXCUSED]: { label: 'Absent · unexcused', tone: 'danger', icon: Ban },
  [DepartureStatus.PARTIAL_DAY]: { label: 'Partial day', tone: 'warning', icon: Clock3 },
  [DepartureStatus.LATE_CLOCKOUT]: { label: 'Late clock-out', tone: 'warning', icon: Clock3 },
  [WfhStatus.PENDING]: { label: 'Pending', tone: 'warning', icon: Clock3 },
  [WfhStatus.APPROVED]: { label: 'Approved', tone: 'success', icon: CheckCircle2 },
  [WfhStatus.REJECTED]: { label: 'Rejected', tone: 'danger', icon: AlertCircle },
  [WfhStatus.CANCELLED]: { label: 'Cancelled', tone: 'neutral', icon: Ban },
  [PromptStage.MORNING_KICKOFF]: { label: 'Morning Kickoff', tone: 'primary', icon: Activity },
  [PromptStage.MIDDAY_PULSE]: { label: 'Midday Pulse', tone: 'info', icon: Activity },
  [PromptStage.EOD_WRAP_UP]: { label: 'EOD Wrap-Up', tone: 'neutral', icon: Moon },
  [PromptStatus.SCHEDULED]: { label: 'Scheduled', tone: 'neutral', icon: Clock3 },
  [PromptStatus.ACTIVE]: { label: 'Active', tone: 'primary', icon: Activity },
  [PromptStatus.SUBMITTED]: { label: 'Submitted', tone: 'success', icon: CheckCircle2 },
  [PromptStatus.EXPIRED]: { label: 'Expired', tone: 'warning', icon: AlertCircle },
  [TicketType.IT_ISSUE]: { label: 'IT issue', tone: 'info', icon: TicketCheck },
  [TicketType.BLOCKER]: { label: 'Blocker', tone: 'danger', icon: AlertTriangle },
  [TicketStatus.OPEN]: { label: 'Open', tone: 'warning', icon: MessageCircle },
  [TicketStatus.RESOLVED]: { label: 'Resolved', tone: 'success', icon: CheckCircle2 },
};

export const getStatusMetadata = (value: keyof typeof statusMetadata): StatusMetadata =>
  statusMetadata[value];
