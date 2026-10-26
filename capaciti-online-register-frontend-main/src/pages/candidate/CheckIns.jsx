import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Send } from 'lucide-react';
import { PromptStage, PromptStatus } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const stages = [PromptStage.MORNING_KICKOFF, PromptStage.MIDDAY_PULSE, PromptStage.EOD_WRAP_UP];

const formatServerTime = (value) => new Intl.DateTimeFormat('en-ZA', {
  timeZone: 'Africa/Johannesburg',
  dateStyle: 'medium',
  timeStyle: 'short',
}).format(new Date(value));

const CheckIns = () => {
  const { prompts, promptServerTime, promptsError, submitPrompt } = useApp();
  const [serverElapsedSeconds, setServerElapsedSeconds] = useState(0);
  const [responses, setResponses] = useState({});
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState({});

  useEffect(() => {
    const timer = window.setInterval(() => setServerElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatCountdown = (expiresAt) => {
    const remainingSeconds = Math.floor((Date.parse(expiresAt) - Date.parse(promptServerTime)) / 1000) - serverElapsedSeconds;
    if (remainingSeconds <= 0) return 'Expired';
    const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
    const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleSubmit = async (prompt) => {
    const response = responses[prompt.id]?.trim() || prompt.response || '';
    if (!response) {
      setErrors((current) => ({ ...current, [prompt.id]: 'Enter a response before submitting.' }));
      return;
    }
    setErrors((current) => ({ ...current, [prompt.id]: '' }));
    try {
      const result = await submitPrompt(prompt.id, {
        draftKey: `${prompt.id}-${crypto.randomUUID()}`,
        response,
      });
      setSubmitted((current) => ({ ...current, [prompt.id]: result.quality.feedbackMessage }));
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [prompt.id]: error instanceof Error ? error.message : 'Check-in could not be submitted.',
      }));
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Candidate Check-ins</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-medium">Daily Prompts</span>
        </div>
        {promptsError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{promptsError.message}</p>}
        <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#1D2951]">Check-ins</h2>
        <p className="mt-1 text-xs text-slate-500">Server time: {formatServerTime(promptServerTime)}</p>
      </div>

      {stages.map((stage) => {
        const prompt = prompts.find((item) => item.stage === stage);
        const stageLabel = getStatusMetadata(stage).label;
        return (
          <Card key={stage} title={stageLabel} subtitle={prompt ? `Scheduled ${formatServerTime(prompt.scheduledAt)}` : 'No prompt scheduled'}>
            {prompt ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={prompt.status} />
                  {prompt.expiresAt && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" /> Expires in {formatCountdown(prompt.expiresAt)}
                    </span>
                  )}
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">{stageLabel} response</span>
                  <textarea
                    rows="3"
                    className="input text-xs"
                    value={responses[prompt.id] ?? prompt.response ?? ''}
                    disabled={prompt.status !== PromptStatus.ACTIVE}
                    onChange={(event) => setResponses((current) => ({ ...current, [prompt.id]: event.target.value }))}
                  />
                </label>
                {errors[prompt.id] && <p role="alert" className="text-xs text-rose-600">{errors[prompt.id]}</p>}
                {submitted[prompt.id] && (
                  <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" /> {submitted[prompt.id]}
                  </p>
                )}
                {prompt.status === PromptStatus.ACTIVE && (
                  <button
                    type="button"
                    onClick={() => void handleSubmit(prompt)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6115D0] py-3 text-xs font-bold text-white shadow-md hover:bg-[#4F11AA] transition-all"
                  >
                    <Send className="h-4 w-4" /> Submit Check-in
                  </button>
                )}
              </div>
            ) : <p className="text-xs text-slate-500">This prompt is not available.</p>}
          </Card>
        );
      })}
    </div>
  );
};

export default CheckIns;
