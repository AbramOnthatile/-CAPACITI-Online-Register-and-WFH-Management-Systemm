import { useMemo, useState } from 'react';
import { Download, Calendar, Filter } from 'lucide-react';
import { ArrivalStatus, DepartureStatus, WorkMode } from '../../api/types';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import { demoOnly } from '../../mocks/demoOnly';

const statusFilters = ['ALL', ...new Set([...Object.values(ArrivalStatus), ...Object.values(DepartureStatus)])];
const formatTime = (value) => value
  ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : '—';
const duration = (entry) => {
  if (!entry.clockInAt || !entry.clockOutAt) return '—';
  const minutes = Math.max(0, Math.floor((Date.parse(entry.clockOutAt) - Date.parse(entry.clockInAt)) / 60000));
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

const AttendanceHistory = () => {
  const { attendance, attendanceLoading, attendanceError } = useApp();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const filtered = useMemo(() => statusFilter === 'ALL' ? attendance : attendance.filter((entry) => entry.arrivalStatus === statusFilter || entry.departureStatus === statusFilter), [attendance, statusFilter]);
  const selected = filtered.find((entry) => entry.id === selectedEntry?.id) ?? filtered[0] ?? null;
  const dates = attendance.map((record) => record.attendanceDate).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><div className="flex items-center gap-2"><span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Attendance Records</span><span className="text-slate-300">·</span><span className="text-xs font-medium text-slate-500">History</span></div><h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Attendance History</h2></div>
        {/* MOCK-ONLY: not in backend */}
        <button type="button" disabled aria-disabled="true" title={demoOnly.notice} className="flex items-center gap-2 self-start rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs font-bold text-[#1D2951] opacity-60 sm:self-auto"><Download className="h-4 w-4" /><span>Export Timesheet</span><StatusBadge status={WorkMode.ON_SITE}>Demo</StatusBadge></button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2"><Filter className="ml-1 h-4 w-4 text-slate-400" /><span className="text-xs font-bold text-slate-700">Filter by Status:</span>{statusFilters.map((status) => <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all ${statusFilter === status ? 'bg-[#1D2951] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>{status === 'ALL' ? 'All' : <StatusBadge status={status} />}</button>)}</div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><Calendar className="h-4 w-4 text-[#6115D0]" /><span className="font-medium">Available dates:</span><span className="font-bold text-[#1D2951]">{dates[0] || '—'} – {dates[dates.length - 1] || '—'}</span></div>
      </div>
      {attendanceError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{attendanceError.message}</p>}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:col-span-8">
          <div className="overflow-x-auto"><table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3.5">Date</th><th className="px-4 py-3.5">Arrival</th><th className="px-4 py-3.5">Clock In</th><th className="px-4 py-3.5">Tea Break <StatusBadge status={WorkMode.ON_SITE}>Demo</StatusBadge></th><th className="px-4 py-3.5">Lunch <StatusBadge status={WorkMode.ON_SITE}>Demo</StatusBadge></th><th className="px-4 py-3.5">Clock Out</th><th className="px-4 py-3.5 text-right">Duration</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((entry) => <tr key={entry.id} onClick={() => setSelectedEntry(entry)} className={`cursor-pointer transition-colors ${selected?.id === entry.id ? 'bg-[#6115D0]/5 font-medium' : 'hover:bg-slate-50/80'}`}><td className="px-5 py-3 font-mono font-semibold tabular-nums text-[#1D2951]">{entry.attendanceDate}</td><td className="px-4 py-3"><StatusBadge status={entry.arrivalStatus} />{entry.departureStatus && <div className="mt-1"><StatusBadge status={entry.departureStatus} /></div>}</td><td className="px-4 py-3 font-mono tabular-nums text-slate-600">{formatTime(entry.clockInAt)}</td>{/* MOCK-ONLY: not in backend */}<td className="px-4 py-3 text-slate-400">{demoOnly.manualBreakDisplay}</td>{/* MOCK-ONLY: not in backend */}<td className="px-4 py-3 text-slate-400">{demoOnly.manualBreakDisplay}</td><td className="px-4 py-3 font-mono tabular-nums text-slate-600">{formatTime(entry.clockOutAt)}</td><td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-[#1D2951]">{duration(entry)}</td></tr>)}
              {attendanceLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Loading attendance records...</td></tr>}
              {!attendanceLoading && filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No attendance records match the selected filter.</td></tr>}
            </tbody>
          </table></div>
        </div>
        <div className="space-y-6 lg:col-span-4">
          {selected ? <Card title="Time Entry Details" subtitle={`Detailed record for ${selected.attendanceDate}`} actions={<StatusBadge status={selected.arrivalStatus} />}>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">Recorded work duration</p><p className="mt-1 font-mono text-3xl font-black tabular-nums text-[#1D2951]">{duration(selected)}</p><p className="mt-1 font-mono text-xs tabular-nums text-slate-500">{formatTime(selected.clockInAt)} — {formatTime(selected.clockOutAt)}</p></div>
              <div className="space-y-2.5 text-xs"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Record details</p><div className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">Work mode</span><StatusBadge status={selected.workMode} /></div><div className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">Arrival</span><StatusBadge status={selected.arrivalStatus} /></div><div className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">Departure</span>{selected.departureStatus ? <StatusBadge status={selected.departureStatus} /> : <span className="text-slate-400">Not recorded</span>}</div><div className="flex justify-between border-b border-slate-100 py-1.5"><span className="text-slate-500">IP verified</span><span className="font-semibold text-slate-700">{selected.ipVerified ? 'Yes' : 'No'}</span></div><div className="flex justify-between py-1.5"><span className="text-slate-500">Geo verified</span><span className="font-semibold text-slate-700">{selected.geoVerified ? 'Yes' : 'No'}</span></div></div>
              {/* MOCK-ONLY: not in backend */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-500">Manual tea and lunch break times: {demoOnly.manualBreakDisplay} <StatusBadge status={WorkMode.ON_SITE}>Demo</StatusBadge></div>
            </div>
          </Card> : <Card title="Time Entry Details"><p className="text-xs text-slate-500">{attendanceLoading ? 'Loading records...' : 'Select an attendance record to view details.'}</p></Card>}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
