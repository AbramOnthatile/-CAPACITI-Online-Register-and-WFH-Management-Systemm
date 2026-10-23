import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card } from './button';

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
  up: 'text-success',
  down: 'text-danger',
  neutral: 'text-ink-500',
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className = '',
}: StatCardProps) {
  return (
    <Card className={className}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-ink-900">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-primary-50 text-primary-600">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>
      {(hint || trend) && (
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          {trend && (
            <span className={`font-semibold ${trendClasses[trend.direction]}`}>
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
    <div className={`w-full overflow-x-auto rounded-card border border-border ${className}`}>
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface text-xs font-semibold uppercase tracking-wide text-ink-500">
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
        <tbody className="divide-y divide-border bg-card">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="text-ink-700">
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
