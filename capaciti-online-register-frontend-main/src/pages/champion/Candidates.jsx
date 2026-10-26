import { Users, ChevronRight } from 'lucide-react';
import { demoOnly } from '../../mocks/demoOnly';
import { UserRole } from '../../api/types';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const Candidates = () => (
  <div className="space-y-6">
    <div>
      <div className="flex items-center gap-2"><span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Candidate Directory</span><span className="text-slate-300">·</span><span className="text-xs text-slate-500">Sample preview</span></div>
      <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Candidates</h2>
    </div>

    {/* MOCK-ONLY: not in backend */}
    <Card title="Candidate Directory Preview" subtitle="Sample user records; this directory is not connected to the backend" actions={<StatusBadge status={UserRole.CANDIDATE}>Demo</StatusBadge>}>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <table className="min-w-full text-left text-xs">
          <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Candidate</th><th className="px-4 py-3">Campus</th><th className="px-4 py-3">Default Mode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Details</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {demoOnly.championDirectoryUsers.map((candidate) => (
              <tr key={candidate.id} title={demoOnly.notice}>
                <td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D2951] text-[10px] font-bold text-white">{candidate.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</span><div><p className="font-bold text-[#1D2951]">{candidate.fullName}</p><p className="font-mono text-[10px] text-slate-400">{candidate.email}</p></div></div></td>
                <td className="px-4 py-3 text-slate-600">{candidate.campusName || '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={candidate.defaultMode} /></td>
                <td className="px-4 py-3"><span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-700">{candidate.active ? 'Active' : 'Inactive'}</span></td>
                {/* MOCK-ONLY: not in backend */}
                <td className="px-4 py-3 text-right"><button type="button" disabled aria-disabled="true" title={demoOnly.notice} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-500 opacity-60"><Users className="h-3 w-3" /> Details <ChevronRight className="h-3 w-3" /><StatusBadge status={UserRole.CANDIDATE}>Demo</StatusBadge></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  </div>
);

export default Candidates;
