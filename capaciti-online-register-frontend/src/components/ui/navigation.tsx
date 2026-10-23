import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { icons } from '../icons';

export type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary-700">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-ink-500 sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export type TabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

export function Tabs({
  items,
  value,
  onChange,
  ariaLabel,
  className = '',
}: TabsProps) {
  const id = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeIndex = items.findIndex((item) => item.value === value);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (direction === 0 && event.key !== 'Home' && event.key !== 'End') {
      return;
    }
    if (items.length === 0) {
      return;
    }
    event.preventDefault();
    let nextIndex = (index + direction + items.length) % items.length;
    if (event.key === 'Home' || event.key === 'End') {
      const step = event.key === 'Home' ? 1 : -1;
      nextIndex = event.key === 'Home' ? 0 : items.length - 1;
      while (items[nextIndex]?.disabled) {
        nextIndex = (nextIndex + step + items.length) % items.length;
        if (nextIndex === 0 || nextIndex === items.length - 1) {
          break;
        }
      }
    } else {
      for (
        let attempts = 0;
        attempts < items.length && items[nextIndex]?.disabled;
        attempts += 1
      ) {
        nextIndex = (nextIndex + direction + items.length) % items.length;
      }
    }

    const nextItem = items[nextIndex];
    if (nextItem && !nextItem.disabled) {
      onChange(nextItem.value);
      tabRefs.current[nextIndex]?.focus();
    }
  };

  const selectedTab = items[activeIndex];

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex max-w-full gap-1 overflow-x-auto border-b border-border"
      >
        {items.map((item, index) => {
          const selected = item.value === value;
          return (
            <button
              key={item.value}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`${id}-tab-${index}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${id}-panel`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`motion-interactive min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 ${selected ? 'border-primary-600 text-primary-700' : 'border-transparent text-ink-500 hover:text-ink-900'}`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {selectedTab && (
        <div
          id={`${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${activeIndex}`}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {selectedTab.content}
        </div>
      )}
    </div>
  );
}

export type SegmentedOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type SegmentedControlProps = {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
};

export function SegmentedControl({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-control border border-border bg-surface p-1 ${className}`}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`motion-interactive min-h-11 shrink-0 rounded-control px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'bg-card text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-900'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
