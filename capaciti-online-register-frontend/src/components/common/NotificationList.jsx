import { Bell, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';

const NotificationList = ({ notifications = [], onMarkRead, compact = false }) => {
  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
        <Bell className="h-6 w-6 text-slate-300" />
        <p className="mt-2 text-sm text-slate-500">No notifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((item) => (
        <article
          key={item.id}
          className={`flex flex-col gap-3 rounded-xl border p-4 ${
            item.read
              ? 'border-slate-200 bg-slate-50'
              : 'border-primary-200 bg-primary-50'
          } ${compact ? 'md:flex-row md:items-center md:justify-between' : ''}`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              {!item.read && <span className="h-2 w-2 rounded-full bg-salmon" aria-label="Unread" />}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(item.timestamp).toLocaleString()} · {item.type}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={item.read ? 'Active' : 'Pending'}>
              {item.read ? 'Read' : 'Unread'}
            </StatusBadge>
            {!item.read && onMarkRead && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onMarkRead(item.id)}
              >
                <Check className="mr-2 h-4 w-4" />
                Mark read
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default NotificationList;
