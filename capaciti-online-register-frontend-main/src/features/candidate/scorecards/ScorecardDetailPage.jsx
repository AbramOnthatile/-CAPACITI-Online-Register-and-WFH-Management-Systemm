import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Award } from 'lucide-react';
import Card from '../../../components/common/Card';
import { percentTone, scoreCriteria, scoreTone } from '../../../lib/scoring';
import { useMyScorecards } from './useMyScorecards';

const toneClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'light-success': 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
};

const ScorecardDetailPage = () => {
  const { assessmentId } = useParams();
  const scorecard = useMyScorecards().find((item) => item.assessmentId === assessmentId);

  if (!scorecard) {
    return (
      <div className="mx-auto max-w-xl space-y-4 text-center">
        <Card title="Scorecard unavailable">
          <p className="text-xs leading-relaxed text-slate-600">This scorecard is not available in your account.</p>
          <Link to="/candidate/scorecards" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#6115D0]"><ArrowLeft className="h-4 w-4" />Back to my scorecards</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <Link to="/candidate/scorecards" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6115D0] hover:underline"><ArrowLeft className="h-4 w-4" />My scorecards</Link>

      <header className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6115D0]">{scorecard.type === 'WEEKLY' ? 'Weekly assessment' : 'Project assessment'}</p>
        <h2 className="mt-1 break-words text-xl font-black leading-tight text-[#1D2951] sm:text-2xl">{scorecard.title}</h2>
        <p className="mt-1.5 text-xs text-slate-500">Assessment date · {scorecard.assessmentDate}</p>
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 text-lg font-black ${toneClasses[percentTone(scorecard.overallPercent)]}`}>
            {scorecard.overallPercent}%
          </div>
          <div>
            <p className="text-sm font-bold text-[#1D2951]">Overall score</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">Your average across six assessment criteria.</p>
          </div>
        </div>
      </header>

      <Card title="Your scores" subtitle="Each criterion is scored from 1 to 5">
        <div className="space-y-2">
          {scoreCriteria.map(({ key, label }) => {
            const score = scorecard.scores[key];
            return (
              <div key={key} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${toneClasses[scoreTone(score)]}`}>
                <span className="min-w-0 text-xs font-semibold">{label}</span>
                <span className="shrink-0 rounded-lg bg-white/70 px-2.5 py-1 text-xs font-black">{score} / 5</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Feedback">
        <div className="space-y-4">
          <section>
            <h3 className="text-xs font-bold text-[#1D2951]">Strengths</h3>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{scorecard.feedbackStrengths || 'No strengths feedback was provided.'}</p>
          </section>
          <section className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-[#1D2951]">Areas to improve</h3>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{scorecard.feedbackImprovements || 'No improvement feedback was provided.'}</p>
          </section>
          <section className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-[#1D2951]">General feedback</h3>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{scorecard.feedback || 'No additional feedback was provided.'}</p>
          </section>
        </div>
      </Card>

      <Card title="Group feedback" subtitle="Your mentor’s notes for the cohort">
        <div className="flex items-start gap-3">
          <Award className="mt-0.5 h-4 w-4 shrink-0 text-[#6115D0]" />
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600">{scorecard.groupFeedback || 'No group feedback was provided.'}</p>
        </div>
      </Card>
    </div>
  );
};

export default ScorecardDetailPage;
