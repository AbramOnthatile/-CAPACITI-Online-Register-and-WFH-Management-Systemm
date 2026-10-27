import { Bell, Check } from 'lucide-react';
import EmptyState from './EmptyState';
import { formatSastDateTime } from '../../lib/time';

const NotificationList = ({ notifications = [], onMarkRead }) => {
  if (!notifications.length) {
    return <EmptyState icon={Bell} title="You're all caught up" description="No notifications at this time." />;
  }

  return (
    <ul className="list">
      {notifications.map((item) => (
        <li
          key={item.id}
          className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
            item.read ? 'border-slate-100 bg-white' : 'border-primary-600/20 bg-primary-50/60'
          }`}
        >
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.read ? 'bg-slate-100 text-slate-400' : 'bg-primary-600/10 text-primary-600'}`}>
            <Bell className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-navy">{item.title}</h4>
              {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-salmon" title="Unread" />}
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{item.message || item.description || ''}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-slate-400">{formatSastDateTime(item.timestamp)} · {item.type || 'Notice'}</p>
              {!item.read && onMarkRead && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMarkRead(item.id)}>
                  <Check className="h-3.5 w-3.5" />
                  Mark read
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default NotificationList;
