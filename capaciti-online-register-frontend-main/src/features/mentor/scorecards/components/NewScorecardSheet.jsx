import { useState } from 'react';
import { X } from 'lucide-react';

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const today = formatDate(new Date());

function subtractDays(value, days) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() - days);
  return formatDate(date);
}

const NewScorecardSheet = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('WEEKLY');
  const [assessmentDate, setAssessmentDate] = useState(today);
  const [periodStart, setPeriodStart] = useState(subtractDays(today, 7));
  const [periodEnd, setPeriodEnd] = useState(today);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (periodStart > periodEnd) {
      setError('The period start must be on or before the period end.');
      return;
    }
    if (periodEnd > assessmentDate) {
      setError('The period end cannot be after the assessment date.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onCreate({ title: title.trim(), type, assessmentDate, periodStart, periodEnd });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The scorecard could not be created.');
    } finally {
      setSaving(false);
    }
  };

  const updateAssessmentDate = (value) => {
    setAssessmentDate(value);
    setPeriodEnd(value);
    setPeriodStart(subtractDays(value, 7));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#1D2951]/50 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="new-scorecard-title" className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="new-scorecard-title" className="text-lg font-black text-[#1D2951]">New scorecard</h3>
            <p className="mt-1 text-xs text-slate-500">Set the assessment details to create a draft.</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Title
            <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="input mt-1 text-xs" placeholder="e.g. Weekly scorecard — 26 October" />
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Type
            <select value={type} onChange={(event) => setType(event.target.value)} className="input mt-1 text-xs">
              <option value="WEEKLY">Weekly</option>
              <option value="PROJECT">Project</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-slate-700">
            Assessment date
            <input required type="date" value={assessmentDate} onChange={(event) => updateAssessmentDate(event.target.value)} className="input mt-1 text-xs" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-slate-700">
              Period start
              <input required type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="input mt-1 text-xs" />
            </label>
            <label className="block text-xs font-bold text-slate-700">
              Period end
              <input required type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="input mt-1 text-xs" />
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#6115D0] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4F11AA] disabled:opacity-60">{saving ? 'Creating...' : 'Create draft'}</button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default NewScorecardSheet;
