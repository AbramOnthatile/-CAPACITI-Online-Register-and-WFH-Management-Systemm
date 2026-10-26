import { Link, useNavigate } from 'react-router-dom';
import { Award, Bell, ChevronRight, History, LifeBuoy, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/common/Avatar';

const groups = [
  {
    title: 'Learning & progress',
    items: [
      { label: 'Scorecards', description: 'Scores, feedback and progress', to: '/candidate/scorecards', icon: Award },
      { label: 'Attendance history', description: 'Past records and timesheet export', to: '/candidate/attendance/history', icon: History },
    ],
  },
  {
    title: 'Help & updates',
    items: [
      { label: 'Notifications', description: 'Announcements and request updates', to: '/candidate/notifications', icon: Bell, unreadBadge: true },
      { label: 'Support', description: 'Report a blocker or IT issue', to: '/candidate/support', icon: LifeBuoy },
    ],
  },
];

const MorePage = () => {
  const { user, logout } = useAuth();
  const { notifications } = useApp();
  const navigate = useNavigate();
  const unread = notifications.filter((item) => !item.read).length;

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page-narrow">
      <Link to="/candidate/profile" className="surface surface-interactive flex items-center gap-4 p-4">
        <Avatar name={user?.fullName} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-extrabold text-navy">{user?.fullName}</span>
          <span className="block truncate text-sm text-slate-500">{user?.email}</span>
          <span className="mt-0.5 flex items-center gap-1 text-xs font-bold text-primary-600"><User className="h-3.5 w-3.5" />View profile</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
      </Link>

      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`more-${group.title}`}>
          <h2 id={`more-${group.title}`} className="label-caps mb-2 px-1">{group.title}</h2>
          <ul className="surface divide-y divide-slate-100 overflow-hidden">
            {group.items.map(({ label, description, to, icon: Icon, unreadBadge }) => (
              <li key={to}>
                <Link to={to} className="flex items-center gap-3 p-4 transition-colors hover:bg-slate-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600"><Icon className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-navy">{label}</span>
                    <span className="block truncate text-xs text-slate-500">{description}</span>
                  </span>
                  {unreadBadge && unread > 0 && <span className="pill border-transparent bg-salmon text-white">{unread}</span>}
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <button type="button" onClick={handleSignOut} className="btn btn-danger btn-block">
        <LogOut className="h-4 w-4" />Sign out
      </button>
    </div>
  );
};

export default MorePage;
