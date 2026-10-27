import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, Building2, Home, ArrowRight, Send, ChevronRight, LifeBuoy } from 'lucide-react';
import { PromptStage, PromptStatus, WfhStatus, WorkMode } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import Card from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import { getStatusMetadata } from '../../lib/status';

const formatClock = (value) => (value
  ? new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  : '--:--');

const CandidateDashboard = () => {
  const { user } = useAuth();
  const { attendanceToday, attendanceLoading, attendanceError, clockIn, clockOut, wfh, wfhLoading, wfhError, prompts, activePrompts, promptsError, promptServerTime } = useApp();
  const [serverElapsedSeconds, setServerElapsedSeconds] = useState(0);
  const [action, setAction] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedMode, setSelectedMode] = useState(user?.defaultMode ?? WorkMode.ON_SITE);

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
  const dateString = new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', weekday: 'long', day: 'numeric', month: 'long' }).format(serverNow);
  const formatElapsed = (start) => {
    const elapsed = Math.max(0, Math.floor((serverNow.getTime() - Date.parse(start)) / 1000));
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  const candidateWfh = wfh.filter((request) => request.userId === user?.id);
  const approvedWfh = candidateWfh.filter((request) => request.status === WfhStatus.APPROVED);
  const nextPrompt = activePrompts[0];
  const currentMode = attendanceToday?.workMode ?? selectedMode;
  const clockedIn = Boolean(attendanceToday?.clockInAt);
  const clockedOut = Boolean(attendanceToday?.clockOutAt);
  const working = clockedIn && !clockedOut;
  const pageError = attendanceError?.message || wfhError?.message || promptsError?.message;

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
    <div className="page">
      <header>
        <p className="eyebrow">{dateString}</p>
        <h2 className="page-title mt-1">{greeting}, {user?.fullName?.split(/\s+/)[0] || 'Candidate'}</h2>
        <p className="page-subtitle mt-1">{working ? 'You are clocked in. Have a productive day.' : 'Review your attendance and scheduled check-ins.'}</p>
      </header>

      <Alert>{pageError}</Alert>

      {nextPrompt && (
        <Link to="/candidate/progress" className="surface surface-interactive flex items-center gap-3 border-primary-600/25 bg-primary-50/70 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white"><Send className="h-4 w-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-navy">{getStatusMetadata(nextPrompt.stage).label} is open</span>
            <span className="block text-xs text-slate-500">Submit your check-in before it expires.</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-primary-600" />
        </Link>
      )}

      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        {/* Attendance hero */}
        <section className="surface overflow-hidden lg:col-span-7" aria-labelledby="today-heading">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${working ? 'animate-pulse bg-emerald-500' : 'bg-slate-300'}`} />
              <h3 id="today-heading" className="section-title">Today</h3>
            </div>
            {attendanceToday ? <StatusBadge status={attendanceToday.arrivalStatus} /> : <span className="pill border-slate-200 bg-slate-100 text-slate-600">Not clocked in</span>}
          </div>

          <div className="card-body space-y-5">
            <div className="segmented" role="group" aria-label="Choose today's work mode">
              <button type="button" aria-pressed={currentMode === WorkMode.ON_SITE} disabled={Boolean(attendanceToday)} onClick={() => setSelectedMode(WorkMode.ON_SITE)} className="segmented-item">
                <Building2 className="h-4 w-4" />On-site
              </button>
              <button type="button" aria-pressed={currentMode === WorkMode.WFH} disabled={Boolean(attendanceToday)} onClick={() => setSelectedMode(WorkMode.WFH)} className="segmented-item">
                <Home className="h-4 w-4" />WFH
              </button>
            </div>

            <div className="text-center">
              <p className="font-mono text-4xl font-extrabold tracking-tight tabular-nums text-navy sm:text-5xl">{timeString}</p>
              <p className="mt-1 text-xs text-slate-400">SAST · server time</p>
            </div>

            <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border-[10px] border-primary-600/10 bg-primary-600/5 sm:h-48 sm:w-48">
              <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-primary-600/20 bg-white shadow-inner sm:h-40 sm:w-40">
                <Clock className="mb-1.5 h-5 w-5 text-primary-600" />
                <p className="font-mono text-xl font-extrabold tabular-nums text-navy sm:text-2xl">{working ? formatElapsed(attendanceToday.clockInAt) : '--:--:--'}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Time recorded</p>
              </div>
            </div>

            {!clockedIn && (
              <button type="button" disabled={attendanceLoading} onClick={() => setAction('clock-in')} className="btn btn-primary btn-lg btn-block">
                <CheckCircle2 className="h-5 w-5" />Clock in
              </button>
            )}
            {working && (
              <button type="button" onClick={() => setAction('clock-out')} className="btn btn-dark btn-lg btn-block">
                <Clock className="h-5 w-5" />Clock out
              </button>
            )}
            {clockedOut && <Alert tone="success">Attendance complete for today.</Alert>}

            <dl className="grid grid-cols-2 gap-3">
              <div className="inset text-center">
                <dt className="label-caps">Clock in</dt>
                <dd className="mt-1 font-mono text-base font-bold text-navy">{formatClock(attendanceToday?.clockInAt)}</dd>
              </div>
              <div className="inset text-center">
                <dt className="label-caps">Clock out</dt>
                <dd className="mt-1 font-mono text-base font-bold text-navy">{formatClock(attendanceToday?.clockOutAt)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <div className="space-y-5 lg:col-span-5 lg:space-y-6">
          <Card title="Today's check-ins" actions={<Link to="/candidate/progress" className="link text-xs">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}>
            <ul className="list">
              {Object.values(PromptStage).map((stage) => {
                const prompt = prompts.find((item) => item.stage === stage);
                const isActive = prompt && activePrompts.some((activePrompt) => activePrompt.id === prompt.id);
                return <div key={stage} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-xs font-bold text-[#1D2951]">{getStatusMetadata(stage).label}</p>{prompt && <p className="mt-1 text-[10px] text-slate-400">Expires {new Intl.DateTimeFormat('en-ZA', { timeZone: 'Africa/Johannesburg', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(prompt.expiresAt))}</p>}</div>{prompt ? <StatusBadge status={isActive ? PromptStatus.ACTIVE : prompt.status} /> : <span className="text-xs text-slate-400">Not scheduled</span>}</div>;
              })}
            </ul>
          </Card>

          <Card title="WFH requests" subtitle={`${approvedWfh.length} approved`} actions={<Link to="/candidate/wfh" className="link text-xs">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}>
            <div className="space-y-4">
              {wfhLoading ? <p className="meta">Loading requests...</p> : candidateWfh.length ? (
                <ul className="list">
                  {candidateWfh.slice(0, 3).map((request) => (
                    <li key={request.id}>
                      <Link to={`/candidate/wfh/${request.id}`} className="list-row">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold text-navy">{request.startDate} – {request.endDate}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{request.reason}</p>
                        </div>
                        <StatusBadge status={request.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <EmptyState icon={Home} title="No WFH requests yet" description="Apply when you need to work remotely." className="py-6" />}
              <div className="grid grid-cols-2 gap-2">
                <Link to="/candidate/wfh/new" className="btn btn-secondary"><Send className="h-4 w-4" />Apply</Link>
                <Link to="/candidate/support" className="btn btn-secondary"><LifeBuoy className="h-4 w-4" />Get support</Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {action && (
        <Modal
          title={action === 'clock-in' ? 'Confirm clock in' : 'Confirm clock out'}
          description={action === 'clock-in' ? `You will clock in as ${currentMode === WorkMode.WFH ? 'working from home' : 'on-site'}.` : 'Are you ready to clock out for today?'}
          onClose={() => setAction('')}
          closeDisabled={saving}
          footer={(
            <>
              <button type="button" onClick={() => setAction('')} disabled={saving} className="btn btn-secondary">Cancel</button>
              <button type="button" disabled={saving} onClick={() => void confirmAction()} className="btn btn-primary">{saving ? 'Saving...' : 'Confirm'}</button>
            </>
          )}
        >
          {actionError && <Alert>{actionError}</Alert>}
        </Modal>
      )}
    </div>
  );
};

export default CandidateDashboard;
