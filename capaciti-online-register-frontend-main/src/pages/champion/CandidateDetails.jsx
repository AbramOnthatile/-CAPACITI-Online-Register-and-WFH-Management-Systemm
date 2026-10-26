import { useParams } from 'react-router-dom';
import { demoOnly } from '../../mocks/demoOnly';
import { UserRole } from '../../api/types';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const CandidateDetails = () => {
  const { id } = useParams();
  const candidate = demoOnly.championDirectoryUsers.find((user) => user.id === id);
  if (!candidate) return <Card title="Candidate preview unavailable" actions={<StatusBadge status={UserRole.CANDIDATE}>Demo</StatusBadge>}><p className="text-xs text-slate-500">This demo-only candidate is not in the sample directory.</p></Card>;

  return (
    <div className="max-w-3xl space-y-6">
      <div><p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Candidate details <StatusBadge status={UserRole.CANDIDATE}>Demo</StatusBadge></p><h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">{candidate.fullName}</h2></div>
      {/* MOCK-ONLY: not in backend */}
      <Card title="Demo Candidate Profile" subtitle="Sample user fields only" actions={<StatusBadge status={candidate.defaultMode} />}>
        <dl className="grid gap-4 text-xs sm:grid-cols-2">
          <div><dt className="text-slate-400">Full name</dt><dd className="mt-1 font-bold text-[#1D2951]">{candidate.fullName}</dd></div>
          <div><dt className="text-slate-400">Email</dt><dd className="mt-1 font-bold text-[#1D2951]">{candidate.email}</dd></div>
          <div><dt className="text-slate-400">Role</dt><dd className="mt-1"><StatusBadge status={candidate.role} /></dd></div>
          <div><dt className="text-slate-400">Campus</dt><dd className="mt-1 font-bold text-[#1D2951]">{candidate.campusName || '—'}</dd></div>
          <div><dt className="text-slate-400">Default work mode</dt><dd className="mt-1"><StatusBadge status={candidate.defaultMode} /></dd></div>
          <div><dt className="text-slate-400">Account</dt><dd className="mt-1 font-bold text-[#1D2951]">{candidate.active ? 'Active' : 'Inactive'}</dd></div>
        </dl>
      </Card>
    </div>
  );
};

export default CandidateDetails;
