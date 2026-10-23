import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { icons } from '../icons';
import {
  arrivalStatus,
  chartColor,
  workMode,
} from '../../lib/status';
import type { ArrivalStatus, StatusTone, WorkMode } from '../../lib/status';
import { formatDate, formatTime } from '../../lib/format';
import { Avatar } from './data-display';

export type ClockButtonState =
  | 'idle'
  | 'locating'
  | 'verifying'
  | 'success'
  | 'error'
  | 'clockedIn'
  | 'done';

export type ClockButtonProps = {
  state: ClockButtonState;
  label: string;
  sublabel?: string;
  onPress: () => void;
  disabled?: boolean;
};

const clockStateLabels: Record<ClockButtonState, string> = {
  idle: '',
  locating: 'Finding location',
  verifying: 'Verifying',
  success: 'Clocked in',
  error: 'Try again',
  clockedIn: 'Clock out',
  done: 'Day complete',
};

function elapsedLabel(startedAt: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function ClockButton({
  state,
  label,
  sublabel,
  onPress,
  disabled = false,
}: ClockButtonProps) {
  const [successSettled, setSuccessSettled] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const clockedInAt = useRef<number | null>(null);
  const visibleState = successSettled && state === 'success' ? 'clockedIn' : state;
  const isBusy = visibleState === 'locating' || visibleState === 'verifying';
  const isUnavailable = disabled || isBusy || visibleState === 'success' || visibleState === 'done';
  const displayLabel = visibleState === 'idle' ? label : clockStateLabels[visibleState];

  useEffect(() => {
    setSuccessSettled(false);
    if (state !== 'success') return;

    const timeout = window.setTimeout(() => setSuccessSettled(true), 900);
    return () => window.clearTimeout(timeout);
  }, [state]);

  useEffect(() => {
    if (visibleState !== 'clockedIn') {
      clockedInAt.current = null;
      return;
    }

    clockedInAt.current ??= Date.now();
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [visibleState]);

  const iconByState = {
    idle: icons.clockIn,
    locating: icons.location,
    verifying: icons.wifi,
    success: icons.check,
    error: icons.warning,
    clockedIn: icons.clockOut,
    done: icons.check,
  } satisfies Record<ClockButtonState, typeof icons.check>;
  const StateIcon = iconByState[visibleState];
  const buttonTone =
    visibleState === 'clockedIn'
      ? 'bg-gradient-ink'
      : visibleState === 'success'
        ? 'bg-success'
        : visibleState === 'error'
          ? 'bg-danger'
          : visibleState === 'done'
            ? 'bg-success-soft text-success'
            : 'bg-gradient-hero';
  const actionSublabel =
    visibleState === 'clockedIn' && clockedInAt.current !== null
      ? elapsedLabel(clockedInAt.current, now)
      : sublabel ?? (visibleState === 'idle' ? 'Tap to start' : undefined);
  const ringsVisible = visibleState === 'idle' || visibleState === 'clockedIn';
  const spinnerVisible = visibleState === 'locating' || visibleState === 'verifying';

  return (
    <div className="relative mx-auto h-[168px] w-[168px] sm:h-[200px] sm:w-[200px]">
      {ringsVisible && (
        <>
          <span
            aria-hidden="true"
            className={`motion-pulse-ring absolute inset-0 rounded-full text-primary-500 ${visibleState === 'clockedIn' ? 'text-ink-500' : ''}`}
          />
          <span
            aria-hidden="true"
            className={`motion-pulse-ring motion-pulse-ring-delayed absolute -inset-2 rounded-full text-primary-500 ${visibleState === 'clockedIn' ? 'text-ink-500' : ''}`}
          />
        </>
      )}
      {spinnerVisible && (
        <span
          aria-hidden="true"
          className={`motion-spinner absolute -inset-2 rounded-full border-2 ${visibleState === 'locating' ? 'border-dashed border-primary-500' : 'border-info border-t-transparent'}`}
        />
      )}
      <button
        type="button"
        role="button"
        disabled={isUnavailable}
        onClick={onPress}
        aria-label={`${displayLabel}${actionSublabel ? `, ${actionSublabel}` : ''}`}
        className={`motion-interactive relative flex h-full w-full flex-col items-center justify-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 focus-visible:ring-offset-4 disabled:cursor-not-allowed ${visibleState === 'done' ? 'text-success shadow-none' : 'text-white shadow-glow-primary'} ${buttonTone} ${visibleState === 'idle' ? 'motion-breathe' : ''} ${visibleState === 'success' ? 'ring-4 ring-success-soft' : ''} ${visibleState === 'error' ? 'motion-shake ring-4 ring-danger-soft' : ''} active:scale-[0.96] active:shadow-none`}
      >
        <StateIcon
          aria-hidden="true"
          className={`h-7 w-7 ${visibleState === 'success' || visibleState === 'done' ? 'motion-draw-check' : ''}`}
        />
        <span aria-live="polite" className="text-center text-base font-bold sm:text-lg">
          {displayLabel}
        </span>
        {actionSublabel && (
          <span
            className={`text-center text-xs sm:text-sm ${visibleState === 'clockedIn' ? 'font-mono' : 'opacity-85'}`}
          >
            {actionSublabel}
          </span>
        )}
      </button>
    </div>
  );
}

export type LiveClockProps = {
  serverTime: Date | string | number;
  variant?: 'pill' | 'hero';
  className?: string;
};

function toTimestamp(value: Date | string | number, name: string): number {
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError(`${name} must be a valid date or timestamp.`);
  }
  return timestamp;
}

export function LiveClock({
  serverTime,
  variant = 'pill',
  className = '',
}: LiveClockProps) {
  const serverOffset = useMemo(
    () => toTimestamp(serverTime, 'serverTime') - Date.now(),
    [serverTime],
  );
  const [now, setNow] = useState(() => Date.now() + serverOffset);

  useEffect(() => {
    setNow(Date.now() + serverOffset);
    const interval = window.setInterval(() => setNow(Date.now() + serverOffset), 1000);
    return () => window.clearInterval(interval);
  }, [serverOffset]);

  if (variant === 'hero') {
    return (
      <div className={`text-center ${className}`}>
        <time
          dateTime={new Date(now).toISOString()}
          className="font-mono text-4xl font-semibold tracking-tight text-ink-900 sm:text-6xl"
        >
          {formatTime(now)}
        </time>
        <p className="mt-2 text-sm text-ink-500">{formatDate(now)}</p>
      </div>
    );
  }

  return (
    <time
      dateTime={new Date(now).toISOString()}
      className={`inline-flex min-h-11 items-center rounded-full border border-border bg-card px-4 font-mono text-sm font-semibold text-ink-900 shadow-soft ${className}`}
    >
      {formatTime(now)}
    </time>
  );
}

export type WeekStripStatus = ArrivalStatus | 'WFH' | 'NONE';

export type WeekStripDay = {
  date: string;
  status: WeekStripStatus;
  hoursLabel: string;
};

export type WeekStripProps = {
  days: WeekStripDay[];
  today: string;
  className?: string;
};

function weekdayKeys(today: string): string[] {
  const parsed = new Date(`${today.slice(0, 10)}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return [];

  const weekday = parsed.getUTCDay();
  const daysSinceMonday = (weekday + 6) % 7;
  parsed.setUTCDate(parsed.getUTCDate() - daysSinceMonday);

  return Array.from({ length: 5 }, (_, index) => {
    const day = new Date(parsed);
    day.setUTCDate(parsed.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

const weekdayFormatter = new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  weekday: 'short',
});

export function WeekStrip({ days, today, className = '' }: WeekStripProps) {
  const daysByDate = new Map(days.map((day) => [day.date.slice(0, 10), day]));
  const dates = weekdayKeys(today);

  return (
    <div
      aria-label="Work week attendance"
      role="list"
      className={`flex gap-2 overflow-x-auto pb-1 ${className}`}
    >
      {dates.map((date) => {
        const day = daysByDate.get(date);
        const isToday = date === today.slice(0, 10);
        const dotColor =
          day?.status === 'WFH'
            ? chartColor('WFH')
            : day && day.status !== 'NONE'
              ? chartColor(day.status)
              : undefined;
        const label = day?.status === 'WFH'
          ? workMode.WFH.label
          : day && day.status !== 'NONE'
            ? arrivalStatus[day.status].label
            : 'No attendance';

        return (
          <div
            key={date}
            aria-current={isToday ? 'date' : undefined}
            role="listitem"
            aria-label={`${weekdayFormatter.format(new Date(`${date}T12:00:00Z`))} ${date.slice(-2)}: ${label}, ${day?.hoursLabel || 'no hours recorded'}`}
            className={`flex min-w-[4.25rem] flex-1 flex-col items-center gap-1 rounded-control border px-2 py-3 text-center ${isToday ? 'border-primary-600 ring-2 ring-primary-100' : 'border-border'} bg-card`}
          >
            <span className="text-xs font-semibold text-ink-500">
              {weekdayFormatter.format(new Date(`${date}T12:00:00Z`))}
            </span>
            <span className="text-sm font-semibold text-ink-900">
              {Number(date.slice(-2))}
            </span>
            <span
              aria-hidden="true"
              title={label}
              className={`h-2.5 w-2.5 rounded-full ${dotColor ? '' : 'bg-border'}`}
              style={dotColor ? { backgroundColor: dotColor } : undefined}
            />
            <span className="max-w-full truncate text-[0.65rem] text-ink-500">
              {day?.hoursLabel || '—'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export type PageHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
  variant?: 'default' | 'gradient';
  className?: string;
};

export function PageHero({
  eyebrow,
  title,
  subtitle,
  action,
  variant = 'default',
  className = '',
}: PageHeroProps) {
  return (
    <section
      className={`flex flex-col gap-5 rounded-card p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8 ${variant === 'gradient' ? 'bg-gradient-hero text-white shadow-glow-primary' : 'border border-border bg-card text-ink-900 shadow-soft'} ${className}`}
    >
      <div className="min-w-0">
        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${variant === 'gradient' ? 'text-white/80' : 'text-primary-600'}`}>
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className={`mt-2 max-w-2xl text-sm sm:text-base ${variant === 'gradient' ? 'text-white/85' : 'text-ink-500'}`}>
          {subtitle}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </section>
  );
}

