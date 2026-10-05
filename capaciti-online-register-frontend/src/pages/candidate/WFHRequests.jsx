import { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';

const WFHRequests = () => {
  const { wfh } = useApp();
  const { user } = useAuth();
  const [tab, setTab] = useState('All');

  const filtered = useMemo(() => {
    const mine = wfh.filter((item) => item.candidateId === user.id);
    if (tab === 'All') return mine;
    return mine.filter((item) => item.status === tab);
  }, [wfh, tab, user.id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">WFH</p>
          <h2 className="text-3xl font-bold text-slate-900">My WFH Requests</h2>
        </div>
        <Link to="/candidate/wfh/new" className="btn btn-primary">
          <Plus className="mr-2 h-4 w-4" />New Request
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {['All', 'Pending', 'Approved', 'Rejected'].map((key) => (
            <button
              key={key}
              type="button"
              className={`rounded-xl px-3 py-2 text-sm font-medium ${tab === key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              onClick={() => setTab(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.length ? filtered.map((request) => (
          <Link key={request.id} to={`/candidate/wfh/${request.id}`} className="card block p-4 hover:border-primary-200">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-900">{request.reason}</p>
                <p className="mt-1 text-sm text-slate-500">Requested: {request.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={request.status} />
                <span className="text-sm text-slate-500">Reviewed by {request.reviewedBy || '—'}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
              <span>Submitted: {new Date(request.submittedAt).toLocaleDateString()}</span>
              <span>Reason: {request.reason}</span>
              <span>Action: View</span>
            </div>
          </Link>
        )) : (
          <div className="card p-8 text-center text-slate-500">
            <Search className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-lg font-medium">No WFH requests found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WFHRequests;
