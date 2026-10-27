import { Link } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../api/types';
import StatusBadge, { ActiveBadge } from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';

const Candidates = () => {
  const { users, usersLoading, usersError } = useApp();
  const { user } = useAuth();
  const candidates = users.filter((candidate) =>
    candidate.role === UserRole.CANDIDATE && candidate.championId === user?.id,
  );
  const emptyMessage = usersLoading ? 'Loading candidates...' : 'No candidates are assigned to this cohort.';

  return (
    <div className="page">
      <PageHeader eyebrow="Candidate directory" title="Candidates" description={`${candidates.length} assigned candidate${candidates.length === 1 ? '' : 's'}`} actions={<StatusBadge status="PENDING">Demo</StatusBadge>} />

      <Alert>{usersError?.message}</Alert>

      {/* Phones */}
      <ul className="list md:hidden">
        {candidates.map((candidate) => (
          <li key={candidate.id}>
            <Link to={`/champion/candidates/${candidate.id}`} className="surface surface-interactive flex items-center gap-3 p-4">
              <Avatar name={candidate.fullName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-navy">{candidate.fullName}</p>
                <p className="truncate text-xs text-slate-500">{candidate.campusName || 'No campus'}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5"><StatusBadge status={candidate.defaultMode} /><ActiveBadge active={candidate.active} /></div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
            </Link>
          </li>
        ))}
        {!candidates.length && <li><EmptyState icon={Users} description={emptyMessage} /></li>}
      </ul>

      {/* Tablet & desktop */}
      <div className="surface hidden overflow-hidden md:block">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Candidate</th><th>Campus</th><th>Default mode</th><th>Status</th><th className="text-right">Details</th></tr></thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={candidate.fullName} size="sm" />
                      <div className="min-w-0"><p className="font-bold text-navy">{candidate.fullName}</p><p className="font-mono text-xs text-slate-400">{candidate.email}</p></div>
                    </div>
                  </td>
                  <td className="text-slate-600">{candidate.campusName || '—'}</td>
                  <td><StatusBadge status={candidate.defaultMode} /></td>
                  <td><ActiveBadge active={candidate.active} /></td>
                  <td className="text-right"><Link to={`/champion/candidates/${candidate.id}`} className="btn btn-secondary btn-sm">View <ChevronRight className="h-3.5 w-3.5" /></Link></td>
                </tr>
              ))}
              {!candidates.length && <tr><td colSpan={5} className="table-empty">{emptyMessage}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Candidates;
