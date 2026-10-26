import { PromptStage, WfhStatus } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';
import { demoOnly } from '../../mocks/demoOnly';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const ChampionCheckIns = () => (
  <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Candidate Check-ins</span>
        <span className="text-slate-300">·</span>
        <span className="text-xs text-slate-500 font-medium">Prompt-stage preview</span>
      </div>
      <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#1D2951]">Check-ins</h2>
    </div>

    {/* MOCK-ONLY: not in backend */}
    <Card title="Check-in Review Preview" subtitle="This sample list is not connected to candidate submissions" actions={<StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>}>
      <div className="space-y-4">
        {demoOnly.championCheckinReview.map((entry) => (
          <article key={entry.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3" title={demoOnly.notice}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1D2951]">{entry.userName}</h3>
                <p className="font-mono text-[11px] text-slate-400">{entry.promptDate}</p>
              </div>
              <StatusBadge status={entry.stage} />
            </div>
            <p className="text-xs text-slate-700">{entry.response}</p>
            {/* MOCK-ONLY: not in backend */}
            <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500">{entry.feedbackComment} <StatusBadge status={PromptStage.EOD_WRAP_UP}>Demo</StatusBadge></p>
            {/* MOCK-ONLY: not in backend */}
            <button type="button" disabled aria-disabled="true" title={demoOnly.notice} className="rounded-xl bg-[#6115D0] px-4 py-2 text-xs font-bold text-white opacity-60">
              Send Feedback <span className="ml-1"><StatusBadge status={PromptStage.EOD_WRAP_UP}>Demo</StatusBadge></span>
            </button>
          </article>
        ))}
      </div>
    </Card>
  </div>
);

export default ChampionCheckIns;
