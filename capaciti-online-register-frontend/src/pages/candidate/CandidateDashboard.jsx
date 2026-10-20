import { useMemo } from 'react';
import { Clock3, Coffee, UtensilsCrossed, CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import NotificationList from '../../components/common/NotificationList';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const { attendanceState, notificationList, wfh } = useApp();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const today = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todayWfh = wfh.filter((item) => item.candidateId === user.id).slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Dashboard</p>
          <h2 className="text-3xl font-bold text-slate-900">{greeting}, {user?.fullName?.split(' ')[0] || 'Candidate'}</h2>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600">{today}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Attendance Status" value={attendanceState.currentStatus || 'Not Checked In'} detail="Daily attendance" tone="primary" icon={Clock3} />
        <StatCard title="Working Time" value="7h 05m" detail="This week" tone="success" icon={CheckCircle2} />
        <StatCard title="WFH Status" value={`${wfh.filter((item) => item.candidateId === user.id && item.status === 'Approved').length}`} detail="Approved requests" tone="warning" icon={CalendarDays} />
        <StatCard title="Progress Status" value="Submitted" detail="Latest update recorded" tone="slate" icon={AlertCircle} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Current Attendance" subtitle="Workday 09:00 – 16:00">
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-sm text-slate-500">Current status</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{attendanceState.currentStatus}</p>
              </div>
              <StatusBadge status={attendanceState.currentStatus} />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <button className="btn btn-primary">Clock In</button>
              <button className="btn btn-secondary">Start Break</button>
              <button className="btn btn-secondary">New WFH Request</button>
            </div>

            <div className="space-y-3">
              {[
                ['Clock In', attendanceState.checkInTime || 'Pending'],
                ['Tea Break', attendanceState.teaBreakStart ? `${attendanceState.teaBreakStart} — ${attendanceState.teaBreakEnd || 'Running'}` : 'Pending'],
                ['Lunch', attendanceState.lunchStart ? `${attendanceState.lunchStart} — ${attendanceState.lunchEnd || 'Running'}` : 'Pending'],
                ['Clock Out', attendanceState.checkOutTime || 'Pending'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {label === 'Tea Break' ? <Coffee className="h-4 w-4" /> : label === 'Lunch' ? <UtensilsCrossed className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    <span>{label}</span>
                  </div>
                  <span className="font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Recent WFH Requests" subtitle="Latest updates">
          <div className="space-y-3">
            {todayWfh.length ? todayWfh.map((request) => (
              <div key={request.id} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{request.reason}</p>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{request.date}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No WFH requests yet.</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title="Notifications" subtitle="Most recent">
          <NotificationList notifications={notificationList.slice(0, 3)} compact />
        </Card>

        <Card title="Attendance Timeline">
          <div className="space-y-4">
            {[
              { label: 'Clock In', time: '08:57', complete: true },
              { label: 'Tea Break', time: '10:30–10:45', complete: true },
              { label: 'Lunch', time: '12:00–13:00', complete: true },
              { label: 'Clock Out', time: 'Pending', complete: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${item.complete ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {item.complete ? <CheckCircle2 className="h-3 w-3 text-white" /> : <span className="h-2 w-2 rounded-full bg-slate-400" />}
                </span>
                <span className="w-20 text-sm text-slate-600">{item.label}</span>
                <span className="text-sm font-medium text-slate-800">{item.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CandidateDashboard;
