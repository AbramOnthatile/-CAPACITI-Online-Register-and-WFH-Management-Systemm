import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Building2, AlertTriangle, Search, ArrowRight } from 'lucide-react';
import { TicketStatus, UserRole, WfhStatus } from '../../api/types';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const AdminDashboard = () => {
  const { users, usersLoading, usersError, wfh, wfhError, tickets, ticketsError, campuses, auditError } = useApp();
  const [search, setSearch] = useState('');
  const candidates = useMemo(() => users.filter((user) => user.role === UserRole.CANDIDATE), [users]);
  const champions = useMemo(() => users.filter((user) => user.role === UserRole.TECH_CHAMP), [users]);
  const filtered = useMemo(() => candidates.filter((user) => !search ||
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())), [candidates, search]);
  const pendingWfh = wfh.filter((request) => request.status === WfhStatus.PENDING);
  const openTickets = tickets.filter((ticket) => ticket.status === TicketStatus.OPEN);
  const errors = [usersError, wfhError, ticketsError, auditError].filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F25251]">Executive Operations</span><span className="text-slate-300">·</span><span className="text-xs font-medium text-slate-500">User and service overview</span></div>
          <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Admin Overview</h2>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">User access, attendance records, WFH requests, and support tickets.</p>
        </div>
        <Link to="/admin/reports" className="flex items-center gap-2 self-start rounded-xl bg-[#1D2951] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0F172A]"><span>Programme Reports</span><ArrowRight className="h-3.5 w-3.5" /></Link>
      </div>

      {errors.map((error) => <p key={error.message} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error.message}</p>)}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Users} title="Candidates" value={candidates.length} detail="Registered user records" tone="primary" />
        <StatCard icon={UserCheck} title="Tech Champions" value={champions.length} detail="Registered user records" tone="slate" />
        <StatCard icon={Building2} title="Campuses" value={campuses.length} detail="Configured campus hubs" tone="success" />
        <StatCard icon={AlertTriangle} title="Open Tickets" value={openTickets.length} detail="Requires follow-up" tone="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card title="User Directory" subtitle={`${filtered.length} candidates matched`}>
            <div className="mb-4 flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[200px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input type="text" placeholder="Search candidate name or email..." value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-9 text-xs" /></div>
              <Link to="/admin/users" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-[#6115D0] hover:border-[#6115D0]">Manage Users</Link>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Candidate</th><th className="px-4 py-3">Campus</th><th className="px-4 py-3">Champion</th><th className="px-4 py-3 text-right">Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.slice(0, 8).map((candidate) => {
                    const champion = users.find((user) => user.id === candidate.championId);
                    return <tr key={candidate.id} className="transition-colors hover:bg-slate-50/60"><td className="px-4 py-3"><p className="font-bold text-[#1D2951]">{candidate.fullName}</p><p className="font-mono text-[10px] text-slate-400">{candidate.email}</p></td><td className="px-4 py-3 font-medium text-slate-600">{candidate.campusName || '—'}</td><td className="px-4 py-3 font-medium text-slate-600">{champion?.fullName || '—'}</td><td className="px-4 py-3 text-right"><span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${candidate.active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{candidate.active ? 'Active' : 'Inactive'}</span></td></tr>;
                  })}
                  {!usersLoading && filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No candidates found.</td></tr>}
                  {usersLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading users...</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="space-y-6 lg:col-span-4">
          <Card title="Pending WFH Requests" subtitle="Awaiting review" actions={<Link to="/admin/reports" className="text-xs font-bold text-[#6115D0] hover:underline">Reports →</Link>}>
            <div className="space-y-3">
              {pendingWfh.slice(0, 4).map((request) => <div key={request.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#1D2951]">{request.userName}</p><StatusBadge status={request.status} /></div><p className="mt-1 font-mono text-[10px] text-slate-400">{request.startDate} – {request.endDate}</p><p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{request.reason}</p></div>)}
              {!pendingWfh.length && <p className="py-2 text-xs text-slate-400">No pending WFH requests.</p>}
            </div>
          </Card>
          <Card title="Open Blockers & Tickets" subtitle="Support ticket tracking" actions={<Link to="/admin/escalations" className="text-xs font-bold text-[#F25251] hover:underline">Manage →</Link>}>
            <div className="space-y-3">
              {openTickets.slice(0, 4).map((ticket) => <div key={ticket.id} className="rounded-xl border border-[#F25251]/20 bg-[#F25251]/5 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#1D2951]">{ticket.userName}</p><StatusBadge status={ticket.status} /></div><p className="mt-1 text-[11px] font-semibold text-slate-700">{ticket.title}</p></div>)}
              {!openTickets.length && <p className="py-2 text-xs text-slate-400">No open tickets.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
