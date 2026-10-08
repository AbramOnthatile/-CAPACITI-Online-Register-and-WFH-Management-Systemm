import { Download } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { generateCSVReport } from '../../services/reportService';

const data = [
  { name: 'Mon', attendance: 18, wfh: 8 },
  { name: 'Tue', attendance: 20, wfh: 9 },
  { name: 'Wed', attendance: 17, wfh: 7 },
  { name: 'Thu', attendance: 22, wfh: 11 },
  { name: 'Fri', attendance: 19, wfh: 10 },
];

const ChampionReports = () => {
  const handleDownload = async () => {
    await generateCSVReport(data, 'capaciti-champion-report.csv');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Reports</p>
          <h2 className="text-3xl font-bold text-slate-900">Reporting Dashboard</h2>
        </div>
        <button className="btn btn-primary" onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download Report</button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-4"><p className="text-sm text-slate-500">Total Attendance Records</p><p className="mt-2 text-2xl font-bold">112</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Present</p><p className="mt-2 text-2xl font-bold text-emerald-600">92</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Late</p><p className="mt-2 text-2xl font-bold text-amber-600">14</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">WFH Requests</p><p className="mt-2 text-2xl font-bold text-blue-600">42</p></div>
      </div>

      <div className="card p-5">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid stroke="#e2e8f0" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="attendance" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
              <Bar dataKey="wfh" fill="#16a34a" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChampionReports;
