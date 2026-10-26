import { useState, useMemo } from 'react';
import { Download, Filter, Search, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import { ArrivalStatus, DepartureStatus } from '../../api/types';
import { downloadCsv } from '../../lib/downloadCsv';

const AttendanceMonitor = () => {
  const { attendance, attendanceLoading, attendanceError } = useApp();
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    return attendance.filter((record) => {
      const nameMatch = !search || record.userName.toLowerCase().includes(search.toLowerCase());
      const statusMatch = status === 'ALL' || record.arrivalStatus === status ||
        record.departureStatus === status;
      return nameMatch && statusMatch;
    });
  }, [attendance, status, search]);

  const filters = ['ALL', ...Object.values(ArrivalStatus), ...Object.values(DepartureStatus)];

  const formatTime = (value) => value
    ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : '—';
  const breakTimes = (record, type) => (record.breaks ?? [])
    .filter((item) => item.type === type)
    .map((item) => `${formatTime(item.startedAt)}–${formatTime(item.endedAt)}`)
    .join('; ') || '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">
              Real-Time Supervision
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Daily Register</span>
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#1D2951]">Live Attendance Monitor</h2>
        </div>
        <button type="button" onClick={() => downloadCsv('daily-attendance-register.csv', rows.map((record) => ({
          candidate: record.userName,
          date: record.attendanceDate,
          workMode: record.workMode,
          arrival: record.arrivalStatus,
          clockIn: formatTime(record.clockInAt),
          teaBreaks: breakTimes(record, 'TEA'),
          lunchBreaks: breakTimes(record, 'LUNCH'),
          clockOut: formatTime(record.clockOutAt),
          departure: record.departureStatus ?? '',
        })), ['candidate', 'date', 'workMode', 'arrival', 'clockIn', 'teaBreaks', 'lunchBreaks', 'clockOut', 'departure'])} className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-[#1D2951] hover:border-[#6115D0] hover:text-[#6115D0] self-start sm:self-auto">
          <Download className="h-4 w-4" />
          <span>Export Daily Register</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" /> Filter:
          </span>
          {filters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                status === s
                  ? 'bg-[#1D2951] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              {s === 'ALL' ? 'All' : <StatusBadge status={s} />}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-8 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Monitor Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Check In</th>
                <th className="px-4 py-3.5">Tea Break</th>
                <th className="px-4 py-3.5">Lunch</th>
                <th className="px-4 py-3.5">Check Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceError && <tr><td colSpan={7} role="alert" className="px-4 py-4 text-center text-rose-600">{attendanceError.message}</td></tr>}
              {attendanceLoading && <tr><td colSpan={7} className="px-4 py-4 text-center text-slate-500">Loading attendance...</td></tr>}
              {rows.map((record) => {
                return (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#1D2951]">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1D2951] text-[10px] font-bold text-white">
                          {record.userName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}
                        </span>
                        <p className="font-bold">{record.userName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 tabular-nums">{record.attendanceDate}</td>
                    <td className="px-4 py-3 space-y-1">
                      <StatusBadge status={record.arrivalStatus} />
                      {record.departureStatus && <StatusBadge status={record.departureStatus} />}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 tabular-nums font-semibold">{formatTime(record.clockInAt)}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{breakTimes(record, 'TEA')}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{breakTimes(record, 'LUNCH')}</td>
                    <td className="px-4 py-3 font-mono text-slate-700 tabular-nums font-semibold">{formatTime(record.clockOutAt)}</td>
                  </tr>
                );
              })}
              {!attendanceLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No attendance records match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMonitor;
