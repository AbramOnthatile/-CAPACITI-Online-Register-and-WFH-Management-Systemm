import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { ArrivalStatus, WfhStatus, WorkMode } from '../../api/types';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
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

  const exportCsv = () => downloadCsv('attendance-wfh-report.csv', [
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
  ], ['recordType', 'candidate', 'date', 'status', 'workMode', 'details']);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Attendance analytics"
        title="Attendance reports"
        actions={<button type="button" onClick={exportCsv} className="btn btn-primary"><Download className="h-4 w-4" />Download CSV</button>}
      />

      <Alert>{error?.message}</Alert>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Attendance records" value={attendance.length} detail={attendanceLoading ? 'Loading records' : 'Available records'} tone="primary" />
        <StatCard title="On-time arrivals" value={onTimeCount} detail="Arrived on time" tone="success" colorValue />
        <StatCard title="Late arrivals" value={lateCount} detail="Excused and unexcused" tone="warning" colorValue />
        <StatCard title="Approved WFH" value={approvedWfh} detail="From WFH requests" tone="slate" />
      </div>

      <Card title="On-site & WFH attendance" subtitle="Daily counts from attendance records">
        {chartData.length ? (
          <div className="h-72 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1D2951', borderRadius: '12px', color: '#ffffff', border: 'none', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar name="On-site" dataKey="onSite" fill="#6115D0" radius={[6, 6, 0, 0]} />
                <Bar name="WFH" dataKey="wfh" fill="#1D2951" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="py-10 text-center text-sm text-slate-500">{attendanceLoading ? 'Loading attendance records...' : 'No attendance summary is available.'}</p>}
      </Card>
    </div>
  );
};

export default ChampionReports;
