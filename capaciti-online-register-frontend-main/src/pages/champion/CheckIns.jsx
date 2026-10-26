import { useState } from 'react';
import { getStatusMetadata } from '../../lib/status';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

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
  <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Candidate Check-ins</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-500 font-medium">Candidate submissions</span>
      </div>
      <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#1D2951]">Check-ins</h2>
    </div>

    <Card title="Check-in Reviews" subtitle="Candidate responses and coach feedback">
      <div className="space-y-4">
        {checkinReviews.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1D2951]">{entry.userName}</h3>
                <p className="font-mono text-[11px] text-slate-400">{entry.promptDate}</p>
              </div>
              <StatusBadge status={entry.stage} />
            </div>
            <p className="text-xs text-slate-700">{entry.response}</p>
            <label className="block text-xs font-bold text-slate-600">Coach feedback<textarea rows="2" className="input mt-1.5 text-xs" value={drafts[entry.id] ?? entry.feedbackComment} onChange={(event) => setDrafts((current) => ({ ...current, [entry.id]: event.target.value }))} /></label>
            {errors[entry.id] && <p role="alert" className="text-xs text-rose-600">{errors[entry.id]}</p>}
            {savedId === entry.id && <p role="status" className="text-xs font-semibold text-emerald-700">Feedback saved.</p>}
            <button type="button" onClick={() => submitFeedback(entry)} className="rounded-xl bg-[#6115D0] px-4 py-2 text-xs font-bold text-white hover:bg-[#4F11AA]">Send Feedback</button>
          </article>
        ))}
        {!checkinReviews.length && <p className="py-8 text-center text-xs text-slate-500">No candidate check-ins have been submitted yet.</p>}
      </div>
    </Card>
  </div>
  );
};

export default ChampionCheckIns;
