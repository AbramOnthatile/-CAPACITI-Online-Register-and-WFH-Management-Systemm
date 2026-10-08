import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';

const WFHReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wfh, updateWFHRequest } = useApp();
  const [comment, setComment] = useState('');
  const request = wfh.find((item) => item.id === id);

  if (!request) {
    return <div className="card p-8 text-center text-slate-500">Request not found.</div>;
  }

  const approveRequest = () => {
    updateWFHRequest(request.id, {
      status: 'Approved',
      reviewedBy: 'Lerato Dlamini',
      reviewerComment: 'Approved for the requested date.',
    });
    navigate('/champion/wfh');
  };

  const rejectRequest = () => {
    if (!comment.trim()) {
      alert('Reviewer comment is required before rejecting a WFH request.');
      return;
    }
    updateWFHRequest(request.id, {
      status: 'Rejected',
      reviewedBy: 'Lerato Dlamini',
      reviewerComment: comment,
    });
    navigate('/champion/wfh');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Review</p>
          <h2 className="text-3xl font-bold text-slate-900">WFH Review</h2>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div><p className="text-sm text-slate-500">Candidate</p><p className="font-medium text-slate-800">{request.candidate}</p></div>
            <div><p className="text-sm text-slate-500">WFH date</p><p className="font-medium text-slate-800">{request.date}</p></div>
            <div><p className="text-sm text-slate-500">Reason</p><p className="font-medium text-slate-800">{request.reason}</p></div>
            <div><p className="text-sm text-slate-500">Current attendance</p><p className="font-medium text-slate-800">92% attendance</p></div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-slate-500">Supporting Information</p>
            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-700">{request.supportingInfo}</p>
          </div>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-medium text-slate-700">Reviewer comment</label>
            <textarea rows="4" className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Provide a detailed review note" />
          </div>

          <div className="mt-6 flex gap-3">
            <button className="btn btn-danger flex-1" onClick={rejectRequest}>Reject</button>
            <button className="btn btn-primary flex-1" onClick={approveRequest}>Approve</button>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Request timeline</p>
          <div className="mt-6 space-y-4">
            {request.timeline.map((step, index) => (
              <div key={step} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-full ${index === 0 ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-700'}`}>{index + 1}</div>
                <span className="text-sm font-medium text-slate-700">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WFHReview;
