import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  ChartCard,
  DonutChart,
  HorizontalBarChart,
  MiniProgress,
  StackedBarChart,
  TrendBarChart,
} from '../../../components/charts';
import type {
  DonutDatum,
  HorizontalBarDatum,
  StackedBarDatum,
  StackedBarSeries,
  TrendBarDatum,
} from '../../../components/charts';
import { icons } from '../../../components/icons';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  StatCard,
  Table,
} from '../../../components/ui';
import type { TableColumn } from '../../../components/ui';
import { formatDate } from '../../../lib/format';

const MAX_RANGE_DAYS = 366;
const DEFAULT_RANGE_DAYS = 30;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type ReportDateRange = {
  from: string;
  to: string;
};

export type ReportsCandidate = {
  id: string;
  name: string;
  punctuality: number;
};

export type ReportsStatData = {
  attendanceRate: number;
  onTimeRate: number;
  lateCount: number;
  absentCount: number;
  wfhDays: number;
  pendingWfh: number;
  prolongedBlockers: number;
  aiFlagged: number;
};

export type ReportsViewData = {
  stats: ReportsStatData;
  trend: TrendBarDatum[];
  arrivalCounts: DonutDatum[];
  workModeCounts: DonutDatum[];
  departureCounts: HorizontalBarDatum[];
  candidates: ReportsCandidate[];
  promptCompletion: {
    data: StackedBarDatum[];
    series: StackedBarSeries[];
  };
  wfhRequestCounts: Array<{
    label: string;
    count: number;
  }>;
};

export type ReportsPageProps = {
  data: ReportsViewData | null;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onDateRangeChange?: (range: ReportDateRange) => void;
};

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultDateRange(): ReportDateRange {
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((datePart) => datePart.type === type)?.value ?? '';
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  const to = new Date(`${today}T00:00:00Z`);
  const from = new Date(to.getTime() - (DEFAULT_RANGE_DAYS - 1) * MILLISECONDS_PER_DAY);
  return {
    from: toDateInputValue(from),
    to: toDateInputValue(to),
  };
}

function inclusiveRangeDays(range: ReportDateRange): number {
  const from = Date.parse(`${range.from}T00:00:00Z`);
  const to = Date.parse(`${range.to}T00:00:00Z`);
  return Math.floor((to - from) / MILLISECONDS_PER_DAY) + 1;
}

function displayDate(date: string): string {
  return formatDate(new Date(`${date}T12:00:00+02:00`));
}

type DateRangeSelectorProps = {
  value: ReportDateRange;
  onChange: (range: ReportDateRange) => void;
};

function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [validationError, setValidationError] = useState('');

  const updateRange = (next: ReportDateRange) => {
    if (!next.from || !next.to) {
      onChange(next);
      setValidationError('');
      return;
    }

    if (next.from > next.to) {
      setValidationError('The start date must be on or before the end date.');
      return;
    }
    if (inclusiveRangeDays(next) > MAX_RANGE_DAYS) {
      setValidationError(`Choose a date range of ${MAX_RANGE_DAYS} days or less.`);
      return;
    }

    setValidationError('');
    onChange(next);
  };

  const earliestFrom = value.to
    ? toDateInputValue(
        new Date(Date.parse(`${value.to}T00:00:00Z`) - (MAX_RANGE_DAYS - 1) * MILLISECONDS_PER_DAY),
      )
    : undefined;
  const latestTo = value.from
    ? toDateInputValue(
        new Date(Date.parse(`${value.from}T00:00:00Z`) + (MAX_RANGE_DAYS - 1) * MILLISECONDS_PER_DAY),
      )
    : undefined;

  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-ink-900">Date range</h2>
        <p className="mt-1 text-sm text-ink-500">
          Select a period of up to {MAX_RANGE_DAYS} days.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="date"
          label="From"
          value={value.from}
          min={earliestFrom}
          max={value.to || undefined}
          onChange={(event) =>
            updateRange({ ...value, from: event.currentTarget.value })
          }
          error={validationError || undefined}
        />
        <Input
          type="date"
          label="To"
          value={value.to}
          min={value.from || undefined}
          max={latestTo}
          onChange={(event) =>
            updateRange({ ...value, to: event.currentTarget.value })
          }
        />
      </div>
      {earliestFrom && value.from && value.to && (
        <p className="text-xs text-ink-500" aria-live="polite">
          Selected period: {displayDate(value.from)} – {displayDate(value.to)}
        </p>
      )}
    </Card>
  );
}

function ReportLoadingState() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading reports">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Card key={index} className="space-y-3">
            <Skeleton className="w-2/3" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="w-1/3" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index}>
            <Skeleton className="mb-4 w-1/2" />
            <Skeleton variant="rectangular" className="h-52" />
          </Card>
        ))}
      </div>
      <span className="sr-only">Loading report data</span>
    </div>
  );
}

function csvCell(value: string | number): string {
  const content = String(value);
  return `"${content.replaceAll('"', '""')}"`;
}

