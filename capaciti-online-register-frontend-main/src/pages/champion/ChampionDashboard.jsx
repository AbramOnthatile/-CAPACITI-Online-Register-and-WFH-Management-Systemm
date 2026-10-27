import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock3, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight, Check, X } from 'lucide-react';
import { ArrivalStatus, TicketStatus, WfhStatus } from '../../api/types';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { getStatusMetadata } from '../../lib/status';
import { Skeleton } from '../../components/common/RequestState';
import { canRetryError, getUserErrorMessage } from '../../api/client';
import { formatSastDate } from '../../lib/time';

const ChampionDashboard = () => {
  const { wfh, attendance, attendanceLoading, attendanceError, tickets, ticketsError, dashboard, dashboardLoading, dashboardError, wfhError, updateWFHRequest, refreshAttendance, refreshWfh, refreshTickets, refreshDashboard } = useApp();
  const retryableError = [attendanceError, wfhError, ticketsError, dashboardError].find(canRetryError);
  const [decisionError, setDecisionError] = useState('');
  const [decidingId, setDecidingId] = useState('');
  const decidingIds = useRef(new Set());
  const [retryDecision, setRetryDecision] = useState(null);
  const present = dashboard?.clockedIn ?? attendance.filter((record) => Boolean(record.clockInAt)).length;
  const late = dashboard?.late ?? attendance.filter((record) => record.arrivalStatus === ArrivalStatus.LATE_UNEXCUSED || record.arrivalStatus === ArrivalStatus.LATE_EXCUSED).length;
  const pendingWfh = wfh.filter((request) => request.status === WfhStatus.PENDING);
  const openTickets = tickets.filter((ticket) => ticket.status === TicketStatus.OPEN);
  const punctualityRate = dashboard?.clockedIn
    ? Math.round((dashboard.onTime / dashboard.clockedIn) * 100)
    : attendance.length ? Math.round(((attendance.length - late) / attendance.length) * 100) : 0;

  const decideWfh = async (id, status) => {
    if (decidingIds.current.has(id)) return;
    setDecisionError('');
    const reviewComment = status === WfhStatus.REJECTED
      ? window.prompt('Enter a required comment for rejecting this request.')?.trim()
      : 'Approved for WFH.';
    if (!reviewComment) {
      if (status === WfhStatus.REJECTED) setDecisionError('A comment is required when rejecting a WFH request.');
      return;
    }
    decidingIds.current.add(id);
    setDecidingId(id);
    try {
      await updateWFHRequest(id, { status, reviewComment });
      setRetryDecision(null);
    } catch (error) {
      setDecisionError(getUserErrorMessage(error, 'The WFH decision could not be saved.'));
      setRetryDecision({ id, status, reviewComment, error });
    } finally {
      decidingIds.current.delete(id);
      setDecidingId('');
    }
  };

  const retryWfhDecision = async () => {
    if (!retryDecision || decidingIds.current.has(retryDecision.id)) return;
    decidingIds.current.add(retryDecision.id);
    setDecidingId(retryDecision.id);
    try {
      await updateWFHRequest(retryDecision.id, {
        status: retryDecision.status,
        reviewComment: retryDecision.reviewComment,
      });
      setRetryDecision(null);
      setDecisionError('');
    } catch (error) {
      setRetryDecision({ ...retryDecision, error });
      setDecisionError(getUserErrorMessage(error, 'The WFH decision could not be saved.'));
    } finally {
      decidingIds.current.delete(retryDecision.id);
      setDecidingId('');
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Operational overview"
        title="Tech Champion Command"
        description="Attendance records, WFH approvals, and candidate support tickets."
        actions={<Link to="/champion/attendance" className="btn btn-dark"><Clock3 className="h-4 w-4" />Open live monitor</Link>}
      />

      <Alert>{decisionError || attendanceError?.message || wfhError?.message || ticketsError?.message || dashboardError?.message}</Alert>
      {retryableError && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void Promise.all([refreshAttendance(), refreshWfh(), refreshTickets(), refreshDashboard()])}>Retry</button>}
      {retryDecision && canRetryError(retryDecision.error) && <button type="button" className="btn btn-secondary btn-sm" disabled={Boolean(decidingId)} onClick={() => void retryWfhDecision()}>Retry decision</button>}
      {dashboardLoading && <Skeleton label="Loading champion dashboard" />}
      {dashboard === null && !dashboardLoading && <Alert tone="info">Dashboard summary is unavailable; the records below show the available operational data.</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Attendance records" value={dashboard?.expectedCandidates ?? attendance.length} detail={attendanceLoading ? 'Loading records' : `${present} clocked in`} tone="slate" icon={Users} />
        <StatCard title="Punctuality" value={`${punctualityRate}%`} detail={`${late} late arrivals`} tone="success" icon={CheckCircle2} />
        <StatCard title="Pending WFH" value={dashboard?.pendingWfhRequests ?? pendingWfh.length} detail="Review queue" tone="primary" icon={TrendingUp} />
        <StatCard title="Open tickets" value={dashboard?.openTickets ?? openTickets.length} detail="Candidate support" tone="warning" icon={AlertTriangle} />
      </div>

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="lg:col-span-7">
          <Card title="Pending WFH requests" subtitle="Review applications and record a decision" actions={<Link to="/champion/wfh" className="link text-xs">View queue <ArrowRight className="h-3.5 w-3.5" /></Link>}>
            {pendingWfh.length ? (
              <ul className="list">
                {pendingWfh.slice(0, 5).map((request) => (
                  <li key={request.id} className="rounded-xl border border-slate-100 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-navy">{request.userName}</p>
                        <p className="mt-0.5 font-mono text-xs text-slate-400">{formatSastDate(request.startDate)} – {formatSastDate(request.endDate)}</p>
                      </div>
                      <StatusBadge status={request.status} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{request.reason}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                      <button type="button" disabled={decidingId === request.id} onClick={() => void decideWfh(request.id, WfhStatus.REJECTED)} className="btn btn-danger btn-sm"><X className="h-3.5 w-3.5" />Reject</button>
                      <button type="button" disabled={decidingId === request.id} onClick={() => void decideWfh(request.id, WfhStatus.APPROVED)} className="btn btn-primary btn-sm"><Check className="h-3.5 w-3.5" />Approve</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={CheckCircle2} title="Queue is clear" description="No pending WFH applications." />}
          </Card>
        </div>
        <div className="space-y-5 lg:col-span-5 lg:space-y-6">
          <Card title="Recent attendance" actions={<Link to="/champion/attendance" className="link text-xs">Monitor <ArrowRight className="h-3.5 w-3.5" /></Link>}>
            {attendance.length ? (
              <ul className="list">
                {attendance.slice(0, 5).map((record) => (
                  <li key={record.id} className="list-row">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-navy">{record.userName}</p>
                      <p className="mt-0.5 font-mono text-xs text-slate-400">{formatSastDate(record.attendanceDate)}</p>
                    </div>
                    <StatusBadge status={record.arrivalStatus} />
                  </li>
                ))}
              </ul>
            ) : !attendanceLoading && <EmptyState icon={Clock3} description="No attendance records." />}
          </Card>
          <Card title="Open support tickets" actions={<Link to="/champion/reports" className="link text-xs">Reports <ArrowRight className="h-3.5 w-3.5" /></Link>}>
            {openTickets.length ? (
              <ul className="list">
                {openTickets.slice(0, 4).map((ticket) => (
                  <li key={ticket.id} className="rounded-xl border border-slate-100 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold text-navy">{ticket.title}</p>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{ticket.userName} · {getStatusMetadata(ticket.type).label}</p>
                  </li>
                ))}
              </ul>
            ) : <EmptyState icon={AlertTriangle} description="No open tickets." />}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ChampionDashboard;
