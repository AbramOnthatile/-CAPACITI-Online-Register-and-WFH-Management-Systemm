import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Eye, Home, Calendar, Clock, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import { WfhStatus } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';

const ChampionWFHRequests = () => {
  const { wfh, updateWFHRequest } = useApp();
  const [tab, setTab] = useState(WfhStatus.PENDING);

  const filtered = tab === 'ALL' ? wfh : wfh.filter((item) => item.status === tab);

  const handleQuickDecision = async (id, status) => {
    try {
      await updateWFHRequest(id, {
        status,
        reviewComment: status === WfhStatus.APPROVED ? 'Authorized remote work.' : 'On-site attendance required.',
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'The WFH decision could not be saved.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">
              Remote Work Queue
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Champion Approvals</span>
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#1D2951]">WFH Review Decisions</h2>
        </div>
      </div>

      {/* Segmented Filter Control */}
      <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm">
        {[WfhStatus.PENDING, WfhStatus.APPROVED, WfhStatus.REJECTED, 'ALL'].map((key) => (
          <button
            key={key}
            type="button"
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              tab === key
                ? 'bg-[#1D2951] text-white shadow-sm'
                : 'text-slate-500 hover:text-[#1D2951] hover:bg-slate-50'
            }`}
            onClick={() => setTab(key)}
          >
            {key === 'ALL' ? 'All' : getStatusMetadata(key).label}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Candidate</th>
                <th className="px-4 py-3.5">Requested period</th>
                <th className="px-4 py-3.5">Reason</th>
                <th className="px-4 py-3.5">Submitted</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#1D2951]">{request.userName}</td>
                  <td className="px-4 py-3.5 font-mono text-[#1D2951] font-semibold tabular-nums">{request.startDate} – {request.endDate}</td>
                  <td className="px-4 py-3.5 text-slate-600 max-w-xs">
                    <span className="truncate">{request.reason}</span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-400 tabular-nums">
                    {new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'medium' }).format(new Date(request.createdAt))}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {request.status === WfhStatus.PENDING ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleQuickDecision(request.id, WfhStatus.REJECTED)}
                            className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Reject"
                          >
                            <X className="h-3 w-3" />
                            <span>Reject</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleQuickDecision(request.id, WfhStatus.APPROVED)}
                            className="flex items-center gap-1 rounded-lg bg-[#6115D0] px-3 py-1 text-[11px] font-bold text-white hover:bg-[#4F11AA] transition-colors shadow-sm"
                            title="Approve"
                          >
                            <Check className="h-3 w-3" />
                            <span>Approve</span>
                          </button>
                        </>
                      ) : (
                        <Link
                          to={`/champion/wfh/${request.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#6115D0] hover:text-[#6115D0] transition-colors"
                        >
                          <Eye className="h-3 w-3" /> Details
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No WFH requests in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChampionWFHRequests;
