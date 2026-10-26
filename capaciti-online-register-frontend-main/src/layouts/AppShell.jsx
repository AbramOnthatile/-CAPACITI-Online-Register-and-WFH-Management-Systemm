import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BrandLogo from '../components/common/BrandLogo';
import TopBar from '../components/common/TopBar';
import Avatar from '../components/common/Avatar';

const accents = {
  primary: 'bg-primary-600 text-white shadow-sm shadow-primary-600/20',
  navy: 'bg-navy text-white shadow-sm shadow-navy/20',
};

const isTabActive = (pathname, tab) => (tab.match ?? [tab.to]).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/**
 * Shared shell for every role:
 * - md+: fixed left sidebar + sticky top bar
 * - phones: either a slide-in drawer (staff roles) or, when `mobileTabs` is given,
 *   an app-style bottom tab bar (candidate experience).
 */
const AppShell = ({ navItems, homePath, accent = 'navy', workspace, roleLabel, getPageInfo, mobileTabs }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { title, subtitle } = getPageInfo(location.pathname);

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy/40 backdrop-blur-sm md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 md:z-30 md:w-64 md:translate-x-0`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <BrandLogo to={homePath} />
          <button type="button" className="btn btn-ghost btn-sm h-9 w-9 p-0 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        {workspace && (
          <div className="mx-3 mt-4 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-navy">
              {workspace.icon && <workspace.icon className="h-3.5 w-3.5 text-salmon" />}
              {workspace.label}
            </p>
            {workspace.detail && <p className="mt-1 truncate text-xs text-slate-500">{workspace.detail}</p>}
          </div>
        )}

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-3" aria-label="Main">
          {navItems.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  isActive ? accents[accent] : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <Avatar name={user?.fullName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-navy">{user?.fullName ?? ''}</p>
              <p className="truncate text-xs text-slate-400">{roleLabel ?? user?.email}</p>
            </div>
            <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm h-9 w-9 p-0 hover:bg-rose-50 hover:text-rose-600" title="Sign out" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col md:pl-64">
        <TopBar onOpenMenu={() => setMobileOpen(true)} title={title} subtitle={subtitle} mobileTabs={Boolean(mobileTabs)} />
        <main className={`mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${mobileTabs ? 'pb-tabbar md:pb-8' : ''}`}>
          <Outlet />
        </main>
      </div>

      {mobileTabs && (
        <nav className="tabbar-safe fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 backdrop-blur-md md:hidden" aria-label="Primary">
          <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, minmax(0, 1fr))` }}>
            {mobileTabs.map((tab) => {
              const active = isTabActive(location.pathname, tab);
              const Icon = tab.icon;
              return (
                <li key={tab.to}>
                  <NavLink
                    to={tab.to}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${active ? 'text-primary-600' : 'text-slate-400 hover:text-navy'}`}
                  >
                    <span className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${active ? 'bg-primary-600/10' : ''}`}>
                      <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                    </span>
                    {tab.label}
                    {tab.badge && <span className="absolute right-[calc(50%-1.1rem)] top-2.5 h-2 w-2 rounded-full bg-salmon ring-2 ring-white" />}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
};

export default AppShell;
