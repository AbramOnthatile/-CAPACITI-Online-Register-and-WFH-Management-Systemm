import { attendanceSeries } from '../components/charts/chartTheme';
import { downloadCsv } from './downloadCsv';
import { downloadPdf } from './downloadPdf';
import { statusMetadata } from './status';
import { formatSastDate } from './time';

const dayLabel = (date) => formatSastDate(date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const statusLabel = (status) => statusMetadata[status]?.label ?? status;

const wfhRowsOf = (wfhCounts) => Object.entries(wfhCounts ?? {}).map(([status, count]) => [statusLabel(status), count]);

// The report pages share one export: summary figures, the daily trend and WFH request counts.
export function downloadReportPdf({ filename, title, subtitle, summary, trend, wfhCounts, chartElement }) {
  const trendRows = trend.map((day) => [dayLabel(day.date), ...attendanceSeries.map((series) => day[series.key] ?? 0)]);
  const wfhRows = wfhRowsOf(wfhCounts);
  return downloadPdf({
    filename: `${filename}.pdf`,
    title,
    subtitle,
    summary,
    chart: { heading: 'Daily attendance', element: chartElement, legend: attendanceSeries },
    tables: [
      { heading: 'Daily attendance', columns: ['Date', ...attendanceSeries.map((series) => series.label)], rows: trendRows, numeric: [1, 2, 3] },
      ...(wfhRows.length ? [{ heading: 'WFH requests', columns: ['Status', 'Requests'], rows: wfhRows, numeric: [1] }] : []),
    ],
  });
}

export function downloadReportCsv({ filename, summary, trend, wfhCounts }) {
  const wfhRows = wfhRowsOf(wfhCounts);
  downloadCsv(`${filename}.csv`, [
    ...summary.map((item) => ({ Section: 'Summary', Item: item.label, Value: item.value })),
    ...trend.map((day) => ({ Section: 'Daily attendance', Item: day.date, Present: day.present ?? 0, Late: day.late ?? 0, Absent: day.absent ?? 0 })),
    ...wfhRows.map(([status, count]) => ({ Section: 'WFH requests', Item: status, Value: count })),
  ], ['Section', 'Item', 'Value', 'Present', 'Late', 'Absent']);
}
