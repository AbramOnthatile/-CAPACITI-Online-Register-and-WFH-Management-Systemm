const NUMERIC_TIMESTAMP_PATTERN = /^[+-]?\d+(?:\.\d+)?$/;
const MILLISECONDS_THRESHOLD = 100_000_000_000;

export const parseTimestamp = (value) => {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return Number.NaN;
    return Math.abs(value) < MILLISECONDS_THRESHOLD ? value * 1000 : value;
  }

  if (typeof value !== 'string' || value.trim() === '') return Number.NaN;

  const normalizedValue = value.trim();
  if (NUMERIC_TIMESTAMP_PATTERN.test(normalizedValue)) {
    const numericValue = Number(normalizedValue);
    if (!Number.isFinite(numericValue)) return Number.NaN;
    return Math.abs(numericValue) < MILLISECONDS_THRESHOLD ? numericValue * 1000 : numericValue;
  }

  return Date.parse(normalizedValue);
};

export const formatCountdown = (expiresAt, currentTimeMs) => {
  const expiresAtMs = parseTimestamp(expiresAt);
  if (!Number.isFinite(expiresAtMs)) return 'Unavailable';

  const remainingSeconds = Math.max(0, Math.ceil((expiresAtMs - currentTimeMs) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const seconds = remainingSeconds % 60;
  const pad = (value) => value.toString().padStart(2, '0');

  return hours > 0
    ? `${pad(hours)}:${pad(Math.floor((remainingSeconds % 3600) / 60))}:${pad(seconds)}`
    : `${pad(Math.floor(remainingSeconds / 60))}:${pad(seconds)}`;
};
