import { useState, useMemo } from 'react';
import { Download, Search, Clock3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import { ArrivalStatus, DepartureStatus } from '../../api/types';
import { downloadCsv } from '../../lib/downloadCsv';
import { getStatusMetadata } from '../../lib/status';
import { useAttendanceApi } from '../../api/hooks';
import { Skeleton, ErrorState } from '../../components/common/RequestState';
import { formatSastDate, formatSastTime } from '../../lib/time';
import { canRetryError } from '../../api/client';

const filters = ['ALL', ...new Set([...Object.values(ArrivalStatus), ...Object.values(DepartureStatus)])];

const formatTime = (value) => formatSastTime(value);
const breakTimes = (record, type) => (record.breaks ?? [])
  .filter((item) => item.type === type)
  .map((item) => `${formatTime(item.startedAt)}–${formatTime(item.endedAt)}`)
  .join('; ') || '—';

const AttendanceMonitor = () => {
  const [status, setStatus] = useState('ALL');
  const { data: attendance, loading: attendanceLoading, error: attendanceError, refresh } = useAttendanceApi(
    undefined,
    true,
    { page: 0, size: 100, ...(status === 'ALL' ? {} : { status }) },
  ).records;
  const [search, setSearch] = useState('');

  const rows = useMemo(() => attendance.filter((record) => {
    const nameMatch = !search || record.userName.toLowerCase().includes(search.toLowerCase());
    return nameMatch;
  }), [attendance, search]);

  const exportCsv = () => downloadCsv('daily-attendance-register.csv', rows.map((record) => ({
    candidate: record.userName,
    date: record.attendanceDate,
    workMode: record.workMode,
    arrival: record.arrivalStatus,
    clockIn: formatTime(record.clockInAt),
    teaBreaks: breakTimes(record, 'TEA'),
    lunchBreaks: breakTimes(record, 'LUNCH'),
    clockOut: formatTime(record.clockOutAt),
    departure: record.departureStatus ?? '',
  })), ['candidate', 'date', 'workMode', 'arrival', 'clockIn', 'teaBreaks', 'lunchBreaks', 'clockOut', 'departure']);

  const emptyMessage = attendanceLoading ? 'Loading attendance...' : 'No attendance records match the selected filter.';

  return (
    <div className="page">
      <PageHeader
        eyebrow="Daily register"
        title="Live attendance monitor"
        actions={<button type="button" onClick={exportCsv} className="btn btn-secondary"><Download className="h-4 w-4" />Export register</button>}
      />

      <div className="surface surface-pad space-y-3">
        <label className="relative block">
          <span className="sr-only">Search candidate</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search candidate..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
        </label>
        <div className="chip-row" role="group" aria-label="Filter by status">
          {filters.map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className="chip">
              {s === 'ALL' ? 'All' : getStatusMetadata(s).label}
            </button>
          ))}
        </div>
      </div>

      <ErrorState message={attendanceError?.message} />
      {canRetryError(attendanceError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button>}
      {attendanceLoading && <Skeleton label="Loading attendance monitor" />}

      {/* Phones */}
      <ul className="list md:hidden">
        {rows.map((record) => (
          <li key={record.id} className="surface p-4">
            <div className="flex items-center gap-3">
              <Avatar name={record.userName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy">{record.userName}</p>
                <p className="font-mono text-xs text-slate-400">{formatSastDate(record.attendanceDate)}</p>
              </div>
              <p className="font-mono text-sm font-semibold text-navy">{formatTime(record.clockInAt)} → {formatTime(record.clockOutAt)}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <StatusBadge status={record.arrivalStatus} />
              {record.departureStatus && <StatusBadge status={record.departureStatus} />}
            </div>
          </li>
        ))}
        {!attendanceLoading && !rows.length && <li><EmptyState icon={Clock3} description={emptyMessage} /></li>}
      </ul>

      {/* Tablet & desktop */}
      <div className="surface hidden overflow-hidden md:block">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Candidate</th><th>Date</th><th>Status</th><th>Clock in</th><th>Tea</th><th>Lunch</th><th>Clock out</th></tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={record.userName} size="sm" />
                      <p className="font-bold text-navy">{record.userName}</p>
                    </div>
                  </td>
                  <td className="font-mono tabular-nums text-slate-600">{formatSastDate(record.attendanceDate)}</td>
                  <td><div className="flex flex-col items-start gap-1"><StatusBadge status={record.arrivalStatus} />{record.departureStatus && <StatusBadge status={record.departureStatus} />}</div></td>
                  <td className="font-mono font-semibold tabular-nums text-slate-700">{formatTime(record.clockInAt)}</td>
                  <td className="font-mono text-xs text-slate-600">{breakTimes(record, 'TEA')}</td>
                  <td className="font-mono text-xs text-slate-600">{breakTimes(record, 'LUNCH')}</td>
                  <td className="font-mono font-semibold tabular-nums text-slate-700">{formatTime(record.clockOutAt)}</td>
                </tr>
              ))}
              {!attendanceLoading && !rows.length && <tr><td colSpan={7} className="table-empty">{emptyMessage}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMonitor;
