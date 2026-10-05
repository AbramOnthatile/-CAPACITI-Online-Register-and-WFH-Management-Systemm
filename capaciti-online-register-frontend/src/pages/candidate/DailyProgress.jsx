import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';

const initialState = {
  workToday: '',
  completed: '',
  blockers: '',
  nextPlan: '',
};

const DailyProgress = () => {
  const { progress, addProgressEntry } = useApp();
  const { user } = useAuth();
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!form.workToday.trim()) nextErrors.workToday = 'This field is required';
    if (!form.completed.trim()) nextErrors.completed = 'This field is required';
    if (!form.blockers.trim()) nextErrors.blockers = 'This field is required';
    if (!form.nextPlan.trim()) nextErrors.nextPlan = 'This field is required';
    return nextErrors;
  };

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    addProgressEntry({
      id: `prog-${Date.now()}`,
      candidate: user.fullName,
      candidateId: user.id,
      date: new Date().toISOString().slice(0, 10),
      completedWork: form.completed,
      blockers: form.blockers,
      nextPlan: form.nextPlan,
      feedback: 'Awaiting review',
    });
    setForm(initialState);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Progress</p>
        <h2 className="text-3xl font-bold text-slate-900">Daily Progress</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card title="Submit your update">
          <form className="space-y-4" onSubmit={submit} noValidate>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">What did you work on today?</label>
              <textarea rows="3" className="input" value={form.workToday} onChange={(e) => setForm({ ...form, workToday: e.target.value })} />
              {errors.workToday && <p className="mt-1 text-sm text-red-600">{errors.workToday}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">What did you complete?</label>
              <textarea rows="3" className="input" value={form.completed} onChange={(e) => setForm({ ...form, completed: e.target.value })} />
              {errors.completed && <p className="mt-1 text-sm text-red-600">{errors.completed}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Any blockers?</label>
              <textarea rows="3" className="input" value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} />
              {errors.blockers && <p className="mt-1 text-sm text-red-600">{errors.blockers}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">What are you planning for tomorrow?</label>
              <textarea rows="3" className="input" value={form.nextPlan} onChange={(e) => setForm({ ...form, nextPlan: e.target.value })} />
              {errors.nextPlan && <p className="mt-1 text-sm text-red-600">{errors.nextPlan}</p>}
            </div>

            <button type="submit" className="btn btn-primary w-full">Submit Progress</button>
          </form>
        </Card>

        <Card title="Previous entries">
          <div className="space-y-3">
            {progress.slice(0, 4).map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-semibold text-slate-800">{item.date}</p>
                <p className="mt-2 text-sm text-slate-600">{item.completedWork}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DailyProgress;
