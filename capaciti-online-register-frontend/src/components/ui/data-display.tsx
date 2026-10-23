import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './button';
import { icons } from '../icons';
import { useCountUp } from '../../lib/useCountUp';

export type StatTrend = {
  value: string;
  label?: string;
  direction: 'up' | 'down' | 'neutral';
};

export type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  trend?: StatTrend;
  className?: string;
};

const trendClasses: Record<StatTrend['direction'], string> = {
  up: 'border-success-soft bg-success-soft text-success',
  down: 'border-danger-soft bg-danger-soft text-danger',
  neutral: 'border-primary-100 bg-primary-50 text-primary-700',
};

const trendIcons = {
  up: icons.trendUp,
  down: icons.trendDown,
  neutral: null,
} as const;

type NumericValue = {
  target: number;
  prefix: string;
  suffix: string;
  decimals: number;
};

function getNumericValue(value: ReactNode): NumericValue | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return { target: value, prefix: '', suffix: '', decimals: 0 };
  }
  if (typeof value !== 'string') return null;

  const match = value.trim().match(/^([^0-9-]*)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
  if (!match) return null;

  const numeric = Number(match[2].replaceAll(',', ''));
  if (!Number.isFinite(numeric)) return null;

  return {
    target: numeric,
    prefix: match[1],
    suffix: match[3],
    decimals: match[2].split('.')[1]?.length ?? 0,
  };
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className = '',
}: StatCardProps) {
  const numericValue = getNumericValue(value);
  const count = useCountUp(numericValue?.target ?? 0);
  const formattedCount = numericValue
    ? `${numericValue.prefix}${count.toLocaleString('en-ZA', {
        minimumFractionDigits: numericValue.decimals,
        maximumFractionDigits: numericValue.decimals,
      })}${numericValue.suffix}`
    : value;
  const iconTone = trend?.direction ?? 'neutral';
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <Card className={className}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 break-words font-display text-2xl font-bold tabular-nums tracking-tight text-ink-900">
            {formattedCount}
          </p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-control ${trendClasses[iconTone]}`}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {trend && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${trendClasses[trend.direction]}`}>
              {TrendIcon && <TrendIcon aria-hidden="true" className="h-3.5 w-3.5" />}
              {trend.value}
            </span>
          )}
          {(trend?.label || hint) && (
            <span className="text-ink-500">{trend?.label ?? hint}</span>
          )}
        </div>
      )}
    </Card>
  );
}

export type TableColumn<Row> = {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
  className?: string;
};

export type TableProps<Row> = {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  caption: string;
  emptyState?: ReactNode;
  className?: string;
};

export function Table<Row>({
  columns,
  rows,
  rowKey,
  caption,
  emptyState,
  className = '',
}: TableProps<Row>) {
  return (
    <div className={`max-h-[70vh] w-full overflow-auto rounded-card border border-border ${className}`}>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10 bg-surface text-xs font-semibold uppercase tracking-wide text-ink-500">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`whitespace-nowrap px-4 py-3 ${column.className ?? ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="motion-stagger divide-y divide-border bg-card">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="text-ink-700 hover:bg-primary-50/60">
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-4 py-3 ${column.className ?? ''}`}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="min-w-[18rem]">
          {emptyState ?? (
            <p className="px-4 py-8 text-center text-sm text-ink-500">
              No data available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export type CountdownProps = {
  expiresAt: Date | string | number;
  serverTime: Date | string | number;
  onExpire: () => void;
  className?: string;
};

function toTimestamp(value: Date | string | number, name: string): number {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError(`${name} must be a valid date or timestamp.`);
  }
  return timestamp;
}

function remainingSeconds(expiresAt: number, serverOffset: number): number {
  return Math.max(0, Math.ceil((expiresAt - (Date.now() + serverOffset)) / 1000));
}

function formatCountdown(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function Countdown({
  expiresAt,
  serverTime,
  onExpire,
  className = '',
}: CountdownProps) {
  const expiryTimestamp = useMemo(
    () => toTimestamp(expiresAt, 'expiresAt'),
    [expiresAt],
  );
  const serverOffset = useMemo(
    () => toTimestamp(serverTime, 'serverTime') - Date.now(),
    [serverTime],
  );
  const [secondsLeft, setSecondsLeft] = useState(() =>
    remainingSeconds(expiryTimestamp, serverOffset),
  );
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    const updateRemaining = () => {
      const nextSeconds = remainingSeconds(expiryTimestamp, serverOffset);
      setSecondsLeft(nextSeconds);
      if (nextSeconds === 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    };

    updateRemaining();
    const intervalId = window.setInterval(updateRemaining, 1000);
    return () => window.clearInterval(intervalId);
  }, [expiryTimestamp, serverOffset]);

  return (
    <time
      className={`font-mono tabular-nums text-ink-900 ${className}`}
      dateTime={new Date(Date.now() + serverOffset + secondsLeft * 1000).toISOString()}
      aria-label={`${secondsLeft} seconds remaining`}
    >
      {formatCountdown(secondsLeft)}
    </time>
  );
}

export type AvatarProps = {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const avatarSizes: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const accessibleName = name.trim() || 'Unknown user';
  const initials = accessibleName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join('');

  return (
    <span
      aria-label={accessibleName}
      role="img"
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-700 ${avatarSizes[size]} ${className}`}
    >
      {initials || '?'}
    </span>
  );
}
