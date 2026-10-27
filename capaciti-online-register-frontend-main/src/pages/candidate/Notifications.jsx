import { useState } from 'react';
import NotificationList from '../../components/common/NotificationList';
import Card from '../../components/common/Card';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import { useApp } from '../../context/AppContext';
import StatusBadge from '../../components/common/StatusBadge';
import { WfhStatus } from '../../api/types';

const Notifications = () => {
  const { notifications, notificationsLoading, notificationsError, markNotificationRead, isDemoMode } = useApp();
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
      <PageHeader eyebrow="Updates & alerts" title="Notifications" description={`${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`} actions={<StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>} />

      <Alert>{notificationsError?.message}</Alert>
      <Alert>{actionError}</Alert>

      <Card title="Activity & announcements">
        {notificationsLoading
          ? <p role="status" className="meta">Loading notifications...</p>
          : <NotificationList notifications={notifications} onMarkRead={isDemoMode ? handleMarkRead : undefined} />}
      </Card>
    </div>
  );
};

export default Notifications;
