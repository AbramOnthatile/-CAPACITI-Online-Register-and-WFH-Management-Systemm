import {
  createContext,
  createPortal,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { icons } from '../icons';
import type { StatusTone } from '../../lib/status';
import { Button } from './button';
import { Badge } from './feedback';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
};

function DialogSurface({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeLabel = 'Close dialog',
  sheet,
}: DialogProps & { sheet: boolean }) {
  const id = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialog = dialogRef.current;
    const firstFocusable = dialog?.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    (firstFocusable ?? dialog)?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) {
        return;
      }
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const dialog = (
    <div
      className={`fixed inset-0 z-50 flex bg-ink-900/40 ${sheet ? 'items-end justify-center px-0 sm:items-center sm:px-4' : 'items-center justify-center px-4 py-6'}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined}
        tabIndex={-1}
        className={`flex max-h-[90dvh] w-full flex-col overflow-hidden border border-border bg-card shadow-soft focus:outline-none ${sheet ? 'rounded-t-card sm:max-w-lg sm:rounded-card' : 'max-w-lg rounded-card'}`}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="font-display text-lg font-semibold text-ink-900">
              {title}
            </h2>
            {description && (
              <p id={`${id}-description`} className="mt-1 text-sm text-ink-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-500 hover:bg-surface hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <icons.close aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-4 py-4 sm:px-5">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );

  return createPortal(dialog, document.body);
}

export function Modal(props: DialogProps) {
  return <DialogSurface {...props} sheet={false} />;
}

export function BottomSheet(props: DialogProps) {
  return <DialogSurface {...props} sheet />;
}

export type ToastTone = Extract<StatusTone, 'success' | 'warning' | 'danger' | 'info'>;

export type ToastOptions = {
  title: string;
  message?: string;
  tone?: ToastTone;
  duration?: number;
};

type ToastEntry = ToastOptions & { id: number };
type ToastContextValue = {
  showToast: (toast: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastTone: Record<ToastTone, { badge: ToastTone; role: 'status' | 'alert' }> = {
  success: { badge: 'success', role: 'status' },
  warning: { badge: 'warning', role: 'status' },
  danger: { badge: 'danger', role: 'alert' },
  info: { badge: 'info', role: 'status' },
};

export type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismissToast = useCallback((id: number) => {
    const timerId = timers.current.get(id);
    if (timerId !== undefined) {
      window.clearTimeout(timerId);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: ToastOptions) => {
      const id = nextId.current + 1;
      nextId.current = id;
      const entry: ToastEntry = { tone: 'info', duration: 5000, ...toast, id };
      setToasts((current) => [...current, entry]);
      if (entry.duration && entry.duration > 0) {
        const timerId = window.setTimeout(() => dismissToast(id), entry.duration);
        timers.current.set(id, timerId);
      }
    },
    [dismissToast],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timerId) => window.clearTimeout(timerId));
      timers.current.clear();
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="safe-area-bottom fixed inset-x-3 bottom-3 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:right-4 sm:w-96"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const tone = toastTone[toast.tone ?? 'info'];
          return (
            <div
              key={toast.id}
              role={tone.role}
              className="flex items-start justify-between gap-3 rounded-card border border-border bg-card p-4 shadow-soft"
            >
              <div className="min-w-0">
                <Badge tone={tone.badge}>{toast.title}</Badge>
                {toast.message && (
                  <p className="mt-2 break-words text-sm text-ink-700">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(toast.id)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-500 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <icons.close aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.');
  }
  return context;
}
