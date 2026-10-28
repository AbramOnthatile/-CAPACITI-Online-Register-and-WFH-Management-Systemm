import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Award, Clock, GraduationCap, LogOut, Menu, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { UserRole } from '../api/types';
import { formatSastDate } from '../lib/time';
import BrandLogo from '../components/common/BrandLogo';
import Avatar from '../components/common/Avatar';
import SignOutDialog from '../components/common/SignOutDialog';

const accents = {
  primary: 'bg-primary-600 text-white shadow-sm shadow-primary-600/20',
  navy: 'bg-navy text-white shadow-sm shadow-navy/20',
};

const roleBadges = {
  [UserRole.CANDIDATE]: { label: 'Candidate', icon: GraduationCap, style: 'border-primary-600/20 bg-primary-600/10 text-primary-600' },
  [UserRole.TECH_CHAMP]: { label: 'Tech Champion', icon: Award, style: 'border-navy/20 bg-navy/10 text-navy' },
  [UserRole.ADMIN]: { label: 'Administrator', icon: Shield, style: 'border-salmon/20 bg-salmon/10 text-salmon' },
};

const isTabActive = (pathname, tab) => (tab.match ?? [tab.to]).some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

// Ticks on its own so the rest of the shell does not re-render every second.
const SidebarClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const iso = now.toISOString();
  return (
    <div className="mx-3 mt-4 flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      <Clock className="h-4 w-4 shrink-0 text-primary-600" />
      <div className="min-w-0">
        <p className="font-mono text-sm font-bold tabular-nums leading-tight text-navy">
          {formatSastDate(iso, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          <span className="ml-1 text-[10px] font-semibold text-slate-400">SAST</span>
        </p>
        <p className="truncate text-[11px] text-slate-500">{formatSastDate(iso, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>
    </div>
  );
};

/**
 * Shared shell for every role. All navigation, the clock and the account
 * controls live in the left sidebar; there is no top bar.
 * - md+: fixed sidebar.
 * - phones: a slide-in drawer opened from a slim brand strip (staff roles) or,
 *   when `mobileTabs` is given, an app-style bottom tab bar (candidate experience).
 */
const AppShell = ({ navItems, homePath, profilePath, accent = 'navy', workspace, getPageInfo, mobileTabs }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const { title } = getPageInfo(location.pathname);
  const roleBadge = roleBadges[user?.role] ?? roleBadges[UserRole.ADMIN];
  const RoleIcon = roleBadge.icon;
  const hasUnread = notifications.some((item) => !item.read);
  const accountDetails = (
    <>
      <Avatar name={user?.fullName} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold text-navy">{user?.fullName ?? ''}</span>
        <span className="block truncate text-xs text-slate-400" title={user?.email}>{user?.email}</span>
      </span>
    </>
  );

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  useEffect(() => {
    document.title = title ? `${title} · CAPACITI` : 'CAPACITI';
  }, [title]);

  const handleLogout = () => {
    setConfirmSignOut(false);
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

        <SidebarClock />

        {workspace && (
          <div className="mx-3 mt-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-navy">
              {workspace.icon && <workspace.icon className="h-3.5 w-3.5 text-salmon" />}
              {workspace.label}
            </p>
            {workspace.detail && <p className="mt-1 truncate text-xs text-slate-500">{workspace.detail}</p>}
          </div>
        )}

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3 pb-3" aria-label="Main">
          {navItems.map(({ label, to, icon: Icon, end, showsUnread }) => {
            const unread = showsUnread && hasUnread;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                aria-label={unread ? `${label} (unread)` : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                    isActive ? accents[accent] : 'text-slate-600 hover:bg-slate-50 hover:text-navy'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-salmon" />}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <span className={`pill mx-2 mb-2 mt-1 ${roleBadge.style}`}>
            <RoleIcon className="h-3 w-3" />
            {roleBadge.label}
          </span>
          <div className="flex items-center gap-1">
            {profilePath ? (
              <NavLink
                to={profilePath}
                title="My profile"
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 transition-colors ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'}`
                }
              >
                {accountDetails}
              </NavLink>
            ) : (
              <div className="flex min-w-0 flex-1 items-center gap-3 p-2">{accountDetails}</div>
            )}
            <button
              type="button"
              onClick={() => setConfirmSignOut(true)}
              className="btn btn-ghost btn-sm h-9 w-9 shrink-0 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col md:pl-64">
        {!mobileTabs && (
          <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md md:hidden">
            <button type="button" onClick={() => setMobileOpen(true)} className="icon-btn h-9 w-9" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <BrandLogo to={homePath} />
          </div>
        )}
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

      {confirmSignOut && <SignOutDialog onCancel={() => setConfirmSignOut(false)} onConfirm={handleLogout} />}
    </div>
  );
};

export default AppShell;
