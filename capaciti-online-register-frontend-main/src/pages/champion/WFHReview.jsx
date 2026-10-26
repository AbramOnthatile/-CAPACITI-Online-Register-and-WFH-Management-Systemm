import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, Home, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { WfhStatus } from '../../api/types';

const WFHReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wfh, wfhLoading, wfhError, updateWFHRequest } = useApp();
  const request = wfh.find((r) => r.id === id);

  const [comment, setComment] = useState('');
  const [decisionFeedback, setDecisionFeedback] = useState(null);

  if (wfhError) return <div className="page-narrow"><Alert>{wfhError.message}</Alert></div>;
  if (wfhLoading) return <p role="status" className="meta">Loading WFH request...</p>;
  if (!request) {
    return (
      <div className="page-narrow">
        <EmptyState icon={Home} title="WFH request not found" action={<Link to="/champion/wfh" className="btn btn-secondary btn-sm">Return to WFH queue</Link>} />
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
    <div className="page-narrow">
      <PageHeader backTo="/champion/wfh" backLabel="Back to WFH queue" eyebrow="Review remote application" title={request.userName} description={<span className="font-mono">{request.startDate} – {request.endDate}</span>} />

      {decisionFeedback && <Alert tone={request.status === WfhStatus.PENDING ? 'error' : 'success'}>{decisionFeedback}</Alert>}

      <Card title="Application" actions={<StatusBadge status={request.status} />}>
        <div className="space-y-5">
          <div className="inset">
            <p className="label-caps">Requested period</p>
            <p className="mt-1 font-mono text-lg font-extrabold text-navy">{request.startDate} – {request.endDate}</p>
          </div>

          <div>
            <p className="label-caps">Candidate statement</p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{request.reason}</p>
          </div>

          <label className="field">
            <span className="field-label">Comment / instructions</span>
            <textarea
              rows="3"
              className="input"
              placeholder="e.g., Approved. Ensure you dial into the 09:15 architecture sync..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>

          {request.status === WfhStatus.PENDING && (
            <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-5 sm:flex sm:justify-end">
              <button type="button" onClick={() => void handleDecision(WfhStatus.REJECTED)} className="btn btn-danger"><X className="h-4 w-4" />Reject</button>
              <button type="button" onClick={() => void handleDecision(WfhStatus.APPROVED)} className="btn btn-primary"><Check className="h-4 w-4" />Authorize WFH</button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WFHReview;
