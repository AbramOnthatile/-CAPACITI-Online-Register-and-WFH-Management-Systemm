const toneMap = {
  primary: {
    bg: 'bg-[#6115D0]/10',
    iconText: 'text-[#6115D0]',
    border: 'border-[#6115D0]/20',
  },
  success: {
    bg: 'bg-emerald-500/10',
    iconText: 'text-emerald-600',
    border: 'border-emerald-500/20',
  },
  warning: {
    bg: 'bg-[#F25251]/10',
    iconText: 'text-[#F25251]',
    border: 'border-[#F25251]/20',
  },
  danger: {
    bg: 'bg-rose-500/10',
    iconText: 'text-rose-600',
    border: 'border-rose-500/20',
  },
  slate: {
    bg: 'bg-[#1D2951]/10',
    iconText: 'text-[#1D2951]',
    border: 'border-[#1D2951]/20',
  },
};

const StatCard = ({ title, value, detail, tone = 'primary', icon: Icon, trend }) => {
  const currentTone = toneMap[tone] || toneMap.primary;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_-2px_rgba(29,41,81,0.04)] transition-all hover:border-slate-300 hover:shadow-[0_4px_16px_-4px_rgba(29,41,81,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-[#1D2951] tabular-nums font-mono">{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${currentTone.bg} ${currentTone.iconText} ${currentTone.border}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(detail || trend) && (
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span className="truncate">{detail}</span>
          {trend && <span className="font-semibold text-emerald-600 tabular-nums">{trend}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
