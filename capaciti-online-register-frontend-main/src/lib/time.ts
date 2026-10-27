const timeZone = 'Africa/Johannesburg';

function isLocalDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toDisplayDate(value: string): Date {
  if (isLocalDate(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }
  return new Date(value);
}

export function formatSastDate(value?: string | null, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  if (!value) return '—';
  const date = toDisplayDate(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-ZA', { timeZone, ...options }).format(date);
}

export function formatSastTime(value?: string | null, options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }): string {
  return formatSastDate(value, options);
}

export function formatSastDateTime(value?: string | null): string {
  return formatSastDate(value, { dateStyle: 'medium', timeStyle: 'short' });
}

export function getSastHour(value: string): number | null {
  const date = toDisplayDate(value);
  if (Number.isNaN(date.getTime())) return null;
  return Number(new Intl.DateTimeFormat('en-ZA', {
    timeZone,
    hour: '2-digit',
    hourCycle: 'h23',
  }).format(date));
}

export function getSastToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

export function getSastDateValue(value: string): string | null {
  const date = toDisplayDate(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function subtractLocalDays(value: string, days: number): string {
  if (!isLocalDate(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - days, 12));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}
