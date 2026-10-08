import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';

const ProgressReview = () => {
  const { progress } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Progress</p>
        <h2 className="text-3xl font-bold text-slate-900">Progress Review</h2>
      </div>

      <div className="card p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <input type="date" className="input" />
          <select className="input"><option>Candidate</option></select>
          <select className="input"><option>Cohort</option></select>
        </div>
      </div>

      <div className="space-y-4">
        {progress.map((entry) => (
          <div key={entry.id} className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{entry.candidate}</p>
                <p className="text-sm text-slate-500">{entry.date}</p>
              </div>
              <StatusBadge status="Pending" />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-600">Completed Work</p>
                <p className="mt-2 text-sm text-slate-700">{entry.completedWork}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">Blockers</p>
                <p className="mt-2 text-sm text-slate-700">{entry.blockers}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-slate-600">Next Plan</p>
                <p className="mt-2 text-sm text-slate-700">{entry.nextPlan}</p>
              </div>
            </div>

            <textarea rows="3" className="input mt-4" placeholder="Add mentor feedback" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressReview;
