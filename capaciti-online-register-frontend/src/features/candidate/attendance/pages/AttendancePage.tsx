import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  StatusBadge,
} from '../../../../components/ui';
import type { AttendanceActionResponse, AttendanceRecord, CandidateIdentity, ClockInPayload, ClockOutPayload, ReasonSubmission, ReasonSubmissionResult } from '../types';
import { ClockPanel } from '../components/ClockPanel';

export type AttendancePageProps = {
  identity: CandidateIdentity;
  today: AttendanceRecord | null;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onClockIn: (payload: ClockInPayload) => Promise<AttendanceActionResponse>;
  onClockOut: (payload: ClockOutPayload) => Promise<AttendanceActionResponse>;
  onSubmitReason: (submission: ReasonSubmission) => Promise<ReasonSubmissionResult>;
};

function AttendanceLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading today's attendance">
      <Skeleton variant="rectangular" className="h-16" />
      <Skeleton variant="rectangular" className="h-[30rem]" />
      <Skeleton variant="rectangular" className="h-48" />
    </div>
  );
}

function TimelineValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <dt className="text-sm text-ink-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink-900">{value}</dd>
    </div>
  );
}

export function AttendancePage({
  identity,
  today,
  loading = false,
  error,
  onRetry,
  onClockIn,
  onClockOut,
  onSubmitReason,
}: AttendancePageProps) {
  if (loading) return <AttendanceLoading />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;
  if (!today) {
    return (
      <main className="space-y-4">
        <PageHeader eyebrow="Attendance" title="Today's attendance" />
        <EmptyState
          title="No attendance record today"
          description="Use the clock button to register today's attendance."
        />
        <ClockPanel
          identity={identity}
          attendance={null}
          onClockIn={onClockIn}
          onClockOut={onClockOut}
          onSubmitReason={onSubmitReason}
        />
      </main>
    );
  }

  const arrival = today.arrivalStatus;
  const departure = today.departureStatus;
  const locationVerified =
    today.geoVerified === null ? 'Not available' : today.geoVerified ? 'Yes' : 'No';

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 pb-6 sm:space-y-6">
      <PageHeader
        eyebrow="Attendance"
        title="Today's attendance"
        description={identity.campusName}
      />

      <ClockPanel
        identity={identity}
        attendance={today}
        onClockIn={onClockIn}
        onClockOut={onClockOut}
        onSubmitReason={onSubmitReason}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-lg font-semibold text-ink-900">Today&apos;s timeline</h2>
          <dl className="mt-3">
            <TimelineValue
              label="Clock in"
              value={today.clockInAt ? new Intl.DateTimeFormat('en-ZA', {
                timeZone: 'Africa/Johannesburg',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
              }).format(new Date(today.clockInAt)) : 'Not recorded'}
            />
            <TimelineValue
              label="Clock out"
              value={today.clockOutAt ? new Intl.DateTimeFormat('en-ZA', {
                timeZone: 'Africa/Johannesburg',
                hour: '2-digit',
                minute: '2-digit',
                hourCycle: 'h23',
              }).format(new Date(today.clockOutAt)) : 'Not recorded'}
            />
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-3">
              <dt className="text-sm text-ink-500">Arrival status</dt>
              <dd>
                {arrival
                  ? <StatusBadge category="arrival" status={arrival} />
                  : <span className="text-sm text-ink-500">Not recorded</span>}
              </dd>
            </div>
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-3">
              <dt className="text-sm text-ink-500">Departure status</dt>
              <dd>
                {departure
                  ? <StatusBadge category="departure" status={departure} />
                  : <span className="text-sm text-ink-500">Not recorded</span>}
              </dd>
            </div>
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border py-3">
              <dt className="text-sm text-ink-500">Work mode</dt>
              <dd><StatusBadge category="workMode" status={today.workMode} /></dd>
            </div>
            <TimelineValue label="Location verified" value={locationVerified} />
          </dl>
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-ink-900">Working-hours rules</h2>
          <ul className="mt-3 divide-y divide-border text-sm text-ink-700">
            <li className="py-3">Standard workday: 09:00 to 16:00</li>
            <li className="py-3">Clock-in window: 08:45 to 09:15</li>
            <li className="py-3">Clock-out window: 16:00 to 16:20</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
