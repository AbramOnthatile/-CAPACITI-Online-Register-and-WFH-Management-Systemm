import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import { ArrowLeft, Calendar, MessageSquare, X } from 'lucide-react';
import { WfhStatus } from '../../api/types';

const WFHDetails = () => {
  const { id } = useParams();
  const { wfh, wfhLoading, wfhError, cancelWFHRequest } = useApp();
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const request = wfh.find((item) => item.id === id);
  const formatDateTime = (value) => value
    ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : '—';
  const cancelRequest = async () => {
    setError('');
    setCancelling(true);
    try {
      await cancelWFHRequest(request.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The WFH request could not be cancelled.');
    } finally {
      setCancelling(false);
    }
  };

  if (wfhError) {
    return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">{wfhError.message}</p>;
  }
  if (wfhLoading) {
    return <p role="status" className="text-xs text-slate-500">Loading WFH request...</p>;
  }
  if (!request) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
        <p className="font-bold">WFH request not found.</p>
        <Link to="/candidate/wfh" className="mt-3 inline-block text-xs font-bold text-[#6115D0] hover:underline">Return to WFH Requests</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/candidate/wfh" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"><ArrowLeft className="h-4 w-4" /></Link>
        <div><h2 className="text-xl font-black text-[#1D2951] sm:text-2xl">WFH Request Details</h2><p className="font-mono text-xs text-slate-500">ID: {request.id}</p></div>
      </div>
      <Card title="Remote Work Request" subtitle={request.userName} actions={<StatusBadge status={request.status} />}>
        <div className="space-y-4">
          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Calendar className="h-3.5 w-3.5" />Requested period</p>
            <p className="mt-1 font-mono text-2xl font-black text-[#1D2951]">{request.startDate} – {request.endDate}</p>
          </div>
          <div className="space-y-2 text-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason</p>
            <p className="rounded-xl border border-slate-100 bg-white p-3.5 leading-relaxed text-slate-700">{request.reason}</p>
          </div>
          <div className="grid gap-3 border-t border-slate-100 pt-2 text-xs sm:grid-cols-2">
            <div><span className="text-slate-400">Created</span><p className="mt-0.5 font-mono font-bold text-[#1D2951]">{formatDateTime(request.createdAt)}</p></div>
            <div><span className="text-slate-400">Reviewed by</span><p className="mt-0.5 font-bold text-[#1D2951]">{request.reviewedByName || 'Not yet reviewed'}</p>{request.reviewedAt && <p className="mt-0.5 font-mono text-[10px] text-slate-400">{formatDateTime(request.reviewedAt)}</p>}</div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs">
            <span className="mb-2 flex items-center gap-1.5 font-bold text-[#1D2951]"><MessageSquare className="h-3.5 w-3.5 text-[#6115D0]" />Readiness</span>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              {Object.entries(request.readiness).map(([key, ready]) => <p key={key}>{key}: {ready ? 'Ready' : 'Not ready'}</p>)}
            </div>
          </div>
          {request.reviewComment && <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5 text-xs text-slate-600"><strong className="text-[#1D2951]">Review comment:</strong><p className="mt-1 text-slate-700">{request.reviewComment}</p></div>}
          {request.status === WfhStatus.PENDING && <div className="flex justify-end border-t border-slate-100 pt-3"><button type="button" disabled={cancelling} onClick={() => void cancelRequest()} className="flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-60"><X className="h-3.5 w-3.5" />{cancelling ? 'Cancelling...' : 'Cancel Request'}</button></div>}
        </div>
      </Card>
    </div>
  );
};

export default WFHDetails;
