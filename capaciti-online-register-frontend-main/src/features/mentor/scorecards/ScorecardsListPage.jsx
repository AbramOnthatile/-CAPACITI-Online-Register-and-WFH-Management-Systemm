import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { useScorecards } from '../../../api/hooks/scorecards';
import { percentTone } from '../../../lib/scoring';
import NewScorecardSheet from './components/NewScorecardSheet';

const percentClasses = {
  success: 'bg-emerald-50 text-emerald-700',
  'light-success': 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-700',
  danger: 'bg-rose-50 text-rose-700',
};

const ScorecardsListPage = () => {
  const navigate = useNavigate();
  const { assessments, loading, error, createAssessment } = useScorecards();
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => assessments.filter((assessment) =>
    (typeFilter === 'ALL' || assessment.type === typeFilter)
    && (statusFilter === 'ALL' || assessment.status === statusFilter)
  ), [assessments, typeFilter, statusFilter]);

  const handleCreate = async (values) => {
    const created = await createAssessment(values);
    setSheetOpen(false);
    navigate(`/champion/scorecards/${encodeURIComponent(created.id)}`);
  };

  const filterButton = (label, selected, onClick) => (
    <button
      key={label}
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
        selected ? 'bg-[#1D2951] text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Mentor Workspace</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Candidate assessments</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Scorecards</h2>
        </div>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-[#6115D0] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#4F11AA]"
        >
          <Plus className="h-4 w-4" />
          New scorecard
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error.message}
        </p>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by assessment type">
          <span className="mr-1 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Type</span>
          {filterButton('All', typeFilter === 'ALL', () => setTypeFilter('ALL'))}
          {filterButton('Weekly', typeFilter === 'WEEKLY', () => setTypeFilter('WEEKLY'))}
          {filterButton('Project', typeFilter === 'PROJECT', () => setTypeFilter('PROJECT'))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter by assessment status">
          <span className="mr-1 px-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Status</span>
          {filterButton('All', statusFilter === 'ALL', () => setStatusFilter('ALL'))}
          {filterButton('Draft', statusFilter === 'DRAFT', () => setStatusFilter('DRAFT'))}
          {filterButton('Submitted', statusFilter === 'SUBMITTED', () => setStatusFilter('SUBMITTED'))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[740px] w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-4 py-3.5">Assessment date</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Group average</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500" role="status">Loading scorecards...</td></tr>
              )}
              {!loading && filtered.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-4 font-bold text-[#1D2951]">{assessment.title}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-mono text-slate-600">{assessment.assessmentDate}</td>
                  <td className="px-4 py-4 text-slate-600">{assessment.type === 'WEEKLY' ? 'Weekly' : 'Project'}</td>
                  <td className="px-4 py-4"><StatusBadge status={assessment.status} /></td>
                  <td className="px-4 py-4">
                    {assessment.groupAveragePercent === null
                      ? <span className="text-slate-400">—</span>
                      : <span className={`rounded-lg px-2.5 py-1 font-bold ${percentClasses[percentTone(assessment.groupAveragePercent)]}`}>{assessment.groupAveragePercent}%</span>}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link to={`/champion/scorecards/${encodeURIComponent(assessment.id)}`} className="font-bold text-[#6115D0] hover:underline">
                      {assessment.status === 'DRAFT' ? 'Continue' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No scorecards match these filters.</td></tr>
              )}
              {!loading && error && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">Scorecards could not be displayed.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {sheetOpen && <NewScorecardSheet onClose={() => setSheetOpen(false)} onCreate={handleCreate} />}
    </div>
  );
};

export default ScorecardsListPage;
