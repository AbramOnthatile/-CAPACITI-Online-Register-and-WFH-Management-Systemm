import { Link } from 'react-router-dom';
import { ArrowRight, Award, ChartNoAxesColumnIncreasing } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../../../components/common/Card';
import { percentTone, scoreCriteria } from '../../../lib/scoring';
import { useMyScorecards } from './useMyScorecards';

const percentClasses = {
  success: 'bg-emerald-50 text-emerald-700',
  'light-success': 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-700',
  danger: 'bg-rose-50 text-rose-700',
};

const scoreClasses = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  'light-success': 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  orange: 'border-orange-200 bg-orange-50 text-orange-800',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
};

const MyScorecardsPage = () => {
  const scorecards = useMyScorecards().slice().sort((a, b) => b.assessmentDate.localeCompare(a.assessmentDate));
  const chartData = scorecards.slice().reverse().map((scorecard) => ({
    title: scorecard.title,
    date: scorecard.assessmentDate,
    overallPercent: scorecard.overallPercent,
  }));

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#6115D0]">My Learning Progress</p>
        <h2 className="mt-1 text-2xl font-black text-[#1D2951]">Scorecards</h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">Review your submitted feedback and track your progress over time.</p>
      </header>

      {scorecards.length === 0 ? (
        <Card title="Your scorecards will appear here">
          <div className="flex flex-col items-center py-6 text-center">
            <Award className="h-8 w-8 text-slate-300" />
            <p className="mt-3 max-w-sm text-sm font-semibold text-[#1D2951]">No submitted scorecards yet</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">When your mentor shares a completed assessment, you’ll be able to review your scores and feedback here.</p>
          </div>
        </Card>
      ) : (
        <>
          {scorecards.length >= 2 && (
            <Card title="Progress over time" subtitle="Your overall percentage across submitted assessments">
              <div className="h-56 w-full" aria-label="Your scorecard progress chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                    <YAxis domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip formatter={(value) => [`${value}%`, 'Overall']} labelFormatter={(label) => `Assessment date: ${label}`} contentStyle={{ backgroundColor: '#1D2951', borderRadius: '12px', color: '#ffffff', border: 'none', fontSize: '11px' }} />
                    <Bar dataKey="overallPercent" name="Overall" fill="#6115D0" radius={[6, 6, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          <section className="space-y-3" aria-labelledby="my-scorecards-heading">
            <div className="flex items-center gap-2 px-1">
              <ChartNoAxesColumnIncreasing className="h-4 w-4 text-[#6115D0]" />
              <h3 id="my-scorecards-heading" className="text-sm font-bold text-[#1D2951]">Submitted assessments</h3>
            </div>
            {scorecards.map((scorecard) => (
              <Link
                key={scorecard.assessmentId}
                to={`/candidate/scorecards/${encodeURIComponent(scorecard.assessmentId)}`}
                className="block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-[#6115D0]/40 focus:outline-none focus:ring-2 focus:ring-[#6115D0]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="break-words text-sm font-bold leading-snug text-[#1D2951]">{scorecard.title}</h4>
                    <p className="mt-1.5 text-[11px] text-slate-500">{scorecard.type === 'WEEKLY' ? 'Weekly assessment' : 'Project assessment'} · {scorecard.assessmentDate}</p>
                  </div>
                  <span className={`shrink-0 rounded-xl px-3 py-1.5 text-sm font-black ${percentClasses[percentTone(scorecard.overallPercent)]}`}>{scorecard.overallPercent}%</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap gap-1.5" aria-label="Score summary">
                    {scoreCriteria.map(({ key, label }) => (
                      <span key={key} aria-label={`${label}: ${scorecard.scores[key]} out of 5`} className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${scoreClasses[percentTone(scorecard.scores[key] * 20)]}`}>
                        {scorecard.scores[key]}/5
                      </span>
                    ))}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#6115D0]">Details<ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </Link>
            ))}
          </section>
        </>
      )}
    </div>
  );
};

export default MyScorecardsPage;
