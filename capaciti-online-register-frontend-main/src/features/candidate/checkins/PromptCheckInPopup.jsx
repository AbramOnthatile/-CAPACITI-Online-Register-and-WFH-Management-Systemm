import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, X } from 'lucide-react';
import { PromptStage, PromptStatus, WorkMode } from '../../../api/types';
import { useApp } from '../../../context/AppContext';
import { createDraftKey } from '../../../lib/attendanceAction';
import { ApiError, canRetryError, getFieldError, getUserErrorMessage } from '../../../api/client';
import { MAX_TASKS, planFor, sameTitle, taskStatusOptions } from '../../../lib/promptTasks';
import { useCheckInGate } from './CheckInGate';

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

const stageDescriptions = {
  [PromptStage.MORNING_KICKOFF]: 'Set up the tasks you will work on today.',
  [PromptStage.MIDDAY_PULSE]: 'Are you still on track? Update each task.',
  [PromptStage.EOD_WRAP_UP]: 'Update every task before you finish for the day.',
};

const gateDescriptions = {
  'clock-out': 'Wrap up your day before you clock out.',
  'sign-out': 'You are still clocked in. Wrap up your day before signing out, or skip it for now.',
};

const submitLabels = {
  [PromptStage.MORNING_KICKOFF]: 'Save my tasks',
  [PromptStage.MIDDAY_PULSE]: 'Submit check-in',
  [PromptStage.EOD_WRAP_UP]: 'Submit wrap-up',
};

const gateSubmitLabels = {
  'clock-out': 'Submit and clock out',
  'sign-out': 'Submit and sign out',
};

// The morning form opens straight after clock-in and the midday check from 13:30;
// the end-of-day form only opens through clock-out or sign-out.
const PromptCheckInPopup = () => {
  const { prompts, activePrompts, attendanceToday, submitPrompt, refreshPrompts } = useApp();
  const { gate, finishEod } = useCheckInGate();
  const [dismissedId, setDismissedId] = useState(null);

  const prompt = useMemo(() => {
    // Midday waits until the morning tasks are saved and loaded, so it can list them.
    const morningPending = activePrompts.some((item) => item.stage === PromptStage.MORNING_KICKOFF)
      || prompts.some((item) => item.stage === PromptStage.MORNING_KICKOFF && item.status === PromptStatus.ACTIVE);
    const available = activePrompts
      .filter((item) => item.stage !== PromptStage.EOD_WRAP_UP && item.id !== dismissedId)
      .filter((item) => !(item.stage === PromptStage.MIDDAY_PULSE && morningPending))
      .sort((left, right) => stages.indexOf(left.stage) - stages.indexOf(right.stage));
    return available[0] ?? null;
  }, [activePrompts, prompts, dismissedId]);

  const workMode = attendanceToday?.workMode;
  // Rebuild the form when an earlier check-in is saved, so it starts from the latest task list.
  const submittedKey = prompts.filter((item) => item.status === PromptStatus.SUBMITTED).map((item) => item.id).join(',');

  if (gate) {
    return (
      <PromptCheckInDialog
        key={`${gate.prompt.id}:${submittedKey}`}
        prompt={gate.prompt}
        prompts={prompts}
        workMode={workMode}
        gateReason={gate.reason}
        onSubmit={submitPrompt}
        onRefresh={refreshPrompts}
        onClose={finishEod}
      />
    );
  }

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
      key={`${prompt.id}:${submittedKey}`}
      prompt={prompt}
      prompts={prompts}
      workMode={workMode}
      onSubmit={submitPrompt}
      onRefresh={refreshPrompts}
      onClose={() => setDismissedId(prompt.id)}
    />
  );
};

