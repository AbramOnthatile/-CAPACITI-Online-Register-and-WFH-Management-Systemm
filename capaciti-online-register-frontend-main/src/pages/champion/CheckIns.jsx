import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';

const ChampionCheckIns = () => {
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
      <PageHeader eyebrow="Candidate submissions" title="Check-in reviews" description="Candidate responses and coach feedback." />

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

export default ChampionCheckIns;
