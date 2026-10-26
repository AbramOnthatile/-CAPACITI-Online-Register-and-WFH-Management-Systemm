import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, CheckCircle2, Circle, Home, MessageSquare, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { WfhStatus } from '../../api/types';

const readinessLabels = {
  stableInternet: 'Stable internet',
  powerBackup: 'Power backup',
  quietWorkspace: 'Quiet workspace',
  laptopReady: 'Laptop ready',
};

const formatDateTime = (value) => value
  ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '—';

const WFHDetails = () => {
  const { id } = useParams();
  const { wfh, wfhLoading, wfhError, cancelWFHRequest } = useApp();
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const request = wfh.find((item) => item.id === id);

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

  if (wfhError) return <div className="page-narrow"><Alert>{wfhError.message}</Alert></div>;
  if (wfhLoading) return <p role="status" className="meta">Loading WFH request...</p>;
  if (!request) {
    return (
      <div className="page-narrow">
        <EmptyState icon={Home} title="WFH request not found" action={<Link to="/candidate/wfh" className="btn btn-secondary btn-sm">Back to WFH requests</Link>} />
      </div>
    );
  }

  return (
    <div className="page-narrow">
      <PageHeader backTo="/candidate/wfh" backLabel="Back to WFH requests" eyebrow="WFH request" title={`${request.startDate} – ${request.endDate}`} description={<span className="font-mono text-xs">ID: {request.id}</span>} />

      <Alert>{error}</Alert>

      <Card title="Request" subtitle={request.userName} actions={<StatusBadge status={request.status} />}>
        <div className="space-y-5">
          <div className="inset">
            <p className="label-caps flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Requested period</p>
            <p className="mt-1 font-mono text-lg font-extrabold text-navy sm:text-xl">{request.startDate} – {request.endDate}</p>
          </div>
          <div>
            <p className="label-caps">Reason</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{request.reason}</p>
          </div>
          <dl className="detail-list border-t border-slate-100 pt-4">
            <div className="detail-row"><dt>Created</dt><dd className="font-mono text-xs">{formatDateTime(request.createdAt)}</dd></div>
            <div className="detail-row"><dt>Reviewed by</dt><dd>{request.reviewedByName || 'Not yet reviewed'}</dd></div>
            {request.reviewedAt && <div className="detail-row"><dt>Reviewed at</dt><dd className="font-mono text-xs">{formatDateTime(request.reviewedAt)}</dd></div>}
          </dl>
        </div>
      </Card>

      <Card title="Readiness">
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(request.readiness).map(([key, ready]) => (
            <li key={key} className="flex items-center gap-2.5 rounded-xl border border-slate-100 p-3 text-sm">
              {ready ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
              <span className={ready ? 'font-semibold text-navy' : 'text-slate-500'}>{readinessLabels[key] ?? key}</span>
            </li>
          ))}
        </ul>
      </Card>

      {request.reviewComment && (
        <Card title="Review comment">
          <p className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700"><MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />{request.reviewComment}</p>
        </Card>
      )}

      {request.status === WfhStatus.PENDING && (
        <button type="button" disabled={cancelling} onClick={() => void cancelRequest()} className="btn btn-danger btn-block sm:w-auto">
          <X className="h-4 w-4" />{cancelling ? 'Cancelling...' : 'Cancel request'}
        </button>
      )}
    </div>
  );
};

export default WFHDetails;
