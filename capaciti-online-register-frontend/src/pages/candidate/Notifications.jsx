import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import NotificationList from '../../components/common/NotificationList';

const Notifications = () => {
  const { notificationList, markNotificationRead } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Notifications</p>
        <h2 className="text-3xl font-bold text-slate-900">Notification Center</h2>
      </div>

      <Card title="Inbox">
        <NotificationList notifications={notificationList} onMarkRead={markNotificationRead} />
      </Card>
    </div>
  );
};

export default Notifications;
