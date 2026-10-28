import { useState } from 'react';
import { AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePromptReviewsApi } from '../../api/hooks';
import { canRetryError } from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { PromptStatus, WfhStatus } from '../../api/types';

import { formatSastDateTime, getSastToday } from '../../lib/time';

const labelFor = (key) => key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replaceAll('_', ' ');

// Live data: what each assigned candidate submitted for the selected day.
const LiveCheckIns = () => {
  const [date, setDate] = useState(getSastToday);
  const reviews = usePromptReviewsApi(date);
  const submitted = reviews.data.filter((entry) => entry.status === PromptStatus.SUBMITTED).length;

  return (
    <div className="page-narrow">
      <PageHeader
        eyebrow="Candidate submissions"
        title="Check-in reviews"
        description="Responses your candidates submitted for their WFH check-ins."
        actions={(
          <label className="flex items-center gap-2">
            <span className="sr-only">Day</span>
            <input type="date" className="input" value={date} max={getSastToday()} onChange={(event) => event.target.value && setDate(event.target.value)} />
          </label>
        )}
      />

      {reviews.error && <ErrorState message={reviews.error.message} />}
      {canRetryError(reviews.error) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void reviews.refresh()}>Retry</button>}
      {reviews.loading ? <Skeleton label="Loading check-ins" /> : !reviews.error && (
        reviews.data.length ? (
          <>
            <p className="text-xs text-slate-500">{submitted} of {reviews.data.length} check-ins submitted</p>
            <ul className="list">
              {reviews.data.map((entry) => (
                <li key={entry.id} className="surface">
                  <div className="card-header">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={entry.userName} size="sm" />
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-navy">{entry.userName}</h3>
                        <p className="text-xs text-slate-400">
                          {entry.submittedAt ? `Submitted ${formatSastDateTime(entry.submittedAt)}` : 'Not submitted'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                      <StatusBadge status={entry.stage} />
                      <StatusBadge status={entry.status} />
                    </div>
                  </div>
                  <div className="card-body space-y-3">
                    {entry.aiQualityFlag && (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />Flagged by the quality check for review
                      </p>
                    )}
                    {entry.response && Object.keys(entry.response).length ? (
                      <dl className="space-y-1.5">
                        {Object.entries(entry.response).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-2 text-xs">
                            <dt className="font-semibold capitalize text-slate-500">{labelFor(key)}</dt>
                            <dd className="whitespace-pre-wrap break-words text-slate-700">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : <p className="text-xs text-slate-400">No response yet.</p>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : <EmptyState icon={MessageSquare} title="No check-ins for this day" description="Check-ins are created for candidates with approved WFH on weekdays." className="bg-white" />
      )}
    </div>
  );
};

// Mock mode keeps the demo feedback flow.
const DemoCheckIns = () => {
  const { checkinReviews, saveCheckinFeedback } = useApp();
  const [drafts, setDrafts] = useState({});
  const [errors, setErrors] = useState({});
  const [savedId, setSavedId] = useState('');

  const submitFeedback = (review) => {
    const feedback = drafts[review.id]?.trim() ?? review.feedbackComment;
    if (!feedback) {
      setErrors((current) => ({ ...current, [review.id]: 'Enter feedback before sending.' }));
      return;
    }
    try {
      saveCheckinFeedback(review.id, feedback);
      setErrors((current) => ({ ...current, [review.id]: '' }));
      setSavedId(review.id);
    } catch (error) {
      setErrors((current) => ({ ...current, [review.id]: error instanceof Error ? error.message : 'Feedback could not be saved.' }));
    }
  };

  return (
    <div className="page-narrow">
      <PageHeader eyebrow="Candidate submissions" title="Check-in reviews" description="Candidate responses and coach feedback." actions={<StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>} />

      {checkinReviews.length ? (
        <ul className="list">
          {checkinReviews.map((entry) => (
            <li key={entry.id} className="surface">
              <div className="card-header">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={entry.userName} size="sm" />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-bold text-navy">{entry.userName}</h3>
                    <p className="font-mono text-xs text-slate-400">{entry.promptDate}</p>
                  </div>
                </div>
                <StatusBadge status={entry.stage} />
              </div>
              <div className="card-body space-y-4">
                <p className="text-sm leading-relaxed text-slate-700">{entry.response}</p>
                <label className="field">
                  <span className="field-label">Coach feedback</span>
                  <textarea rows="2" className="input" value={drafts[entry.id] ?? entry.feedbackComment} onChange={(event) => setDrafts((current) => ({ ...current, [entry.id]: event.target.value }))} />
                </label>
                <Alert>{errors[entry.id]}</Alert>
                {savedId === entry.id && <Alert tone="success">Feedback saved.</Alert>}
                <div className="flex justify-end">
                  <button type="button" onClick={() => submitFeedback(entry)} className="btn btn-primary w-full sm:w-auto"><Send className="h-4 w-4" />Send feedback</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={MessageSquare} title="No check-ins yet" description="No candidate check-ins have been submitted yet." className="bg-white" />}
    </div>
  );
};

const ChampionCheckIns = () => {
  const { isDemoMode } = useApp();
  return isDemoMode ? <DemoCheckIns /> : <LiveCheckIns />;
};

export default ChampionCheckIns;
