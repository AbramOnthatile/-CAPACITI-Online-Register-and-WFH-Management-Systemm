import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import { useMyScorecardQuery } from '../../../api/hooks/scorecards';
import { useAuth } from '../../../context/AuthContext';
import Card from '../../../components/common/Card';
import Alert from '../../../components/common/Alert';
import PageHeader from '../../../components/common/PageHeader';
import { Skeleton } from '../../../components/common/RequestState';
import { ApiError, canRetryError } from '../../../api/client';
import { formatSastDate } from '../../../lib/time';
import { percentTone, scoreCriteria, scoreTone } from '../../../lib/scoring';

const toneClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'light-success': 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
};

const feedbackSections = [
  { key: 'feedbackStrengths', title: 'Strengths', empty: 'No strengths feedback was provided.' },
  { key: 'feedbackImprovements', title: 'Areas to improve', empty: 'No improvement feedback was provided.' },
  { key: 'feedback', title: 'General feedback', empty: 'No additional feedback was provided.' },
];

const ScorecardDetailPage = () => {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  const scorecardQuery = useMyScorecardQuery(user?.id, assessmentId);
  const { data: scorecard, isLoading: loading, error } = scorecardQuery;

  if (loading) {
    return <div className="page-narrow"><Skeleton label="Loading scorecard" /></div>;
  }
  if (!scorecard) {
    return (
      <div className="page-narrow">
        <Card title={error instanceof ApiError && error.status === 404 ? 'Scorecard not found' : error ? 'Scorecard could not be loaded' : 'Scorecard unavailable'}>
          <Alert tone={error ? 'error' : 'info'}>{error?.message || 'This scorecard is not available in your account.'}</Alert>
          {canRetryError(error) && <button type="button" className="btn btn-secondary mt-4" onClick={() => void scorecardQuery.refetch()}>Retry</button>}
          <Link to="/candidate/scorecards" className="btn btn-secondary mt-4"><ArrowLeft className="h-4 w-4" />Back to my scorecards</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-narrow">
      <PageHeader
        backTo="/candidate/scorecards"
        backLabel="Back to my scorecards"
        eyebrow={scorecard.type === 'WEEKLY' ? 'Weekly assessment' : 'Project assessment'}
        title={scorecard.title}
        description={`Assessment date · ${formatSastDate(scorecard.assessmentDate)}`}
      />

      <section className="surface surface-pad flex items-center gap-4">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 font-mono text-lg font-extrabold ${toneClasses[percentTone(scorecard.overallPercent)]}`}>
          {scorecard.overallPercent}%
        </div>
        <div>
          <p className="text-sm font-bold text-navy">Overall score</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Your average across six assessment criteria.</p>
        </div>
      </section>

      <Card title="Your scores" subtitle="Each criterion is scored from 1 to 5">
        <ul className="list">
          {scoreCriteria.map(({ key, label }) => {
            const score = scorecard.scores[key];
            return (
              <li key={key} className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 ${toneClasses[scoreTone(score)]}`}>
                <span className="min-w-0 text-sm font-semibold">{label}</span>
                <span className="shrink-0 rounded-full bg-white/70 px-2.5 py-0.5 font-mono text-xs font-extrabold">{score} / 5</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Feedback">
        <div className="divide-y divide-slate-100">
          {feedbackSections.map(({ key, title, empty }) => (
            <section key={key} className="py-4 first:pt-0 last:pb-0">
              <h3 className="text-sm font-bold text-navy">{title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{scorecard[key] || empty}</p>
            </section>
          ))}
        </div>
      </Card>

      <Card title="Group feedback" subtitle="Your mentor's notes for the cohort">
        <div className="flex items-start gap-3">
          <Award className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{scorecard.groupFeedback || 'No group feedback was provided.'}</p>
        </div>
      </Card>
    </div>
  );
};

export default ScorecardDetailPage;
