import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Clock3, History, Home, Bell, User, LogOut, PanelLeftClose, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import BrandLogo from '../components/common/BrandLogo';

const navItems = [
  { label: 'Dashboard', to: '/candidate/dashboard', icon: LayoutDashboard },
  { label: 'Attendance', to: '/candidate/attendance', icon: Clock3 },
  { label: 'Attendance History', to: '/candidate/attendance/history', icon: History },
  { label: 'WFH Requests', to: '/candidate/wfh', icon: Home },
  { label: 'Daily Progress', to: '/candidate/progress', icon: PanelLeftClose },
  { label: 'Notifications', to: '/candidate/notifications', icon: Bell },
  { label: 'Profile', to: '/candidate/profile', icon: User },
];

const Sidebar = ({ mobileOpen, onClose, onLogout, user }) => (
  <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex h-screen w-[18rem] max-w-[calc(100vw-3rem)] flex-col overflow-hidden border-r border-navy/10 bg-white p-5 transition-transform duration-200 md:translate-x-0`}>
    <div className="mb-8 flex items-center justify-between">
      <BrandLogo compact />
      <button className="md:hidden" onClick={onClose} aria-label="Close menu">✕</button>
    </div>
    <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.2em] text-salmon">Candidate Portal</p>
    <nav className="space-y-2">
      {navItems.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={label}
          to={to}
          onClick={onClose}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
    <div className="mt-auto rounded-2xl border border-primary-100 bg-primary-50 p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
          {user?.avatar || 'CN'}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-navy">{user?.fullName || 'Candidate'}</p>
          <p className="truncate text-xs text-slate-500">{user?.role || 'candidate'}</p>
        </div>
      </div>
      <button type="button" onClick={onLogout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-salmon hover:bg-white">
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </div>
  </aside>
);

export const CandidateLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-navy/40 backdrop-blur-sm md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={handleLogout} user={user} />
      <main className="h-screen overflow-y-auto md:pl-[18rem]">
        <button
          type="button"
          className="fixed left-4 top-4 z-20 rounded-xl border border-navy/10 bg-white p-2.5 text-navy shadow-soft md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="mx-auto w-full max-w-7xl p-4 pt-16 md:p-8 md:pt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CandidateLayout;
