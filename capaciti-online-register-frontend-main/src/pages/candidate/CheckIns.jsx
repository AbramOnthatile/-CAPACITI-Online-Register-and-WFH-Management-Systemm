import { Link } from 'react-router-dom';
import { ArrowRight, Clock3 } from 'lucide-react';
import { PromptStage, PromptStatus } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import EmptyState from '../../components/common/EmptyState';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { formatSastDateTime } from '../../lib/time';
import { canRetryError } from '../../api/client';

const stages = [PromptStage.MORNING_KICKOFF, PromptStage.MIDDAY_PULSE, PromptStage.EOD_WRAP_UP];

const CheckIns = () => {
  const { prompts, activePrompts, promptsError, promptsLoading, promptServerTime, refreshPrompts } = useApp();
  const activePromptIds = new Set(activePrompts.map((prompt) => prompt.id));

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#6115D0]">Candidate Check-ins · Daily Prompts</p>
        <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Check-ins</h2>
        <p className="mt-1 text-xs text-slate-500">Respond to each time-boxed prompt while its check-in window is open.</p>
        {promptServerTime && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400"><Clock3 className="h-3.5 w-3.5" />Server time: {formatServerTime(promptServerTime)}</p>}
      </header>

      <ErrorState message={promptsError?.message} />
      {canRetryError(promptsError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshPrompts()}>Retry</button>}
      {promptsLoading && <Skeleton label="Loading today's check-ins" />}

      <Card title="Today’s check-ins" subtitle="Your prompts are generated only for approved WFH weekdays.">
        {prompts.length === 0 && !promptsLoading ? (
          <EmptyState title="No check-ins scheduled" description="No prompts are available for today." />
        ) : <div className="space-y-3">
          {stages.map((stage) => {
            const prompt = prompts.find((item) => item.stage === stage);
            const isActive = prompt && activePromptIds.has(prompt.id);
            return (
              <article key={stage} className="rounded-xl border border-slate-100 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold text-[#1D2951]">{getStatusMetadata(stage).label}</h3>
                  {prompt ? <StatusBadge status={isActive ? PromptStatus.ACTIVE : prompt.status} /> : <span className="text-[11px] text-slate-400">Not scheduled</span>}
                </div>
                {prompt && (
                  <>
                    <p className="mt-1.5 text-[10px] text-slate-500">
                      Opens {formatServerTime(prompt.scheduledAt)} · expires {formatServerTime(prompt.expiresAt)}
                    </p>
                    {isActive && (
                      <Link to="/candidate/dashboard" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#6115D0] hover:underline">
                        Open check-in <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                    {prompt.status === PromptStatus.SUBMITTED && prompt.response && (
                      <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                        {Object.entries(prompt.response).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-2 text-[10px]">
                            <dt className="font-semibold capitalize text-slate-500">{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).replaceAll('_', ' ')}</dt>
                            <dd className="whitespace-pre-wrap break-words text-slate-700">{Array.isArray(value) ? value.join(', ') : String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {prompt.attemptCount > 0 && prompt.status !== PromptStatus.SUBMITTED && (
                      <p className="mt-2 text-[10px] text-slate-400">Quality review attempts: {prompt.attemptCount}</p>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </div>}
      </Card>
    </div>
  );
};

function formatServerTime(value) {
  return formatSastDateTime(value);
}

export default CheckIns;
