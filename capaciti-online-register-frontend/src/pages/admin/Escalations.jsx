import { useApp } from '../../context/AppContext';

const Escalations = () => {
  const { escalations } = useApp();
  return (
    <div className="card p-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900">Escalations</h1>
      <ul className="space-y-3">
        {escalations.map((e) => (
          <li key={e.id} className="rounded-xl border border-slate-100 p-3 text-sm">
            <p className="font-medium text-slate-800">{e.candidate} — {e.status}</p>
            <p className="text-slate-500">{e.reason}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Escalations;
