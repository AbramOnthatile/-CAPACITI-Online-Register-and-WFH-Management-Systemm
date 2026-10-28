import { forwardRef } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatSastDate } from '../../lib/time';
import { attendanceSeries, chartInk, ChartLegend, ChartTooltip, gridProps, xAxisProps, yAxisProps } from './chartTheme';

const shortDate = (value) => formatSastDate(value, { day: 'numeric', month: 'short' });
const longDate = (value) => formatSastDate(value, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// Daily present / late / absent, stacked so each bar is the day's cohort.
// The ref points at the plot so exports can draw it into a PDF.
const AttendanceTrendChart = forwardRef(({ data }, ref) => (
  <div className="space-y-3">
    <ChartLegend series={attendanceSeries} />
    <div ref={ref} className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="date" tickFormatter={shortDate} {...xAxisProps} minTickGap={12} />
          <YAxis allowDecimals={false} {...yAxisProps} />
          <Tooltip cursor={{ fill: chartInk.cursor }} content={<ChartTooltip labelFormatter={longDate} showTotal />} />
          {attendanceSeries.map((series, index) => (
            <Bar
              key={series.key}
              name={series.label}
              dataKey={series.key}
              stackId="attendance"
              fill={series.color}
              stroke="#ffffff"
              strokeWidth={2}
              maxBarSize={44}
              radius={index === attendanceSeries.length - 1 ? [4, 4, 0, 0] : 0}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
    <details className="text-xs text-slate-600">
      <summary className="cursor-pointer font-semibold text-slate-500 hover:text-navy">View as table</summary>
      <div className="table-wrap mt-2">
        <table className="table">
          <thead><tr><th>Date</th>{attendanceSeries.map((series) => <th key={series.key} className="text-right">{series.label}</th>)}</tr></thead>
          <tbody>
            {data.map((day) => (
              <tr key={day.date}>
                <td>{longDate(day.date)}</td>
                {attendanceSeries.map((series) => <td key={series.key} className="text-right tabular-nums">{day[series.key] ?? 0}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  </div>
));

AttendanceTrendChart.displayName = 'AttendanceTrendChart';

export default AttendanceTrendChart;
