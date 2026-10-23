import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartColor } from '../../lib/status';
import type { ChartColorKey } from '../../lib/status';
import { icons } from '../icons';
import { Card } from '../ui/button';
import { EmptyState, Skeleton } from '../ui/feedback';

export type ChartCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  className?: string;
};

function ChartLoadingState() {
  return (
    <div className="space-y-4 px-2 py-5" aria-label="Loading chart" role="status">
      <Skeleton variant="rectangular" className="h-48" />
      <span className="sr-only">Loading chart data</span>
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  loading = false,
  empty = false,
  emptyMessage = 'There is no chart data to display.',
  className = '',
}: ChartCardProps) {
  return (
    <Card className={`min-w-0 overflow-hidden ${className}`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-base font-semibold text-ink-900 sm:text-lg">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {loading ? (
        <ChartLoadingState />
      ) : empty ? (
        <EmptyState
          title="No chart data"
          description={emptyMessage}
          icon={icons.reports}
          className="py-8"
        />
      ) : (
        children
      )}
    </Card>
  );
}

type TooltipEntry = {
  name?: string | number;
  value?: number | string;
  color?: string;
};

type SharedTooltipProps = {
  active?: boolean;
  label?: string | number;
  payload?: TooltipEntry[];
};

function SharedTooltip({ active, label, payload }: SharedTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="max-w-[calc(100vw-2rem)] rounded-control border border-border bg-card px-3 py-2 shadow-soft">
      {label !== undefined && (
        <p className="mb-1 text-xs font-semibold text-ink-900">{label}</p>
      )}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li
            key={`${String(entry.name ?? 'value')}-${index}`}
            className="flex items-center gap-2 text-xs text-ink-700"
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? 'var(--color-ink-500)' }}
            />
            <span>{entry.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-ink-900">
              {entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type ChartLegendItem = {
  key: string;
  label: string;
  color: string;
};

function ChartLegend({ items }: { items: ChartLegendItem[] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2" aria-label="Chart legend">
      {items.map((item) => (
        <li key={item.key} className="inline-flex items-center gap-1.5 text-xs text-ink-700">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

type ChartSurfaceProps = {
  children: ReactNode;
  className?: string;
};

function ChartSurface({ children, className = '' }: ChartSurfaceProps) {
  return (
    <div className={`motion-chart-draw h-56 min-w-0 w-full sm:h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

type ChartStateProps = {
  loading?: boolean;
  empty: boolean;
  emptyMessage?: string;
  children: ReactNode;
};

function ChartState({
  loading = false,
  empty,
  emptyMessage = 'There is no chart data to display.',
  children,
}: ChartStateProps) {
  if (loading) {
    return <ChartLoadingState />;
  }
  if (empty) {
    return (
      <EmptyState
        title="No chart data"
        description={emptyMessage}
        icon={icons.reports}
        className="py-8"
      />
    );
  }
  return <>{children}</>;
}

const xAxisProps = {
  axisLine: { stroke: 'var(--color-border)' },
  tickLine: false,
  tick: { fill: 'var(--color-ink-500)', fontSize: 11 },
  tickMargin: 8,
  minTickGap: 12,
} as const;

const yAxisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fill: 'var(--color-ink-500)', fontSize: 11 },
  width: 36,
} as const;

const gridProps = {
  stroke: 'var(--color-border)',
  strokeDasharray: '3 3',
  vertical: false,
} as const;

export type TrendBarDatum = {
  day: string;
  present: number;
  late: number;
  absent: number;
};

export type TrendBarChartProps = {
  data: TrendBarDatum[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function TrendBarChart({
  data,
  loading = false,
  emptyMessage,
  className,
}: TrendBarChartProps) {
  const series = [
    { key: 'present', label: 'Present', color: chartColor('ON_TIME') },
    { key: 'late', label: 'Late', color: chartColor('LATE_UNEXCUSED') },
    { key: 'absent', label: 'Absent', color: chartColor('ABSENT_UNEXCUSED') },
  ];

  return (
    <ChartState loading={loading} empty={data.length === 0} emptyMessage={emptyMessage}>
      <ChartSurface className={className}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis
            {...xAxisProps}
            dataKey="day"
            tickFormatter={(value: string) => value.slice(0, 3)}
          />
          <YAxis {...yAxisProps} allowDecimals={false} />
          <Tooltip content={<SharedTooltip />} cursor={{ fill: 'var(--color-surface)' }} />
          {series.map((item) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stackId="attendance"
              fill={item.color}
              isAnimationActive={false}
              radius={item.key === 'absent' ? [3, 3, 0, 0] : undefined}
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ChartSurface>
      <ChartLegend items={series.map((item) => ({ ...item }))} />
    </ChartState>
  );
}

export type DonutDatum = {
  key: ChartColorKey;
  value: number;
  label?: string;
};

export type DonutChartProps = {
  data: DonutDatum[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  totalLabel?: string;
};

export function DonutChart({
  data,
  loading = false,
  emptyMessage,
  className,
  totalLabel = 'Total',
}: DonutChartProps) {
  const validData = data
    .filter((item) => item.value > 0)
    .map((item) => ({
      ...item,
      chartLabel: item.label ?? item.key.replaceAll('_', ' '),
    }));
  const total = validData.reduce((sum, item) => sum + item.value, 0);
  const legendItems = validData.map((item) => ({
    key: item.key,
    label: item.chartLabel,
    color: chartColor(item.key),
  }));

  return (
    <ChartState loading={loading} empty={validData.length === 0} emptyMessage={emptyMessage}>
      <div className={`relative ${className ?? ''}`}>
        <ChartSurface>
          <PieChart>
            <Tooltip content={<SharedTooltip />} />
            <Pie
              data={validData}
              dataKey="value"
              nameKey="chartLabel"
              innerRadius="62%"
              outerRadius="82%"
              paddingAngle={2}
              stroke="var(--color-card)"
              strokeWidth={3}
              isAnimationActive={false}
            >
              {validData.map((item) => (
                <Cell key={item.key} fill={chartColor(item.key)} />
              ))}
            </Pie>
          </PieChart>
        </ChartSurface>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold tabular-nums text-ink-900">
            {total.toLocaleString()}
          </span>
          <span className="text-xs text-ink-500">{totalLabel}</span>
        </div>
      </div>
      <ChartLegend items={legendItems} />
    </ChartState>
  );
}

export type HorizontalBarDatum = {
  key: ChartColorKey;
  label: string;
  value: number;
};

export type HorizontalBarChartProps = {
  data: HorizontalBarDatum[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
};

export function HorizontalBarChart({
  data,
  loading = false,
  emptyMessage,
  className,
}: HorizontalBarChartProps) {
  const colorMap = new Map(data.map((item) => [item.key, chartColor(item.key)]));

  return (
    <ChartState loading={loading} empty={data.length === 0} emptyMessage={emptyMessage}>
      <ChartSurface className={className}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 10, left: 4, bottom: 0 }}
        >
          <CartesianGrid {...gridProps} horizontal={false} vertical />
          <XAxis
            type="number"
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={false}
            tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }}
            allowDecimals={false}
          />
          <YAxis
            {...yAxisProps}
            type="category"
            dataKey="label"
            width={90}
            tickFormatter={(value: string) =>
              value.length > 14 ? `${value.slice(0, 12)}…` : value
            }
          />
          <Tooltip content={<SharedTooltip />} cursor={{ fill: 'var(--color-surface)' }} />
          <Bar
            dataKey="value"
            name="Count"
            radius={[0, 4, 4, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          >
            {data.map((item) => (
              <Cell key={item.key} fill={colorMap.get(item.key)} />
            ))}
          </Bar>
        </BarChart>
      </ChartSurface>
    </ChartState>
  );
}

export type StackedBarSeries = {
  key: string;
  label: string;
  colorKey: ChartColorKey;
};

export type StackedBarDatum = {
  label: string;
  [key: string]: string | number;
};

export type StackedBarChartProps = {
  data: StackedBarDatum[];
  series: StackedBarSeries[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  layout?: 'horizontal' | 'vertical';
};

export function StackedBarChart({
  data,
  series,
  loading = false,
  emptyMessage,
  className,
  layout = 'horizontal',
}: StackedBarChartProps) {
  const legendItems = series.map((item) => ({
    key: item.key,
    label: item.label,
    color: chartColor(item.colorKey),
  }));

  return (
    <ChartState
      loading={loading}
      empty={data.length === 0 || series.length === 0}
      emptyMessage={emptyMessage}
    >
      <ChartSurface className={className}>
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 4, right: 4, left: layout === 'vertical' ? 4 : -20, bottom: 0 }}
        >
          <CartesianGrid
            {...gridProps}
            horizontal={layout !== 'vertical'}
            vertical={layout === 'vertical'}
          />
          {layout === 'horizontal' ? (
            <>
              <XAxis
                {...xAxisProps}
                dataKey="label"
                tickFormatter={(value: string) => value.slice(0, 3)}
              />
              <YAxis {...yAxisProps} allowDecimals={false} />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
                tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--color-ink-500)', fontSize: 11 }}
                width={88}
                tickFormatter={(value: string) =>
                  value.length > 14 ? `${value.slice(0, 12)}…` : value
                }
              />
            </>
          )}
          <Tooltip content={<SharedTooltip />} cursor={{ fill: 'var(--color-surface)' }} />
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stackId="stacked"
              fill={chartColor(item.colorKey)}
              isAnimationActive={false}
              radius={
                index === series.length - 1
                  ? layout === 'horizontal'
                    ? [3, 3, 0, 0]
                    : [0, 3, 3, 0]
                  : undefined
              }
              maxBarSize={36}
            />
          ))}
        </BarChart>
      </ChartSurface>
      <ChartLegend items={legendItems} />
    </ChartState>
  );
}

export type SparklineProps = {
  data: number[];
  colorKey?: ChartColorKey;
  label: string;
  loading?: boolean;
  className?: string;
};

export function Sparkline({
  data,
  colorKey = 'ON_TIME',
  label,
  loading = false,
  className = '',
}: SparklineProps) {
  const values = data.map((value, index) => ({ index, value }));

  if (loading) {
    return <Skeleton variant="rectangular" className={`h-10 ${className}`} />;
  }
  if (data.length === 0) {
    return (
      <span className={`text-xs text-ink-500 ${className}`} role="status">
        No trend data
      </span>
    );
  }

  return (
    <div className={`h-10 min-w-0 w-full ${className}`} role="img" aria-label={`${label} trend`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={values} margin={{ top: 4, right: 1, left: 1, bottom: 4 }}>
          <Tooltip content={<SharedTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name={label}
            stroke={chartColor(colorKey)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export type MiniProgressProps = {
  percentage: number;
  colorKey?: ChartColorKey;
  label?: string;
  showValue?: boolean;
  loading?: boolean;
  className?: string;
};

export function MiniProgress({
  percentage,
  colorKey = 'ON_TIME',
  label = 'Progress',
  showValue = true,
  loading = false,
  className = '',
}: MiniProgressProps) {
  if (loading) {
    return <Skeleton className={`h-2 ${className}`} />;
  }

  const value = Number.isFinite(percentage)
    ? Math.min(100, Math.max(0, percentage))
    : 0;
  const roundedValue = Math.round(value);

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`}>
      <div
        className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={roundedValue}
      >
        <div
          aria-hidden="true"
          className="motion-progress-fill h-full rounded-full"
          style={{
          transform: `scaleX(${value / 100})`,
          backgroundColor: chartColor(colorKey),
          }}
        />
      </div>
      {showValue && (
        <span className="shrink-0 text-xs tabular-nums text-ink-700">{roundedValue}%</span>
      )}
    </div>
  );
}

export type {
  ChartColorKey,
};
