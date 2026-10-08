import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Clock3, FileText, BarChart3, CheckCircle2, LogOut, Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', to: '/champion/dashboard', icon: LayoutDashboard },
  { label: 'Candidates', to: '/champion/candidates', icon: Users },
  { label: 'Attendance Monitor', to: '/champion/attendance', icon: Clock3 },
  { label: 'WFH Requests', to: '/champion/wfh', icon: FileText },
  { label: 'Progress Review', to: '/champion/progress', icon: CheckCircle2 },
  { label: 'Reports', to: '/champion/reports', icon: BarChart3 },
];

const Sidebar = ({ mobileOpen, onClose, onLogout }) => (
  <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white p-5 transition-transform duration-200 md:static md:translate-x-0`}>
    <div className="mb-8 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">CAPACITI</p>
        <h2 className="text-lg font-bold text-slate-900">Champion Panel</h2>
      </div>
      <button className="md:hidden" onClick={onClose} aria-label="Close menu">✕</button>
    </div>
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
      <button type="button" onClick={onLogout} className="mt-6 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-600 hover:bg-slate-100">
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </nav>
  </aside>
);

export const ChampionLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={handleLogout} />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between px-4 py-4 md:px-8">
              <div className="flex items-center gap-3">
                <button className="md:hidden" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
                  <Menu className="h-5 w-5 text-slate-700" />
                </button>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tech Champion</p>
                  <h1 className="text-xl font-bold text-slate-900">Review Workspace</h1>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-600">
                  <Bell className="h-4 w-4" />
                </button>
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                  {user?.avatar || 'TC'}
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-slate-800">{user?.fullName || 'Champion'}</p>
                  <p className="text-xs text-slate-500">Mentor</p>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary">Logout</button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default ChampionLayout;
