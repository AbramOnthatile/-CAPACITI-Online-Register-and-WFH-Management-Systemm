import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const tones = {
  error: { className: 'alert-error', icon: AlertCircle, role: 'alert' },
  success: { className: 'alert-success', icon: CheckCircle2, role: 'status' },
  warning: { className: 'alert-warning', icon: AlertTriangle, role: 'alert' },
  info: { className: 'alert-info', icon: Info, role: 'status' },
};

const Alert = ({ tone = 'error', children, className = '' }) => {
  if (!children) return null;
  const { className: toneClass, icon: Icon, role } = tones[tone] ?? tones.error;
  return (
    <div role={role} className={`alert ${toneClass} ${className}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
    </div>
  );
};

export default Alert;
