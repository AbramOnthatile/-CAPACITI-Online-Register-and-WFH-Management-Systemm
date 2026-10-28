import { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import PageHeader from '../../components/common/PageHeader';
import ExportButtons from '../../components/common/ExportButtons';
import AttendanceTrendChart from '../../components/charts/AttendanceTrendChart';
import { downloadReportCsv, downloadReportPdf } from '../../lib/reportExport';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import EmptyState from '../../components/common/EmptyState';
import { canRetryError } from '../../api/client';

const AdminReports = () => {
  const { reports, attendanceSummary, wfhSummary, reportsLoading, reportsError, refreshReports } = useApp();
  const chartData = attendanceSummary?.trend ?? [];

  const chartRef = useRef(null);
  const report = {
    filename: 'programme-report',
    title: 'Programme-wide report',
    subtitle: 'Attendance, punctuality and WFH across all candidates',
    summary: [
      { label: 'Attendance rate', value: `${reports?.attendanceRatePercent ?? 0}%` },
      { label: 'Punctuality', value: `${reports?.onTimeRatePercent ?? 0}%` },
      { label: 'Late arrivals', value: reports?.lateCount ?? 0 },
      { label: 'Approved WFH', value: reports?.approvedWfh ?? 0 },
      { label: 'Candidates', value: reports?.totalCandidates ?? 0 },
    ],
    trend: chartData,
    wfhCounts: wfhSummary?.requestCounts,
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Executive compliance"
        eyebrowClassName="text-salmon"
        title="Programme-wide reports"
        actions={<ExportButtons onPdf={() => downloadReportPdf({ ...report, chartElement: chartRef.current })} onCsv={() => downloadReportCsv(report)} disabled={reportsLoading} />}
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
          <AttendanceTrendChart ref={chartRef} data={chartData} />
        ) : <EmptyState title={reportsLoading ? 'Loading attendance summary' : 'No attendance summary'} description={reportsLoading ? undefined : 'There is no attendance trend for this reporting period.'} />}
      </Card>
    </div>
  );
};

export default AdminReports;
