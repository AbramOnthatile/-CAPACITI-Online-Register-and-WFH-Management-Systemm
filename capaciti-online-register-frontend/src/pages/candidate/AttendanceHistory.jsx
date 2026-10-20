import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import { attendanceRecords } from '../../data/mockAttendance';
import { printReport } from '../../services/reportService';

const AttendanceHistory = () => {
  const [statusFilter, setStatusFilter] = useState('All');

  const filtered = useMemo(() => {
    if (statusFilter === 'All') return attendanceRecords;
    return attendanceRecords.filter((entry) => entry.status === statusFilter);
  }, [statusFilter]);

  const handleExport = () => printReport({
    title: 'Attendance History',
    subtitle: `CAPACITI | ${statusFilter === 'All' ? 'All attendance records' : `${statusFilter} records`}`,
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'status', label: 'Status' },
      { key: 'checkIn', label: 'Check In' },
      { key: 'teaBreak', label: 'Tea Break' },
      { key: 'lunch', label: 'Lunch' },
      { key: 'checkOut', label: 'Check Out' },
      { key: 'totalHours', label: 'Total Hours' },
    ],
    rows: filtered,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">History</p>
          <h2 className="text-3xl font-bold text-slate-900">Attendance History</h2>
        </div>
        <button className="btn btn-secondary" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Export Report</button>
      </div>

      <Card title="Filters" className="overflow-hidden">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm text-slate-600">Date</label>
            <input type="date" className="input" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-600">Date range</label>
            <input type="text" className="input" placeholder="2026-09-01 to 2026-09-30" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-600">Status</label>
            <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Partial">Partial</option>
              <option value="Absent">Absent</option>
              <option value="Early Checkout">Early Checkout</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50 text-sm text-slate-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Check In</th>
                <th className="px-4 py-3">Tea Break</th>
                <th className="px-4 py-3">Lunch</th>
                <th className="px-4 py-3">Check Out</th>
                <th className="px-4 py-3">Total Hours</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-200 text-sm text-slate-700">
                  <td className="px-4 py-3">{entry.date}</td>
                  <td className="px-4 py-3"><StatusBadge status={entry.status} /></td>
                  <td className="px-4 py-3">{entry.checkIn}</td>
                  <td className="px-4 py-3">{entry.teaBreak}</td>
                  <td className="px-4 py-3">{entry.lunch}</td>
                  <td className="px-4 py-3">{entry.checkOut}</td>
                  <td className="px-4 py-3">{entry.totalHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistory;
