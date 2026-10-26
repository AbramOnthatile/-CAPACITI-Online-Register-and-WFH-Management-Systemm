import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock3,
  History,
  Home,
  CheckSquare,
  Bell,
  User,
  LogOut,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import BrandLogo from '../components/common/BrandLogo';
import TopBar from '../components/common/TopBar';
import StatusBadge from '../components/common/StatusBadge';
import { WfhStatus } from '../api/types';
import { demoOnly } from '../mocks/demoOnly';

const navItems = [
  { label: 'Dashboard', to: '/candidate/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', to: '/candidate/attendance', icon: Clock3 },
  { label: 'History', to: '/candidate/attendance/history', icon: History },
  { label: 'WFH Requests', to: '/candidate/wfh', icon: Home },
  { label: 'Check-ins', to: '/candidate/progress', icon: CheckSquare },
  { label: 'Notifications', to: '/candidate/notifications', icon: Bell, mockOnly: true },
  { label: 'My Profile', to: '/candidate/profile', icon: User },
];

const Sidebar = ({ mobileOpen, onClose, onLogout, user }) => {
  return (
    <aside
      className={`${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col overflow-hidden border-r border-slate-200/80 bg-white transition-transform duration-200 md:translate-x-0`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <BrandLogo to="/candidate/dashboard" />
        <button
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 md:hidden"
          onClick={onClose}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* User and campus summary */}
      <div className="mx-4 mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span className="uppercase tracking-wider text-[10px] text-[#6115D0] font-bold">Candidate Workspace</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <MapPin className="h-3 w-3 text-[#F25251]" />
          <span>{user?.campusName || 'No campus assigned'}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon, mockOnly }) => (
          mockOnly ? (
            <div key={label} className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-600" title={demoOnly.notice}>
              <span className="flex items-center gap-3"><Icon className="h-4 w-4 shrink-0" />{label}</span>
              {/* MOCK-ONLY: not in backend */}
              <StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>
            </div>
          ) : (
            <NavLink
              key={label}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#6115D0] text-white shadow-sm shadow-[#6115D0]/20'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-[#1D2951]'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          )
        ))}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#1D2951]">
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
              {user?.fullName?.split(/\s+/).map((name) => name[0]).join('').slice(0, 2)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#1D2951]">{user?.fullName || 'User'}</p>
            <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export const CandidateLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageInfo = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return { title: 'Candidate Portal', subtitle: 'Attendance, Check-ins & WFH Hub' };
    if (path.includes('attendance/history')) return { title: 'Attendance History', subtitle: 'Timesheet records and work verification' };
    if (path.includes('attendance')) return { title: 'Daily Attendance', subtitle: 'Clock in/out and review your attendance record' };
    if (path.includes('wfh/new')) return { title: 'New WFH Request', subtitle: 'Apply for remote work approval' };
    if (path.includes('wfh')) return { title: 'Work From Home Requests', subtitle: 'Submit and track remote working applications' };
    if (path.includes('progress')) return { title: 'Check-ins', subtitle: 'Morning Kickoff, Midday Pulse & EOD Wrap-Up' };
    if (path.includes('notifications')) return { title: 'Notifications', subtitle: 'Programme announcements and request updates' };
    if (path.includes('profile')) return { title: 'My Profile', subtitle: 'Account and campus details' };
    return { title: 'Candidate Portal', subtitle: 'CAPACITI Workforce Management' };
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-[#1D2951]/40 backdrop-blur-sm md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        user={user}
      />
      <div className="flex flex-col md:pl-64">
        <TopBar onOpenMenu={() => setMobileOpen(true)} title={title} subtitle={subtitle} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CandidateLayout;
