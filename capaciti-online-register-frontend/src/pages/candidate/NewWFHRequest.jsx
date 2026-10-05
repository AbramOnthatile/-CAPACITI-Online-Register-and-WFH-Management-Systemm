import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const initialState = {
  date: '',
  reason: '',
  supportingInfo: '',
};

const NewWFHRequest = () => {
  const navigate = useNavigate();
  const { addWFHRequest } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const nextErrors = {};
    if (!form.date) nextErrors.date = 'WFH date is required';
    if (!form.reason) nextErrors.reason = 'Reason is required';
    if (!form.supportingInfo.trim()) nextErrors.supportingInfo = 'Supporting information is required';
    return nextErrors;
  };

  const onSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    addWFHRequest({
      id: `wfh-${Date.now()}`,
      candidate: user.fullName,
      candidateId: user.id,
      date: form.date,
      reason: form.reason,
      supportingInfo: form.supportingInfo,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
      reviewedBy: '—',
      reviewerComment: '',
      timeline: ['Submitted', 'Pending Review'],
    });
    setSubmitted(true);
    setForm(initialState);
    setTimeout(() => navigate('/candidate/wfh'), 1000);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">WFH</p>
        <h2 className="text-3xl font-bold text-slate-900">New WFH Request</h2>
      </div>

      <form className="card p-6" onSubmit={onSubmit} noValidate>
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">WFH Date</label>
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Reason</label>
            <select className="input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
              <option value="">Select a reason</option>
              <option value="Personal">Personal</option>
              <option value="Health">Health</option>
              <option value="Transport">Transport</option>
              <option value="Technical">Technical</option>
              <option value="Other">Other</option>
            </select>
            {errors.reason && <p className="mt-1 text-sm text-red-600">{errors.reason}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Supporting Information</label>
            <textarea rows="5" className="input" value={form.supportingInfo} onChange={(e) => setForm({ ...form, supportingInfo: e.target.value })} />
            {errors.supportingInfo && <p className="mt-1 text-sm text-red-600">{errors.supportingInfo}</p>}
          </div>

          {submitted && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              WFH request submitted successfully and marked as pending.
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" className="btn btn-secondary flex-1" onClick={() => navigate('/candidate/wfh')}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1">Submit Request</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewWFHRequest;
