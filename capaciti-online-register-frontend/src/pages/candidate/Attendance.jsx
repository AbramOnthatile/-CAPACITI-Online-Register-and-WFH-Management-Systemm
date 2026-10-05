import { useState } from 'react';
import { Clock3, Coffee, UtensilsCrossed, CheckCircle2, AlarmClock, TimerReset } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const Attendance = () => {
  const { attendanceState, setAttendanceState } = useApp();
  const [modal, setModal] = useState(null);

  const statusOptions = [
    { key: 'Not Checked In', label: 'Not Checked In' },
    { key: 'Working', label: 'Working' },
    { key: 'On Break', label: 'On Tea Break' },
    { key: 'On Lunch', label: 'On Lunch' },
    { key: 'Checked Out', label: 'Checked Out' },
  ];

  const handleStatus = (status) => {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const next = { ...attendanceState };

    if (status === 'check-in') {
      next.currentStatus = 'Working';
      next.checkInTime = time;
      next.wasLate = false;
      next.lateMinutes = 0;
    }

    if (status === 'start-break') {
      next.currentStatus = 'On Break';
      next.teaBreakStart = time;
    }

    if (status === 'end-break') {
      next.currentStatus = 'Working';
      next.teaBreakEnd = time;
    }

    if (status === 'start-lunch') {
      next.currentStatus = 'On Lunch';
      next.lunchStart = time;
    }

    if (status === 'end-lunch') {
      next.currentStatus = 'Working';
      next.lunchEnd = time;
    }

    if (status === 'check-out') {
      next.currentStatus = 'Checked Out';
      next.checkOutTime = time;
      next.earlyCheckout = false;
    }

    setAttendanceState(next);
    setModal(null);
  };

  const actions = [];
  if (attendanceState.currentStatus === 'Not Checked In') {
    actions.push({ label: 'Clock In', action: 'check-in', variant: 'primary' });
  } else if (attendanceState.currentStatus === 'Working') {
    actions.push({ label: 'Start Tea Break', action: 'start-break', variant: 'secondary' }, { label: 'Start Lunch', action: 'start-lunch', variant: 'secondary' }, { label: 'Clock Out', action: 'check-out', variant: 'danger' });
  } else if (attendanceState.currentStatus === 'On Break') {
    actions.push({ label: 'End Tea Break', action: 'end-break', variant: 'primary' });
  } else if (attendanceState.currentStatus === 'On Lunch') {
    actions.push({ label: 'End Lunch', action: 'end-lunch', variant: 'primary' });
  } else if (attendanceState.currentStatus === 'Checked Out') {
    actions.push({ label: 'Workday completed', action: null, variant: 'secondary', disabled: true });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Attendance</p>
          <h2 className="text-3xl font-bold text-slate-900">Today's attendance</h2>
        </div>
        <StatusBadge status={attendanceState.currentStatus} />
      </div>

      <Card title="Current register status" subtitle="9:00–16:00 workday">
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Current time</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="rounded-xl bg-white p-3 text-primary-600 shadow-sm">
                  <Clock3 className="h-6 w-6" />
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className={`btn ${action.variant === 'primary' ? 'btn-primary' : action.variant === 'danger' ? 'btn-danger' : 'btn-secondary'} ${action.disabled ? 'cursor-default' : ''}`}
                  onClick={() => !action.disabled && setModal(action.action)}
                  disabled={action.disabled}
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {[
                { label: 'Status', value: attendanceState.currentStatus },
                { label: 'Total working time', value: '7h 05m' },
                { label: 'Late rule', value: attendanceState.wasLate ? 'Late by 17 minutes' : 'On time' },
                { label: 'Early check-out', value: attendanceState.earlyCheckout ? 'Early check-out' : 'On schedule' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-b border-slate-200 pb-2 text-sm">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-medium text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-700">
              <AlarmClock className="h-4 w-4" />
              <p className="font-semibold">Business rules</p>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• Clock-in after 09:00 registers as late.</li>
              <li>• Workday runs from 09:00 to 16:00.</li>
              <li>• Tea break is 10:30–10:45.</li>
              <li>• Lunch is 12:00–13:00.</li>
              <li>• Check-out before 16:00 is flagged as early.</li>
            </ul>
          </div>
        </div>
      </Card>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              {modal === 'check-in' ? <CheckCircle2 className="h-6 w-6 text-emerald-600" /> : modal === 'check-out' ? <TimerReset className="h-6 w-6 text-red-600" /> : modal === 'start-break' ? <Coffee className="h-6 w-6 text-amber-600" /> : <UtensilsCrossed className="h-6 w-6 text-blue-600" />}
              <h3 className="text-lg font-semibold text-slate-900">Confirm action</h3>
            </div>
            <p className="text-sm text-slate-600">This will update the candidate attendance record for today.</p>
            <div className="mt-6 flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={() => handleStatus(modal)}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
