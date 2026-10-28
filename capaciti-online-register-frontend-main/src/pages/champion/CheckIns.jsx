import { useMemo, useState } from 'react';
import { AlertTriangle, MessageSquare, Search, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePromptReviewsApi } from '../../api/hooks';
import { canRetryError } from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { PromptStage, PromptStatus, WfhStatus } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';

import { formatSastDateTime, getSastToday } from '../../lib/time';
import CheckInResponse from '../../features/candidate/checkins/CheckInResponse';

const stageOrder = Object.values(PromptStage);

// Live data: what each assigned candidate submitted for the selected day.
const LiveCheckIns = () => {
  const [date, setDate] = useState(getSastToday);
  const reviews = usePromptReviewsApi(date);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [behindOnly, setBehindOnly] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const filtering = Boolean(search) || stage !== 'ALL' || status !== 'ALL' || behindOnly || flaggedOnly;
  const clearFilters = () => {
    setSearch('');
    setStage('ALL');
    setStatus('ALL');
    setBehindOnly(false);
    setFlaggedOnly(false);
  };

  const shown = useMemo(() => reviews.data.filter((entry) => {
    const name = search.trim().toLowerCase();
    if (name && !entry.userName.toLowerCase().includes(name)) return false;
    if (stage !== 'ALL' && entry.stage !== stage) return false;
    if (status !== 'ALL' && entry.status !== status) return false;
    if (behindOnly && !['DELAYED', 'BLOCKED'].includes(entry.response?.progressStatus)) return false;
    if (flaggedOnly && !entry.aiQualityFlag) return false;
    return true;
  }).sort((left, right) => left.userName.localeCompare(right.userName)
    || stageOrder.indexOf(left.stage) - stageOrder.indexOf(right.stage)), [reviews.data, search, stage, status, behindOnly, flaggedOnly]);
  const submitted = shown.filter((entry) => entry.status === PromptStatus.SUBMITTED).length;

  return (
    <div className="page-narrow">
      <PageHeader
        eyebrow="Candidate submissions"
        title="Check-in reviews"
        description="Tasks and progress your candidates submitted in their daily check-ins."
        actions={(
          <label className="flex items-center gap-2">
            <span className="sr-only">Day</span>
            <input type="date" className="input" value={date} max={getSastToday()} onChange={(event) => event.target.value && setDate(event.target.value)} />
          </label>
        )}
      />

      <div className="surface surface-pad space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block flex-1">
            <span className="sr-only">Search candidates</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" placeholder="Search candidate name..." value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-10" />
          </label>
          <label className="sm:w-44">
            <span className="sr-only">Check-in</span>
            <select value={stage} onChange={(event) => setStage(event.target.value)} className="input">
              <option value="ALL">All check-ins</option>
              {Object.values(PromptStage).map((value) => <option key={value} value={value}>{getStatusMetadata(value).label}</option>)}
            </select>
          </label>
          <label className="sm:w-40">
            <span className="sr-only">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="input">
              <option value="ALL">All statuses</option>
              {Object.values(PromptStatus).map((value) => <option key={value} value={value}>{getStatusMetadata(value).label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={behindOnly} onChange={(event) => setBehindOnly(event.target.checked)} className="h-4 w-4 accent-[#6115D0]" />
            Behind or blocked
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={flaggedOnly} onChange={(event) => setFlaggedOnly(event.target.checked)} className="h-4 w-4 accent-[#6115D0]" />
            Flagged only
          </label>
          {filtering && <button type="button" onClick={clearFilters} className="font-semibold text-[#6115D0] hover:underline">Clear filters</button>}
        </div>
      </div>

      {reviews.error && <ErrorState message={reviews.error.message} />}
      {canRetryError(reviews.error) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void reviews.refresh()}>Retry</button>}
      {reviews.loading ? <Skeleton label="Loading check-ins" /> : !reviews.error && (
        shown.length ? (
          <>
            <p className="text-xs text-slate-500">
              {submitted} of {shown.length} check-ins submitted{filtering && ` · ${reviews.data.length} in total for this day`}
            </p>
            <ul className="list">
              {shown.map((entry) => (
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
                      <CheckInResponse response={entry.response} />
                    ) : <p className="text-xs text-slate-400">No response yet.</p>}
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : filtering && reviews.data.length ? (
          <EmptyState icon={Search} title="No check-ins match these filters" description="Try another name or clear the filters." className="bg-white" />
        ) : <EmptyState icon={MessageSquare} title="No check-ins for this day" description="Check-ins are created when your candidates clock in." className="bg-white" />
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