export type UserCardProps = {
  name: string;
  role: string;
  campus: string;
  champion: boolean;
  className?: string;
};

export function UserCard({
  name,
  role,
  campus,
  champion,
  className = '',
}: UserCardProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 rounded-card border border-border bg-card p-3 ${className}`}>
      <Avatar name={name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
        <p className="truncate text-xs text-ink-500">{campus}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">
            {role}
          </span>
          {champion && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning">
              <icons.flag aria-hidden="true" className="h-3 w-3" />
              Champion
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export type ModeBadgeProps = {
  mode: WorkMode;
  className?: string;
};

const toneClasses: Record<StatusTone, string> = {
  primary: 'border-primary-100 bg-primary-50 text-primary-700',
  success: 'border-success-soft bg-success-soft text-success',
  warning: 'border-warning-soft bg-warning-soft text-warning',
  danger: 'border-danger-soft bg-danger-soft text-danger',
  info: 'border-info-soft bg-info-soft text-info',
  neutral: 'border-border bg-surface text-ink-700',
};

export function ModeBadge({ mode, className = '' }: ModeBadgeProps) {
  const config = workMode[mode];
  const ModeIcon = config.icon;

  return (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[config.tone]} ${className}`}>
      <ModeIcon aria-hidden="true" className="h-4 w-4" />
      {config.label}
    </span>
  );
}

