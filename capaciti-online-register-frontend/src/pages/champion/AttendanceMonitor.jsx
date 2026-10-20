import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import { printReport } from '../../services/reportService';

const AttendanceMonitor = () => {
  const { attendance, users } = useApp();
  const [status, setStatus] = useState('All');

  const rows = attendance.filter((record) => status === 'All' || record.status === status);
  const reportRows = rows.map((record) => ({
    candidate: users.find((item) => item.id === record.candidateId)?.fullName || 'Unknown candidate',
    date: record.date,
    status: record.status,
    checkIn: record.checkIn,
    teaBreak: record.teaBreak,
    lunch: record.lunch,
    checkOut: record.checkOut,
  }));

  const handleExport = () => printReport({
    title: 'Attendance Monitor',
    subtitle: `CAPACITI | ${status === 'All' ? 'All attendance records' : `${status} records`}`,
    columns: [
      { key: 'candidate', label: 'Candidate' },
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'checkIn', label: 'Check In' },
      { key: 'teaBreak', label: 'Tea Break' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'checkOut', label: 'Check Out' },
    ],
    rows: reportRows,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Monitor</p>
          <h2 className="text-3xl font-bold text-slate-900">Attendance Monitor</h2>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export Report</button>
      </div>

      <div className="card p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <input type="date" className="input" />
          <select className="input">
            <option>Candidate</option>
          </select>
          <select className="input">
            <option>Cohort</option>
          </select>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="No Clock-In">No Clock-In</option>
            <option value="Early Checkout">Early Checkout</option>
            <option value="Checked Out">Checked Out</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">Tea Break</th>
                <th className="px-4 py-3">Lunch</th>
                <th className="px-4 py-3">Check Out</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => {
                const user = users.find((item) => item.id === record.candidateId);
                return (
                  <tr key={record.id} className="border-t border-slate-200 text-slate-700">
                    <td className="px-4 py-3">{user?.fullName}</td>
                    <td className="px-4 py-3">{record.date}</td>
                    <td className="px-4 py-3"><StatusBadge status={record.status} /></td>
                    <td className="px-4 py-3">{record.checkIn}</td>
                    <td className="px-4 py-3">{record.teaBreak}</td>
                    <td className="px-4 py-3">{record.lunch}</td>
                    <td className="px-4 py-3">{record.checkOut}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMonitor;
