import { useMemo, useState } from 'react';
import { Plus, Calendar, Home, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WfhStatus } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import { demoOnly } from '../../mocks/demoOnly';
import { getStatusMetadata } from '../../lib/status';

const filters = ['ALL', ...Object.values(WfhStatus)];

const WFHRequests = () => {
  const { wfh, wfhLoading, wfhError } = useApp();
  const { user } = useAuth();
  const [tab, setTab] = useState('ALL');
  const mine = useMemo(() => wfh.filter((item) => item.userId === user?.id), [wfh, user?.id]);
  const filtered = tab === 'ALL' ? mine : mine.filter((item) => item.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Remote Work Governance</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">My requests</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">My WFH Requests</h2>
        </div>
        <Link to="/candidate/wfh/new" className="flex items-center gap-2 self-start rounded-xl bg-[#6115D0] px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#4F11AA] sm:self-auto">
          <Plus className="h-4 w-4" /><span>Apply for WFH</span>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Weekly Policy Allowance</p>
            {/* MOCK-ONLY: not in backend */}
            <StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>
          </div>
          <p className="mt-1 font-mono text-2xl font-black text-[#1D2951]">{demoOnly.weeklyAllowance}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Policy display only</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Approved Requests</p>
          <p className="mt-1 font-mono text-2xl font-black text-emerald-600">{mine.filter((item) => item.status === WfhStatus.APPROVED).length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">From your request records</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Decisions</p>
          <p className="mt-1 font-mono text-2xl font-black text-[#F25251]">{mine.filter((item) => item.status === WfhStatus.PENDING).length}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Awaiting review</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        {filters.map((key) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`shrink-0 rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${tab === key ? 'bg-[#1D2951] text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-[#1D2951]'}`}>
            {key === 'ALL' ? 'All' : getStatusMetadata(key).label}
          </button>
        ))}
      </div>

      {wfhError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{wfhError.message}</p>}
      {wfhLoading ? <p className="text-xs text-slate-500">Loading requests...</p> : (
        <div className="space-y-3">
          {filtered.length ? filtered.map((request) => (
            <Link key={request.id} to={`/candidate/wfh/${request.id}`} className="group flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-[#6115D0]/40 hover:shadow-md sm:flex-row sm:items-center">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Home className="h-5 w-5" /></div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1D2951] group-hover:text-[#6115D0]">{request.reason}</h3>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{request.startDate} – {request.endDate}</span>
                    <span>Reviewed by: {request.reviewedByName || 'Not yet reviewed'}</span>
                  </div>
                </div>
              </div>
              <span className="flex items-center gap-1 self-end text-xs font-bold text-[#6115D0] sm:self-center">View Details <ChevronRight className="h-4 w-4" /></span>
            </Link>
          )) : <Card title="No WFH requests"><p className="text-xs text-slate-500">Submit a request when you need to work remotely.</p></Card>}
        </div>
      )}
    </div>
  );
};

export default WFHRequests;
