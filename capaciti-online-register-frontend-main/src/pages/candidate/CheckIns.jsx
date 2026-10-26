import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Send } from 'lucide-react';
import { PromptStage, PromptStatus } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';

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
    <div className="page-narrow">
      <PageHeader eyebrow="Daily prompts" title="Check-ins" description={`Server time: ${formatServerTime(promptServerTime)}`} />

      <Alert>{promptsError?.message}</Alert>

      {stages.map((stage, index) => {
        const prompt = prompts.find((item) => item.stage === stage);
        const stageLabel = getStatusMetadata(stage).label;
        const active = prompt?.status === PromptStatus.ACTIVE;
        return (
          <Card
            key={stage}
            title={<span className="flex items-center gap-2.5"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-extrabold ${active ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>{stageLabel}</span>}
            subtitle={prompt ? `Scheduled ${formatServerTime(prompt.scheduledAt)}` : 'No prompt scheduled'}
            actions={prompt && <StatusBadge status={prompt.status} />}
            className={active ? 'border-primary-600/30' : ''}
          >
            {prompt ? (
              <div className="space-y-4">
                {prompt.expiresAt && active && (
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-primary-600" />Expires in <span className="font-mono text-navy">{formatCountdown(prompt.expiresAt)}</span>
                  </p>
                )}
                <label className="field">
                  <span className="field-label">Your response</span>
                  <textarea
                    rows="3"
                    className="input"
                    value={responses[prompt.id] ?? prompt.response ?? ''}
                    disabled={!active}
                    placeholder={active ? `Share your ${stageLabel.toLowerCase()} update...` : ''}
                    onChange={(event) => setResponses((current) => ({ ...current, [prompt.id]: event.target.value }))}
                  />
                </label>
                <Alert>{errors[prompt.id]}</Alert>
                {submitted[prompt.id] && <Alert tone="success">{submitted[prompt.id]}</Alert>}
                {active && (
                  <button type="button" onClick={() => void handleSubmit(prompt)} className="btn btn-primary btn-block">
                    <Send className="h-4 w-4" />Submit check-in
                  </button>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-slate-500"><CheckCircle2 className="h-4 w-4 text-slate-300" />This prompt is not available.</p>
            )}
          </Card>
        );
      })}
    </div>
  );
};

export default CheckIns;
