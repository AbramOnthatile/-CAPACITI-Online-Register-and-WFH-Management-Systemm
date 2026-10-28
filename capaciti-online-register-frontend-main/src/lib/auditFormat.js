import { statusMetadata } from './status';

// Turns audit records (CLOCK_OUT, AttendanceRecord, {"ipVerified":false}) into readable text.

const actionLabels = {
  CLOCK_IN: 'Clocked in',
  CLOCK_OUT: 'Clocked out',
  ATTENDANCE_EXCUSED: 'Excused attendance',
  WFH_APPROVED: 'Approved WFH request',
  WFH_REJECTED: 'Rejected WFH request',
  WFH_CANCELLED: 'Cancelled WFH request',
  TICKET_RESOLVED: 'Resolved ticket',
  ANNOUNCEMENT_PUBLISHED: 'Published announcement',
  CAMPUS_UPDATED: 'Updated campus',
  WHITELIST_ADDED: 'Allowed a network',
  WHITELIST_REMOVED: 'Removed a network',
};

const detailLabels = {
  arrivalStatus: 'Arrival',
  departureStatus: 'Departure',
  workMode: 'Work mode',
  ipVerified: 'Campus network',
  geoVerified: 'Within campus radius',
  cidr: 'Network',
  entryCount: 'Entries',
  groupAverage: 'Group average',
  expiresIn: 'Expires in',
  reason: 'Reason',
  title: 'Title',
};

const sentenceCase = (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

// CLOCK_OUT -> "Clock out", AttendanceRecord -> "Attendance record"
export const humanize = (value) => sentenceCase(String(value)
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replaceAll('_', ' ')
  .trim());

export const actionLabel = (action) => actionLabels[action] ?? humanize(action);

export const targetLabel = (targetType) => (targetType ? humanize(targetType) : '');

const valueLabel = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (Array.isArray(value)) return value.map(valueLabel).join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  if (statusMetadata[value]) return statusMetadata[value].label;
  return /^[A-Z][A-Z_]+$/.test(value) ? humanize(value) : value;
};

export const detailEntries = (details) => Object.entries(details ?? {})
  .map(([key, value]) => ({ key, label: detailLabels[key] ?? humanize(key), value: valueLabel(value) }));

// Plain text of a record, for search.
export const auditSearchText = (entry) => [
  entry.actorName,
  entry.action,
  actionLabel(entry.action),
  entry.targetType,
  targetLabel(entry.targetType),
  entry.targetId ?? '',
  ...detailEntries(entry.details).map((detail) => `${detail.label} ${detail.value}`),
].join(' ').toLowerCase();

// One row per person per day (SAST): that day's activities in order, their details merged
// (a later value wins), and the time of the last activity. Newest rows first.
export function groupByPersonAndDay(entries, dayOf) {
  const groups = new Map();
  for (const entry of entries) {
    const day = dayOf(entry.createdAt);
    const key = `${entry.actorId ?? entry.actorName}|${day}`;
    const group = groups.get(key) ?? { key, actorName: entry.actorName, day, events: [] };
    group.events.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => {
      const events = [...group.events].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
      const details = Object.assign({}, ...events.map((event) => event.details ?? {}));
      return { ...group, events, details, lastAt: events.at(-1).createdAt };
    })
    .sort((left, right) => Date.parse(right.lastAt) - Date.parse(left.lastAt));
}
