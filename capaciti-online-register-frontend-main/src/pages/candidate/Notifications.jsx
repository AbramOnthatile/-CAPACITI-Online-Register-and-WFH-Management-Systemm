import { useState } from 'react';
import NotificationList from '../../components/common/NotificationList';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import { useApp } from '../../context/AppContext';

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
    <div className="page-narrow">
      <PageHeader eyebrow="Updates & alerts" title="Notifications" description={`${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`} />

      <Alert>{notificationsError?.message}</Alert>
      <Alert>{actionError}</Alert>

      <Card title="Activity & announcements">
        {notificationsLoading
          ? <p role="status" className="meta">Loading notifications...</p>
          : <NotificationList notifications={notifications} onMarkRead={handleMarkRead} />}
      </Card>
    </div>
  );
};

export default Notifications;
