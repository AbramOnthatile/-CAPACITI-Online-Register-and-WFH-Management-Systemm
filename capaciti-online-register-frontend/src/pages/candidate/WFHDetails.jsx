import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';

const WFHDetails = () => {
  const { id } = useParams();
  const { wfh } = useApp();
  const request = wfh.find((item) => item.id === id);

  if (!request) {
    return <div className="card p-8 text-center text-slate-500">WFH request not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/candidate/wfh" className="btn btn-secondary">
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Link>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">WFH Request</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">{request.reason}</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div><p className="text-sm text-slate-500">Candidate</p><p className="font-medium text-slate-800">{request.candidate}</p></div>
            <div><p className="text-sm text-slate-500">Requested Date</p><p className="font-medium text-slate-800">{request.date}</p></div>
            <div><p className="text-sm text-slate-500">Submitted At</p><p className="font-medium text-slate-800">{new Date(request.submittedAt).toLocaleString()}</p></div>
            <div><p className="text-sm text-slate-500">Current Status</p><p className="font-medium text-slate-800">{request.status}</p></div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-500">Supporting Information</p>
            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">{request.supportingInfo}</p>
          </div>

          {request.status === 'Rejected' && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              <p className="font-semibold">Reviewer Comment</p>
              <p className="mt-1">{request.reviewerComment || 'No comment provided.'}</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Timeline</p>
          <div className="mt-6 space-y-4">
            {request.timeline.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${index === request.timeline.length - 1 ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-700'}`}>
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-slate-700">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WFHDetails;
