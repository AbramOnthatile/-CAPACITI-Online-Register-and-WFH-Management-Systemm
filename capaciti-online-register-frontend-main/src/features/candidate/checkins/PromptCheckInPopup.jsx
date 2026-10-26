import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, X } from 'lucide-react';
import { PromptStage } from '../../../api/types';
import { useApp } from '../../../context/AppContext';

const stages = [
  PromptStage.MORNING_KICKOFF,
  PromptStage.MIDDAY_PULSE,
  PromptStage.EOD_WRAP_UP,
];

const stageTitles = {
  [PromptStage.MORNING_KICKOFF]: 'Morning kickoff',
  [PromptStage.MIDDAY_PULSE]: 'Midday pulse',
  [PromptStage.EOD_WRAP_UP]: 'End-of-day wrap-up',
};

const qualityStatusLabel = (prompt) => prompt.stage === PromptStage.MORNING_KICKOFF
  ? '2–3 deliverables, stand-up, power, and ISP'
  : prompt.stage === PromptStage.MIDDAY_PULSE
    ? 'Progress status and any blocker note'
    : 'A GitHub PR, commit hash, or deliverable link';

const PromptCheckInPopup = () => {
  const { activePrompts, activePromptServerTime, submitPrompt } = useApp();
  const [dismissedId, setDismissedId] = useState(null);
  const [serverElapsedSeconds, setServerElapsedSeconds] = useState(0);

  useEffect(() => {
    setServerElapsedSeconds(0);
  }, [activePromptServerTime]);

  useEffect(() => {
    const interval = window.setInterval(() => setServerElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const prompt = useMemo(() => {
    const available = activePrompts
      .filter((item) => item.id !== dismissedId)
      .sort((left, right) => stages.indexOf(left.stage) - stages.indexOf(right.stage));
    return available[0] ?? null;
  }, [activePrompts, dismissedId]);

  if (!prompt) {
    const dismissedPrompt = activePrompts.find((item) => item.id === dismissedId);
    return dismissedPrompt ? (
      <button
        type="button"
        onClick={() => setDismissedId(null)}
        className="fixed bottom-4 right-4 z-[60] rounded-xl bg-[#6115D0] px-4 py-3 text-xs font-bold text-white shadow-xl hover:bg-[#4F11AA]"
      >
        Reopen {stageTitles[dismissedPrompt.stage]} check-in
      </button>
    ) : null;
  }

  return (
    <PromptCheckInDialog
      key={prompt.id}
      prompt={prompt}
      serverTime={activePromptServerTime}
      elapsedSeconds={serverElapsedSeconds}
      onSubmit={submitPrompt}
      onClose={() => setDismissedId(prompt.id)}
    />
  );
};

const PromptCheckInDialog = ({ prompt, serverTime, elapsedSeconds, onSubmit, onClose }) => {
  const durationSeconds = Math.max(1, Math.floor((Date.parse(prompt.expiresAt) - Date.parse(prompt.scheduledAt)) / 1000));
  const remainingSeconds = Math.max(0, Math.floor((Date.parse(prompt.expiresAt) - Date.parse(serverTime)) / 1000) - elapsedSeconds);
  const progress = Math.min(1, remainingSeconds / durationSeconds);
  const [deliverables, setDeliverables] = useState(['', '']);
  const [standupConfirmed, setStandupConfirmed] = useState('');
  const [powerStatus, setPowerStatus] = useState('');
  const [ispStatus, setIspStatus] = useState('');
  const [progressStatus, setProgressStatus] = useState('');
  const [blockerNote, setBlockerNote] = useState('');
  const [workLink, setWorkLink] = useState('');
  const [error, setError] = useState('');
  const [qualityMessage, setQualityMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setQualityMessage('');
    const payload = prompt.stage === PromptStage.MORNING_KICKOFF
      ? {
        deliverables: deliverables.map((item) => item.trim()).filter(Boolean),
        standupConfirmed: standupConfirmed === 'true' ? true : standupConfirmed === 'false' ? false : undefined,
        powerStatus: powerStatus || undefined,
        ispStatus: ispStatus || undefined,
      }
      : prompt.stage === PromptStage.MIDDAY_PULSE
        ? {
          progressStatus: progressStatus || undefined,
          blockerNote: blockerNote.trim() || undefined,
        }
        : { workLink: workLink.trim() || undefined };

    const nonBlankDeliverables = payload.deliverables ?? [];
    if (prompt.stage === PromptStage.MORNING_KICKOFF
      && (nonBlankDeliverables.length < 2 || nonBlankDeliverables.length > 3
        || payload.standupConfirmed === undefined || !payload.powerStatus || !payload.ispStatus)) {
      setError('Add 2 or 3 deliverables and answer all stand-up, power, and ISP fields.');
      return;
    }
    if (prompt.stage === PromptStage.MIDDAY_PULSE
      && (!payload.progressStatus
        || (['DELAYED', 'BLOCKED'].includes(payload.progressStatus) && !payload.blockerNote))) {
      setError('Choose your progress status and add a blocker note when delayed or blocked.');
      return;
    }
    if (prompt.stage === PromptStage.EOD_WRAP_UP && !isValidWorkLink(payload.workLink)) {
      setError('Enter an http(s) link or a 7 to 40 character hexadecimal commit hash.');
      return;
    }
    if (remainingSeconds <= 0) {
      setError('This check-in window has ended. Refreshing available prompts…');
      return;
    }

    setSaving(true);
    try {
      const result = await onSubmit(prompt.id, payload);
      setAttempt(result.quality.attempt);
      if (result.quality.accepted) {
        setQualityMessage(result.quality.feedbackMessage || 'Check-in submitted successfully.');
        onClose();
      } else {
        setQualityMessage(result.quality.feedbackMessage || 'Please revise your response and try again.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Check-in could not be submitted.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1D2951]/60 p-3 backdrop-blur-sm sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="prompt-dialog-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#6115D0]">WFH check-in · {prompt.stage.replaceAll('_', ' ')}</p>
            <h2 id="prompt-dialog-title" className="mt-1 text-lg font-black text-[#1D2951]">{stageTitles[prompt.stage]}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{qualityStatusLabel(prompt)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Dismiss check-in" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <svg viewBox="0 0 44 44" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#ddd6fe" strokeWidth="4" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#6115D0" strokeWidth="4" strokeLinecap="round" strokeDasharray="113.1" strokeDashoffset={113.1 * (1 - progress)} />
            </svg>
            <Clock3 className="h-4 w-4 text-[#6115D0]" />
          </div>
          <div>
            <p className="font-mono text-lg font-black tabular-nums text-[#1D2951]">{formatDuration(remainingSeconds)}</p>
            <p className="text-[10px] text-slate-500">Time remaining · server time</p>
          </div>
        </div>

        {qualityMessage && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">{qualityMessage}{attempt > 0 && ` · Attempt ${attempt}`}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700">{error}</p>}

        <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-4">
          {prompt.stage === PromptStage.MORNING_KICKOFF && (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Today’s deliverables <span className="font-medium text-slate-400">(2–3)</span></p>
                {deliverables.map((value, index) => (
                  <label key={index} className="block">
                    <span className="sr-only">Deliverable {index + 1}</span>
                    <input maxLength={500} value={value} onChange={(event) => setDeliverables((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="input text-xs" placeholder={`Deliverable ${index + 1}`} />
                  </label>
                ))}
                {deliverables.length < 3 && <button type="button" onClick={() => setDeliverables((current) => [...current, ''])} className="text-[11px] font-bold text-[#6115D0] hover:underline">+ Add another deliverable</button>}
                {deliverables.length > 2 && <button type="button" onClick={() => setDeliverables((current) => current.slice(0, 2))} className="ml-3 text-[11px] font-semibold text-slate-500 hover:underline">Remove third</button>}
              </div>
              <SelectField label="Stand-up confirmed" value={standupConfirmed} onChange={setStandupConfirmed} options={[['true', 'Yes'], ['false', 'No']]} />
              <div className="grid gap-3 sm:grid-cols-2">
                <SelectField label="Power status" value={powerStatus} onChange={setPowerStatus} options={statusOptions} />
                <SelectField label="ISP status" value={ispStatus} onChange={setIspStatus} options={statusOptions} />
              </div>
            </>
          )}

          {prompt.stage === PromptStage.MIDDAY_PULSE && (
            <>
              <SelectField label="Progress status" value={progressStatus} onChange={setProgressStatus} options={[['ON_TRACK', 'On track'], ['DELAYED', 'Delayed'], ['BLOCKED', 'Blocked']]} />
              {['DELAYED', 'BLOCKED'].includes(progressStatus) && (
                <label className="block text-xs font-bold text-slate-700">
                  Blocker note
                  <textarea maxLength={1000} rows={3} value={blockerNote} onChange={(event) => setBlockerNote(event.target.value)} className="input mt-1 text-xs" placeholder="Briefly describe what is blocking or delaying progress." />
                </label>
              )}
              {progressStatus === 'BLOCKED' && <p className="rounded-lg bg-slate-50 p-2.5 text-[10px] leading-relaxed text-slate-500">Your blocker will be added to the passive support queue for review. No alert is sent.</p>}
            </>
          )}

          {prompt.stage === PromptStage.EOD_WRAP_UP && (
            <label className="block text-xs font-bold text-slate-700">
              PR, commit hash, or deliverable link
              <input maxLength={500} value={workLink} onChange={(event) => setWorkLink(event.target.value)} className="input mt-1 text-xs" placeholder="https://github.com/... or commit hash" />
            </label>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/candidate/progress" onClick={onClose} className="text-center text-[11px] font-semibold text-slate-500 hover:text-[#6115D0]">View check-in history</Link>
            <button type="submit" disabled={saving || remainingSeconds <= 0} className="rounded-xl bg-[#6115D0] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#4F11AA] disabled:cursor-not-allowed disabled:opacity-50">
              {saving ? 'Submitting…' : 'Submit check-in'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const statusOptions = [['STABLE', 'Stable'], ['UNSTABLE', 'Unstable'], ['DOWN', 'Down']];

const SelectField = ({ label, value, onChange, options }) => (
  <label className="block text-xs font-bold text-slate-700">
    {label}
    <select required value={value} onChange={(event) => onChange(event.target.value)} className="input mt-1 text-xs">
      <option value="" disabled>Select status</option>
      {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  </label>
);

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remaining = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remaining}`;
}

function isValidWorkLink(value) {
  if (!value) return false;
  if (/^[a-fA-F0-9]{7,40}$/.test(value)) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export default PromptCheckInPopup;
