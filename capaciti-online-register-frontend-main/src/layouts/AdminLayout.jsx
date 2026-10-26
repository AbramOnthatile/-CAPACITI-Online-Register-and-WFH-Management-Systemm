import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  TicketCheck,
  ScrollText,
  FileBarChart,
  LogOut,
  Sliders,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import BrandLogo from '../components/common/BrandLogo';
import TopBar from '../components/common/TopBar';
import { getStatusMetadata } from '../lib/status';

const navItems = [
  { label: 'Overview', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'User Directory', to: '/admin/users', icon: Users },
  { label: 'Blockers & Tickets', to: '/admin/escalations', icon: TicketCheck },
  { label: 'Audit Trail', to: '/admin/audit-log', icon: ScrollText },
  { label: 'Programme Reports', to: '/admin/reports', icon: FileBarChart },
];

const Sidebar = ({ mobileOpen, onClose, onLogout, user }) => {
  return (
    <aside
      className={`${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col overflow-hidden border-r border-slate-200/80 bg-white transition-transform duration-200 md:translate-x-0`}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <BrandLogo to="/admin/dashboard" />
        <button
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 md:hidden"
          onClick={onClose}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <div className="mx-4 mt-4 rounded-xl border border-slate-100 bg-[#1D2951]/5 p-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="uppercase tracking-wider text-[10px] text-[#1D2951] font-extrabold flex items-center gap-1">
            <Sliders className="h-3.5 w-3.5 text-[#F25251]" />
            Administration
          </span>
        </div>
        <p className="mt-1 text-xs font-bold text-[#1D2951] truncate">{user?.fullName || 'Musa Zulu'}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{user?.email}</p>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#1D2951] text-white shadow-sm shadow-[#1D2951]/20'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-[#1D2951]'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-[#1D2951]">
            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
              {user?.fullName?.split(/\s+/).map((name) => name[0]).join('').slice(0, 2)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-[#1D2951]">{user?.fullName || 'Musa Zulu'}</p>
            <p className="truncate text-[11px] text-slate-400">{user ? getStatusMetadata(user.role).label : ''}</p>
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

export const AdminLayout = () => {
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
    if (path.includes('dashboard')) return { title: 'Executive Operations', subtitle: 'User, attendance and support operations' };
    if (path.includes('users')) return { title: 'User Management', subtitle: 'Candidates, Tech Champions and administrative privileges' };
    if (path.includes('escalations')) return { title: 'Blockers & Tickets', subtitle: 'Support ticket tracking and resolution' };
    if (path.includes('audit-log')) return { title: 'System Audit Trail', subtitle: 'Immutable compliance logging and security tracking' };
    if (path.includes('reports')) return { title: 'Executive Analytics', subtitle: 'Attendance and WFH request summaries' };
    return { title: 'Administration Console', subtitle: 'CAPACITI Workforce Management' };
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

export default AdminLayout;
