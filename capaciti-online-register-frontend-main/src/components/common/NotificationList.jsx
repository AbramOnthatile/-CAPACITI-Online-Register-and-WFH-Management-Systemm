import { Bell, Check, Clock, Info } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { WfhStatus } from '../../api/types';

const NotificationList = ({ notifications = [], onMarkRead, compact = false }) => {
  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center">
        <Bell className="h-6 w-6 text-slate-300" />
        <p className="mt-2 text-xs font-semibold text-slate-500">No notifications at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {notifications.map((item) => (
        <article
          key={item.id}
          className={`flex flex-col gap-3 rounded-2xl border p-4 transition-all ${
            item.read
              ? 'border-slate-100 bg-white hover:border-slate-200'
              : 'border-[#6115D0]/20 bg-[#6115D0]/[0.02] shadow-sm'
          } ${compact ? 'sm:flex-row sm:items-center sm:justify-between' : ''}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-[#1D2951]">{item.title}</h4>
              {/* MOCK-ONLY: not in backend */}
              <StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>
              {!item.read && (
                <span className="flex h-2 w-2 rounded-full bg-[#F25251]" title="Unread" />
              )}
            </div>
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.message || item.description || ''}</p>
            <p className="mt-1 text-[10px] text-slate-400 font-mono tabular-nums">
              {new Intl.DateTimeFormat('en-ZA', {
                timeZone: 'Africa/Johannesburg',
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(item.timestamp))} · {item.type || 'Notice'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {!item.read && onMarkRead && (
              <button
                type="button"
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-[#6115D0] hover:text-[#6115D0] transition-colors"
                onClick={() => onMarkRead(item.id)}
              >
                <Check className="h-3 w-3" />
                <span>Mark Read</span>
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default NotificationList;
