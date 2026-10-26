import { getStatusMetadata } from '../../lib/status';
const toneClasses = {
  success: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20',
  warning: 'text-amber-700 bg-amber-500/10 border-amber-500/20',
  danger: 'text-rose-700 bg-rose-500/10 border-rose-500/20',
  info: 'text-sky-700 bg-sky-500/10 border-sky-500/20',
  neutral: 'text-slate-600 bg-slate-100 border-slate-200',
  primary: 'text-[#6115D0] bg-[#6115D0]/10 border-[#6115D0]/20',
};

const StatusBadge = ({ children, status }) => {
  const metadata = getStatusMetadata(status);
  if (!metadata) throw new Error(`Unsupported status value: ${String(status)}`);
  const Icon = metadata.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide ${toneClasses[metadata.tone]}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{children || metadata.label}</span>
    </span>
  );
};

export default StatusBadge;
