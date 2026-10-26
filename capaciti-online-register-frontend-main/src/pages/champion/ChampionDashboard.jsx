import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock3, AlertTriangle, CheckCircle2, TrendingUp, ArrowRight } from 'lucide-react';
import { ArrivalStatus, TicketStatus, WfhStatus } from '../../api/types';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { getStatusMetadata } from '../../lib/status';

const ChampionDashboard = () => {
  const { wfh, attendance, attendanceLoading, attendanceError, tickets, ticketsError, dashboard, dashboardLoading, dashboardError, wfhError, updateWFHRequest } = useApp();
  const [decisionError, setDecisionError] = useState('');
  const present = attendance.filter((record) => Boolean(record.clockInAt)).length;
  const late = attendance.filter((record) => record.arrivalStatus === ArrivalStatus.LATE_UNEXCUSED || record.arrivalStatus === ArrivalStatus.LATE_EXCUSED).length;
  const pendingWfh = wfh.filter((request) => request.status === WfhStatus.PENDING);
  const openTickets = tickets.filter((ticket) => ticket.status === TicketStatus.OPEN);
  const punctualityRate = attendance.length ? Math.round(((attendance.length - late) / attendance.length) * 100) : 0;

  const decideWfh = async (id, status) => {
    setDecisionError('');
    try {
      await updateWFHRequest(id, { status, reviewComment: status === WfhStatus.APPROVED ? 'Approved for WFH.' : 'On-site attendance required.' });
    } catch (error) {
      setDecisionError(error instanceof Error ? error.message : 'The WFH decision could not be saved.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Tech Champion</span><span className="text-slate-300">·</span><span className="text-xs font-medium text-slate-500">Operational overview</span></div>
          <h2 className="mt-1 text-2xl font-black text-[#1D2951] sm:text-3xl">Tech Champion Command</h2>
          <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">Attendance records, WFH approvals, and candidate support tickets.</p>
        </div>
        <Link to="/champion/attendance" className="flex items-center gap-2 self-start rounded-xl bg-[#1D2951] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#0F172A]"><Clock3 className="h-4 w-4" /><span>Open Live Monitor</span></Link>
      </div>

      {(attendanceError || wfhError || ticketsError || dashboardError || decisionError) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{decisionError || attendanceError?.message || wfhError?.message || ticketsError?.message || dashboardError?.message}</p>}
      {dashboardLoading && <p className="text-xs text-slate-500">Loading champion dashboard data...</p>}
      {dashboard === null && !dashboardLoading && <p className="text-xs text-slate-500">Dashboard summary is unavailable; the records below show the available operational data.</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Attendance Records" value={attendance.length} detail={attendanceLoading ? 'Loading records' : `${present} clocked in`} tone="slate" icon={Users} />
        <StatCard title="Punctuality" value={`${punctualityRate}%`} detail={`${late} late arrivals`} tone="success" icon={CheckCircle2} />
        <StatCard title="Pending WFH" value={pendingWfh.length} detail="Review queue" tone="primary" icon={TrendingUp} />
        <StatCard title="Open Tickets" value={openTickets.length} detail="Candidate support" tone="warning" icon={AlertTriangle} />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card title="Pending WFH Requests" subtitle="Review applications and record a decision" actions={<Link to="/champion/wfh" className="text-xs font-bold text-[#6115D0] hover:underline">View queue →</Link>}>
            <div className="space-y-3">
              {pendingWfh.slice(0, 5).map((request) => (
                <div key={request.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-[#1D2951]">{request.userName}</p><StatusBadge status={request.status} /></div>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{request.startDate} – {request.endDate}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{request.reason}</p>
                  <div className="mt-3 flex justify-end gap-2">
                    <button type="button" onClick={() => void decideWfh(request.id, WfhStatus.REJECTED)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50">Reject</button>
                    <button type="button" onClick={() => void decideWfh(request.id, WfhStatus.APPROVED)} className="rounded-lg bg-[#6115D0] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#4F11AA]">Approve</button>
                  </div>
                </div>
              ))}
              {!pendingWfh.length && <p className="py-2 text-xs text-slate-400">No pending WFH applications.</p>}
            </div>
          </Card>
        </div>
        <div className="space-y-6 lg:col-span-5">
          <Card title="Recent Attendance" subtitle="Backend attendance records" actions={<Link to="/champion/attendance" className="text-xs font-bold text-[#6115D0] hover:underline">Monitor →</Link>}>
            <div className="space-y-3">
              {attendance.slice(0, 5).map((record) => <div key={record.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3"><div><p className="text-xs font-bold text-[#1D2951]">{record.userName}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{record.attendanceDate}</p></div><StatusBadge status={record.arrivalStatus} /></div>)}
              {!attendance.length && !attendanceLoading && <p className="py-2 text-xs text-slate-400">No attendance records.</p>}
            </div>
          </Card>
          <Card title="Open Support Tickets" subtitle="Candidate support requests" actions={<Link to="/champion/reports" className="text-xs font-bold text-[#6115D0] hover:underline">Reports →</Link>}>
            <div className="space-y-3">
              {openTickets.slice(0, 4).map((ticket) => <div key={ticket.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3"><div className="flex items-center justify-between gap-2"><p className="text-xs font-bold text-[#1D2951]">{ticket.title}</p><StatusBadge status={ticket.status} /></div><p className="mt-1 text-[11px] text-slate-500">{ticket.userName} · {getStatusMetadata(ticket.type).label}</p></div>)}
              {!openTickets.length && <p className="py-2 text-xs text-slate-400">No open tickets.</p>}
            </div>
          </Card>
          <Link to="/champion/reports" className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-[#1D2951] hover:border-[#6115D0] hover:text-[#6115D0]"><span>View attendance and WFH reports</span><ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  );
};

export default ChampionDashboard;
