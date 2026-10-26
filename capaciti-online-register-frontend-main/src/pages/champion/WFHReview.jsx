import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import { ArrowLeft, Check, X, MessageSquare, Home, Calendar, User } from 'lucide-react';
import { WfhStatus } from '../../api/types';

const WFHReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wfh, wfhLoading, wfhError, updateWFHRequest } = useApp();
  const request = wfh.find((r) => r.id === id);

  const [comment, setComment] = useState('');
  const [decisionFeedback, setDecisionFeedback] = useState(null);

  if (wfhError) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{wfhError.message}</p>;
  }
  if (wfhLoading) {
    return <p role="status" className="text-xs text-slate-500">Loading WFH request...</p>;
  }
  if (!request) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        <p className="font-bold">WFH Request not found.</p>
        <Link to="/champion/wfh" className="mt-3 inline-block text-xs font-bold text-[#6115D0] hover:underline">
          Return to WFH Queue
        </Link>
      </div>
    );
  }

  const handleDecision = async (status) => {
    try {
      await updateWFHRequest(request.id, {
        status,
        reviewComment: comment || (status === WfhStatus.APPROVED ? 'Authorized remote work.' : 'On-site attendance required.'),
      });
      setDecisionFeedback(`Request ${status.toLowerCase()} successfully.`);
      setTimeout(() => navigate('/champion/wfh'), 1200);
    } catch (error) {
      setDecisionFeedback(error instanceof Error ? error.message : 'The WFH decision could not be saved.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          to="/champion/wfh"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#1D2951]">Review Remote Application</h2>
          <p className="text-xs text-slate-500 font-mono">Candidate: {request.userName}</p>
        </div>
      </div>

      {decisionFeedback && (
        <div className={`rounded-xl border p-4 text-xs font-bold ${request.status === WfhStatus.PENDING ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
          {decisionFeedback}
        </div>
      )}

      <Card
        title={`Application by ${request.userName}`}
        subtitle={`${request.startDate} – ${request.endDate}`}
        actions={<StatusBadge status={request.status} />}
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-3.5">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Category</span>
              <p className="font-bold text-[#1D2951] mt-0.5">{request.reason}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3.5">
              <span className="text-slate-400 uppercase text-[10px] font-bold">Requested Date</span>
              <p className="font-mono font-bold text-[#1D2951] mt-0.5">{request.startDate} – {request.endDate}</p>
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Candidate Statement</span>
            <p className="mt-1.5 rounded-xl border border-slate-100 bg-white p-4 text-xs text-slate-700 leading-relaxed">
              {request.reason}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
              Tech Champion Comment / Instructions
            </label>
            <textarea
              rows="3"
              className="input text-xs"
              placeholder="e.g., Approved. Ensure you dial into the 09:15 architecture sync..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {request.status === WfhStatus.PENDING && (
            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => void handleDecision(WfhStatus.REJECTED)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                Reject Request
              </button>
              <button
                type="button"
                onClick={() => void handleDecision(WfhStatus.APPROVED)}
                className="flex-1 rounded-xl bg-[#6115D0] py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#4F11AA] transition-all"
              >
                Authorize WFH
              </button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WFHReview;
