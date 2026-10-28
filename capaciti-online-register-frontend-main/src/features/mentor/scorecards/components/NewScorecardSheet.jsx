import { useRef, useState } from 'react';
import { ApiError, canRetryError, getFieldError, getUserErrorMessage } from '../../../../api/client';
import Modal from '../../../../components/common/Modal';
import Alert from '../../../../components/common/Alert';
import { getSastToday, subtractLocalDays } from '../../../../lib/time';

const today = getSastToday();

const NewScorecardSheet = ({ onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('WEEKLY');
  const [assessmentDate, setAssessmentDate] = useState(today);
  const [periodStart, setPeriodStart] = useState(subtractLocalDays(today, 7));
  const [periodEnd, setPeriodEnd] = useState(today);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [retryError, setRetryError] = useState(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (periodStart > periodEnd) {
      setError('The period start must be on or before the period end.');
      return;
    }
    if (periodEnd > assessmentDate) {
      setError('The period end cannot be after the assessment date.');
      return;
    }
    setError('');
    setFieldErrors({});
    inFlight.current = true;
    setSaving(true);
    try {
      await onCreate({ title: title.trim(), type, assessmentDate, periodStart, periodEnd });
    } catch (caught) {
      setError(getUserErrorMessage(caught, 'The scorecard could not be created.'));
      setRetryError(caught);
      if (caught instanceof ApiError) setFieldErrors(caught.fieldErrors);
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const updateAssessmentDate = (value) => {
    setAssessmentDate(value);
    setPeriodEnd(value);
    setPeriodStart(subtractLocalDays(value, 7));
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
        {canRetryError(retryError) && <button type="button" className="btn btn-secondary btn-sm" disabled={saving} onClick={(event) => {
          const form = event.currentTarget.closest('form');
          form?.requestSubmit();
        }}>Retry</button>}
        <label className="field">
          <span className="field-label">Title</span>
          <input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} className="input" placeholder="e.g. Weekly scorecard — 26 October" />
          {getFieldError(fieldErrors, 'title') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'title')}</span>}
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
            {getFieldError(fieldErrors, 'assessmentDate') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'assessmentDate')}</span>}
          </label>
          <label className="field">
            <span className="field-label">Period start</span>
            <input required type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} className="input" />
            {getFieldError(fieldErrors, 'periodStart') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'periodStart')}</span>}
          </label>
          <label className="field">
            <span className="field-label">Period end</span>
            <input required type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} className="input" />
            {getFieldError(fieldErrors, 'periodEnd') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'periodEnd')}</span>}
          </label>
        </div>
      </div>
    </Modal>
  );
};

export default NewScorecardSheet;
