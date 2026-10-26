import NotificationList from '../../components/common/NotificationList';
import Card from '../../components/common/Card';
import { useApp } from '../../context/AppContext';
import { useState } from 'react';

const Notifications = () => {
  const { notifications, notificationsLoading, notificationsError, markNotificationRead } = useApp();
  const [actionError, setActionError] = useState('');
  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleMarkRead = async (id) => {
    setActionError('');
    try {
      await markNotificationRead(id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The notification could not be updated.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#6115D0]">
            System Communications
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-500 font-medium">Updates &amp; Alerts</span>
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#1D2951]">Notifications</h2>
      </div>

      {notificationsError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{notificationsError.message}</p>}
      {actionError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{actionError}</p>}

      <Card title="Activity & Announcements" subtitle={`${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`}>
        {notificationsLoading
          ? <p role="status" className="text-xs text-slate-500">Loading notifications...</p>
          : <NotificationList notifications={notifications} onMarkRead={handleMarkRead} />}
      </Card>
    </div>
  );
};

export default Notifications;
