import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import Card from '../../components/common/Card';

const MorePage = () => (
  <div className="mx-auto w-full max-w-3xl space-y-5">
    <header>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#6115D0]">Candidate Workspace</p>
      <h2 className="mt-1 text-2xl font-black text-[#1D2951]">More</h2>
      <p className="mt-1 text-xs text-slate-500">Learning resources and account tools.</p>
    </header>
    <Card title="Learning & feedback" subtitle="Review your progress and mentor feedback.">
      <Link to="/candidate/scorecards" className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 transition-colors hover:border-[#6115D0]/40 hover:bg-slate-50">
        <span className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6115D0]/10 text-[#6115D0]"><Award className="h-5 w-5" /></span>
          <span>
            <span className="block text-sm font-bold text-[#1D2951]">Scorecards</span>
            <span className="mt-0.5 block text-[11px] text-slate-500">View your scores, feedback, and progress.</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[#6115D0]" />
      </Link>
    </Card>
  </div>
);

export default MorePage;
