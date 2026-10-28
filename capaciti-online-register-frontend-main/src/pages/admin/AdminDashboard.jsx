import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Building2, AlertTriangle, Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TicketStatus, UserRole, WfhStatus } from '../../api/types';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import StatusBadge, { ActiveBadge } from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { canRetryError } from '../../api/client';

const AdminDashboard = () => {
  const { users, usersLoading, usersError, wfh, tickets, campuses, campusesError, reports, reportsLoading, reportsError, isDemoMode, refreshUsers, refreshCampuses, refreshReports } = useApp();
  const [search, setSearch] = useState('');
  const candidates = useMemo(() => users.filter((user) => user.role === UserRole.CANDIDATE), [users]);
  const champions = useMemo(() => users.filter((user) => user.role === UserRole.TECH_CHAMP), [users]);
  const filtered = useMemo(() => candidates.filter((user) => !search ||
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())), [candidates, search]);
  const pendingWfh = wfh.filter((request) => request.status === WfhStatus.PENDING);
  const openTickets = tickets.filter((ticket) => ticket.status === TicketStatus.OPEN);
  const errors = [usersError, campusesError, reportsError].filter(Boolean);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Executive operations"
        eyebrowClassName="text-salmon"
        title="Admin overview"
        description="User access, attendance records, WFH requests, and support tickets."
        actions={<Link to="/admin/reports" className="btn btn-dark">Programme reports<ArrowRight className="h-4 w-4" /></Link>}
      />

      {errors.map((error) => <Alert key={error.message}>{error.message}</Alert>)}
      {errors.some(canRetryError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void Promise.all([refreshUsers(), refreshCampuses(), refreshReports()])}>Retry</button>}
      {(usersLoading || reportsLoading) && <Skeleton label="Loading administrator overview" />}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={Users} title="Candidates" value={candidates.length} detail="Registered users" tone="primary" />
        <StatCard icon={UserCheck} title="Tech Champions" value={champions.length} detail="Registered users" tone="slate" />
        <StatCard icon={Building2} title="Campuses" value={campuses.length} detail="Configured hubs" tone="success" />
        <StatCard icon={AlertTriangle} title="Open tickets" value={reports?.openTickets ?? 0} detail="Requires follow-up" tone="warning" />
      </div>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-8">
          <Card title="User directory" subtitle={`${filtered.length} candidates matched`} actions={<Link to="/admin/users" className="link text-xs">Manage <ArrowRight className="h-3.5 w-3.5" /></Link>} contentClassName="p-0 sm:p-0">
            <div className="border-b border-slate-100 p-4 sm:px-5">
              <label className="relative block">
                <span className="sr-only">Search candidates</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input type="search" placeholder="Search candidate name or email..." value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-10" />
              </label>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Candidate</th><th className="hidden sm:table-cell">Campus</th><th className="hidden md:table-cell">Champion</th><th className="text-right">Status</th></tr></thead>
                <tbody>
                  {filtered.slice(0, 8).map((candidate) => {
                    const champion = users.find((user) => user.id === candidate.championId);
                    return (
                      <tr key={candidate.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar name={candidate.fullName} size="sm" />
                            <div className="min-w-0"><p className="truncate font-bold text-navy">{candidate.fullName}</p><p className="truncate font-mono text-xs text-slate-400">{candidate.email}</p></div>
                          </div>
                        </td>
                        <td className="hidden text-slate-600 sm:table-cell">{candidate.campusName || '—'}</td>
                        <td className="hidden text-slate-600 md:table-cell">{champion?.fullName || '—'}</td>
                        <td className="text-right"><ActiveBadge active={candidate.active} /></td>
                      </tr>
                    );
                  })}
                  {!filtered.length && <tr><td colSpan={4} className="table-empty">{usersLoading ? 'Loading users...' : 'No candidates found.'}</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="space-y-5 lg:col-span-4 lg:space-y-6">
          <Card title="Pending WFH requests" actions={<Link to="/admin/reports" className="link text-xs">Reports <ArrowRight className="h-3.5 w-3.5" /></Link>}>
            {!isDemoMode && (reports?.pendingWfh ?? 0) > 0 ? (
              <p className="meta">{reports.pendingWfh} pending request{reports.pendingWfh === 1 ? '' : 's'} are included in the aggregate report. Detailed review is available to the assigned champion.</p>
            ) : pendingWfh.length ? (
              <ul className="list">
                {pendingWfh.slice(0, 4).map((request) => (
                  <li key={request.id} className="rounded-xl border border-slate-100 p-3.5">
                    <div className="flex items-start justify-between gap-2"><p className="text-sm font-bold text-navy">{request.userName}</p><StatusBadge status={request.status} /></div>
                    <p className="mt-0.5 font-mono text-xs text-slate-400">{request.startDate} – {request.endDate}</p>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-500">{request.reason}</p>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={CheckCircle2} description="No pending WFH requests." />}
          </Card>
          <Card title="Open blockers & tickets" actions={<Link to="/admin/escalations" className="link text-xs">Manage <ArrowRight className="h-3.5 w-3.5" /></Link>}>
            {!isDemoMode && (reports?.openTickets ?? 0) > 0 ? (
              <p className="meta">{reports.openTickets} open tickets are included in the aggregate report. Ticket details are demo-only for administrator accounts.</p>
            ) : openTickets.length ? (
              <ul className="list">
                {openTickets.slice(0, 4).map((ticket) => (
                  <li key={ticket.id} className="rounded-xl border border-salmon/20 bg-salmon/5 p-3.5">
                    <div className="flex items-start justify-between gap-2"><p className="text-sm font-bold text-navy">{ticket.userName}</p><StatusBadge status={ticket.status} /></div>
                    <p className="mt-1 text-xs font-semibold text-slate-700">{ticket.title}</p>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={CheckCircle2} description="No open tickets." />}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
