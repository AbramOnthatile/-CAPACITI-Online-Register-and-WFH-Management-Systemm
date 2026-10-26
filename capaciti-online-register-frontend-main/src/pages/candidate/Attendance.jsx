import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Coffee, UtensilsCrossed, CheckCircle2, Building2, Home, Info } from 'lucide-react';
import { WorkMode } from '../../api/types';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const formatSast = (value) => value
  ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : '—';

const Attendance = () => {
  const { user } = useAuth();
  const { attendanceToday, attendanceLoading, attendanceError, clockIn, clockOut, startBreak, endBreak, isDemoMode } = useApp();
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [selectedMode, setSelectedMode] = useState(user?.defaultMode ?? WorkMode.ON_SITE);
  const record = attendanceToday;
  const hasClockedIn = Boolean(record?.clockInAt);
  const hasClockedOut = Boolean(record?.clockOutAt);

  const confirmAction = async () => {
    setWorking(true);
    setError('');
    try {
      if (confirmation === 'clock-in') await clockIn(selectedMode);
      if (confirmation === 'clock-out') await clockOut();
      setConfirmation(null);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Attendance could not be updated.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">Daily Attendance Register</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500 font-medium">Attendance record</span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-[#1D2951]">Today's Attendance</h2>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm" aria-label="Choose today's work mode">
          <button type="button" disabled={hasClockedIn} onClick={() => setSelectedMode(WorkMode.ON_SITE)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${selectedMode === WorkMode.ON_SITE ? 'bg-[#1D2951] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Building2 className="h-3.5 w-3.5" /><span>On-site</span>
          </button>
          <button type="button" disabled={hasClockedIn} onClick={() => setSelectedMode(WorkMode.WFH)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-60 ${selectedMode === WorkMode.WFH ? 'bg-[#6115D0] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Home className="h-3.5 w-3.5" /><span>WFH</span>
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</p>}
      {attendanceError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{attendanceError.message}</p>}
      {attendanceLoading && <p className="text-xs text-slate-500">Loading today's attendance...</p>}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_-4px_rgba(29,41,81,0.06)] sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Attendance status</p>
                <div className="mt-1 flex items-center gap-2">
                  <h3 className="text-xl font-bold text-[#1D2951]">{hasClockedOut ? 'Clocked out' : hasClockedIn ? 'Clocked in' : 'Not clocked in'}</h3>
                  {record && <StatusBadge status={hasClockedOut ? record.departureStatus : record.arrivalStatus} />}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-400">Work mode</p>
                <StatusBadge status={record?.workMode ?? user?.defaultMode ?? WorkMode.ON_SITE} />
              </div>
            </div>

            <div className="my-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Attendance actions</p>
              <div className="flex flex-wrap gap-3">
                {!hasClockedIn && (
                  <button type="button" onClick={() => setConfirmation('clock-in')} className="flex items-center gap-2 rounded-xl bg-[#6115D0] px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-[#4F11AA] transition-all">
                    <Clock className="h-4 w-4" /><span>Clock In for Today</span>
                  </button>
                )}
                {hasClockedIn && !hasClockedOut && (
                  <>
                    {isDemoMode && (record?.breaks?.some((item) => !item.endedAt) ? (
                      <button type="button" onClick={() => { setWorking(true); setError(''); try { endBreak(); } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'The break could not be ended.'); } finally { setWorking(false); } }} disabled={working} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                        <Clock className="h-4 w-4" /><span>End {record.breaks.find((item) => !item.endedAt)?.type === 'TEA' ? 'Tea' : 'Lunch'} Break</span>
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setWorking(true); setError(''); try { startBreak('TEA'); } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'The break could not be started.'); } finally { setWorking(false); } }} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <Coffee className="h-4 w-4 text-[#F25251]" /><span>Start Tea Break</span>
                        </button>
                        <button type="button" onClick={() => { setWorking(true); setError(''); try { startBreak('LUNCH'); } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'The break could not be started.'); } finally { setWorking(false); } }} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                          <UtensilsCrossed className="h-4 w-4 text-[#6115D0]" /><span>Start Lunch</span>
                        </button>
                      </>
                    ))}
                    <button type="button" onClick={() => setConfirmation('clock-out')} className="flex items-center gap-2 rounded-xl bg-[#1D2951] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0F172A] shadow-sm transition-all">
                      <span>Clock Out</span>
                    </button>
                  </>
                )}
                {hasClockedOut && <span className="rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">Attendance recorded for today</span>}
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Attendance details</p>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs">
                <span className="font-semibold text-[#1D2951]">Clock in</span>
                <span className="font-mono font-bold text-[#1D2951]">{formatSast(record?.clockInAt)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs">
                <span className="font-semibold text-[#1D2951]">Arrival</span>
                {record ? <StatusBadge status={record.arrivalStatus} /> : <span className="text-slate-400">Not recorded</span>}
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs">
                <span className="font-semibold text-[#1D2951]">Clock out</span>
                <span className="font-mono font-bold text-[#1D2951]">{formatSast(record?.clockOutAt)}</span>
              </div>
              {record?.departureStatus && (
                <div className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs">
                  <span className="font-semibold text-[#1D2951]">Departure</span>
                  <StatusBadge status={record.departureStatus} />
                </div>
              )}
              {record?.breaks?.map((breakEntry, index) => (
                <div key={`${breakEntry.startedAt}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-xs">
                  <span className="font-semibold text-[#1D2951]">{breakEntry.type === 'TEA' ? 'Tea break' : 'Lunch break'}</span>
                  <span className="font-mono text-slate-600">{formatSast(breakEntry.startedAt)} – {formatSast(breakEntry.endedAt)}</span>
                </div>
              ))}
            </div>
          </div>

          <Card title="Attendance guidance" subtitle="Daily register policy">
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#6115D0]" />
              <p>Choose the work mode that applies today, clock in when your workday begins, record breaks as they happen, and clock out when you finish.</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <Card title="Verification" subtitle="Backend attendance fields">
            <div className="space-y-3 text-xs">
              <p className="flex justify-between"><span className="text-slate-500">IP verified</span><strong>{record ? (record.ipVerified ? 'Yes' : 'No') : '—'}</strong></p>
              <p className="flex justify-between"><span className="text-slate-500">Location verified</span><strong>{record ? (record.geoVerified ? 'Yes' : 'No') : '—'}</strong></p>
              <p className="flex justify-between"><span className="text-slate-500">Distance</span><strong>{record?.distanceM == null ? '—' : `${record.distanceM} m`}</strong></p>
              <p className="flex justify-between"><span className="text-slate-500">Quality flag</span><strong>{record?.aiQualityFlag ? 'Flagged' : record ? 'Clear' : '—'}</strong></p>
            </div>
          </Card>
          <Card title="Attendance History" subtitle="Review recorded entries">
            <Link to="/candidate/attendance/history" className="text-xs font-bold text-[#6115D0] hover:underline">View attendance history →</Link>
          </Card>
        </div>
      </div>

      {confirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2951]/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-[#1D2951]">Confirm {confirmation === 'clock-in' ? 'Clock In' : 'Clock Out'}</h3>
            <p className="mt-2 text-xs text-slate-600">This updates your attendance record.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setConfirmation(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="button" disabled={working} onClick={() => void confirmAction()} className="rounded-xl bg-[#6115D0] px-5 py-2 text-xs font-bold text-white hover:bg-[#4F11AA] shadow-sm">{working ? 'Saving...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
