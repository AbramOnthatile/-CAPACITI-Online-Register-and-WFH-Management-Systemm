import NotificationList from '../../components/common/NotificationList';
import Card from '../../components/common/Card';
import { useApp } from '../../context/AppContext';

const Notifications = () => {
  const { notifications, markNotificationRead } = useApp();
  const unreadCount = notifications.filter((item) => !item.read).length;

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

      <Card title="Activity & Announcements" subtitle={`${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`}>
        <NotificationList notifications={notifications} onMarkRead={markNotificationRead} />
      </Card>
    </div>
  );
};

export default Notifications;
