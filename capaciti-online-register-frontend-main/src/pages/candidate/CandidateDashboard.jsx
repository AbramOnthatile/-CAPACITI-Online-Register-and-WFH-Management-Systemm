import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, Calendar, Building2, Home, ArrowRight, Send, ChevronRight } from 'lucide-react';
import { PromptStage, PromptStatus, WfhStatus, WorkMode } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import { getStatusMetadata } from '../../lib/status';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const { attendanceToday, attendanceLoading, attendanceError, clockIn, clockOut, wfh, wfhLoading, wfhError, prompts, promptsError, promptServerTime } = useApp();
  const [serverElapsedSeconds, setServerElapsedSeconds] = useState(0);
  const [action, setAction] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setServerElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const serverNow = useMemo(() => new Date(Date.parse(promptServerTime) + serverElapsedSeconds * 1000), [promptServerTime, serverElapsedSeconds]);
  const greeting = useMemo(() => {
    const hour = Number(new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', hourCycle: 'h23' }).format(serverNow));
    return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  }, [serverNow]);
  const timeString = new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(serverNow);
  const dateString = new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(serverNow);
  const formatElapsed = (start) => {
    const elapsed = Math.max(0, Math.floor((serverNow.getTime() - Date.parse(start)) / 1000));
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  const candidateWfh = wfh.filter((request) => request.userId === user?.id);
  const approvedWfh = candidateWfh.filter((request) => request.status === WfhStatus.APPROVED);
  const nextPrompt = prompts.find((prompt) => prompt.status === PromptStatus.ACTIVE);
  const currentMode = attendanceToday?.workMode ?? user?.defaultMode ?? WorkMode.ON_SITE;
  const clockedIn = Boolean(attendanceToday?.clockInAt);
  const clockedOut = Boolean(attendanceToday?.clockOutAt);

  const confirmAction = async () => {
    setActionError('');
    setSaving(true);
    try {
      if (action === 'clock-in') await clockIn(currentMode);
      else if (action === 'clock-out') await clockOut();
      setAction('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Attendance could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#F25251]">CAPACITI Attendance Hub</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-medium text-slate-500">Today</span>
          </div>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#1D2951] sm:text-3xl">{greeting}, {user?.fullName?.split(/\s+/)[0] || 'Candidate'}!</h2>
          <p className="mt-0.5 text-sm text-slate-600">{clockedIn && !clockedOut ? 'You are currently clocked in.' : 'Review your attendance and scheduled check-ins.'}</p>
        </div>

        {/* MOCK-ONLY: not in backend */}
        <div className="flex items-center self-start rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm" title="Demo only, not connected">
          <button type="button" disabled aria-disabled="true" title="Demo only, not connected" className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold opacity-60 ${currentMode === WorkMode.ON_SITE ? 'bg-[#1D2951] text-white shadow-sm' : 'text-slate-600'}`}>
            <Building2 className="h-4 w-4 text-[#F25251]" /><span>On-site</span><StatusBadge status={WorkMode.ON_SITE}>Demo</StatusBadge>
          </button>
          <button type="button" disabled aria-disabled="true" title="Demo only, not connected" className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold opacity-60 ${currentMode === WorkMode.WFH ? 'bg-[#6115D0] text-white shadow-sm' : 'text-slate-600'}`}>
            <Home className="h-4 w-4" /><span>WFH</span><StatusBadge status={WorkMode.WFH}>Demo</StatusBadge>
          </button>
        </div>
      </div>

      {(attendanceError || wfhError || promptsError || actionError) && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{actionError || attendanceError?.message || wfhError?.message || promptsError?.message}</p>}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_4px_24px_-4px_rgba(29,41,81,0.06)] sm:p-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2"><span className={`flex h-2.5 w-2.5 rounded-full ${clockedIn && !clockedOut ? 'animate-pulse bg-emerald-500' : 'bg-slate-300'}`} /><span className="text-xs font-bold uppercase tracking-wider text-slate-500">{currentMode === WorkMode.ON_SITE ? 'On-site attendance' : 'WFH attendance'}</span></div>
              {attendanceToday ? <StatusBadge status={attendanceToday.arrivalStatus} /> : <span className="rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">Not clocked in</span>}
            </div>
            <div className="mt-6 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6115D0]">{dateString}</p>
              <div className="mt-2 font-mono text-5xl font-black tabular-nums tracking-tight text-[#1D2951] sm:text-6xl">{timeString}</div>
              <p className="mt-2 text-xs text-slate-400">Africa/Johannesburg · Server time</p>
            </div>
            <div className="mx-auto mt-6 flex h-44 w-44 items-center justify-center rounded-full border-[10px] border-[#6115D0]/10 bg-[#6115D0]/5 sm:h-52 sm:w-52">
              <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full border-4 border-[#6115D0]/20 bg-white shadow-inner sm:h-44 sm:w-44">
                <Clock className="mb-2 h-6 w-6 text-[#6115D0]" />
                <p className="font-mono text-2xl font-black text-[#1D2951]">{clockedIn && !clockedOut ? formatElapsed(attendanceToday.clockInAt) : '--:--:--'}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Time recorded</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              {!clockedIn && <button type="button" disabled={attendanceLoading} onClick={() => setAction('clock-in')} className="flex items-center justify-center gap-2 rounded-xl bg-[#6115D0] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#4F11AA] disabled:opacity-60"><CheckCircle2 className="h-4 w-4" />Clock In</button>}
              {clockedIn && !clockedOut && <button type="button" onClick={() => setAction('clock-out')} className="flex items-center justify-center gap-2 rounded-xl bg-[#1D2951] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#0F172A]"><Clock className="h-4 w-4" />Clock Out</button>}
              {clockedOut && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">Attendance complete for today.</p>}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-center">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clock in</p><p className="mt-1 font-mono text-sm font-bold text-[#1D2951]">{attendanceToday?.clockInAt ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }).format(new Date(attendanceToday.clockInAt)) : '--:--'}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clock out</p><p className="mt-1 font-mono text-sm font-bold text-[#1D2951]">{attendanceToday?.clockOutAt ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }).format(new Date(attendanceToday.clockOutAt)) : '--:--'}</p></div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-5">
          <Card title="Today's Check-ins" subtitle="Prompt stages">
            <div className="space-y-3">
              {Object.values(PromptStage).map((stage) => {
                const prompt = prompts.find((item) => item.stage === stage);
                return <div key={stage} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-xs font-bold text-[#1D2951]">{getStatusMetadata(stage).label}</p>{prompt && <p className="mt-1 text-[10px] text-slate-400">Expires {new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }).format(new Date(prompt.expiresAt))}</p>}</div>{prompt ? <StatusBadge status={prompt.status} /> : <span className="text-xs text-slate-400">Not scheduled</span>}</div>;
              })}
              <Link to="/candidate/progress" className="flex items-center justify-between pt-1 text-xs font-bold text-[#6115D0] hover:underline"><span>{nextPrompt?.status === PromptStatus.ACTIVE ? 'Submit an active check-in' : 'View all check-ins'}</span><ArrowRight className="h-4 w-4" /></Link>
            </div>
          </Card>

          <Card title="WFH Requests" subtitle="Your remote work applications" actions={<Link to="/candidate/wfh" className="text-xs font-bold text-[#6115D0] hover:underline">View all <ChevronRight className="inline h-3.5 w-3.5" /></Link>}>
            <div className="space-y-3">
              {wfhLoading ? <p className="text-xs text-slate-400">Loading requests...</p> : candidateWfh.slice(0, 3).map((request) => <div key={request.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-xs font-bold text-[#1D2951]">{request.startDate} – {request.endDate}</p><p className="mt-1 line-clamp-1 text-[11px] text-slate-500">{request.reason}</p></div><StatusBadge status={request.status} /></div>)}
              {!wfhLoading && candidateWfh.length === 0 && <p className="text-xs text-slate-400">No WFH requests found.</p>}
              <p className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500"><Calendar className="h-4 w-4 text-[#6115D0]" />{approvedWfh.length} approved request{approvedWfh.length === 1 ? '' : 's'}</p>
              <Link to="/candidate/wfh/new" className="flex items-center justify-center gap-2 rounded-xl border border-[#6115D0]/20 py-2 text-xs font-bold text-[#6115D0] hover:bg-[#6115D0]/5"><Send className="h-3.5 w-3.5" />Apply for WFH</Link>
            </div>
          </Card>
        </div>
      </div>

      {action && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1D2951]/40 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl"><h3 className="text-base font-bold text-[#1D2951]">Confirm {action === 'clock-in' ? 'Clock In' : 'Clock Out'}</h3><p className="mt-2 text-xs leading-relaxed text-slate-600">{action === 'clock-in' ? `Clock in using your default work mode: ${currentMode}.` : 'Are you ready to clock out for today?'}</p>{actionError && <p role="alert" className="mt-3 text-xs text-rose-600">{actionError}</p>}<div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setAction('')} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="button" disabled={saving} onClick={() => void confirmAction()} className="rounded-xl bg-[#6115D0] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#4F11AA] disabled:opacity-60">{saving ? 'Saving...' : 'Confirm'}</button></div></div></div>}
    </div>
  );
};

export default CandidateDashboard;
