import { useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, History } from 'lucide-react';
import { ArrivalStatus, DepartureStatus } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import { downloadCsv } from '../../lib/downloadCsv';
import { downloadPdf } from '../../lib/downloadPdf';
import ExportButtons from '../../components/common/ExportButtons';
import { getStatusMetadata } from '../../lib/status';
import { Skeleton } from '../../components/common/RequestState';
import { formatSastDate, formatSastTime } from '../../lib/time';
import { canRetryError } from '../../api/client';

const statusFilters = ['ALL', ...new Set([...Object.values(ArrivalStatus), ...Object.values(DepartureStatus)])];
const formatTime = (value) => formatSastTime(value);
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
  const { attendance, attendanceLoading, attendanceError, refreshAttendance } = useApp();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [sheetEntry, setSheetEntry] = useState(null);
  const filtered = useMemo(() => statusFilter === 'ALL' ? attendance : attendance.filter((entry) => entry.arrivalStatus === statusFilter || entry.departureStatus === statusFilter), [attendance, statusFilter]);
  const selected = filtered.find((entry) => entry.id === selectedEntry?.id) ?? filtered[0] ?? null;
  const dates = attendance.map((record) => record.attendanceDate).sort();

  // One column list for both exports, with readable labels.
  const label = (status) => (status ? getStatusMetadata(status)?.label ?? status : '');
  const columns = [
    ['Date', (entry) => formatSastDate(entry.attendanceDate)],
    ['Work mode', (entry) => label(entry.workMode)],
    ['Arrival', (entry) => label(entry.arrivalStatus)],
    ['Clock in', (entry) => formatTime(entry.clockInAt)],
    ['Tea breaks', (entry) => breakTimes(entry, 'TEA')],
    ['Lunch breaks', (entry) => breakTimes(entry, 'LUNCH')],
    ['Clock out', (entry) => formatTime(entry.clockOutAt)],
    ['Departure', (entry) => label(entry.departureStatus)],
    ['Duration', (entry) => duration(entry)],
  ];
  const exportCsv = () => downloadCsv('attendance-timesheet.csv',
    filtered.map((entry) => Object.fromEntries(columns.map(([header, value]) => [header, value(entry)]))),
    columns.map(([header]) => header));
  const exportPdf = () => downloadPdf({
    filename: 'attendance-timesheet.pdf',
    title: 'Attendance timesheet',
    subtitle: [user?.fullName, dates.length ? `${formatSastDate(dates[0])} – ${formatSastDate(dates.at(-1))}` : ''].filter(Boolean).join(' · '),
    summary: [
      { label: 'Days recorded', value: filtered.length },
      { label: 'On time', value: filtered.filter((entry) => entry.arrivalStatus === 'ON_TIME').length },
      { label: 'Late', value: filtered.filter((entry) => entry.arrivalStatus?.startsWith('LATE')).length },
      { label: 'Working from home', value: filtered.filter((entry) => entry.workMode === 'WFH').length },
    ],
    tables: [{ heading: 'Timesheet', columns: columns.map(([header]) => header), rows: filtered.map((entry) => columns.map(([, value]) => value(entry))) }],
  });

  const emptyMessage = attendanceLoading ? 'Loading attendance records...' : 'No attendance records match the selected filter.';

  return (
    <div className="page">
      <PageHeader
        eyebrow="Attendance records"
        title="Attendance history"
        backTo="/candidate/attendance"
        backLabel="Back to attendance"
        actions={<ExportButtons onPdf={exportPdf} onCsv={exportCsv} disabled={!filtered.length} />}
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
      {canRetryError(attendanceError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshAttendance()}>Retry</button>}
      {attendanceLoading && <Skeleton label="Loading attendance history" />}

      {/* Phones & tablets: tappable record cards */}
      <ul className="list lg:hidden">
        {filtered.map((entry) => (
          <li key={entry.id}>
            <button type="button" onClick={() => setSheetEntry(entry)} className="surface surface-interactive flex w-full items-center gap-3 p-4 text-left">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-navy">{formatSastDate(entry.attendanceDate)}</p>
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

      {/* Desktop: table, with the detail panel beside it on wide screens (breaks then show in the panel) */}
      <div className="hidden gap-6 lg:grid xl:grid-cols-12">
        <div className="surface overflow-hidden xl:col-span-8">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Arrival</th><th>Clock in</th><th className="xl:hidden 2xl:table-cell">Tea</th><th className="xl:hidden 2xl:table-cell">Lunch</th><th>Clock out</th><th className="text-right">Duration</th></tr></thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} onClick={() => setSelectedEntry(entry)} aria-selected={selected?.id === entry.id} className={`cursor-pointer ${selected?.id === entry.id ? 'bg-primary-50/70' : ''}`}>
                    <td className="font-mono font-semibold tabular-nums text-navy">{formatSastDate(entry.attendanceDate)}</td>
                    <td><div className="flex flex-col items-start gap-1"><StatusBadge status={entry.arrivalStatus} />{entry.departureStatus && <StatusBadge status={entry.departureStatus} />}</div></td>
                    <td className="font-mono tabular-nums text-slate-600">{formatTime(entry.clockInAt)}</td>
                    <td className="font-mono text-xs text-slate-600 xl:hidden 2xl:table-cell">{breakTimes(entry, 'TEA')}</td>
                    <td className="font-mono text-xs text-slate-600 xl:hidden 2xl:table-cell">{breakTimes(entry, 'LUNCH')}</td>
                    <td className="font-mono tabular-nums text-slate-600">{formatTime(entry.clockOutAt)}</td>
                    <td className="text-right font-mono font-bold tabular-nums text-navy">{duration(entry)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={7} className="table-empty">{emptyMessage}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="xl:col-span-4">
          <Card title="Entry details" subtitle={selected ? formatSastDate(selected.attendanceDate) : undefined}>
            {selected ? <EntryDetails entry={selected} /> : <p className="meta">{attendanceLoading ? 'Loading records...' : 'Select an attendance record to view details.'}</p>}
          </Card>
        </div>
      </div>

      {sheetEntry && (
        <Modal title="Entry details" description={formatSastDate(sheetEntry.attendanceDate)} onClose={() => setSheetEntry(null)}>
          <EntryDetails entry={sheetEntry} />
        </Modal>
      )}
    </div>
  );
};

export default AttendanceHistory;
