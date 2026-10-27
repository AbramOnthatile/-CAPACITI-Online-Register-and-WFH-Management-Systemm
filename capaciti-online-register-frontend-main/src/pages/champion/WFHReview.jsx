import { useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Check, Home, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { Skeleton } from '../../components/common/RequestState';
import { WfhStatus } from '../../api/types';
import { canRetryError, getUserErrorMessage } from '../../api/client';
import { formatSastDate } from '../../lib/time';

const WFHReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wfh, wfhLoading, wfhError, updateWFHRequest, refreshWfh } = useApp();
  const request = wfh.find((r) => r.id === id);

  const [comment, setComment] = useState('');
  const [decisionFeedback, setDecisionFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const [retryDecision, setRetryDecision] = useState(null);

  if (wfhError) return <div className="page-narrow"><Alert>{wfhError.message}</Alert>{canRetryError(wfhError) && <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => void refreshWfh()}>Retry</button>}</div>;
  if (wfhLoading) return <div className="page-narrow"><Skeleton label="Loading WFH request" /></div>;
  if (!request) {
    return (
      <div className="page-narrow">
        <EmptyState icon={Home} title="WFH request not found" action={<Link to="/champion/wfh" className="btn btn-secondary btn-sm">Return to WFH queue</Link>} />
      </div>
    );
  }

  const handleDecision = async (status) => {
    if (inFlight.current) return;
    if (status === WfhStatus.REJECTED && !comment.trim()) {
      setDecisionFeedback({ tone: 'error', message: 'A comment is required when rejecting a WFH request.' });
      return;
    }
    inFlight.current = true;
    setSaving(true);
    try {
      await updateWFHRequest(request.id, {
        status,
        reviewComment: comment.trim(),
      });
      setRetryDecision(null);
      setDecisionFeedback({ tone: 'success', message: `Request ${status.toLowerCase()} successfully.` });
      setTimeout(() => navigate('/champion/wfh'), 1200);
    } catch (error) {
      setRetryDecision({ status, reviewComment: comment.trim(), error });
      setDecisionFeedback({ tone: 'error', message: getUserErrorMessage(error, 'The WFH decision could not be saved.') });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const retryDecisionRequest = async () => {
    if (!retryDecision || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    try {
      await updateWFHRequest(request.id, {
        status: retryDecision.status,
        reviewComment: retryDecision.reviewComment,
      });
      setRetryDecision(null);
      setDecisionFeedback({ tone: 'success', message: `Request ${retryDecision.status.toLowerCase()} successfully.` });
      setTimeout(() => navigate('/champion/wfh'), 1200);
    } catch (error) {
      setRetryDecision({ ...retryDecision, error });
      setDecisionFeedback({ tone: 'error', message: getUserErrorMessage(error, 'The WFH decision could not be saved.') });
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="page-narrow">
      <PageHeader backTo="/champion/wfh" backLabel="Back to WFH queue" eyebrow="Review remote application" title={request.userName} description={<span className="font-mono">{formatSastDate(request.startDate)} – {formatSastDate(request.endDate)}</span>} />

      {decisionFeedback && <Alert tone={decisionFeedback.tone}>{decisionFeedback.message}</Alert>}
      {retryDecision && canRetryError(retryDecision.error) && <button type="button" className="btn btn-secondary btn-sm" disabled={saving} onClick={() => void retryDecisionRequest()}>Retry</button>}

      <Card title="Application" actions={<StatusBadge status={request.status} />}>
        <div className="space-y-5">
          <div className="inset">
            <p className="label-caps">Requested period</p>
            <p className="mt-1 font-mono text-lg font-extrabold text-navy">{formatSastDate(request.startDate)} – {formatSastDate(request.endDate)}</p>
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
              <button type="button" disabled={saving} onClick={() => void handleDecision(WfhStatus.REJECTED)} className="btn btn-danger"><X className="h-4 w-4" />Reject</button>
              <button type="button" disabled={saving} onClick={() => void handleDecision(WfhStatus.APPROVED)} className="btn btn-primary"><Check className="h-4 w-4" />Authorize WFH</button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WFHReview;
