import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search } from 'lucide-react';

const AuditLog = () => {
  const { audit, auditLoading, auditError } = useApp();
  const [search, setSearch] = useState('');
  const [targetType, setTargetType] = useState('ALL');
  const targetTypes = [...new Set(audit.map((entry) => entry.targetType))];
  const filtered = useMemo(() => audit.filter((entry) => {
    const detailText = JSON.stringify(entry.details);
    const matchesSearch = !search || [entry.actorName, entry.action, entry.targetType, entry.targetId ?? '', detailText].some((value) => value.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && (targetType === 'ALL' || entry.targetType === targetType);
  }), [audit, search, targetType]);
  const formatTime = (value) => new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

  return (
    <div className="space-y-6">
      <div><div className="flex items-center gap-2"><span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F25251]">Security &amp; Governance</span><span className="text-slate-300">·</span><span className="text-xs font-medium text-slate-500">Compliance Trail</span></div><h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">System Audit Log</h2><p className="mt-0.5 text-xs text-slate-600 sm:text-sm">Audit records of system actions and targets.</p></div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm">
        <div className="relative min-w-[220px] flex-1"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input type="text" placeholder="Search action, actor, target, or details..." value={search} onChange={(event) => setSearch(event.target.value)} className="input py-1.5 pl-8 text-xs" /></div>
        <select value={targetType} onChange={(event) => setTargetType(event.target.value)} className="input w-auto py-1.5 text-xs"><option value="ALL">All target types</option>{targetTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
      </div>
      {auditError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{auditError.message}</p>}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-3.5">Timestamp</th><th className="px-4 py-3.5">Actor</th><th className="px-4 py-3.5">Action</th><th className="px-4 py-3.5">Target</th><th className="px-4 py-3.5">Details</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((entry) => <tr key={entry.id} className="transition-colors hover:bg-slate-50/60"><td className="whitespace-nowrap px-5 py-3 font-mono tabular-nums text-slate-500">{formatTime(entry.createdAt)}</td><td className="px-4 py-3 font-bold text-[#1D2951]">{entry.actorName}</td><td className="px-4 py-3 font-semibold text-[#6115D0]">{entry.action}</td><td className="px-4 py-3 text-slate-600">{entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ''}</td><td className="max-w-md break-words px-4 py-3 text-slate-600">{JSON.stringify(entry.details)}</td></tr>)}
            {auditLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">Loading audit records...</td></tr>}
            {!auditLoading && !auditError && filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No audit records match the current filters.</td></tr>}
          </tbody>
        </table></div>
      </div>
    </div>
  );
};

export default AuditLog;
