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

const ChampionReports = () => {
  const { reports, attendanceSummary, wfhSummary, reportsLoading, reportsError, refreshReports } = useApp();
  const chartData = attendanceSummary?.trend ?? [];

  const chartRef = useRef(null);
  const report = {
    filename: 'attendance-report',
    title: 'Attendance report',
    subtitle: 'Attendance and WFH for your assigned candidates',
    summary: [
      { label: 'Candidates', value: reports?.totalCandidates ?? 0 },
      { label: 'On-time rate', value: `${reports?.onTimeRatePercent ?? 0}%` },
      { label: 'Late arrivals', value: reports?.lateCount ?? 0 },
      { label: 'Pending WFH', value: reports?.pendingWfh ?? 0 },
      { label: 'Approved WFH', value: reports?.approvedWfh ?? 0 },
    ],
    trend: chartData,
    wfhCounts: wfhSummary?.requestCounts,
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Attendance analytics"
        title="Attendance reports"
        actions={<ExportButtons onPdf={() => downloadReportPdf({ ...report, chartElement: chartRef.current })} onCsv={() => downloadReportCsv(report)} disabled={reportsLoading} />}
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
          <AttendanceTrendChart ref={chartRef} data={chartData} />
        ) : <EmptyState title={reportsLoading ? 'Loading attendance summary' : 'No attendance summary'} description={reportsLoading ? undefined : 'There is no attendance trend for this reporting period.'} />}
      </Card>
    </div>
  );
};

export default ChampionReports;
