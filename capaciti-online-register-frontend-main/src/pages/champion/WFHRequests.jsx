import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import { WfhStatus } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';

const ChampionWFHRequests = () => {
  const { wfh, updateWFHRequest } = useApp();
  const [tab, setTab] = useState(WfhStatus.PENDING);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState(null);

  const filtered = tab === 'ALL' ? wfh : wfh.filter((item) => item.status === tab);
  const pendingFiltered = filtered.filter((item) => item.status === WfhStatus.PENDING);
  const selectedPending = pendingFiltered.filter((item) => selectedIds.includes(item.id));
  const allPendingSelected = pendingFiltered.length > 0 && selectedPending.length === pendingFiltered.length;

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

  const toggleRequest = (id) => {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]);
    setBulkFeedback(null);
  };

  const toggleAllPending = () => {
    const visibleIds = pendingFiltered.map((request) => request.id);
    setSelectedIds((current) => allPendingSelected
      ? current.filter((id) => !visibleIds.includes(id))
      : [...new Set([...current, ...visibleIds])]);
    setBulkFeedback(null);
  };

  const handleBulkApprove = async () => {
    const requestsToApprove = wfh.filter(
      (request) => selectedIds.includes(request.id) && request.status === WfhStatus.PENDING,
    );
    if (requestsToApprove.length === 0) return;

    setBulkLoading(true);
    setBulkFeedback(null);
    const failed = [];
    for (const request of requestsToApprove) {
      try {
        await updateWFHRequest(request.id, {
          status: WfhStatus.APPROVED,
          reviewComment: 'Authorized remote work.',
        });
      } catch (error) {
        failed.push({
          id: request.id,
          message: error instanceof Error ? error.message : 'The WFH decision could not be saved.',
        });
      }
    }

    const approvedCount = requestsToApprove.length - failed.length;
    setSelectedIds(failed.map((request) => request.id));
    setBulkFeedback(failed.length
      ? `Approved ${approvedCount} of ${requestsToApprove.length} requests. ${failed.length} failed: ${failed.map((request) => `${wfh.find((item) => item.id === request.id)?.userName ?? request.id}: ${request.message}`).join('; ')}`
      : `Approved ${approvedCount} request${approvedCount === 1 ? '' : 's'} successfully.`);
    setBulkLoading(false);
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
            onClick={() => {
              setTab(key);
              setSelectedIds([]);
              setBulkFeedback(null);
            }}
          >
            {key === 'ALL' ? 'All' : getStatusMetadata(key).label}
          </button>
        ))}
      </div>

      {tab !== WfhStatus.REJECTED && tab !== WfhStatus.APPROVED && pendingFiltered.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleAllPending}
              disabled={bulkLoading}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-[#1D2951] hover:bg-slate-50 disabled:opacity-50"
            >
              {allPendingSelected ? 'Deselect pending' : 'Select all pending'}
            </button>
            <span className="text-xs text-slate-500" aria-live="polite">
              {selectedPending.length} selected
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleBulkApprove()}
            disabled={selectedPending.length === 0 || bulkLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6115D0] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#4F11AA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {bulkLoading ? 'Approving requests...' : `Approve ${selectedPending.length} selected`}
          </button>
        </div>
      )}

      {bulkFeedback && (
        <p
          role={bulkFeedback.startsWith('Approved ') && !bulkFeedback.includes(' failed:') ? 'status' : 'alert'}
          className={`rounded-xl border p-4 text-xs font-semibold ${
            bulkFeedback.includes(' failed:')
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {bulkFeedback}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                {tab !== WfhStatus.REJECTED && tab !== WfhStatus.APPROVED && (
                  <th className="w-10 px-4 py-3.5">
                    <span className="sr-only">Select request</span>
                  </th>
                )}
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
                  {tab !== WfhStatus.REJECTED && tab !== WfhStatus.APPROVED && (
                    <td className="px-4 py-3.5">
                      {request.status === WfhStatus.PENDING && (
                        <input
                          type="checkbox"
                          aria-label={`Select WFH request from ${request.userName}`}
                          checked={selectedIds.includes(request.id)}
                          disabled={bulkLoading}
                          onChange={() => toggleRequest(request.id)}
                          className="h-4 w-4 rounded border-slate-300 accent-[#6115D0]"
                        />
                      )}
                    </td>
                  )}
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
                  <td colSpan={tab !== WfhStatus.REJECTED && tab !== WfhStatus.APPROVED ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
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
