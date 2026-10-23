import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'border border-primary-600 bg-primary-600 text-white hover:bg-primary-700',
  secondary: 'border border-border bg-card text-ink-900 hover:bg-surface',
  ghost: 'border border-transparent bg-transparent text-ink-700 hover:bg-surface',
  danger: 'border border-danger bg-danger text-white hover:opacity-90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 text-sm',
  md: 'px-4 text-sm',
  lg: 'px-5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`motion-interactive relative inline-flex min-h-11 items-center justify-center gap-2 rounded-control font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="motion-spinner absolute h-4 w-4 rounded-full border-2 border-current border-r-transparent"
        />
      )}
      <span className={loading ? 'invisible' : ''}>{children}</span>
    </button>
  );
}

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

const cardPadding: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
};

export function Card({
  padding = 'md',
  className = '',
  onClick,
  role,
  tabIndex,
  ...props
}: CardProps) {
  const isInteractive =
    onClick !== undefined ||
    role === 'button' ||
    role === 'link' ||
    tabIndex !== undefined;

  return (
    <div
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}
      {...props}
      className={`rounded-card border border-border bg-card shadow-soft ${isInteractive ? 'card-interactive' : ''} ${cardPadding[padding]} ${className}`}
    />
  );
}
