import { useMemo, useState } from 'react';
import { Download, CalendarDays, ChevronRight, History } from 'lucide-react';
import { ArrivalStatus, DepartureStatus } from '../../api/types';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { downloadCsv } from '../../lib/downloadCsv';
import { getStatusMetadata } from '../../lib/status';

const statusFilters = ['ALL', ...new Set([...Object.values(ArrivalStatus), ...Object.values(DepartureStatus)])];
const formatTime = (value) => value
  ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : '—';
const duration = (entry) => {
  if (!entry.clockInAt || !entry.clockOutAt) return '—';
  const minutes = Math.max(0, Math.floor((Date.parse(entry.clockOutAt) - Date.parse(entry.clockInAt)) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const breakTimes = (entry, type) => (entry.breaks ?? [])
  .filter((item) => item.type === type)
  .map((item) => `${formatTime(item.startedAt)}–${formatTime(item.endedAt)}`)
  .join('; ') || '—';

const EntryDetails = ({ entry }) => (
  <div className="space-y-4">
    <div className="inset">
      <p className="meta">Recorded work duration</p>
      <p className="mt-1 font-mono text-3xl font-extrabold tabular-nums text-navy">{duration(entry)}</p>
      <p className="mt-1 font-mono text-xs tabular-nums text-slate-500">{formatTime(entry.clockInAt)} — {formatTime(entry.clockOutAt)}</p>
    </div>
    <dl className="detail-list">
      <div className="detail-row"><dt>Work mode</dt><dd><StatusBadge status={entry.workMode} /></dd></div>
      <div className="detail-row"><dt>Arrival</dt><dd><StatusBadge status={entry.arrivalStatus} /></dd></div>
      <div className="detail-row"><dt>Departure</dt><dd>{entry.departureStatus ? <StatusBadge status={entry.departureStatus} /> : <span className="font-normal text-slate-400">Not recorded</span>}</dd></div>
      <div className="detail-row"><dt>Tea break</dt><dd className="font-mono text-xs">{breakTimes(entry, 'TEA')}</dd></div>
      <div className="detail-row"><dt>Lunch</dt><dd className="font-mono text-xs">{breakTimes(entry, 'LUNCH')}</dd></div>
      <div className="detail-row"><dt>IP verified</dt><dd>{entry.ipVerified ? 'Yes' : 'No'}</dd></div>
      <div className="detail-row"><dt>Geo verified</dt><dd>{entry.geoVerified ? 'Yes' : 'No'}</dd></div>
    </dl>
  </div>
);

const AttendanceHistory = () => {
  const { attendance, attendanceLoading, attendanceError } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [sheetEntry, setSheetEntry] = useState(null);
  const filtered = useMemo(() => statusFilter === 'ALL' ? attendance : attendance.filter((entry) => entry.arrivalStatus === statusFilter || entry.departureStatus === statusFilter), [attendance, statusFilter]);
  const selected = filtered.find((entry) => entry.id === selectedEntry?.id) ?? filtered[0] ?? null;
  const dates = attendance.map((record) => record.attendanceDate).sort();

  const exportCsv = () => downloadCsv('attendance-timesheet.csv', filtered.map((entry) => ({
    date: entry.attendanceDate,
    workMode: entry.workMode,
    arrival: entry.arrivalStatus,
    clockIn: formatTime(entry.clockInAt),
    teaBreaks: breakTimes(entry, 'TEA'),
    lunchBreaks: breakTimes(entry, 'LUNCH'),
    clockOut: formatTime(entry.clockOutAt),
    departure: entry.departureStatus ?? '',
    duration: duration(entry),
  })), ['date', 'workMode', 'arrival', 'clockIn', 'teaBreaks', 'lunchBreaks', 'clockOut', 'departure', 'duration']);

  const emptyMessage = attendanceLoading ? 'Loading attendance records...' : 'No attendance records match the selected filter.';

  return (
    <div className="page">
      <PageHeader
        eyebrow="Attendance records"
        title="Attendance history"
        backTo="/candidate/attendance"
        backLabel="Back to attendance"
        actions={<button type="button" onClick={exportCsv} className="btn btn-secondary"><Download className="h-4 w-4" />Export timesheet</button>}
      />

      <div className="space-y-3">
        <div className="chip-row" role="group" aria-label="Filter by status">
          {statusFilters.map((status) => (
            <button key={status} type="button" aria-pressed={statusFilter === status} onClick={() => setStatusFilter(status)} className="chip">
              {status === 'ALL' ? 'All' : getStatusMetadata(status).label}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarDays className="h-4 w-4 text-primary-600" />
          <span className="font-mono font-semibold text-navy">{dates[0] || '—'} – {dates[dates.length - 1] || '—'}</span>
        </p>
      </div>

      <Alert>{attendanceError?.message}</Alert>

      {/* Phones: tappable record cards */}
      <ul className="list md:hidden">
        {filtered.map((entry) => (
          <li key={entry.id}>
            <button type="button" onClick={() => setSheetEntry(entry)} className="surface surface-interactive flex w-full items-center gap-3 p-4 text-left">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-navy">{entry.attendanceDate}</p>
                  <p className="font-mono text-sm font-bold text-navy">{duration(entry)}</p>
                </div>
                <p className="mt-0.5 font-mono text-xs text-slate-500">{formatTime(entry.clockInAt)} → {formatTime(entry.clockOutAt)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={entry.arrivalStatus} />
                  {entry.departureStatus && <StatusBadge status={entry.departureStatus} />}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li><EmptyState icon={History} description={emptyMessage} /></li>}
      </ul>

      {/* Tablet & desktop: table + detail panel */}
      <div className="hidden gap-6 md:grid lg:grid-cols-12">
        <div className="surface overflow-hidden lg:col-span-8">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Arrival</th><th>Clock in</th><th>Tea</th><th>Lunch</th><th>Clock out</th><th className="text-right">Duration</th></tr></thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} onClick={() => setSelectedEntry(entry)} aria-selected={selected?.id === entry.id} className={`cursor-pointer ${selected?.id === entry.id ? 'bg-primary-50/70' : ''}`}>
                    <td className="font-mono font-semibold tabular-nums text-navy">{entry.attendanceDate}</td>
                    <td><div className="flex flex-col items-start gap-1"><StatusBadge status={entry.arrivalStatus} />{entry.departureStatus && <StatusBadge status={entry.departureStatus} />}</div></td>
                    <td className="font-mono tabular-nums text-slate-600">{formatTime(entry.clockInAt)}</td>
                    <td className="font-mono text-xs text-slate-600">{breakTimes(entry, 'TEA')}</td>
                    <td className="font-mono text-xs text-slate-600">{breakTimes(entry, 'LUNCH')}</td>
                    <td className="font-mono tabular-nums text-slate-600">{formatTime(entry.clockOutAt)}</td>
                    <td className="text-right font-mono font-bold tabular-nums text-navy">{duration(entry)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="table-empty">{emptyMessage}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="lg:col-span-4">
          <Card title="Entry details" subtitle={selected ? selected.attendanceDate : undefined}>
            {selected ? <EntryDetails entry={selected} /> : <p className="meta">{attendanceLoading ? 'Loading records...' : 'Select an attendance record to view details.'}</p>}
          </Card>
        </div>
      </div>

      {sheetEntry && (
        <Modal title="Entry details" description={sheetEntry.attendanceDate} onClose={() => setSheetEntry(null)}>
          <EntryDetails entry={sheetEntry} />
        </Modal>
      )}
    </div>
  );
};

export default AttendanceHistory;
