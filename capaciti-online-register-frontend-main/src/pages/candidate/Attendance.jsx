import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Coffee, UtensilsCrossed, Building2, Home, Info, History, ChevronRight } from 'lucide-react';
import { ApiError, canRetryError, getFieldError, getUserErrorMessage } from '../../api/client';
import { WorkMode } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import ClockButton from '../../components/common/ClockButton';
import { ErrorState, Skeleton } from '../../components/common/RequestState';
import { createDraftKey, getCurrentCoordinates } from '../../lib/attendanceAction';
import { formatSastTime } from '../../lib/time';

const formatSast = (value) => formatSastTime(value);

const Attendance = () => {
  const { user } = useAuth();
  const { attendanceToday, attendanceLoading, attendanceError, clockIn, clockOut, startBreak, endBreak, isDemoMode, refreshAttendance } = useApp();
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [qualityMessage, setQualityMessage] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [requiresReason, setRequiresReason] = useState(false);
  const [actionRequest, setActionRequest] = useState(null);
  const [working, setWorking] = useState(false);
  const inFlight = useRef(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [retryActionError, setRetryActionError] = useState(null);
  const [selectedMode, setSelectedMode] = useState(user?.defaultMode ?? WorkMode.ON_SITE);
  const record = attendanceToday;
  const hasClockedIn = Boolean(record?.clockInAt);
  const hasClockedOut = Boolean(record?.clockOutAt);
  const openBreak = record?.breaks?.find((item) => !item.endedAt);

  const confirmAction = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setWorking(true);
    setError('');
    setFieldErrors({});
    setRetryActionError(null);
    setQualityMessage('');
    try {
      let result;
      if (confirmation === 'clock-in') {
        let request = actionRequest;
        if (!request) {
          const position = selectedMode === WorkMode.ON_SITE ? await getCurrentCoordinates() : null;
          request = {
            draftKey: createDraftKey(),
            workMode: selectedMode,
            lateReason: null,
            ...(position ?? {}),
          };
          setActionRequest(request);
        } else if (requiresReason) {
          if (!actionReason.trim()) {
            setError('Enter the reason requested by the server.');
            return;
          }
          request = { ...request, lateReason: actionReason.trim() };
          setActionRequest(request);
        }
        result = await clockIn(request);
      } else if (confirmation === 'clock-out') {
        let request = actionRequest;
        if (!request) {
          request = {
            draftKey: createDraftKey(),
            earlyClockoutReason: null,
            lateClockoutNote: null,
            deliverableLink: null,
          };
          setActionRequest(request);
        } else if (requiresReason) {
          if (!actionReason.trim()) {
            setError('Enter the reason requested by the server.');
            return;
          }
          request = { ...request, earlyClockoutReason: actionReason.trim() };
          setActionRequest(request);
        }
        result = await clockOut(request);
      }

      if (result?.requiresReason) {
        setRequiresReason(true);
        setQualityMessage(result.quality.feedbackMessage ?? '');
        return;
      }
      if (result?.quality?.accepted === false) {
        setRequiresReason(true);
        setQualityMessage(result.quality.feedbackMessage || 'Please revise your reason and try again.');
        return;
      }
      setConfirmation(null);
      setActionRequest(null);
      setActionReason('');
      setRequiresReason(false);
    } catch (actionError) {
      setError(getUserErrorMessage(actionError, 'Attendance could not be updated.'));
      setRetryActionError(actionError);
      if (actionError instanceof ApiError) setFieldErrors(actionError.fieldErrors);
    } finally {
      inFlight.current = false;
      setWorking(false);
    }
  };

  const closeConfirmation = () => {
    if (working) return;
    setConfirmation(null);
    setActionRequest(null);
    setActionReason('');
    setRequiresReason(false);
    setQualityMessage('');
  };

  const runBreakAction = (fn, fallback) => {
    setWorking(true);
    setError('');
    try {
      fn();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : fallback);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Daily register" title="Today's attendance" description="Choose your work mode, clock in, record breaks and clock out." />

      <Alert>{error}</Alert>
      <ErrorState message={attendanceError?.message} />
      {canRetryError(attendanceError) && <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshAttendance()}>Retry</button>}
      {canRetryError(retryActionError) && <button type="button" className="btn btn-secondary btn-sm" disabled={working} onClick={() => void confirmAction()}>Retry</button>}
      {attendanceLoading && <Skeleton label="Loading today's attendance" />}

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="space-y-5 lg:col-span-8 lg:space-y-6">
          <section className="surface" aria-labelledby="attendance-status">
            <div className="card-header">
              <div className="min-w-0">
                <p className="label-caps">Status</p>
                <h3 id="attendance-status" className="mt-0.5 text-lg font-extrabold text-navy">{hasClockedOut ? 'Clocked out' : hasClockedIn ? 'Clocked in' : 'Not clocked in'}</h3>
              </div>
              {record && <StatusBadge status={hasClockedOut ? record.departureStatus : record.arrivalStatus} />}
            </div>

            <div className="card-body space-y-5">
              <div>
                <p className="label-caps mb-2">Work mode</p>
                {hasClockedIn ? (
                  <StatusBadge status={record?.workMode ?? user?.defaultMode ?? WorkMode.ON_SITE} />
                ) : (
                  <div className="segmented" role="group" aria-label="Choose today's work mode">
                    <button type="button" aria-pressed={selectedMode === WorkMode.ON_SITE} onClick={() => setSelectedMode(WorkMode.ON_SITE)} className="segmented-item">
                      <Building2 className="h-4 w-4" />On-site
                    </button>
                    <button type="button" aria-pressed={selectedMode === WorkMode.WFH} onClick={() => setSelectedMode(WorkMode.WFH)} className="segmented-item">
                      <Home className="h-4 w-4" />WFH
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="label-caps mb-2">Actions</p>
                {!hasClockedIn && (
                  <ClockButton
                    action="clock-in"
                    icon={Clock}
                    label="Clock in for today"
                    pending={working}
                    onClick={() => setConfirmation('clock-in')}
                    className="btn btn-primary btn-lg btn-block sm:w-auto"
                  />
                )}
                {hasClockedIn && !hasClockedOut && (
                  <div className="grid gap-2 sm:flex sm:flex-wrap">
                    {isDemoMode && (openBreak ? (
                      <button type="button" disabled={working} onClick={() => runBreakAction(endBreak, 'The break could not be ended.')} className="btn btn-secondary">
                        <Clock className="h-4 w-4" />End {openBreak.type === 'TEA' ? 'tea' : 'lunch'} break
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:flex">
                        <button type="button" onClick={() => runBreakAction(() => startBreak('TEA'), 'The break could not be started.')} className="btn btn-secondary">
                          <Coffee className="h-4 w-4 text-salmon" />Tea break
                        </button>
                        <button type="button" onClick={() => runBreakAction(() => startBreak('LUNCH'), 'The break could not be started.')} className="btn btn-secondary">
                          <UtensilsCrossed className="h-4 w-4 text-primary-600" />Lunch
                        </button>
                      </div>
                    ))}
                    <ClockButton
                      action="clock-out"
                      pending={working}
                      onClick={() => setConfirmation('clock-out')}
                      className="btn btn-dark"
                      iconClassName="h-4 w-4"
                    />
                  </div>
                )}
                {hasClockedOut && <Alert tone="success">Attendance recorded for today.</Alert>}
              </div>

              <div>
                <p className="label-caps mb-2">Details</p>
                <dl className="detail-list">
                  <div className="detail-row"><dt>Clock in</dt><dd className="font-mono">{formatSast(record?.clockInAt)}</dd></div>
                  <div className="detail-row"><dt>Arrival</dt><dd>{record ? <StatusBadge status={record.arrivalStatus} /> : <span className="font-normal text-slate-400">Not recorded</span>}</dd></div>
                  <div className="detail-row"><dt>Clock out</dt><dd className="font-mono">{formatSast(record?.clockOutAt)}</dd></div>
                  {record?.departureStatus && <div className="detail-row"><dt>Departure</dt><dd><StatusBadge status={record.departureStatus} /></dd></div>}
                  {record?.breaks?.map((breakEntry, index) => (
                    <div key={`${breakEntry.startedAt}-${index}`} className="detail-row">
                      <dt>{breakEntry.type === 'TEA' ? 'Tea break' : 'Lunch break'}</dt>
                      <dd className="font-mono">{formatSast(breakEntry.startedAt)} – {formatSast(breakEntry.endedAt)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>

          <Alert tone="info">Choose the work mode that applies today, clock in when your workday begins, record breaks as they happen, and clock out when you finish.</Alert>
        </div>

        <div className="space-y-5 lg:col-span-4 lg:space-y-6">
          <Card title="Verification" subtitle="Attendance checks">
            <dl className="detail-list">
              <div className="detail-row"><dt>IP verified</dt><dd>{record ? (record.ipVerified ? 'Yes' : 'No') : '—'}</dd></div>
              <div className="detail-row"><dt>Location verified</dt><dd>{record ? (record.geoVerified ? 'Yes' : 'No') : '—'}</dd></div>
              <div className="detail-row"><dt>Distance</dt><dd>{record?.distanceM == null ? '—' : `${record.distanceM} m`}</dd></div>
              <div className="detail-row"><dt>Quality flag</dt><dd>{record?.aiQualityFlag ? 'Flagged' : record ? 'Clear' : '—'}</dd></div>
            </dl>
          </Card>
          <Link to="/candidate/attendance/history" className="surface surface-interactive flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600"><History className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-navy">Attendance history</span>
              <span className="block text-xs text-slate-500">Review and export past records</span>
            </span>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </Link>
        </div>
      </div>

      {confirmation && (
        <Modal
          title={confirmation === 'clock-in' ? 'Confirm clock in' : 'Confirm clock out'}
          description="This updates your attendance record."
          onClose={closeConfirmation}
          closeDisabled={working}
          footer={(
            <>
              <button type="button" onClick={closeConfirmation} disabled={working} className="btn btn-secondary">Cancel</button>
              <button type="button" disabled={working} onClick={() => void confirmAction()} className="btn btn-primary">{working ? 'Saving...' : 'Confirm'}</button>
            </>
          )}
        >
          {qualityMessage && <Alert tone={requiresReason ? 'info' : 'warning'}>{qualityMessage}</Alert>}
          {requiresReason && (
            <label className="field">
              <span className="field-label">Reason</span>
              <textarea rows="3" className="input" value={actionReason} onChange={(event) => setActionReason(event.target.value)} />
              {getFieldError(fieldErrors, confirmation === 'clock-in' ? 'lateReason' : 'earlyClockoutReason', 'reason') && (
                <span role="alert" className="text-xs text-rose-700">
                  {getFieldError(fieldErrors, confirmation === 'clock-in' ? 'lateReason' : 'earlyClockoutReason', 'reason')}
                </span>
              )}
            </label>
          )}
        </Modal>
      )}
    </div>
  );
};

export default Attendance;
