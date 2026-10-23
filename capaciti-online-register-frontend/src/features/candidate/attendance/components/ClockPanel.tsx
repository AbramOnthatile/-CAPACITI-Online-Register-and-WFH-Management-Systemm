import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { BottomSheet, Button, Card, StatusBadge, Textarea } from '../../../../components/ui';
import type { ClockButtonState } from '../../../../components/ui';
import { ClockButton } from '../../../../components/ui';
import { formatTime } from '../../../../lib/format';
import type {
  AttendanceActionResponse,
  AttendanceRecord,
  CandidateIdentity,
  ClockInPayload,
  ClockOutPayload,
  ReasonSubmission,
  ReasonSubmissionResult,
} from '../types';

type ClockPanelProps = {
  identity: CandidateIdentity;
  attendance: AttendanceRecord | null;
  onClockIn: (payload: ClockInPayload) => Promise<AttendanceActionResponse>;
  onClockOut: (payload: ClockOutPayload) => Promise<AttendanceActionResponse>;
  onSubmitReason: (submission: ReasonSubmission) => Promise<ReasonSubmissionResult>;
  label?: string;
};

type PendingReason = {
  kind: ReasonSubmission['kind'];
  successState: 'success' | 'done';
};

function baseClockState(attendance: AttendanceRecord | null): ClockButtonState {
  if (!attendance?.clockInAt) return 'idle';
  return attendance.clockOutAt ? 'done' : 'clockedIn';
}

function geolocate(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location could not be verified on campus'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      resolve,
      () => reject(new Error('Location could not be verified on campus')),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  });
}

function responseError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'We could not update your attendance. Please try again.';
}

export function ClockPanel({
  identity,
  attendance,
  onClockIn,
  onClockOut,
  onSubmitReason,
  label = 'Attendance action',
}: ClockPanelProps) {
  const [actionState, setActionState] = useState<ClockButtonState | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [draftKey, setDraftKey] = useState('');
  const [pendingReason, setPendingReason] = useState<PendingReason | null>(null);
  const [submittingReason, setSubmittingReason] = useState(false);
  const [actionAttendance, setActionAttendance] = useState<AttendanceRecord | null>(null);
  const currentAttendance = actionAttendance ?? attendance;
  const currentState = actionState ?? baseClockState(currentAttendance);
  const noClockIn = !currentAttendance?.clockInAt;
  const clockInTime = currentAttendance?.clockInAt
    ? formatTime(currentAttendance.clockInAt)
    : '—';
  const clockOutTime = currentAttendance?.clockOutAt
    ? formatTime(currentAttendance.clockOutAt)
    : '—';
  const arrivalStatus = currentAttendance?.arrivalStatus;

  useEffect(() => {
    setActionAttendance(null);
  }, [attendance]);

  useEffect(() => {
    if (actionState !== 'success' && actionState !== 'done') return;
    const timeout = window.setTimeout(() => setActionState(null), 900);
    return () => window.clearTimeout(timeout);
  }, [actionState]);

  const breakSchedule = useMemo(
    () => 'Tea 10:30 to 10:45, Lunch 12:00 to 13:00',
    [],
  );

  const openReasonSheet = (kind: ReasonSubmission['kind'], successState: PendingReason['successState']) => {
    setPendingReason({ kind, successState });
    setDraftKey(crypto.randomUUID());
    setReason('');
    setReasonError('');
  };

  const handleAction = async () => {
    setErrorMessage('');
    setReasonError('');

    try {
      if (noClockIn) {
        let payload: ClockInPayload = {};
        if (identity.workMode === 'ON_SITE') {
          setActionState('locating');
          const position = await geolocate();
          payload = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyM: position.coords.accuracy,
          };
        }
        setActionState('verifying');
        const result = await onClockIn(payload);
        setActionAttendance(result.attendance);
        if (result.requiresReason) {
          openReasonSheet('late', 'success');
          setActionState(null);
          return;
        }
        setActionState('success');
        return;
      }

      setActionState('verifying');
      const result = await onClockOut({});
      setActionAttendance(result.attendance);
      if (result.requiresReason) {
        openReasonSheet('early', 'done');
        setActionState(null);
        return;
      }
      setActionState('done');
    } catch (error) {
      setActionState('error');
      setErrorMessage(responseError(error));
    }
  };

  const handleReasonSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingReason || !reason.trim()) {
      setReasonError('Enter a reason to continue.');
      return;
    }

    setSubmittingReason(true);
    setReasonError('');
    try {
      const result = await onSubmitReason({
        kind: pendingReason.kind,
        note: reason.trim(),
        draftKey,
      });
      if (!result.quality.accepted) {
        setReasonError(result.quality.feedbackMessage);
        return;
      }
      if (result.attendance) setActionAttendance(result.attendance);
      setActionState(pendingReason.successState);
      setPendingReason(null);
    } catch (error) {
      setReasonError(responseError(error));
    } finally {
      setSubmittingReason(false);
    }
  };

  return (
    <>
      <Card className="space-y-5 text-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">
            {identity.campusName}
          </h2>
        </div>

        <ClockButton
          state={currentState}
          label={currentState === 'clockedIn' ? 'Clock out' : 'Clock in'}
          sublabel={currentState === 'idle' ? 'Tap to start' : undefined}
          onPress={() => void handleAction()}
        />

        {errorMessage && (
          <p className="mx-auto max-w-sm text-sm font-medium text-danger" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 text-left">
          <div className="min-w-0 rounded-control bg-surface p-3">
            <p className="text-xs text-ink-500">Clock in</p>
            <p className="mt-1 truncate font-mono text-sm font-semibold tabular-nums text-ink-900">
              {clockInTime}
            </p>
          </div>
          <div className="min-w-0 rounded-control bg-surface p-3">
            <p className="text-xs text-ink-500">Clock out</p>
            <p className="mt-1 truncate font-mono text-sm font-semibold tabular-nums text-ink-900">
              {clockOutTime}
            </p>
          </div>
          <div className="min-w-0 rounded-control bg-surface p-3">
            <p className="text-xs text-ink-500">Status</p>
            {arrivalStatus ? (
              <StatusBadge
                category="arrival"
                status={arrivalStatus}
                className="mt-1 max-w-full"
              />
            ) : (
              <p className="mt-1 truncate text-xs font-semibold text-ink-700">
                {currentAttendance ? 'Awaiting status' : 'Not checked in'}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-ink-500">{breakSchedule}</p>
      </Card>

      <BottomSheet
        open={pendingReason !== null}
        onClose={() => {
          if (submittingReason) return;
          setPendingReason(null);
        }}
        title={pendingReason?.kind === 'late' ? 'Reason for late arrival' : 'Reason for early clock-out'}
        description="Please provide a reason to complete this attendance action."
        footer={
          <Button
            type="submit"
            form="attendance-reason-form"
            loading={submittingReason}
          >
            Submit reason
          </Button>
        }
      >
        <form id="attendance-reason-form" onSubmit={handleReasonSubmit} className="space-y-4">
          <Textarea
            label="Reason"
            value={reason}
            onChange={(event) => setReason(event.currentTarget.value)}
            maxLength={500}
            required
            error={reasonError}
            hint="Your reason is included with the attendance record."
          />
        </form>
      </BottomSheet>
    </>
  );
}
