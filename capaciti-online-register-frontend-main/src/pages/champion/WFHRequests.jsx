import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Eye, Inbox } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { WfhStatus } from '../../api/types';
import { getStatusMetadata } from '../../lib/status';
import { formatSastDate, formatSastDateTime } from '../../lib/time';
import { canRetryError, getUserErrorMessage } from '../../api/client';

const formatSubmitted = (value) => formatSastDateTime(value);

const ChampionWFHRequests = () => {
  const { wfh, wfhLoading, wfhError, updateWFHRequest, refreshWfh } = useApp();
  const [tab, setTab] = useState(WfhStatus.PENDING);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState(null);
  const [decisionError, setDecisionError] = useState('');
  const [decidingId, setDecidingId] = useState('');
  const decidingIds = useRef(new Set());
  const [retryDecision, setRetryDecision] = useState(null);

  const filtered = tab === 'ALL' ? wfh : wfh.filter((item) => item.status === tab);
  const pendingFiltered = filtered.filter((item) => item.status === WfhStatus.PENDING);
  const selectedPending = pendingFiltered.filter((item) => selectedIds.includes(item.id));
  const allPendingSelected = pendingFiltered.length > 0 && selectedPending.length === pendingFiltered.length;
  const selectable = tab !== WfhStatus.REJECTED && tab !== WfhStatus.APPROVED;

  const handleQuickDecision = async (id, status) => {
    if (decidingIds.current.has(id)) return;
    setDecisionError('');
    const reviewComment = status === WfhStatus.REJECTED
      ? window.prompt('Enter a required comment for rejecting this request.')?.trim()
      : 'Authorized remote work.';
    if (!reviewComment) {
      if (status === WfhStatus.REJECTED) setDecisionError('A comment is required when rejecting a WFH request.');
      return;
    }
    decidingIds.current.add(id);
    setDecidingId(id);
    try {
      await updateWFHRequest(id, {
        status,
        reviewComment,
      });
      setRetryDecision(null);
    } catch (error) {
      setDecisionError(getUserErrorMessage(error, 'The WFH decision could not be saved.'));
      setRetryDecision({ id, status, reviewComment, error });
    } finally {
      decidingIds.current.delete(id);
      setDecidingId('');
    }
  };

  const retryQuickDecision = async () => {
    if (!retryDecision || decidingIds.current.has(retryDecision.id)) return;
    decidingIds.current.add(retryDecision.id);
    setDecidingId(retryDecision.id);
    try {
      await updateWFHRequest(retryDecision.id, {
        status: retryDecision.status,
        reviewComment: retryDecision.reviewComment,
      });
      setRetryDecision(null);
      setDecisionError('');
    } catch (error) {
      setRetryDecision({ ...retryDecision, error });
      setDecisionError(getUserErrorMessage(error, 'The WFH decision could not be saved.'));
    } finally {
      decidingIds.current.delete(retryDecision.id);
      setDecidingId('');
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
      if (decidingIds.current.has(request.id)) continue;
      decidingIds.current.add(request.id);
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
      } finally {
        decidingIds.current.delete(request.id);
      }
    }

    const approvedCount = requestsToApprove.length - failed.length;
    setSelectedIds(failed.map((request) => request.id));
    setBulkFeedback(failed.length
      ? `Approved ${approvedCount} of ${requestsToApprove.length} requests. ${failed.length} failed: ${failed.map((request) => `${wfh.find((item) => item.id === request.id)?.userName ?? request.id}: ${request.message}`).join('; ')}`
      : `Approved ${approvedCount} request${approvedCount === 1 ? '' : 's'} successfully.`);
    setBulkLoading(false);
  };

  const renderDecisionButtons = (request) => (request.status === WfhStatus.PENDING ? (
    <>
      <button type="button" disabled={decidingId === request.id} onClick={() => void handleQuickDecision(request.id, WfhStatus.REJECTED)} className="btn btn-danger btn-sm"><X className="h-3.5 w-3.5" />Reject</button>
      <button type="button" disabled={decidingId === request.id} onClick={() => void handleQuickDecision(request.id, WfhStatus.APPROVED)} className="btn btn-primary btn-sm"><Check className="h-3.5 w-3.5" />Approve</button>
    </>
  ) : (
    <Link to={`/champion/wfh/${request.id}`} className="btn btn-secondary btn-sm"><Eye className="h-3.5 w-3.5" />Details</Link>
  ));

  return (
    <div className="page">
      <PageHeader eyebrow="Remote work queue" title="WFH review decisions" />

      <div className="chip-row" role="group" aria-label="Filter by status">
        {[WfhStatus.PENDING, WfhStatus.APPROVED, WfhStatus.REJECTED, 'ALL'].map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            className="chip"
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

      {wfhLoading ? (
        <Skeleton label="Loading WFH requests" />
      ) : wfhError ? (
        <><ErrorState message={wfhError.message} />{canRetryError(wfhError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshWfh()}>Retry</button>}</>
      ) : (
      <>
      {selectable && pendingFiltered.length > 0 && (
        <div className="surface surface-pad flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={toggleAllPending} disabled={bulkLoading} className="btn btn-secondary btn-sm">
              {allPendingSelected ? 'Deselect pending' : 'Select all pending'}
            </button>
            <span className="meta" aria-live="polite">{selectedPending.length} selected</span>
          </div>
          <button type="button" onClick={() => void handleBulkApprove()} disabled={selectedPending.length === 0 || bulkLoading} className="btn btn-primary">
            <Check className="h-4 w-4" />
            {bulkLoading ? 'Approving requests...' : `Approve ${selectedPending.length} selected`}
          </button>
        </div>
      )}

      {bulkFeedback && <Alert tone={bulkFeedback.includes(' failed:') ? 'warning' : 'success'}>{bulkFeedback}</Alert>}
      <Alert>{decisionError}</Alert>
      {retryDecision && canRetryError(retryDecision.error) && <button type="button" className="btn btn-secondary btn-sm" disabled={Boolean(decidingId) || bulkLoading} onClick={() => void retryQuickDecision()}>Retry decision</button>}

      {/* Phones & tablets */}
      <ul className="list lg:hidden">
        {filtered.map((request) => (
          <li key={request.id} className="surface p-4">
            <div className="flex items-start gap-3">
              {selectable && request.status === WfhStatus.PENDING && (
                <input type="checkbox" aria-label={`Select WFH request from ${request.userName}`} checked={selectedIds.includes(request.id)} disabled={bulkLoading} onChange={() => toggleRequest(request.id)} className="checkbox mt-1 h-5 w-5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-navy">{request.userName}</p>
                  <StatusBadge status={request.status} />
                </div>
                <p className="mt-0.5 font-mono text-xs text-slate-500">{formatSastDate(request.startDate)} – {formatSastDate(request.endDate)}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{request.reason}</p>
                <p className="mt-1 text-xs text-slate-400">Submitted {formatSubmitted(request.createdAt)}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 [&>a]:col-span-2">
              {renderDecisionButtons(request)}
            </div>
          </li>
        ))}
        {!filtered.length && <li><EmptyState icon={Inbox} description="No WFH requests in this category." /></li>}
      </ul>

      {/* Desktop */}
      <div className="surface hidden overflow-hidden lg:block">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {selectable && <th className="w-10"><span className="sr-only">Select request</span></th>}
                <th>Candidate</th>
                <th>Requested period</th>
                <th>Reason</th>
                <th>Submitted</th>
                <th>Status</th>
                <th className="text-right">Review action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => (
                <tr key={request.id}>
                  {selectable && (
                    <td>
                      {request.status === WfhStatus.PENDING && (
                        <input type="checkbox" aria-label={`Select WFH request from ${request.userName}`} checked={selectedIds.includes(request.id)} disabled={bulkLoading} onChange={() => toggleRequest(request.id)} className="checkbox" />
                      )}
                    </td>
                  )}
                  <td className="font-bold text-navy">{request.userName}</td>
                  <td className="whitespace-nowrap font-mono font-semibold tabular-nums text-navy">{formatSastDate(request.startDate)} – {formatSastDate(request.endDate)}</td>
                  <td className="max-w-xs text-slate-600"><span className="line-clamp-2">{request.reason}</span></td>
                  <td className="whitespace-nowrap font-mono tabular-nums text-slate-400">{formatSubmitted(request.createdAt)}</td>
                  <td><StatusBadge status={request.status} /></td>
                  <td><div className="flex items-center justify-end gap-1.5">{renderDecisionButtons(request)}</div></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={selectable ? 7 : 6} className="table-empty">No WFH requests in this category.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default ChampionWFHRequests;
