const TIME_ZONE = 'Africa/Johannesburg';
const locale = 'en-ZA';

type DateInput = Date | number | string;

const timeFormatter = new Intl.DateTimeFormat(locale, {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const dateFormatter = new Intl.DateTimeFormat(locale, {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(locale, {
  timeZone: TIME_ZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const integerFormatter = new Intl.NumberFormat(locale, {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat(locale, {
  style: 'percent',
  maximumFractionDigits: 0,
});

const toDate = (value: DateInput): Date =>
  value instanceof Date ? value : new Date(value);

export const formatTime = (value: DateInput): string =>
  timeFormatter.format(toDate(value));

export const formatDate = (value: DateInput): string =>
  dateFormatter.format(toDate(value));

export const formatDateTime = (value: DateInput): string =>
  dateTimeFormatter.format(toDate(value));

export const formatDuration = (minutes: number): string => {
  const absoluteMinutes = Math.abs(Math.trunc(minutes));
  const hours = Math.floor(absoluteMinutes / 60);
  const remainingMinutes = absoluteMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${integerFormatter.format(hours)} hr`);
  }
  if (remainingMinutes > 0 || parts.length === 0) {
    parts.push(`${integerFormatter.format(remainingMinutes)} min`);
  }

  return `${minutes < 0 ? '-' : ''}${parts.join(' ')}`;
};

export const formatPercent = (value: number): string =>
  percentFormatter.format(value);