const PromptCheckInDialog = ({ prompt, prompts, workMode, gateReason, onSubmit, onRefresh, onClose }) => {
  const isMorning = prompt.stage === PromptStage.MORNING_KICKOFF;
  const isEod = prompt.stage === PromptStage.EOD_WRAP_UP;
  const workingFromHome = workMode === WorkMode.WFH;
  const plan = useMemo(() => planFor(prompts, prompt.stage), [prompts, prompt.stage]);

  const [morningTasks, setMorningTasks] = useState(['']);
  const [rows, setRows] = useState(() => (plan.current.length
    ? plan.current.map((task) => ({ title: task.title, status: task.status, existing: true }))
    : [{ title: '', status: '', existing: false }]));
  const [standupConfirmed, setStandupConfirmed] = useState('');
  const [powerStatus, setPowerStatus] = useState('');
  const [ispStatus, setIspStatus] = useState('');
  const [blockerNote, setBlockerNote] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [qualityMessage, setQualityMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const draftKey = useRef(createDraftKey());
  const inFlight = useRef(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [retryError, setRetryError] = useState(null);

  // New tasks unlock once a morning task is done (or straight away when there was no morning plan).
  const morningTaskDone = rows.some((row) => row.status === 'DONE' && plan.morning.some((title) => sameTitle(title, row.title)));
  const canAddTasks = (!plan.morningSubmitted || morningTaskDone) && rows.length < MAX_TASKS;
  const behind = rows.some((row) => ['DELAYED', 'BLOCKED'].includes(row.status));

  const updateRow = (index, change) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...change } : row));

  const validate = () => {
    if (isMorning) {
      const titles = morningTasks.map((item) => item.trim()).filter(Boolean);
      if (!titles.length) return 'Add at least one task for today.';
      if (new Set(titles.map((title) => title.toLowerCase())).size !== titles.length) return 'Each task must have a different title.';
      if (workingFromHome && (!standupConfirmed || !powerStatus || !ispStatus)) return 'Answer the stand-up, power and internet questions.';
      return '';
    }
    if (rows.some((row) => !row.title.trim())) return 'Give every task a title, or remove the empty one.';
    if (rows.some((row) => !row.status)) return 'Choose a status for every task.';
    const titles = rows.map((row) => row.title.trim().toLowerCase());
    if (new Set(titles).size !== titles.length) return 'Each task must have a different title.';
    if (rows.some((row) => !row.existing) && plan.morningSubmitted && !morningTaskDone) return 'Complete at least one of your morning tasks before adding new ones.';
    if (behind && !blockerNote.trim()) return 'Add a note on what is delaying or blocking you.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    setError('');
    setFieldErrors({});
    setQualityMessage('');
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const payload = isMorning
      ? {
        tasks: morningTasks.map((item) => item.trim()).filter(Boolean).map((title) => ({ title })),
        standupConfirmed: workingFromHome ? standupConfirmed === 'true' : undefined,
        powerStatus: workingFromHome ? powerStatus : undefined,
        ispStatus: workingFromHome ? ispStatus : undefined,
      }
      : {
        tasks: rows.map((row) => ({ title: row.title.trim(), status: row.status })),
        blockerNote: behind ? blockerNote.trim() : undefined,
        note: isEod ? note.trim() || undefined : undefined,
      };
    payload.draftKey = draftKey.current;

    inFlight.current = true;
    setSaving(true);
    try {
      const result = await onSubmit(prompt.id, payload);
      setAttempt(result.quality.attempt);
      if (result.quality.accepted) {
        onClose('submitted');
      } else {
        setQualityMessage(result.quality.feedbackMessage || 'Please revise your response and try again.');
      }
    } catch (caught) {
      setError(getUserErrorMessage(caught, 'Check-in could not be submitted.'));
      setRetryError(caught);
      if (caught instanceof ApiError) setFieldErrors(caught.fieldErrors);
      if (caught instanceof ApiError && ['PROMPT_EXPIRED', 'PROMPT_ALREADY_SUBMITTED'].includes(caught.code)) await onRefresh();
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1D2951]/60 p-3 backdrop-blur-sm sm:p-5">
      <section role="dialog" aria-modal="true" aria-labelledby="prompt-dialog-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#6115D0]">Daily check-in</p>
            <h2 id="prompt-dialog-title" className="mt-1 text-lg font-black text-[#1D2951]">{stageTitles[prompt.stage]}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{gateReason ? gateDescriptions[gateReason] : stageDescriptions[prompt.stage]}</p>
          </div>
          <button type="button" onClick={() => onClose('cancelled')} aria-label={gateReason ? 'Cancel' : 'Dismiss check-in'} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>

        {qualityMessage && <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">{qualityMessage}{attempt > 0 && ` · Attempt ${attempt}`}</p>}
        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs leading-relaxed text-rose-700">{error}</p>}

        <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-4" noValidate>
          {isMorning ? (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Today’s tasks</p>
                {morningTasks.map((value, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <label className="flex-1">
                      <span className="sr-only">Task {index + 1}</span>
                      <input maxLength={500} value={value} onChange={(event) => setMorningTasks((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="input text-xs" placeholder={`Task ${index + 1}`} />
                    </label>
                    {morningTasks.length > 1 && (
                      <button type="button" onClick={() => setMorningTasks((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove task ${index + 1}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {morningTasks.length < MAX_TASKS && (
                  <button type="button" onClick={() => setMorningTasks((current) => [...current, ''])} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6115D0] hover:underline">
                    <Plus className="h-3 w-3" />Add another task
                  </button>
                )}
                {getFieldError(fieldErrors, 'tasks') && <p role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'tasks')}</p>}
              </div>
              {workingFromHome && (
                <>
                  <SelectField label="Stand-up confirmed" value={standupConfirmed} onChange={setStandupConfirmed} options={[['true', 'Yes'], ['false', 'No']]} placeholder="Select an answer" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField label="Power status" value={powerStatus} onChange={setPowerStatus} options={connectionOptions} />
                    <SelectField label="Internet status" value={ispStatus} onChange={setIspStatus} options={connectionOptions} />
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700">Your tasks</p>
                <ul className="space-y-2">
                  {rows.map((row, index) => (
                    <li key={index} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-2.5 sm:flex-row sm:items-center">
                      {row.existing ? (
                        <p className="min-w-0 flex-1 break-words text-xs font-semibold text-slate-700">{row.title}</p>
                      ) : (
                        <label className="min-w-0 flex-1">
                          <span className="sr-only">New task title</span>
                          <input maxLength={500} value={row.title} onChange={(event) => updateRow(index, { title: event.target.value })} className="input text-xs" placeholder="New task" />
                        </label>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 sm:w-36 sm:flex-none">
                          <span className="sr-only">Status of {row.title || 'new task'}</span>
                          <select value={row.status} onChange={(event) => updateRow(index, { status: event.target.value })} className="input text-xs">
                            <option value="" disabled>Status</option>
                            {taskStatusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                          </select>
                        </label>
                        {!row.existing && (rows.length > 1) && (
                          <button type="button" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))} aria-label="Remove new task" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                {rows.length < MAX_TASKS && (
                  canAddTasks ? (
                    <button type="button" onClick={() => setRows((current) => [...current, { title: '', status: 'ON_TRACK', existing: false }])} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6115D0] hover:underline">
                      <Plus className="h-3 w-3" />Add a task
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-400">Mark one of your morning tasks as done to add more tasks.</p>
                  )
                )}
              </div>
              {behind && (
                <label className="block text-xs font-bold text-slate-700">
                  What is delaying or blocking you?
                  <textarea maxLength={1000} rows={3} value={blockerNote} onChange={(event) => setBlockerNote(event.target.value)} className="input mt-1 text-xs" placeholder="Briefly describe what is holding the task up." />
                  {getFieldError(fieldErrors, 'blockerNote') && <span role="alert" className="block text-rose-700">{getFieldError(fieldErrors, 'blockerNote')}</span>}
                </label>
              )}
              {rows.some((row) => row.status === 'BLOCKED') && <p className="rounded-lg bg-slate-50 p-2.5 text-[10px] leading-relaxed text-slate-500">Blocked tasks are added to the support queue for review. No alert is sent.</p>}
              {isEod && (
                <label className="block text-xs font-bold text-slate-700">
                  Anything else about today? <span className="font-medium text-slate-400">(optional)</span>
                  <textarea maxLength={1000} rows={2} value={note} onChange={(event) => setNote(event.target.value)} className="input mt-1 text-xs" />
                </label>
              )}
            </>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {gateReason === 'sign-out' ? (
              <button type="button" disabled={saving} onClick={() => onClose('skipped')} className="text-center text-[11px] font-semibold text-slate-500 hover:text-[#6115D0]">Skip and sign out</button>
            ) : gateReason ? <span /> : (
              <Link to="/candidate/progress" onClick={() => onClose('cancelled')} className="text-center text-[11px] font-semibold text-slate-500 hover:text-[#6115D0]">View check-in history</Link>
            )}
            <div className="flex justify-end gap-2">
              {canRetryError(retryError) && <button type="button" disabled={saving} onClick={(event) => event.currentTarget.closest('form')?.requestSubmit()} className="btn btn-secondary btn-sm">Retry</button>}
              <button type="submit" disabled={saving} className="rounded-xl bg-[#6115D0] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#4F11AA] disabled:cursor-not-allowed disabled:opacity-50">
                {saving ? 'Submitting…' : (gateReason ? gateSubmitLabels[gateReason] : submitLabels[prompt.stage])}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
};

const connectionOptions = [['STABLE', 'Stable'], ['UNSTABLE', 'Unstable'], ['DOWN', 'Down']];

const SelectField = ({ label, value, onChange, options, placeholder = 'Select status' }) => (
  <label className="block text-xs font-bold text-slate-700">
    {label}
    <select value={value} onChange={(event) => onChange(event.target.value)} className="input mt-1 text-xs">
      <option value="" disabled>{placeholder}</option>
      {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
    </select>
  </label>
);

export default PromptCheckInPopup;
