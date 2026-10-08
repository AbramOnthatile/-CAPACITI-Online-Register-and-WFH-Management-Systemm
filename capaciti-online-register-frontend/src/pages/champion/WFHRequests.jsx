import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Link } from 'react-router-dom';

const ChampionWFHRequests = () => {
  const { wfh } = useApp();
  const [tab, setTab] = useState('Pending');

  const filtered = tab === 'All' ? wfh : wfh.filter((item) => item.status === tab);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">WFH</p>
        <h2 className="text-3xl font-bold text-slate-900">WFH Requests</h2>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {['Pending', 'Approved', 'Rejected', 'All'].map((key) => (
            <button key={key} type="button" className={`rounded-xl px-3 py-2 text-sm font-medium ${tab === key ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`} onClick={() => setTab(key)}>{key}</button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">WFH Date</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={request.id} className="border-t border-slate-200 text-slate-700">
                  <td className="px-4 py-3">{request.candidate}</td>
                  <td className="px-4 py-3">{request.date}</td>
                  <td className="px-4 py-3">{request.reason}</td>
                  <td className="px-4 py-3">{new Date(request.submittedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                  <td className="px-4 py-3"><Link to={`/champion/wfh/${request.id}`} className="btn btn-secondary px-2 py-1 text-xs">Review</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChampionWFHRequests;
