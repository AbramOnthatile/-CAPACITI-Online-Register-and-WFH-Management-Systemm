import { useApp } from '../../context/AppContext';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';

const Notifications = () => {
  const { notificationList, markNotificationRead } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Notifications</p>
        <h2 className="text-3xl font-bold text-slate-900">Notification Center</h2>
      </div>

      <Card title="Inbox">
        <div className="space-y-3">
          {notificationList.length ? notificationList.map((item) => (
            <div key={item.id} className={`flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between ${item.read ? 'border-slate-200 bg-slate-50' : 'border-primary-200 bg-primary-50'}`}>
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()} · {item.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={item.read ? 'Active' : 'Pending'}>{item.read ? 'Read' : 'Unread'}</StatusBadge>
                {!item.read && <button className="btn btn-secondary" onClick={() => markNotificationRead(item.id)}>Mark read</button>}
              </div>
            </div>
          )) : <p className="text-slate-500">No notifications.</p>}
        </div>
      </Card>
    </div>
  );
};

export default Notifications;
