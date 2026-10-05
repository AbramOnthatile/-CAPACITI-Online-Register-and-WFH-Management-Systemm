const StatCard = ({ title, value, detail, tone = 'primary', icon: Icon }) => {
  const toneMap = {
    primary: 'bg-primary-50 text-primary-700 border-primary-100',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <div className={`rounded-xl border p-2 ${toneMap[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {detail && <p className="mt-3 text-xs text-slate-500">{detail}</p>}
    </div>
  );
};

export default StatCard;
