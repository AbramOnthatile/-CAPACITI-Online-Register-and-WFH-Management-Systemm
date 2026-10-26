import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, RotateCcw, Save, Send, Trash2 } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import Alert from '../../../components/common/Alert';
import Modal from '../../../components/common/Modal';
import { useScorecards } from '../../../api/hooks/scorecards';
import { overallPercent, percentTone, scoreCriteria, scoreTone } from '../../../lib/scoring';

const scoreClasses = {
  success: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  'light-success': 'border-green-300 bg-green-100 text-green-800',
  warning: 'border-amber-300 bg-amber-100 text-amber-800',
  orange: 'border-orange-300 bg-orange-100 text-orange-800',
  danger: 'border-rose-300 bg-rose-100 text-rose-800',
};
const percentClasses = {
  success: 'bg-emerald-50 text-emerald-700',
  'light-success': 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-700',
  danger: 'bg-rose-50 text-rose-700',
};
const feedbackLimit = 1000;

function editableData(assessment) {
  return JSON.stringify({ entries: assessment.entries, groupFeedback: assessment.groupFeedback });
}

function groupAverage(entries) {
  const values = entries.map((entry) => overallPercent(entry.scores)).filter((value) => value !== null);
  return values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : null;
}

function missingScoreWarnings(entries) {
  return entries.flatMap((entry) => {
    const missing = scoreCriteria.filter(({ key }) => typeof entry.scores[key] !== 'number').map(({ label }) => label);
    return missing.length ? [`${entry.candidateName}: ${missing.join(', ')}`] : [];
  });
}

const ScoringPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAssessment, saveAssessment, setAssessmentStatus, deleteAssessment } = useScorecards();
  const [assessment, setAssessment] = useState(null);
  const [expandedIds, setExpandedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const savedSnapshot = useRef('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getAssessment(id)
      .then((result) => {
        if (!active) return;
        setAssessment(result);
        savedSnapshot.current = editableData(result);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Scorecard could not be loaded.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, getAssessment]);

  const isDirty = assessment?.status === 'DRAFT' && savedSnapshot.current !== editableData(assessment);
  const readOnly = assessment?.status === 'SUBMITTED';
  const average = useMemo(() => assessment ? groupAverage(assessment.entries) : null, [assessment]);
  const missingWarnings = useMemo(() => assessment ? missingScoreWarnings(assessment.entries) : [], [assessment]);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const handleLinkClick = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!anchor || anchor.target === '_blank') return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.pathname === window.location.pathname) return;
      if (!window.confirm('You have unsaved scorecard changes. Leave without saving?')) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('click', handleLinkClick, true);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [isDirty]);

  const updateEntry = useCallback((candidateId, updater) => {
    setAssessment((current) => current ? ({
      ...current,
      entries: current.entries.map((entry) => entry.candidateId === candidateId ? updater(entry) : entry),
    }) : current);
    setNotice('');
  }, []);

  const updateScore = (entry, key, score) => updateEntry(entry.candidateId, (current) => ({
    ...current,
    scores: { ...current.scores, [key]: score },
    overallPercent: overallPercent({ ...current.scores, [key]: score }),
  }));

  const handleSave = async () => {
    if (!assessment || readOnly) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await saveAssessment(assessment.id, {
        entries: assessment.entries,
        groupFeedback: assessment.groupFeedback,
      });
      setAssessment(saved);
      savedSnapshot.current = editableData(saved);
      setNotice('Draft saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The draft could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (action) => {
    if (!assessment) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (action === 'submit' && isDirty) {
        const saved = await saveAssessment(assessment.id, {
          entries: assessment.entries,
          groupFeedback: assessment.groupFeedback,
        });
        setAssessment(saved);
      }
      const updated = await setAssessmentStatus(assessment.id, action);
      setAssessment(updated);
      savedSnapshot.current = editableData(updated);
      setShowSubmitDialog(false);
      setNotice(action === 'submit' ? 'Scorecard submitted.' : 'Scorecard reopened as a draft.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `The scorecard could not be ${action === 'submit' ? 'submitted' : 'reopened'}.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!assessment || assessment.status !== 'DRAFT') return;
    if (!window.confirm('Delete this draft scorecard? This cannot be undone.')) return;
    setSaving(true);
    setError('');
    try {
      await deleteAssessment(assessment.id);
      navigate('/champion/scorecards', { replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The draft could not be deleted.');
      setSaving(false);
    }
  };

  if (loading) return <p role="status" className="meta">Loading scorecard...</p>;
  if (!assessment) {
    return (
      <div className="page-narrow">
        <Alert>{error}</Alert>
        <Link to="/champion/scorecards" className="btn btn-secondary"><ArrowLeft className="h-4 w-4" />Back to scorecards</Link>
      </div>
    );
  }

  const statusTone = average === null ? null : percentTone(average);

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex min-w-0 items-start gap-3">
          <Link to="/champion/scorecards" className="icon-btn mt-0.5" aria-label="All scorecards" title="All scorecards"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="page-title">{assessment.title}</h2>
              <StatusBadge status={assessment.status} />
            </div>
            <p className="page-subtitle mt-1">{assessment.type === 'WEEKLY' ? 'Weekly' : 'Project'} · {assessment.periodStart} – {assessment.periodEnd} · Assessment {assessment.assessmentDate}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap [&>*:only-child]:col-span-3">
          {assessment.status === 'DRAFT' ? (
            <>
              <button type="button" onClick={() => void handleDelete()} disabled={saving} className="btn btn-danger"><Trash2 className="h-3.5 w-3.5" />Delete</button>
              <button type="button" onClick={() => void handleSave()} disabled={saving || !isDirty} className="btn btn-secondary"><Save className="h-3.5 w-3.5" />{saving ? 'Saving...' : 'Save draft'}</button>
              <button type="button" onClick={() => setShowSubmitDialog(true)} disabled={saving} className="btn btn-primary"><Send className="h-3.5 w-3.5" />Submit</button>
            </>
          ) : (
            <button type="button" onClick={() => void handleStatus('reopen')} disabled={saving} className="btn btn-secondary"><RotateCcw className="h-3.5 w-3.5" />{saving ? 'Reopening...' : 'Reopen'}</button>
          )}
        </div>
      </div>

      <Alert>{error}</Alert>
      <Alert tone="success">{notice}</Alert>
      {isDirty && <Alert tone="warning">You have unsaved changes. Save the draft before leaving to keep your updates.</Alert>}

      <section className="surface surface-pad">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="group-feedback" className="field-label">Group feedback</label>
          <span className="text-xs text-slate-500">
            Group average: {average === null
              ? '—'
              : <span className={`ml-1 rounded-full px-2.5 py-0.5 font-mono font-bold ${percentClasses[statusTone]}`}>{average}%</span>}
          </span>
        </div>
        <textarea
          id="group-feedback"
          rows="3"
          maxLength={feedbackLimit}
          disabled={readOnly}
          value={assessment.groupFeedback}
          onChange={(event) => setAssessment((current) => current ? ({ ...current, groupFeedback: event.target.value }) : current)}
          className="input mt-2"
          placeholder="Share feedback relevant to the whole group."
        />
        <p className="mt-1 text-right text-[10px] text-slate-400">{assessment.groupFeedback.length}/{feedbackLimit}</p>
      </section>

      <section className="surface overflow-hidden">
        <div className="card-header block">
          <h3 className="section-title">Candidate scorecard</h3>
          <p className="mt-0.5 text-xs text-slate-500">Score each criterion from 1 to 5. Select a candidate row to add feedback.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="sticky left-0 z-20 min-w-48 border-b border-r border-slate-200 bg-slate-50 px-4 py-3">Candidate</th>
                {scoreCriteria.map((criterion) => <th key={criterion.key} className="min-w-36 border-b border-slate-200 px-3 py-3 text-center">{criterion.label}</th>)}
                <th className="min-w-28 border-b border-slate-200 px-3 py-3 text-center">Overall</th>
                <th className="min-w-32 border-b border-slate-200 px-3 py-3 text-center">Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessment.entries.map((entry) => {
                const suggestion = assessment.attendanceSuggestions.find((item) => item.candidateId === entry.candidateId);
                const percent = overallPercent(entry.scores);
                const expanded = expandedIds.includes(entry.candidateId);
                const tooltip = suggestion
                  ? `Attendance counts — Present/on time: ${suggestion.onTime}; late excused: ${suggestion.lateExcused}; late unexcused: ${suggestion.lateUnexcused}; absent: ${suggestion.absent}`
                  : 'No attendance suggestion available';
                return (
                  <FragmentRows
                    key={entry.candidateId}
                    entry={entry}
                    suggestion={suggestion}
                    tooltip={tooltip}
                    readOnly={readOnly}
                    expanded={expanded}
                    percent={percent}
                    onScore={(key, value) => updateScore(entry, key, value)}
                    onToggleFeedback={() => setExpandedIds((current) => current.includes(entry.candidateId) ? current.filter((candidateId) => candidateId !== entry.candidateId) : [...current, entry.candidateId])}
                    onFeedback={(field, value) => updateEntry(entry.candidateId, (current) => ({ ...current, [field]: value }))}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
        {!assessment.entries.length && <p className="table-empty">No candidates are available for this assessment.</p>}
      </section>

      {showSubmitDialog && (
        <Modal
          size="lg"
          title="Submit scorecard?"
          description={`Current group average: ${average === null ? 'Not available until a candidate has all six scores.' : `${average}%`}.`}
          onClose={() => setShowSubmitDialog(false)}
          closeDisabled={saving}
          footer={(
            <>
              <button type="button" onClick={() => setShowSubmitDialog(false)} disabled={saving} className="btn btn-secondary">Continue editing</button>
              <button type="button" onClick={() => void handleStatus('submit')} disabled={saving} className="btn btn-primary">{saving ? 'Submitting...' : 'Confirm submit'}</button>
            </>
          )}
        >
          {missingWarnings.length > 0 ? (
            <Alert tone="warning">
              <p className="font-bold">Missing scores to review</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                {missingWarnings.map((warning) => <li key={warning}>{warning}</li>)}
              </ul>
              <p className="mt-2 text-xs">You can still submit; candidates with incomplete scores will have no overall percentage.</p>
            </Alert>
          ) : (
            <Alert tone="success">All candidates have scores for every criterion.</Alert>
          )}
        </Modal>
      )}
    </div>
  );
};

const FragmentRows = ({ entry, suggestion, tooltip, readOnly, expanded, percent, onScore, onToggleFeedback, onFeedback }) => (
  <>
    <tr className="hover:bg-slate-50/50">
      <th scope="row" className="sticky left-0 z-10 border-r border-slate-100 bg-white px-4 py-3 text-left font-bold text-navy">
        <div className="flex items-center gap-2">
          <span>{entry.candidateName}</span>
          <button type="button" onClick={onToggleFeedback} aria-expanded={expanded} aria-label={`${expanded ? 'Hide' : 'Show'} feedback for ${entry.candidateName}`} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-primary-600">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </th>
      {scoreCriteria.map((criterion) => {
        const score = entry.scores[criterion.key];
        return (
          <td key={criterion.key} className="px-3 py-3 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div role="group" aria-label={`${criterion.label} score for ${entry.candidateName}`} className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={readOnly}
                    aria-label={`${criterion.label} ${value}`}
                    aria-pressed={score === value}
                    onClick={() => onScore(criterion.key, value)}
                    className={`h-8 w-8 rounded-lg border text-xs font-bold transition-colors disabled:cursor-default ${
                      score === value ? scoreClasses[scoreTone(value)] : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {criterion.key === 'attendance' && suggestion && (
                <button
                  type="button"
                  title={tooltip}
                  disabled={readOnly}
                  onClick={() => onScore(criterion.key, suggestion.suggestedScore)}
                  className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[9px] font-semibold text-sky-800 hover:bg-sky-100 disabled:cursor-default"
                >
                  Suggested: {suggestion.suggestedScore}
                </button>
              )}
              {criterion.key === 'attendance' && !readOnly && <span className="text-[9px] text-slate-400">Suggestion only</span>}
            </div>
          </td>
        );
      })}
      <td className="px-3 py-3 text-center">
        {percent === null
          ? <span className="text-slate-400">—</span>
          : <span className={`rounded-full px-2.5 py-0.5 font-mono font-bold ${percentClasses[percentTone(percent)]}`}>{percent}%</span>}
      </td>
      <td className="px-3 py-3 text-center">
        <button type="button" onClick={onToggleFeedback} aria-expanded={expanded} className="btn btn-secondary btn-sm">
          {expanded ? 'Hide' : 'Add / view'}
        </button>
      </td>
    </tr>
    {expanded && (
      <tr className="bg-slate-50/60">
        <td colSpan={scoreCriteria.length + 3} className="px-4 py-4 sm:px-6">
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { field: 'feedbackStrengths', label: 'Strengths', placeholder: 'What went well?' },
              { field: 'feedbackImprovements', label: 'Areas to improve', placeholder: 'What should the candidate focus on?' },
              { field: 'feedback', label: 'General feedback', placeholder: 'Add additional feedback.' },
            ].map(({ field, label, placeholder }) => (
              <label key={field} className="field">
                <span className="field-label">{label}</span>
                <textarea
                  rows="3"
                  maxLength={feedbackLimit}
                  disabled={readOnly}
                  value={entry[field]}
                  onChange={(event) => onFeedback(field, event.target.value)}
                  className="input"
                  placeholder={placeholder}
                />
                <span className="mt-1 block text-right text-[10px] font-normal text-slate-400">{entry[field].length}/{feedbackLimit}</span>
              </label>
            ))}
          </div>
        </td>
      </tr>
    )}
  </>
);

export default ScoringPage;
