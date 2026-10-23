import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { icons } from '../icons';
import { arrivalStatus, departureStatus, promptStage, promptStatus, ticketStatus, ticketType, wfhStatus, workMode } from '../../lib/status';
import type { StatusTone } from '../../lib/status';
import { Button } from './button';

const toneClasses: Record<StatusTone, string> = {
  primary: 'border-primary-100 bg-primary-50 text-primary-700',
  success: 'border-success-soft bg-success-soft text-success',
  warning: 'border-warning-soft bg-warning-soft text-warning',
  danger: 'border-danger-soft bg-danger-soft text-danger',
  info: 'border-info-soft bg-info-soft text-info',
  neutral: 'border-border bg-surface text-ink-700',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone: StatusTone;
  icon?: LucideIcon;
  children: ReactNode;
};

export function Badge({
  tone,
  icon: Icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    >
      {Icon && <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </span>
  );
}

const statusMaps = {
  arrival: arrivalStatus,
  departure: departureStatus,
  wfh: wfhStatus,
  prompt: promptStatus,
  promptStage,
  ticket: ticketStatus,
  ticketType,
  workMode,
} as const;

export type StatusCategory = keyof typeof statusMaps;
export type StatusValue<Category extends StatusCategory> =
  keyof (typeof statusMaps)[Category] & string;

export type StatusBadgeProps<Category extends StatusCategory> = {
  category: Category;
  status: StatusValue<Category>;
  className?: string;
};

export function StatusBadge<Category extends StatusCategory>({
  category,
  status,
  className,
}: StatusBadgeProps<Category>) {
  const config = statusMaps[category][status];

  return (
    <Badge tone={config.tone} icon={config.icon} className={className}>
      {config.label}
    </Badge>
  );
}

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  variant?: 'text' | 'circular' | 'rectangular';
};

const skeletonVariants: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'h-4 w-full rounded-control',
  circular: 'h-10 w-10 rounded-full',
  rectangular: 'h-24 w-full rounded-card',
};

export function Skeleton({
  variant = 'text',
  className = '',
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={`animate-pulse bg-border ${skeletonVariants[variant]} ${className}`}
    />
  );
}

export type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: ButtonHTMLAttributes<HTMLButtonElement>['onClick'];
  };
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center px-4 py-10 text-center ${className}`}>
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Icon aria-hidden="true" className="h-6 w-6" />
        </span>
      )}
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>
      )}
      {action && (
        <Button className="mt-4" variant="secondary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export type ErrorStateProps = {
  title?: string;
  description: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center px-4 py-10 text-center ${className}`}
      role="alert"
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <icons.alert aria-hidden="true" className="h-6 w-6" />
      </span>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>
      {onRetry && (
        <Button className="mt-4" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export type ProgressTone = Extract<StatusTone, 'primary' | 'success' | 'warning' | 'danger' | 'info'>;

export type ProgressBarProps = {
  value: number;
  max?: number;
  label?: string;
  tone?: ProgressTone;
  showValue?: boolean;
  className?: string;
};

const progressTones: Record<ProgressTone, string> = {
  primary: 'bg-primary-600',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  tone = 'primary',
  showValue = false,
  className = '',
}: ProgressBarProps) {
  const percentage = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const roundedValue = Math.round(percentage);

  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
          {label && <span className="font-medium text-ink-700">{label}</span>}
          {showValue && <span className="text-ink-500">{roundedValue}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label ?? 'Progress'}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(max, Math.max(0, value))}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface"
      >
        <div
          aria-hidden="true"
          className={`h-full rounded-full transition-[width] ${progressTones[tone]}`}
          style={{ width: `${roundedValue}%` }}
        />
      </div>
    </div>
  );
}
