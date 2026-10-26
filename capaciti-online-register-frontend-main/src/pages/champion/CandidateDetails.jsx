import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const CandidateDetails = () => {
  const { id } = useParams();
  const { users, usersLoading, usersError } = useApp();
  const candidate = users.find((user) => user.id === id);
  if (usersLoading) return <p role="status" className="text-xs text-slate-500">Loading candidate details...</p>;
  if (usersError) return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{usersError.message}</p>;
  if (!candidate) return <Card title="Candidate not found"><p className="text-xs text-slate-500">This candidate is no longer in the directory.</p><Link to="/champion/candidates" className="mt-3 inline-block text-xs font-bold text-[#6115D0]">Back to Candidates</Link></Card>;

  return (
    <div className="max-w-3xl space-y-6">
      <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Candidate details</p><h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">{candidate.fullName}</h2></div>
      <Card title="Candidate Profile" subtitle={candidate.email} actions={<span className={`rounded-md border px-2 py-1 text-[10px] font-semibold ${candidate.active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'}`}>{candidate.active ? 'Active' : 'Inactive'}</span>}>
        <dl className="grid gap-4 text-xs sm:grid-cols-2">
          <div><dt className="text-slate-400">Full name</dt><dd className="mt-1 font-bold text-[#1D2951]">{candidate.fullName}</dd></div>
          <div><dt className="text-slate-400">Email</dt><dd className="mt-1 font-bold text-[#1D2951]">{candidate.email}</dd></div>
          <div><dt className="text-slate-400">Role</dt><dd className="mt-1">{candidate.role}</dd></div>
          <div><dt className="text-slate-400">Campus</dt><dd className="mt-1 font-bold text-[#1D2951]">{candidate.campusName || '—'}</dd></div>
          <div><dt className="text-slate-400">Default work mode</dt><dd className="mt-1"><StatusBadge status={candidate.defaultMode} /></dd></div>
          <div><dt className="text-slate-400">Account</dt><dd className="mt-1 font-bold text-[#1D2951]">{candidate.active ? 'Active' : 'Inactive'}</dd></div>
        </dl>
      </Card>
      <Link to="/champion/candidates" className="inline-block text-xs font-bold text-[#6115D0] hover:underline">Back to Candidates</Link>
    </div>
  );
};

export default CandidateDetails;