function downloadCandidatesCsv(candidates: ReportsCandidate[]) {
  const rows = [
    ['Candidate', 'Punctuality (%)'],
    ...candidates.map((candidate) => [candidate.name, candidate.punctuality]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'candidate-punctuality.csv';
  link.click();
  URL.revokeObjectURL(url);
}

const candidateColumns: TableColumn<ReportsCandidate>[] = [
  {
    key: 'candidate',
    header: 'Candidate',
    render: (candidate) => (
      <span className="font-medium text-ink-900">{candidate.name}</span>
    ),
  },
  {
    key: 'punctuality',
    header: 'Punctuality',
    render: (candidate) => (
      <div className="min-w-36">
        <MiniProgress
          percentage={candidate.punctuality}
          colorKey="ON_TIME"
          label={`${candidate.name} punctuality`}
        />
      </div>
    ),
  },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`reports-${title.toLowerCase().replaceAll(' ', '-')}`}>
      <h2
        id={`reports-${title.toLowerCase().replaceAll(' ', '-')}`}
        className="mb-3 font-display text-lg font-semibold text-ink-900"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ReportsPage({
  data,
  loading = false,
  error,
  onRetry,
  onDateRangeChange,
}: ReportsPageProps) {
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const hasData = data !== null;

  const handleDateRangeChange = (nextRange: ReportDateRange) => {
    setDateRange(nextRange);
    onDateRangeChange?.(nextRange);
  };

  const statCards = data
    ? [
        { label: 'Attendance rate', value: `${data.stats.attendanceRate}%`, icon: icons.attendance },
        { label: 'On-time rate', value: `${data.stats.onTimeRate}%`, icon: icons.check },
        { label: 'Late count', value: data.stats.lateCount, icon: icons.clockIn },
        { label: 'Absent count', value: data.stats.absentCount, icon: icons.close },
        { label: 'WFH days', value: data.stats.wfhDays, icon: icons.mode.wfh },
        { label: 'Pending WFH', value: data.stats.pendingWfh, icon: icons.wfh },
        { label: 'Prolonged blockers', value: data.stats.prolongedBlockers, icon: icons.tickets },
        { label: 'AI flagged', value: data.stats.aiFlagged, icon: icons.alert },
      ]
    : [];

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary-700">Analytics</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Attendance, work-from-home, and prompt completion summaries.
          </p>
        </div>
        {data && (
          <Button
            variant="secondary"
            disabled={data.candidates.length === 0}
            onClick={() => downloadCandidatesCsv(data.candidates)}
          >
            <icons.download aria-hidden="true" className="h-4 w-4" />
            Download CSV
          </Button>
        )}
      </header>

      <DateRangeSelector
        value={dateRange}
        onChange={handleDateRangeChange}
      />

      {loading ? (
        <ReportLoadingState />
      ) : error ? (
        <Card>
          <ErrorState
            title="Reports could not be loaded"
            description={error}
            onRetry={onRetry}
          />
        </Card>
      ) : !hasData || !data ? (
        <Card>
          <EmptyState
            title="No reports available"
            description="There is no report data for the selected date range."
            icon={icons.reports}
          />
        </Card>
      ) : (
        <>
          <Section title="Overview">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {statCards.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  icon={stat.icon}
                />
              ))}
            </div>
          </Section>

          <Section title="Attendance">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard
                title="Attendance trend"
                subtitle="Present, late, and absent attendance by day."
              >
                <TrendBarChart data={data.trend} />
              </ChartCard>
              <ChartCard title="Arrival counts" subtitle="Arrival status distribution.">
                <DonutChart data={data.arrivalCounts} />
              </ChartCard>
              <ChartCard title="Work mode" subtitle="On-site and work-from-home days.">
                <DonutChart data={data.workModeCounts} />
              </ChartCard>
              <ChartCard title="Departure counts" subtitle="Departure status distribution.">
                <HorizontalBarChart data={data.departureCounts} />
              </ChartCard>
            </div>
          </Section>

          <Section title="Candidates">
            <Card padding="none" className="overflow-hidden">
              <Table
                caption="Candidate punctuality report"
                columns={candidateColumns}
                rows={data.candidates}
                rowKey={(candidate) => candidate.id}
                emptyState={
                  <p className="px-4 py-8 text-center text-sm text-ink-500">
                    No candidate data is available for this date range.
                  </p>
                }
              />
            </Card>
          </Section>

          <Section title="Prompts and WFH requests">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Prompt completion" subtitle="Completion by prompt stage.">
                <StackedBarChart
                  data={data.promptCompletion.data}
                  series={data.promptCompletion.series}
                />
              </ChartCard>
              <ChartCard title="WFH requests" subtitle="Request counts by period.">
                <StackedBarChart
                  data={data.wfhRequestCounts.map((item) => ({
                    label: item.label,
                    requests: item.count,
                  }))}
                  series={[
                    { key: 'requests', label: 'Requests', colorKey: 'WFH' },
                  ]}
                />
              </ChartCard>
            </div>
          </Section>
        </>
      )}
    </main>
  );
}
