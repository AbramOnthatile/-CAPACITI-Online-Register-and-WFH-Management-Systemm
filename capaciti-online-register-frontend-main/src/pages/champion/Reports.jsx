import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { ArrivalStatus, WfhStatus, WorkMode } from '../../api/types';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import { downloadCsv } from '../../lib/downloadCsv';

const ChampionReports = () => {
  const { attendance, attendanceLoading, attendanceError, wfh, wfhError, reportsError } = useApp();
  const lateCount = attendance.filter((record) => record.arrivalStatus === ArrivalStatus.LATE_UNEXCUSED || record.arrivalStatus === ArrivalStatus.LATE_EXCUSED).length;
  const onTimeCount = attendance.filter((record) => record.arrivalStatus === ArrivalStatus.ON_TIME).length;
  const approvedWfh = wfh.filter((request) => request.status === WfhStatus.APPROVED).length;
  const grouped = attendance.reduce((groups, record) => {
    const day = record.attendanceDate;
    const current = groups[day] ?? { date: day, onSite: 0, wfh: 0 };
    if (record.workMode === WorkMode.ON_SITE) current.onSite += 1;
    if (record.workMode === WorkMode.WFH) current.wfh += 1;
    groups[day] = current;
    return groups;
  }, {});
  const chartData = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  const error = attendanceError || wfhError || reportsError;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Attendance Analytics</span><span className="text-slate-300">·</span><span className="text-xs text-slate-500">Backend record summaries</span></div><h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Attendance Reports</h2></div>
        <button type="button" onClick={() => downloadCsv('attendance-wfh-report.csv', [
          ...attendance.map((record) => ({
            recordType: 'Attendance',
            candidate: record.userName,
            date: record.attendanceDate,
            status: record.arrivalStatus,
            workMode: record.workMode,
            details: `Clock in ${record.clockInAt ?? '—'}; clock out ${record.clockOutAt ?? '—'}`,
          })),
          ...wfh.map((request) => ({
            recordType: 'WFH request',
            candidate: request.userName,
            date: `${request.startDate} to ${request.endDate}`,
            status: request.status,
            workMode: WorkMode.WFH,
            details: request.reason,
          })),
        ], ['recordType', 'candidate', 'date', 'status', 'workMode', 'details'])} className="flex items-center gap-2 self-start rounded-xl bg-[#6115D0] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4F11AA] sm:self-auto"><Download className="h-4 w-4" /><span>Download Full CSV</span></button>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error.message}</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Attendance Records" value={attendance.length} detail={attendanceLoading ? 'Loading records' : 'Available records'} tone="primary" />
        <StatCard title="On-Time Arrivals" value={onTimeCount} detail="ArrivalStatus: ON_TIME" tone="success" />
        <StatCard title="Late Arrivals" value={lateCount} detail="Excused and unexcused" tone="warning" />
        <StatCard title="Approved WFH Requests" value={approvedWfh} detail="From WFH request records" tone="slate" />
      </div>

      <Card title="On-site & WFH Attendance" subtitle="Daily counts from attendance records">
        {chartData.length ? <div className="h-80 w-full pt-4"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="date" stroke="#94a3b8" fontSize={11} /><YAxis stroke="#94a3b8" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: '#1D2951', borderRadius: '12px', color: '#ffffff', border: 'none', fontSize: '12px' }} /><Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} /><Bar name="On-site" dataKey="onSite" fill="#6115D0" radius={[6, 6, 0, 0]} /><Bar name="WFH" dataKey="wfh" fill="#1D2951" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-10 text-center text-xs text-slate-500">{attendanceLoading ? 'Loading attendance records...' : 'No attendance summary is available.'}</p>}
      </Card>

    </div>
  );
};

export default ChampionReports;
