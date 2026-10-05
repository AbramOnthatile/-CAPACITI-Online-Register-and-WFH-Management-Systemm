import { Link, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';

const CandidateDetails = () => {
  const { id } = useParams();
  const { users, attendance, wfh, progress } = useApp();
  const candidate = users.find((user) => user.id === id && user.role === 'candidate');

  if (!candidate) {
    return <div className="card p-8 text-center text-slate-500">Candidate not found.</div>;
  }

  const attendanceSummary = attendance.filter((record) => record.candidateId === candidate.id);
  const totalWfh = wfh.filter((item) => item.candidateId === candidate.id).length;
  const totalProgress = progress.filter((item) => item.candidateId === candidate.id).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Candidate</p>
          <h2 className="text-3xl font-bold text-slate-900">{candidate.fullName}</h2>
        </div>
        <Link to="/champion/candidates" className="btn btn-secondary">Back to list</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold">{candidate.avatar}</div>
            <div>
              <p className="text-lg font-semibold text-slate-900">{candidate.fullName}</p>
              <p className="text-sm text-slate-500">{candidate.email}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 text-sm text-slate-600">
            <div className="flex justify-between"><span>Cohort</span><span className="font-medium text-slate-800">{candidate.cohort}</span></div>
            <div className="flex justify-between"><span>Programme</span><span className="font-medium text-slate-800">{candidate.programme}</span></div>
            <div className="flex justify-between"><span>Status</span><StatusBadge status={candidate.status} /></div>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Attendance summary</p>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Attendance %</p><p className="mt-2 text-2xl font-bold text-slate-900">92%</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Late days</p><p className="mt-2 text-2xl font-bold text-slate-900">2</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Partial days</p><p className="mt-2 text-2xl font-bold text-slate-900">1</p></div>
            <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">WFH days</p><p className="mt-2 text-2xl font-bold text-slate-900">{totalWfh}</p></div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Attendance overview</h3>
          <button className="btn btn-secondary">View Full History</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-3">Date</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Check In</th>
                <th className="pb-3">Break</th>
                <th className="pb-3">Check Out</th>
                <th className="pb-3">Hours</th>
              </tr>
            </thead>
            <tbody>
              {attendanceSummary.slice(0, 5).map((record) => (
                <tr key={record.id} className="border-t border-slate-200 text-slate-700">
                  <td className="py-3">{record.date}</td>
                  <td className="py-3"><StatusBadge status={record.status} /></td>
                  <td className="py-3">{record.checkIn}</td>
                  <td className="py-3">{record.teaBreak}</td>
                  <td className="py-3">{record.checkOut}</td>
                  <td className="py-3">{record.totalHours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-xl font-bold text-slate-900">Progress</h3>
          <div className="mt-4 space-y-3">
            {progress.filter((item) => item.candidateId === candidate.id).slice(0, 2).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-800">{entry.date}</p>
                <p className="mt-2 text-sm text-slate-600">{entry.completedWork}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-xl font-bold text-slate-900">WFH</h3>
          <div className="mt-4 space-y-3">
            {wfh.filter((item) => item.candidateId === candidate.id).slice(0, 2).map((entry) => (
              <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{entry.reason}</span>
                  <StatusBadge status={entry.status} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{entry.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetails;
