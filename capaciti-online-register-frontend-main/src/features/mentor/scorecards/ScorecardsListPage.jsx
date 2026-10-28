import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { useScorecards } from '../../../api/hooks/scorecards';
import { percentTone } from '../../../lib/scoring';
import NewScorecardSheet from './components/NewScorecardSheet';
import PageHeader from '../../../components/common/PageHeader';
import Alert from '../../../components/common/Alert';
import { Skeleton } from '../../../components/common/RequestState';
import { canRetryError } from '../../../api/client';
import { formatSastDate } from '../../../lib/time';

const percentClasses = {
  success: 'bg-emerald-50 text-emerald-700',
  'light-success': 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-700',
  danger: 'bg-rose-50 text-rose-700',
};

const ScorecardsListPage = () => {
  const navigate = useNavigate();
  const { assessments, loading, error, createAssessment, refresh } = useScorecards();
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
      className="chip"
    >
      {label}
    </button>
  );

  return (
    <div className="page">
      <PageHeader
        eyebrow="Mentor workspace"
        title="Scorecards"
        description="Candidate assessments"
        actions={<button type="button" onClick={() => setSheetOpen(true)} className="btn btn-primary"><Plus className="h-4 w-4" />New scorecard</button>}
      />

      <Alert>{error?.message}</Alert>
      {canRetryError(error) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refresh()}>Retry</button>}

      <div className="surface surface-pad space-y-3">
        <div className="chip-row items-center" role="group" aria-label="Filter by assessment type">
          <span className="label-caps w-14 shrink-0">Type</span>
          {filterButton('All', typeFilter === 'ALL', () => setTypeFilter('ALL'))}
          {filterButton('Weekly', typeFilter === 'WEEKLY', () => setTypeFilter('WEEKLY'))}
          {filterButton('Project', typeFilter === 'PROJECT', () => setTypeFilter('PROJECT'))}
        </div>
        <div className="chip-row items-center" role="group" aria-label="Filter by assessment status">
          <span className="label-caps w-14 shrink-0">Status</span>
          {filterButton('All', statusFilter === 'ALL', () => setStatusFilter('ALL'))}
          {filterButton('Draft', statusFilter === 'DRAFT', () => setStatusFilter('DRAFT'))}
          {filterButton('Submitted', statusFilter === 'SUBMITTED', () => setStatusFilter('SUBMITTED'))}
        </div>
      </div>

      {loading ? <Skeleton label="Loading scorecards" /> : <div className="surface overflow-hidden">
        <div className="table-wrap">
          <table className="table min-w-[640px]">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assessment date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Group average</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((assessment) => (
                <tr key={assessment.id}>
                  <td className="font-bold text-navy">{assessment.title}</td>
                  <td className="whitespace-nowrap font-mono text-slate-600">{formatSastDate(assessment.assessmentDate)}</td>
                  <td className="text-slate-600">{assessment.type === 'WEEKLY' ? 'Weekly' : 'Project'}</td>
                  <td><StatusBadge status={assessment.status} /></td>
                  <td>
                    {assessment.groupAveragePercent === null
                      ? <span className="text-slate-400">—</span>
                      : <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold ${percentClasses[percentTone(assessment.groupAveragePercent)]}`}>{assessment.groupAveragePercent}%</span>}
                  </td>
                  <td className="text-right">
                    <Link to={`/champion/scorecards/${encodeURIComponent(assessment.id)}`} className="btn btn-secondary btn-sm">
                      {assessment.status === 'DRAFT' ? 'Continue' : 'View'}
                    </Link>
                  </td>
                </tr>
              ))}
              {!error && filtered.length === 0 && (
                <tr><td colSpan={6} className="table-empty">No scorecards match these filters.</td></tr>
              )}
              {error && filtered.length === 0 && (
                <tr><td colSpan={6} className="table-empty">Scorecards could not be displayed.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>}

      {sheetOpen && <NewScorecardSheet onClose={() => setSheetOpen(false)} onCreate={handleCreate} />}
    </div>
  );
};

export default ScorecardsListPage;
