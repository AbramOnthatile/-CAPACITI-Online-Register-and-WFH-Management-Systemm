import { useRef, useState } from 'react';
import { ApiError, canRetryError, getFieldError, getUserErrorMessage } from '../../api/client';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import { createDraftKey } from '../../lib/attendanceAction';

const initialReadiness = {
  stableInternet: false,
  powerBackup: false,
  quietWorkspace: false,
  laptopReady: false,
};
const readinessLabels = {
  stableInternet: 'Stable internet',
  powerBackup: 'Power backup',
  quietWorkspace: 'Quiet workspace',
  laptopReady: 'Laptop ready',
};
const NewWFHRequest = () => {
  const navigate = useNavigate();
  const { addWFHRequest } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', readiness: initialReadiness });
  const [error, setError] = useState('');
  const [qualityMessage, setQualityMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const draftKey = useRef(createDraftKey());
  const inFlight = useRef(false);
  const formRef = useRef(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [retryError, setRetryError] = useState(null);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setError('Enter a date range and reason.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('The end date must be on or after the start date.');
      return;
    }
    setError('');
    setFieldErrors({});
    setQualityMessage('');
    inFlight.current = true;
    setSubmitting(true);
    try {
      const result = await addWFHRequest({ ...form, draftKey: draftKey.current });
      if (result?.quality?.accepted === false) {
        setQualityMessage(result.quality.feedbackMessage || 'Please revise your request and try again.');
        return;
      }
      navigate('/candidate/wfh');
    } catch (submitError) {
      setError(getUserErrorMessage(submitError, 'Request could not be submitted.'));
      setRetryError(submitError);
      if (submitError instanceof ApiError) setFieldErrors(submitError.fieldErrors);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="page-narrow">
      <PageHeader backTo="/candidate/wfh" backLabel="Back to WFH requests" eyebrow="Remote work" title="New WFH request" description="Submit a remote work request for review." />

      <Card title="Application details" subtitle={`Requesting as ${user?.fullName ?? ''}`}>
        <form ref={formRef} onSubmit={(event) => void onSubmit(event)} className="space-y-5" noValidate>
          <Alert>{error}</Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="field">
              <span className="field-label">Start date</span>
              <input type="date" required className="input" value={form.startDate} onChange={(event) => { setFieldErrors({}); setForm({ ...form, startDate: event.target.value }); }} />
              {getFieldError(fieldErrors, 'startDate') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'startDate')}</span>}
            </label>
            <label className="field">
              <span className="field-label">End date</span>
              <input type="date" required value={form.endDate} onChange={(event) => { setFieldErrors({}); setForm({ ...form, endDate: event.target.value }); }} className="input" />
              {getFieldError(fieldErrors, 'endDate') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'endDate')}</span>}
            </label>
          </div>

          <label className="field">
            <span className="field-label">Reason</span>
            <textarea rows="4" required className="input" value={form.reason} onChange={(event) => { setFieldErrors({}); setForm({ ...form, reason: event.target.value }); }} placeholder="Explain the reason for your request." />
            {getFieldError(fieldErrors, 'reason') && <span role="alert" className="text-xs text-rose-700">{getFieldError(fieldErrors, 'reason')}</span>}
          </label>

          <fieldset>
            <legend className="field-label mb-2">WFH readiness</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(readinessLabels).map(([key, label]) => (
                <label key={key} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-sm font-semibold transition-colors ${form.readiness[key] ? 'border-primary-600/40 bg-primary-50/70 text-navy' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={form.readiness[key]}
                    onChange={(event) => setForm({
                      ...form,
                      readiness: { ...form.readiness, [key]: event.target.checked },
                    })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {canRetryError(retryError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => formRef.current?.requestSubmit()}>Retry</button>}
          <Alert tone="warning">{qualityMessage}</Alert>
          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/candidate/wfh')}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              <Send className="h-4 w-4" />{submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewWFHRequest;
