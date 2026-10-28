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

const ChampionReports = () => {
  const { reports, attendanceSummary, wfhSummary, reportsLoading, reportsError, refreshReports } = useApp();
  const chartData = attendanceSummary?.trend ?? [];

  const exportCsv = () => downloadCsv('attendance-wfh-report.csv', [
    { report: 'Overview', metric: 'Attendance rate (%)', value: reports?.attendanceRatePercent ?? 0 },
    { report: 'Overview', metric: 'On-time rate (%)', value: reports?.onTimeRatePercent ?? 0 },
    { report: 'Overview', metric: 'Pending WFH', value: reports?.pendingWfh ?? 0 },
    { report: 'Overview', metric: 'Approved WFH', value: reports?.approvedWfh ?? 0 },
    ...chartData.map((day) => ({ report: 'Attendance trend', metric: day.date, value: `Present ${day.present}; late ${day.late}; absent ${day.absent}` })),
    ...Object.entries(wfhSummary?.requestCounts ?? {}).map(([status, count]) => ({ report: 'WFH requests', metric: status, value: count })),
  ], ['report', 'metric', 'value']);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Attendance analytics"
        title="Attendance reports"
        actions={<button type="button" onClick={exportCsv} className="btn btn-primary"><Download className="h-4 w-4" />Download CSV</button>}
      />

      <ErrorState message={reportsError?.message} />
      {canRetryError(reportsError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshReports()}>Retry</button>}
      {reportsLoading && <Skeleton label="Loading champion reports" />}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Candidates" value={reports?.totalCandidates ?? 0} detail="In reporting period" tone="primary" />
        <StatCard title="On-time rate" value={`${reports?.onTimeRatePercent ?? 0}%`} detail="Arrived on time" tone="success" colorValue />
        <StatCard title="Late arrivals" value={reports?.lateCount ?? 0} detail="Excused and unexcused" tone="warning" colorValue />
        <StatCard title="Approved WFH" value={reports?.approvedWfh ?? 0} detail="From WFH requests" tone="slate" />
      </div>

      <Card title="Attendance trend" subtitle="Present, late, and absent counts from the backend report">
        {chartData.length ? (
          <div className="h-72 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickFormatter={formatSastDate} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1D2951', borderRadius: '12px', color: '#ffffff', border: 'none', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar name="Present" dataKey="present" fill="#6115D0" radius={[6, 6, 0, 0]} />
                <Bar name="Late" dataKey="late" fill="#1D2951" radius={[6, 6, 0, 0]} />
                <Bar name="Absent" dataKey="absent" fill="#F25251" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyState title={reportsLoading ? 'Loading attendance summary' : 'No attendance summary'} description={reportsLoading ? undefined : 'There is no attendance trend for this reporting period.'} />}
      </Card>
    </div>
  );
};

export default ChampionReports;
