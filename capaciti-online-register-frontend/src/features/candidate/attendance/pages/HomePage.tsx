import { Link } from 'react-router-dom';
import { CountdownRing } from '../../../../components/ui';
import type { WeekStripDay } from '../../../../components/ui';
import {
  Card,
  EmptyState,
  ErrorState,
  ModeBadge,
  PageHero,
  Skeleton,
  StatusBadge,
  WeekStrip,
} from '../../../../components/ui';
import { LiveClock } from '../../../../components/ui';
import { formatDate, formatDuration, formatTime } from '../../../../lib/format';
import { promptStage } from '../../../../lib/status';
import type {
  AttendanceActionResponse,
  CandidateDashboardData,
  CandidateIdentity,
  ClockInPayload,
  ClockOutPayload,
  ReasonSubmission,
  ReasonSubmissionResult,
} from '../types';
import { ClockPanel } from '../components/ClockPanel';

export type HomePageProps = {
  identity: CandidateIdentity;
  data: CandidateDashboardData | null;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onClockIn: (payload: ClockInPayload) => Promise<AttendanceActionResponse>;
  onClockOut: (payload: ClockOutPayload) => Promise<AttendanceActionResponse>;
  onSubmitReason: (submission: ReasonSubmission) => Promise<ReasonSubmissionResult>;
};

function localDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function greeting(serverTime: string): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(serverTime)),
  );

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function durationLabel(clockInAt: string | null, clockOutAt: string | null): string {
  if (!clockInAt || !clockOutAt) return '—';
  const minutes = Math.max(
    0,
    Math.floor((new Date(clockOutAt).getTime() - new Date(clockInAt).getTime()) / 60_000),
  );
  return formatDuration(minutes);
}

function HomeLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading candidate home">
      <Skeleton variant="rectangular" className="h-40" />
      <Skeleton variant="rectangular" className="h-[28rem]" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Skeleton variant="rectangular" />
        <Skeleton variant="rectangular" />
      </div>
    </div>
  );
}

export function HomePage({
  identity,
  data,
  loading = false,
  error,
  onRetry,
  onClockIn,
  onClockOut,
  onSubmitReason,
}: HomePageProps) {
  if (loading) return <HomeLoading />;
  if (error) {
    return <ErrorState description={error} onRetry={onRetry} />;
  }
  if (!data) {
    return (
      <EmptyState
        title="Home data is not available"
        description="Candidate dashboard information has not been loaded."
      />
    );
  }

  const today = localDate(data.serverTime);
  const weekDays: WeekStripDay[] = data.recentAttendance.map((record) => ({
    date: record.attendanceDate,
    status: record.workMode === 'WFH' ? 'WFH' : record.arrivalStatus ?? 'NONE',
    hoursLabel: durationLabel(record.clockInAt, record.clockOutAt),
  }));
  const todayPrompts = data.promptsToday.filter(
    (prompt) => prompt.status === 'ACTIVE' || prompt.status === 'SCHEDULED',
  );
  const currentWfh = data.currentWfh ??
    [...data.recentWfhRequests].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    )[0] ??
    null;
  const dateLabel = formatDate(data.serverTime);

  return (
    <main className="motion-stagger mx-auto w-full max-w-6xl space-y-4 pb-6 sm:space-y-6">
      <PageHero
        eyebrow="Candidate home"
        title={`${greeting(data.serverTime)}, ${identity.firstName}`}
        subtitle={`${identity.campusName} · ${dateLabel}`}
        variant="gradient"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <ModeBadge mode={identity.workMode} />
            <LiveClock serverTime={data.serverTime} />
          </div>
        }
      />

      <ClockPanel
        identity={identity}
        attendance={data.today}
        onClockIn={onClockIn}
        onClockOut={onClockOut}
        onSubmitReason={onSubmitReason}
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Your work week</h2>
            <p className="mt-1 text-sm text-ink-500">Recent attendance by working day</p>
          </div>
          <Link
            to="/candidate/attendance/history"
            className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            View history
          </Link>
        </div>
        <WeekStrip days={weekDays} today={today} />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="space-y-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">Today&apos;s check-ins</h2>
            <p className="mt-1 text-sm text-ink-500">Active and upcoming prompts</p>
          </div>
          {todayPrompts.length === 0 ? (
            <EmptyState
              title="No prompts today"
              description="There are no active or upcoming check-ins."
              className="py-6"
            />
          ) : (
            <ul className="motion-stagger space-y-3">
              {todayPrompts.map((prompt) => (
                <li
                  key={prompt.id}
                  className="flex flex-col gap-3 rounded-control border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">
                      {promptStage[prompt.stage].label}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                      <StatusBadge category="prompt" status={prompt.status} />
                      <span>Scheduled {formatTime(prompt.scheduledAt)}</span>
                    </div>
                  </div>
                  {identity.workMode === 'WFH' &&
                    prompt.status === 'ACTIVE' &&
                    prompt.expiresAt && (
                      <CountdownRing
                        expiresAt={prompt.expiresAt}
                        serverTime={data.serverTime}
                        totalSeconds={Math.max(
                          1,
                          Math.ceil(
                            (new Date(prompt.expiresAt).getTime() -
                              new Date(prompt.scheduledAt).getTime()) /
                              1000,
                          ),
                        )}
                        onExpire={() => undefined}
                        className="mx-auto shrink-0 sm:mx-0"
                      />
                    )}
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/candidate/progress"
            className="inline-flex min-h-11 items-center rounded-control px-3 text-sm font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Open check-ins
          </Link>
        </Card>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">Work from home</h2>
              <p className="mt-1 text-sm text-ink-500">Latest request</p>
            </div>
            {currentWfh && <StatusBadge category="wfh" status={currentWfh.status} />}
          </div>
          {currentWfh ? (
            <div className="rounded-control bg-surface p-3">
              <p className="font-semibold text-ink-900">{currentWfh.reason}</p>
              <p className="mt-1 text-sm text-ink-500">
                {formatDate(`${currentWfh.startDate}T12:00:00+02:00`)}
                {currentWfh.startDate !== currentWfh.endDate &&
                  ` – ${formatDate(`${currentWfh.endDate}T12:00:00+02:00`)}`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-500">No work-from-home request has been submitted.</p>
          )}
          <Link
            to="/candidate/wfh/new"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-primary-600 px-4 text-sm font-semibold text-white hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            Apply for work from home
          </Link>
        </Card>
      </div>
    </main>
  );
}
