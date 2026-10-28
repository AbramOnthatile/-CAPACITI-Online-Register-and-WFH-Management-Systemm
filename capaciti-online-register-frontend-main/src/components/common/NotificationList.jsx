import { Link } from 'react-router-dom';
import { ArrowRight, Award, Bell, Check, Clock3, Megaphone } from 'lucide-react';
import EmptyState from './EmptyState';
import { formatSastDateTime } from '../../lib/time';

// Readable label, icon and (where useful) a link for each backend notification type.
const typeInfo = {
  SCORECARD_SHARED: { label: 'Scorecard', icon: Award, to: '/candidate/scorecards', cta: 'View scorecard' },
  MISSING_CLOCK_OUT: { label: 'Attendance', icon: Clock3, to: '/candidate/attendance/history', cta: 'View history' },
  ANNOUNCEMENT: { label: 'Announcement', icon: Megaphone },
};

const NotificationList = ({ notifications = [], onMarkRead }) => {
  if (!notifications.length) {
    return <EmptyState icon={Bell} title="You're all caught up" description="No notifications at this time." />;
  }

  return (
    <ul className="list">
      {notifications.map((item) => {
        const info = typeInfo[item.type] ?? { label: item.type || 'Notice', icon: Bell };
        const Icon = info.icon;
        return (
        <li
          key={item.id}
          className={`flex items-start gap-3 rounded-xl border p-3.5 transition-colors ${
            item.read ? 'border-slate-100 bg-white' : 'border-primary-600/20 bg-primary-50/60'
          }`}
        >
          <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${item.read ? 'bg-slate-100 text-slate-400' : 'bg-primary-600/10 text-primary-600'}`}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-bold text-navy">{item.title}</h4>
              {!item.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-salmon" title="Unread" />}
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{item.message || item.description || ''}</p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11px] text-slate-400">{formatSastDateTime(item.timestamp)} · {info.label}</p>
              <div className="flex flex-wrap items-center gap-2">
                {info.to && (
                  <Link to={info.to} onClick={() => !item.read && onMarkRead?.(item.id)} className="btn btn-primary btn-sm">
                    {info.cta}<ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
                {!item.read && onMarkRead && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => onMarkRead(item.id)}>
                    <Check className="h-3.5 w-3.5" />
                    Mark read
                  </button>
                )}
              </div>
            </div>
          </div>
        </li>
        );
      })}
    </ul>
  );
};

export default NotificationList;
