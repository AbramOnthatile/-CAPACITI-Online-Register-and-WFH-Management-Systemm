import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { formatSastDateTime } from '../../lib/time';
import { canRetryError } from '../../api/client';

const formatTime = (value) => formatSastDateTime(value);

const AuditLog = () => {
  const { audit, auditLoading, auditError, refreshAudit } = useApp();
  const [search, setSearch] = useState('');
  const [targetType, setTargetType] = useState('ALL');
  const targetTypes = [...new Set(audit.map((entry) => entry.targetType))];
  const filtered = useMemo(() => audit.filter((entry) => {
    const detailText = JSON.stringify(entry.details);
    const matchesSearch = !search || [entry.actorName, entry.action, entry.targetType, entry.targetId ?? '', detailText].some((value) => value.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && (targetType === 'ALL' || entry.targetType === targetType);
  }), [audit, search, targetType]);
  const emptyMessage = 'No audit records match the current filters.';

  return (
    <div className="page">
      <PageHeader eyebrow="Security & governance" eyebrowClassName="text-salmon" title="System audit log" description="Audit records of system actions and targets." />

      <div className="surface surface-pad flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Search audit records</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search action, actor, target, or details..." value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-10" />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">Target type</span>
          <select value={targetType} onChange={(event) => setTargetType(event.target.value)} className="input">
            <option value="ALL">All target types</option>
            {targetTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
      </div>

      {auditError && <ErrorState message={auditError.message} />}
      {canRetryError(auditError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshAudit()}>Retry</button>}
      {auditLoading ? <Skeleton label="Loading audit records" /> : !auditError && (
      <>

      {/* Phones */}
      <ul className="list md:hidden">
        {filtered.map((entry) => (
          <li key={entry.id} className="surface p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-primary-600">{entry.action}</p>
              <p className="shrink-0 font-mono text-[11px] text-slate-400">{formatTime(entry.createdAt)}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-navy">{entry.actorName}</p>
            <p className="text-xs text-slate-500">{entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ''}</p>
            <p className="mt-2 break-words rounded-lg bg-slate-50 p-2 font-mono text-[11px] text-slate-600">{JSON.stringify(entry.details)}</p>
          </li>
        ))}
        {!auditError && !filtered.length && <li className="empty-state text-sm text-slate-400">{emptyMessage}</li>}
      </ul>

      {/* Tablet & desktop */}
      <div className="surface hidden overflow-hidden md:block">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap font-mono text-xs tabular-nums text-slate-500">{formatTime(entry.createdAt)}</td>
                  <td className="font-bold text-navy">{entry.actorName}</td>
                  <td className="font-semibold text-primary-600">{entry.action}</td>
                  <td className="text-slate-600">{entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ''}</td>
                  <td className="max-w-md break-words font-mono text-xs text-slate-600">{JSON.stringify(entry.details)}</td>
                </tr>
              ))}
          {!auditError && !filtered.length && <tr><td colSpan={5} className="table-empty">{emptyMessage}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default AuditLog;
