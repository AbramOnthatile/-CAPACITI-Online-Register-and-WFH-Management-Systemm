import { useMemo, useState } from 'react';
import { ChartCard, TrendBarChart } from '../../../../components/charts';
import type { TrendBarDatum } from '../../../../components/charts';
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
} from '../../../../components/ui';
import { arrivalStatus } from '../../../../lib/status';
import { formatDate, formatTime } from '../../../../lib/format';
import type { AttendanceRecord } from '../types';

export type HistoryPageProps = {
  records: AttendanceRecord[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
};

type AttendanceWeek = {
  key: string;
  monthLabel: string;
  weekLabel: string;
  records: AttendanceRecord[];
};

const dateAtNoon = (date: string) => new Date(`${date}T12:00:00+02:00`);

function weekStart(date: string): Date {
  const result = dateAtNoon(date);
  const weekday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - weekday);
  return result;
}

function weekEnd(start: Date): Date {
  const result = new Date(start);
  result.setDate(result.getDate() + 4);
  return result;
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function formatMonth(month: string): string {
  return new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    month: 'long',
    year: 'numeric',
  }).format(dateAtNoon(`${month}-01`));
}

function attendanceWeeks(records: AttendanceRecord[]): AttendanceWeek[] {
  const groups = new Map<string, AttendanceRecord[]>();
  for (const record of [...records].sort((a, b) =>
    b.attendanceDate.localeCompare(a.attendanceDate),
  )) {
    const start = weekStart(record.attendanceDate);
    const key = `${monthKey(record.attendanceDate)}:${start.toISOString().slice(0, 10)}`;
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }

  return [...groups.entries()].map(([key, grouped]) => {
    const [month] = key.split(':');
    const start = weekStart(grouped[0].attendanceDate);
    const end = weekEnd(start);
    const dateFormatter = new Intl.DateTimeFormat('en-ZA', {
      timeZone: 'Africa/Johannesburg',
      day: 'numeric',
      month: 'short',
    });
    return {
      key,
      monthLabel: formatMonth(month),
      weekLabel: `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`,
      records: grouped,
    };
  });
}

function HistoryLoading() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading attendance history">
      <Skeleton variant="rectangular" className="h-16" />
      <Skeleton variant="rectangular" className="h-56" />
      <Skeleton variant="rectangular" className="h-64" />
    </div>
  );
}

function arrivalFilterOptions() {
  return [
    { value: 'ALL', label: 'All statuses' },
    ...Object.entries(arrivalStatus).map(([value, config]) => ({
      value,
      label: config.label,
    })),
  ];
}

function PunctualityChart({ records }: { records: AttendanceRecord[] }) {
  const chartData: TrendBarDatum[] = [...records]
    .sort((left, right) => left.attendanceDate.localeCompare(right.attendanceDate))
    .map((record) => ({
      day: dateAtNoon(record.attendanceDate).toLocaleDateString('en-ZA', {
        timeZone: 'Africa/Johannesburg',
        day: 'numeric',
        month: 'short',
      }),
      present:
        record.arrivalStatus === 'ON_TIME' || record.arrivalStatus === 'LATE_EXCUSED'
          ? 1
          : 0,
      late: record.arrivalStatus === 'LATE_UNEXCUSED' ? 1 : 0,
      absent: record.arrivalStatus === 'ABSENT_UNEXCUSED' ? 1 : 0,
    }));

  return (
    <ChartCard
      title="Punctuality"
      subtitle="Daily attendance by arrival status"
      className="min-w-0"
    >
      <TrendBarChart data={chartData} className="h-40 sm:h-48" />
    </ChartCard>
  );
}

function HistoryEntry({ record }: { record: AttendanceRecord }) {
  return (
    <li className="flex flex-col gap-3 border-b border-border py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-ink-900">
          {formatDate(dateAtNoon(record.attendanceDate))}
        </p>
        <p className="mt-1 font-mono text-xs tabular-nums text-ink-500">
          {record.clockInAt ? formatTime(record.clockInAt) : '—'}
          {' – '}
          {record.clockOutAt ? formatTime(record.clockOutAt) : '—'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {record.arrivalStatus && (
          <StatusBadge category="arrival" status={record.arrivalStatus} />
        )}
        {record.departureStatus && (
          <StatusBadge category="departure" status={record.departureStatus} />
        )}
      </div>
    </li>
  );
}

export function HistoryPage({
  records,
  loading = false,
  error,
  onRetry,
}: HistoryPageProps) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const filteredRecords = useMemo(
    () => records.filter((record) =>
      statusFilter === 'ALL' || record.arrivalStatus === statusFilter,
    ),
    [records, statusFilter],
  );
  const weeks = useMemo(() => attendanceWeeks(filteredRecords), [filteredRecords]);
  const validArrivalStatus = statusFilter === 'ALL' ||
    Object.prototype.hasOwnProperty.call(arrivalStatus, statusFilter);

  if (loading) return <HistoryLoading />;
  if (error) return <ErrorState description={error} onRetry={onRetry} />;

  if (!validArrivalStatus) {
    return <ErrorState description="The selected attendance status is not valid." />;
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-4 pb-6 sm:space-y-6">
      <PageHeader
        eyebrow="Attendance"
        title="Attendance history"
        description="Review attendance by month and working week."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <PunctualityChart records={filteredRecords} />
        <Card className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">Filter history</h2>
          <Select
            label="Arrival status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.currentTarget.value)}
            options={arrivalFilterOptions()}
          />
        </Card>
      </div>

      {weeks.length === 0 ? (
        <Card>
          <EmptyState
            title={records.length === 0 ? 'No attendance history yet' : 'No matching attendance'}
            description={
              records.length === 0
                ? 'Attendance records will appear here when they are available.'
                : 'Try selecting a different arrival status.'
            }
          />
        </Card>
      ) : (
        <div className="motion-stagger space-y-4">
          {weeks.map((week) => (
            <Card key={week.key} className="motion-fade-up">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-3">
                <h2 className="font-display text-base font-semibold text-ink-900">
                  {week.monthLabel}
                </h2>
                <p className="text-sm text-ink-500">{week.weekLabel}</p>
              </div>
              <ul className="motion-stagger">
                {week.records.map((record) => (
                  <HistoryEntry key={record.id} record={record} />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
