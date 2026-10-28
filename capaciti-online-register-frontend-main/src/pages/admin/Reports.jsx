import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import { downloadCsv } from '../../lib/downloadCsv';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import EmptyState from '../../components/common/EmptyState';
import { canRetryError } from '../../api/client';
import { formatSastDate } from '../../lib/time';

const AdminReports = () => {
  const { reports, attendanceSummary, wfhSummary, reportsLoading, reportsError, refreshReports } = useApp();
  const chartData = attendanceSummary?.trend ?? [];

  const exportCsv = () => downloadCsv('programme-operations-report.csv', [
    { report: 'Overview', metric: 'Total candidates', value: reports?.totalCandidates ?? 0 },
    { report: 'Overview', metric: 'Attendance rate (%)', value: reports?.attendanceRatePercent ?? 0 },
    { report: 'Overview', metric: 'On-time rate (%)', value: reports?.onTimeRatePercent ?? 0 },
    { report: 'Overview', metric: 'Approved WFH', value: reports?.approvedWfh ?? 0 },
    ...chartData.map((day) => ({ report: 'Attendance trend', metric: day.date, value: `Present ${day.present}; late ${day.late}; absent ${day.absent}` })),
    ...Object.entries(wfhSummary?.requestCounts ?? {}).map(([status, count]) => ({ report: 'WFH requests', metric: status, value: count })),
  ], ['report', 'metric', 'value']);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Executive compliance"
        eyebrowClassName="text-salmon"
        title="Programme-wide reports"
        actions={<button type="button" onClick={exportCsv} className="btn btn-dark"><Download className="h-4 w-4" />Export data</button>}
      />

      <ErrorState message={reportsError?.message} />
      {canRetryError(reportsError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshReports()}>Retry</button>}
      {reportsLoading && <Skeleton label="Loading programme reports" />}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Attendance rate" value={`${reports?.attendanceRatePercent ?? 0}%`} detail="Attendance in period" tone="success" />
        <StatCard title="Approved WFH" value={reports?.approvedWfh ?? 0} detail="From WFH requests" tone="primary" />
        <StatCard title="Punctuality" value={`${reports?.onTimeRatePercent ?? 0}%`} detail={`${reports?.lateCount ?? 0} late arrivals`} tone="slate" />
        <StatCard title="Candidates" value={reports?.totalCandidates ?? 0} detail="Registered users" tone="warning" />
      </div>

      <Card title="Attendance summary" subtitle="Daily present, late, and absent counts">
        {chartData.length ? (
          <div className="h-72 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatSastDate} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1D2951', borderRadius: '12px', color: '#ffffff', border: 'none', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar name="Present" dataKey="present" fill="#1D2951" radius={[6, 6, 0, 0]} />
                <Bar name="Late" dataKey="late" fill="#6115D0" radius={[6, 6, 0, 0]} />
                <Bar name="Absent" dataKey="absent" fill="#F25251" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState title={reportsLoading ? 'Loading attendance summary' : 'No attendance summary'} description={reportsLoading ? undefined : 'There is no attendance trend for this reporting period.'} />}
      </Card>
    </div>
  );
};

export default AdminReports;
