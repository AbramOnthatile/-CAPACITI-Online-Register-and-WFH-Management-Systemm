import { useMemo, useState } from 'react';
import { Plus, Calendar, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WfhStatus } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { getStatusMetadata } from '../../lib/status';
import { countWfhDaysForWeek, getCurrentWeekStart, weeklyWfhLimit } from '../../lib/wfhPolicy';

const filters = ['ALL', ...Object.values(WfhStatus)];

const WFHRequests = () => {
  const { wfh, wfhLoading, wfhError } = useApp();
  const { user } = useAuth();
  const [tab, setTab] = useState('ALL');
  const mine = useMemo(() => wfh.filter((item) => item.userId === user?.id), [wfh, user?.id]);
  const filtered = tab === 'ALL' ? mine : mine.filter((item) => item.status === tab);
  const reservedDaysThisWeek = countWfhDaysForWeek(mine, getCurrentWeekStart());
  const remainingDays = Math.max(0, weeklyWfhLimit - reservedDaysThisWeek);
  const approved = mine.filter((item) => item.status === WfhStatus.APPROVED).length;
  const pending = mine.filter((item) => item.status === WfhStatus.PENDING).length;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Remote work"
        title="My WFH requests"
        actions={<Link to="/candidate/wfh/new" className="btn btn-primary"><Plus className="h-4 w-4" />Apply for WFH</Link>}
      />

      <div className="surface surface-pad">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label-caps">Weekly allowance</p>
            <p className="mt-1 font-mono text-2xl font-extrabold text-navy">{remainingDays} day{remainingDays === 1 ? '' : 's'} left</p>
          </div>
          <p className="text-right text-xs text-slate-500">{reservedDaysThisWeek} of {weeklyWfhLimit} used</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={weeklyWfhLimit} aria-valuenow={reservedDaysThisWeek} aria-label="WFH days used this week">
          <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${Math.min(100, (reservedDaysThisWeek / weeklyWfhLimit) * 100)}%` }} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <div><dt className="label-caps">Approved</dt><dd className="mt-0.5 font-mono text-xl font-extrabold text-emerald-600">{approved}</dd></div>
          <div><dt className="label-caps">Pending</dt><dd className="mt-0.5 font-mono text-xl font-extrabold text-salmon">{pending}</dd></div>
        </dl>
      </div>

      <div className="chip-row" role="group" aria-label="Filter requests by status">
        {filters.map((key) => (
          <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)} className="chip">
            {key === 'ALL' ? 'All' : getStatusMetadata(key).label}
          </button>
        ))}
      </div>

      <Alert>{wfhError?.message}</Alert>
      {wfhLoading ? <p className="meta">Loading requests...</p> : (
        <ul className="list">
          {filtered.map((request) => (
            <li key={request.id}>
              <Link to={`/candidate/wfh/${request.id}`} className="surface surface-interactive group flex items-center gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600"><Home className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-sm font-bold text-navy group-hover:text-primary-600">{request.reason}</h3>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-mono"><Calendar className="h-3.5 w-3.5" />{request.startDate} – {request.endDate}</span>
                    <span>{request.reviewedByName ? `Reviewed by ${request.reviewedByName}` : 'Not yet reviewed'}</span>
                  </p>
                </div>
                <ChevronRight className="hidden h-5 w-5 shrink-0 text-slate-300 sm:block" />
              </Link>
            </li>
          ))}
          {!filtered.length && (
            <li>
              <EmptyState
                icon={Home}
                title="No WFH requests"
                description="Submit a request when you need to work remotely."
                action={<Link to="/candidate/wfh/new" className="btn btn-secondary btn-sm"><Plus className="h-3.5 w-3.5" />New request</Link>}
              />
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default WFHRequests;
