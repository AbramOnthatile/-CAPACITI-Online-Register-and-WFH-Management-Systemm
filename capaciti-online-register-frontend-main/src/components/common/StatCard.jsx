const toneMap = {
  primary: 'bg-primary-600/10 text-primary-600',
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-salmon/10 text-salmon',
  danger: 'bg-rose-500/10 text-rose-600',
  slate: 'bg-navy/10 text-navy',
};

const valueToneMap = {
  primary: 'text-navy',
  success: 'text-emerald-600',
  warning: 'text-salmon',
  danger: 'text-rose-600',
  slate: 'text-navy',
};

const StatCard = ({ title, value, detail, tone = 'primary', icon: Icon, trend, colorValue = false }) => (
  <div className="surface surface-pad flex flex-col">
    <div className="flex items-start justify-between gap-3">
      <p className="label-caps min-w-0 leading-snug">{title}</p>
      {Icon && (
        <span className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:flex ${toneMap[tone] ?? toneMap.primary}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      )}
    </div>
    <p className={`mt-2 font-mono text-2xl font-extrabold tracking-tight tabular-nums ${colorValue ? valueToneMap[tone] : 'text-navy'}`}>{value}</p>
    {(detail || trend) && (
      <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-slate-500">
        <span className="truncate">{detail}</span>
        {trend && <span className="font-semibold text-emerald-600 tabular-nums">{trend}</span>}
      </div>
    )}
  </div>
);

export default StatCard;
