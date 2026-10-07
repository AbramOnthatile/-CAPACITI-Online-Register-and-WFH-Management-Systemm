import { useApp } from '../../context/AppContext';

const AuditLog = () => {
  const { auditLogs } = useApp();
  return (
    <div className="card p-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900">Audit Log</h1>
      <ul className="space-y-3">
        {auditLogs.map((a) => (
          <li key={a.id} className="rounded-xl border border-slate-100 p-3 text-sm">
            <p className="font-medium text-slate-800">{a.action} — {a.user}</p>
            <p className="text-slate-500">{a.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AuditLog;
