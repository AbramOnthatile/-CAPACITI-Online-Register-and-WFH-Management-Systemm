import NotificationList from '../../components/common/NotificationList';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { WfhStatus } from '../../api/types';
import { demoOnly } from '../../mocks/demoOnly';

const Notifications = () => {
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

      {/* MOCK-ONLY: not in backend */}
      <Card title="Activity & Announcements" subtitle="Traineeship updates and supervisor notifications" actions={<StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>}>
        <NotificationList notifications={demoOnly.sampleNotifications} />
      </Card>
    </div>
  );
};

export default Notifications;
