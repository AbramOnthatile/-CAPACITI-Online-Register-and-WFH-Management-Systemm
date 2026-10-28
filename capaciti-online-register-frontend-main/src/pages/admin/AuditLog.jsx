import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { formatSastDateTime, formatSastTime, getSastDateValue } from '../../lib/time';
import { canRetryError } from '../../api/client';
import { actionLabel, auditSearchText, detailEntries, groupByPersonAndDay } from '../../lib/auditFormat';

const formatTime = (value) => formatSastDateTime(value);

const Activities = ({ events }) => (
  <ul className="space-y-1">
    {events.map((event) => (
      <li key={event.id} className="flex items-baseline gap-2 whitespace-nowrap text-xs">
        <span className="font-semibold text-primary-600">{actionLabel(event.action)}</span>
        <span className="font-mono tabular-nums text-slate-400">{formatSastTime(event.createdAt)}</span>
      </li>
    ))}
  </ul>
);

const Details = ({ details }) => {
  const entries = detailEntries(details);
  if (!entries.length) return <span className="text-xs text-slate-400">—</span>;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {entries.map((detail) => (
        <li key={detail.key} className="inline-flex max-w-full items-baseline gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
          <span className="text-slate-500">{detail.label}:</span>
          <span className="break-words font-semibold text-slate-700">{detail.value}</span>
        </li>
      ))}
    </ul>
  );
};

const AuditLog = () => {
  const { audit, auditLoading, auditError, refreshAudit } = useApp();
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('ALL');
  const actions = [...new Set(audit.map((entry) => entry.action))];
  const rows = useMemo(() => groupByPersonAndDay(
    audit.filter((entry) => (action === 'ALL' || entry.action === action)
      && (!search || auditSearchText(entry).includes(search.toLowerCase()))),
    (value) => getSastDateValue(value) ?? value,
  ), [audit, search, action]);
  const emptyMessage = 'No audit records match the current filters.';

  return (
    <div className="page">
      <PageHeader eyebrow="Security & governance" eyebrowClassName="text-salmon" title="System audit log" description="Each person's activity, one row per day." />

      <div className="surface surface-pad flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <span className="sr-only">Search audit records</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" placeholder="Search person, action, or details..." value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-10" />
        </label>
        <label className="sm:w-56">
          <span className="sr-only">Activity</span>
          <select value={action} onChange={(event) => setAction(event.target.value)} className="input">
            <option value="ALL">All activities</option>
            {actions.map((value) => <option key={value} value={value}>{actionLabel(value)}</option>)}
          </select>
        </label>
      </div>

      {auditError && <ErrorState message={auditError.message} />}
      {canRetryError(auditError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshAudit()}>Retry</button>}
      {auditLoading ? <Skeleton label="Loading audit records" /> : !auditError && (
      <>

      {/* Phones & tablets */}
      <ul className="list lg:hidden">
        {rows.map((row) => (
          <li key={row.key} className="surface p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-navy">{row.actorName}</p>
              <p className="shrink-0 font-mono text-[11px] text-slate-400">{formatTime(row.lastAt)}</p>
            </div>
            <div className="mt-2"><Activities events={row.events} /></div>
            <div className="mt-2"><Details details={row.details} /></div>
          </li>
        ))}
        {!auditError && !rows.length && <li className="empty-state text-sm text-slate-400">{emptyMessage}</li>}
      </ul>

      {/* Desktop */}
      <div className="surface hidden overflow-hidden lg:block">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Last activity</th><th>Person</th><th>Activity</th><th>Details</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="align-top">
                  <td className="whitespace-nowrap font-mono text-xs tabular-nums text-slate-500">{formatTime(row.lastAt)}</td>
                  <td className="whitespace-nowrap font-bold text-navy">{row.actorName}</td>
                  <td><Activities events={row.events} /></td>
                  <td className="max-w-md"><Details details={row.details} /></td>
                </tr>
              ))}
          {!auditError && !rows.length && <tr><td colSpan={4} className="table-empty">{emptyMessage}</td></tr>}
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
