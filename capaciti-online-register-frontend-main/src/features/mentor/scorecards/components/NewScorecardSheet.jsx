import { useState } from 'react';
import Modal from '../../../../components/common/Modal';
import Alert from '../../../../components/common/Alert';

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
    <Modal
      as="form"
      onSubmit={(event) => void handleSubmit(event)}
      size="lg"
      title="New scorecard"
      description="Set the assessment details to create a draft."
      onClose={onClose}
      closeDisabled={saving}
      footer={(
        <>
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-secondary">Cancel</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Creating...' : 'Create draft'}</button>
        </>
      )}
    >
      <div className="space-y-4">
        <Alert>{error}</Alert>
        <label className="field">
          <span className="field-label">Title</span>
          <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="input" placeholder="e.g. Weekly scorecard — 26 October" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span className="field-label">Type</span>
            <select value={type} onChange={(event) => setType(event.target.value)} className="input">
              <option value="WEEKLY">Weekly</option>
              <option value="PROJECT">Project</option>
            </select>
          </label>
          <label className="field">
            <span className="field-label">Assessment date</span>
            <input required type="date" value={assessmentDate} onChange={(event) => updateAssessmentDate(event.target.value)} className="input" />
          </label>
          <label className="field">
            <span className="field-label">Period start</span>
            <input required type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="input" />
          </label>
          <label className="field">
            <span className="field-label">Period end</span>
            <input required type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="input" />
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default NewScorecardSheet;