export type CountdownRingProps = {
  expiresAt: Date | string | number;
  serverTime: Date | string | number;
  totalSeconds: number;
  onExpire: () => void;
  className?: string;
};

function countdownSeconds(expiresAt: number, serverOffset: number): number {
  return Math.max(0, Math.ceil((expiresAt - (Date.now() + serverOffset)) / 1000));
}

function mmss(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export function CountdownRing({
  expiresAt,
  serverTime,
  totalSeconds,
  onExpire,
  className = '',
}: CountdownRingProps) {
  const expiryTimestamp = useMemo(
    () => toTimestamp(expiresAt, 'expiresAt'),
    [expiresAt],
  );
  const serverOffset = useMemo(
    () => toTimestamp(serverTime, 'serverTime') - Date.now(),
    [serverTime],
  );
  const [secondsLeft, setSecondsLeft] = useState(() =>
    countdownSeconds(expiryTimestamp, serverOffset),
  );
  const onExpireRef = useRef(onExpire);
  const expiredRef = useRef(false);
  const safeTotalSeconds = Math.max(1, totalSeconds);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    expiredRef.current = false;
    const tick = () => setSecondsLeft(countdownSeconds(expiryTimestamp, serverOffset));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [expiryTimestamp, serverOffset]);

  useEffect(() => {
    if (
      secondsLeft > 0 ||
      countdownSeconds(expiryTimestamp, serverOffset) > 0 ||
      expiredRef.current
    ) return;
    expiredRef.current = true;
    onExpireRef.current();
  }, [secondsLeft, expiryTimestamp, serverOffset]);

  const progress = Math.min(1, Math.max(0, secondsLeft / safeTotalSeconds));
  const tone: StatusTone =
    secondsLeft < 60 ? 'danger' : secondsLeft < 300 ? 'warning' : 'primary';
  const strokeClasses: Record<StatusTone, string> = {
    primary: 'text-primary-600',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
    neutral: 'text-ink-500',
  };
  const circumference = 2 * Math.PI * 45;

  return (
    <div
      role="timer"
      aria-label={`${mmss(secondsLeft)} remaining`}
      className={`relative h-28 w-28 ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-surface"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={`motion-progress-fill ${strokeClasses[tone]}`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-mono text-xl font-semibold ${tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-primary-600'}`}>
        {mmss(secondsLeft)}
      </span>
    </div>
  );
}
