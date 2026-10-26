import { Link, useParams } from 'react-router-dom';
import { UserX } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge, { ActiveBadge } from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import { getStatusMetadata } from '../../lib/status';

const CandidateDetails = () => {
  const { id } = useParams();
  const { users, usersLoading, usersError } = useApp();
  const candidate = users.find((user) => user.id === id);
  if (usersLoading) return <p role="status" className="meta">Loading candidate details...</p>;
  if (usersError) return <div className="page-narrow"><Alert>{usersError.message}</Alert></div>;
  if (!candidate) {
    return (
      <div className="page-narrow">
        <EmptyState icon={UserX} title="Candidate not found" description="This candidate is no longer in the directory." action={<Link to="/champion/candidates" className="btn btn-secondary btn-sm">Back to candidates</Link>} />
      </div>
    );
  }

  return (
    <div className="page-narrow">
      <PageHeader backTo="/champion/candidates" backLabel="Back to candidates" eyebrow="Candidate details" title={candidate.fullName} />

      <section className="surface surface-pad flex items-center gap-4">
        <Avatar name={candidate.fullName} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-extrabold text-navy">{candidate.fullName}</p>
          <p className="truncate text-sm text-slate-500">{candidate.email}</p>
          <div className="mt-1.5"><ActiveBadge active={candidate.active} /></div>
        </div>
      </section>

      <Card title="Profile">
        <dl className="detail-list">
          <div className="detail-row"><dt>Full name</dt><dd>{candidate.fullName}</dd></div>
          <div className="detail-row"><dt>Email</dt><dd className="break-all">{candidate.email}</dd></div>
          <div className="detail-row"><dt>Role</dt><dd>{getStatusMetadata(candidate.role).label}</dd></div>
          <div className="detail-row"><dt>Campus</dt><dd>{candidate.campusName || '—'}</dd></div>
          <div className="detail-row"><dt>Default work mode</dt><dd><StatusBadge status={candidate.defaultMode} /></dd></div>
        </dl>
      </Card>
    </div>
  );
};

export default CandidateDetails;
