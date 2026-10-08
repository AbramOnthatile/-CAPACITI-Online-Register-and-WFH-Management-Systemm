import { useMemo } from 'react';
import { BarChart3, Users, Clock3, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { useApp } from '../../context/AppContext';

const attendanceData = [
  { name: 'Mon', present: 18, late: 3, absent: 2 },
  { name: 'Tue', present: 20, late: 4, absent: 1 },
  { name: 'Wed', present: 17, late: 5, absent: 2 },
  { name: 'Thu', present: 22, late: 1, absent: 1 },
  { name: 'Fri', present: 19, late: 2, absent: 3 },
];

const wfhData = [
  { name: 'Pending', value: 8 },
  { name: 'Approved', value: 12 },
  { name: 'Rejected', value: 3 },
];

const ChampionDashboard = () => {
  const { wfh, attendance, users } = useApp();

  const metrics = useMemo(() => {
    const candidates = users.filter((user) => user.role === 'candidate');
    const present = attendance.filter((record) => record.status === 'Present').length;
    const late = attendance.filter((record) => record.status === 'Late').length;
    const noClockIn = attendance.filter((record) => record.status === 'No Clock-In').length;
    const pendingWfh = wfh.filter((item) => item.status === 'Pending').length;
    const early = attendance.filter((record) => record.status === 'Early Checkout').length;
    return { candidates: candidates.length, present, late, noClockIn, pendingWfh, early };
  }, [attendance, users, wfh]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Overview</p>
        <h2 className="text-3xl font-bold text-slate-900">Tech Champion Dashboard</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Candidates" value={metrics.candidates} tone="primary" icon={Users} />
        <StatCard title="Present" value={metrics.present} tone="success" icon={CheckCircle2} />
        <StatCard title="Late" value={metrics.late} tone="warning" icon={Clock3} />
        <StatCard title="No Clock-In" value={metrics.noClockIn} tone="danger" icon={AlertTriangle} />
        <StatCard title="Pending WFH" value={metrics.pendingWfh} tone="warning" icon={TrendingUp} />
        <StatCard title="Early Check-Out" value={metrics.early} tone="danger" icon={BarChart3} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Attendance overview">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceData}>
                <defs>
                  <linearGradient id="presentColor" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="present" stroke="#1d4ed8" fill="url(#presentColor)" />
                <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="#fef3c7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="WFH request status">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wfhData}>
                <CartesianGrid stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
        <Card title="Today's Attendance">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Check In</th>
                  <th className="pb-3">Break</th>
                  <th className="pb-3">Check Out</th>
                  <th className="pb-3">Hours</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.filter((user) => user.role === 'candidate').slice(0, 5).map((candidate) => (
                  <tr key={candidate.id} className="border-t border-slate-200 text-slate-700">
                    <td className="py-3">{candidate.fullName}</td>
                    <td className="py-3"><StatusBadge status="Present" /></td>
                    <td className="py-3">08:57</td>
                    <td className="py-3">10:30-10:45</td>
                    <td className="py-3">16:00</td>
                    <td className="py-3">7h 05m</td>
                    <td className="py-3"><button className="btn btn-secondary px-2 py-1 text-xs">View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Attendance Exceptions">
          <div className="space-y-3">
            {['Late Check-In', 'No Clock-In', 'Early Check-Out', 'Excessive Break'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{item}</span>
                  <StatusBadge status={item === 'No Clock-In' ? 'No Clock-In' : item === 'Early Check-Out' ? 'Early Checkout' : 'Late'} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChampionDashboard;
