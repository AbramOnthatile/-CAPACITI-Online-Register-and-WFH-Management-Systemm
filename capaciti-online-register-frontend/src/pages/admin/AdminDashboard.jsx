import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, UserCheck, Layers, AlertTriangle } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="card p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </div>
);

const statusStyles = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Away: 'border-salmon/30 bg-salmon/10 text-salmon',
  Inactive: 'border-slate-200 bg-slate-100 text-slate-500',
};

const AdminDashboard = () => {
  const { users, wfh, escalations } = useApp();
  const [search, setSearch] = useState('');
  const [cohortFilter, setCohortFilter] = useState('All');
  const [championFilter, setChampionFilter] = useState('All');

  const candidates = useMemo(() => users.filter((u) => u.role === 'candidate'), [users]);
  const champions = useMemo(() => users.filter((u) => u.role === 'tech-champion'), [users]);
  const cohorts = useMemo(() => Array.from(new Set(candidates.map((c) => c.cohort))).sort(), [candidates]);

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.candId.toLowerCase().includes(search.toLowerCase());
      const matchesCohort = cohortFilter === 'All' || c.cohort === cohortFilter;
      const matchesChampion = championFilter === 'All' || c.techChampion === championFilter;
      return matchesSearch && matchesCohort && matchesChampion;
    });
  }, [candidates, search, cohortFilter, championFilter]);

  const pendingWfh = wfh.filter((w) => w.status === 'PENDING');
  const openEscalations = escalations.filter((e) => e.status !== 'Resolved');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-sm text-slate-500">Candidates, cohorts, and programme-wide activity</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard icon={Users} label="Total Candidates" value={candidates.length} />
        <StatCard icon={UserCheck} label="Tech Champions" value={champions.length} />
        <StatCard icon={Layers} label="Cohorts" value={cohorts.length} />
        <StatCard icon={AlertTriangle} label="Open Escalations" value={openEscalations.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
            <input
              type="text"
              placeholder="Search by name or candidate ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input flex-1 min-w-[180px]"
            />
            <select value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)} className="input w-auto">
              <option value="All">All Cohorts</option>
              {cohorts.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={championFilter} onChange={(e) => setChampionFilter(e.target.value)} className="input w-auto">
              <option value="All">All Tech Champions</option>
              {champions.map((c) => <option key={c.id} value={c.fullName}>{c.fullName}</option>)}
            </select>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Candidate</th>
                <th className="px-4 py-3 font-medium">Cohort</th>
                <th className="px-4 py-3 font-medium">Tech Champion</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                        {c.avatar}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">{c.fullName}</p>
                        <p className="text-xs text-slate-500">{c.candId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.cohort}</td>
                  <td className="px-4 py-3 text-slate-600">{c.techChampion}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${statusStyles[c.status] || statusStyles.Inactive}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">No candidates match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Pending WFH Requests</h2>
            <div className="space-y-3">
              {pendingWfh.length === 0 && <p className="text-sm text-slate-400">Nothing pending.</p>}
              {pendingWfh.map((w) => (
                <div key={w.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-sm font-medium text-slate-800">{w.candidate}</p>
                  <p className="text-xs text-slate-500">{w.date} — {w.reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Open Escalations</h2>
            <div className="space-y-3">
              {openEscalations.length === 0 && <p className="text-sm text-slate-400">No open escalations.</p>}
              {openEscalations.map((e) => (
                <div key={e.id} className="rounded-xl border border-salmon/20 bg-salmon/5 p-3">
                  <p className="text-sm font-medium text-slate-800">{e.candidate}</p>
                  <p className="text-xs text-slate-500">{e.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
