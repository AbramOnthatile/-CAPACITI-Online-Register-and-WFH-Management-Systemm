// One look for every chart: hairline horizontal grid, recessive axes, a white tooltip
// with text in ink colours (the swatch carries identity), and the status colours
// for attendance states. The three status hues were checked for colour-blind
// separation; the green/amber pair leans on the 2px gaps, legend and table view.

export const chartInk = {
  grid: '#e2e8f0',
  axis: '#cbd5e1',
  tick: '#64748b',
  text: '#1D2951',
  muted: '#64748b',
  cursor: 'rgba(29, 41, 81, 0.06)',
};

export const brandSeries = '#6115D0';

export const attendanceSeries = [
  { key: 'present', label: 'Present', color: '#15803d' },
  { key: 'late', label: 'Late', color: '#d97706' },
  { key: 'absent', label: 'Absent', color: '#be123c' },
];

export const gridProps = { stroke: chartInk.grid, vertical: false };

export const xAxisProps = {
  tick: { fontSize: 11, fill: chartInk.tick },
  tickLine: false,
  axisLine: { stroke: chartInk.axis },
  tickMargin: 8,
};

export const yAxisProps = {
  tick: { fontSize: 11, fill: chartInk.tick },
  tickLine: false,
  axisLine: false,
  width: 40,
};

export const ChartLegend = ({ series }) => (
  <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
    {series.map((item) => (
      <li key={item.key} className="inline-flex items-center gap-1.5">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
        {item.label}
      </li>
    ))}
  </ul>
);

// Recharts tooltip content: label on top, one row per series, an optional total.
export const ChartTooltip = ({ active, payload, label, labelFormatter, valueFormatter = (value) => value, showTotal = false }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  return (
    <div className="min-w-[9rem] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-bold text-navy">{labelFormatter ? labelFormatter(label) : label}</p>
      <ul className="space-y-1">
        {[...payload].reverse().map((item) => (
          <li key={item.dataKey} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span aria-hidden="true" className="h-2 w-2 rounded-sm" style={{ backgroundColor: item.color ?? item.fill }} />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums text-navy">{valueFormatter(item.value)}</span>
          </li>
        ))}
      </ul>
      {showTotal && payload.length > 1 && (
        <p className="mt-1.5 flex justify-between border-t border-slate-100 pt-1.5 text-slate-500">
          Total<span className="font-semibold tabular-nums text-navy">{valueFormatter(total)}</span>
        </p>
      )}
    </div>
  );
};
