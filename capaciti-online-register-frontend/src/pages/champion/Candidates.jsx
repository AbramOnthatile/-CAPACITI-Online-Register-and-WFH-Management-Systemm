import { useState } from 'react';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';

const Candidates = () => {
  const { users } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cohortFilter, setCohortFilter] = useState('All');

  const candidates = users.filter((user) => user.role === 'candidate').filter((person) => {
    const matchesSearch = person.fullName.toLowerCase().includes(search.toLowerCase()) || person.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || person.status === statusFilter;
    const matchesCohort = cohortFilter === 'All' || person.cohort === cohortFilter;
    return matchesSearch && matchesStatus && matchesCohort;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Candidates</p>
        <h2 className="text-3xl font-bold text-slate-900">Candidate Directory</h2>
      </div>

      <div className="card p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search candidates" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All status</option>
            <option value="Active">Active</option>
            <option value="Away">Away</option>
          </select>
          <select className="input" value={cohortFilter} onChange={(e) => setCohortFilter(e.target.value)}>
            <option value="All">All cohorts</option>
            <option value="Cohort 8">Cohort 8</option>
            <option value="Cohort 9">Cohort 9</option>
            <option value="Cohort 10">Cohort 10</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Cohort</th>
                <th className="px-4 py-3">Today's Status</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3">WFH</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="border-t border-slate-200 text-slate-700">
                  <td className="px-4 py-3 font-medium">{candidate.fullName}</td>
                  <td className="px-4 py-3">{candidate.email}</td>
                  <td className="px-4 py-3">{candidate.cohort}</td>
                  <td className="px-4 py-3"><StatusBadge status={candidate.status} /></td>
                  <td className="px-4 py-3">92%</td>
                  <td className="px-4 py-3">2</td>
                  <td className="px-4 py-3">2h ago</td>
                  <td className="px-4 py-3"><Link to={`/champion/candidates/${candidate.id}`} className="btn btn-secondary px-2 py-1 text-xs">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Candidates;
