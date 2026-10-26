import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import { ArrowLeft, Calendar, Send } from 'lucide-react';

const initialReadiness = {
  stableInternet: false,
  powerBackup: false,
  quietWorkspace: false,
  laptopReady: false,
};
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date());

const NewWFHRequest = () => {
  const navigate = useNavigate();
  const { addWFHRequest } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState({ startDate: '', endDate: '', reason: '', readiness: initialReadiness });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setError('Enter a date range and reason.');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('The end date must be on or after the start date.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await addWFHRequest(form);
      navigate('/candidate/wfh');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/candidate/wfh" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-xl font-black text-[#1D2951] sm:text-2xl">New WFH Request</h2>
          <p className="text-xs text-slate-500">Submit a remote work request for review</p>
        </div>
      </div>

      <Card title="Remote Work Application" subtitle={`Requesting user: ${user?.fullName ?? ''}`}>
        <form onSubmit={(event) => void onSubmit(event)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Start date</span>
              <input type="date" required min={today} className="input text-xs" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">End date</span>
              <input type="date" required min={form.startDate || today} value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="input text-xs" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Reason</span>
            <textarea rows="4" required className="input text-xs" value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="Explain the reason for your request." />
          </label>

          <fieldset className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-slate-700">WFH readiness</legend>
            {Object.entries({
              stableInternet: 'Stable internet',
              powerBackup: 'Power backup',
              quietWorkspace: 'Quiet workspace',
              laptopReady: 'Laptop ready',
            }).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={form.readiness[key]}
                  onChange={(event) => setForm({
                    ...form,
                    readiness: { ...form.readiness, [key]: event.target.checked },
                  })}
                />
                {label}
              </label>
            ))}
          </fieldset>

          {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50" onClick={() => navigate('/candidate/wfh')}>Cancel</button>
            <button type="submit" disabled={submitting} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#6115D0] py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#4F11AA]">
              <Calendar className="h-4 w-4" /><Send className="h-4 w-4" />{submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default NewWFHRequest;
