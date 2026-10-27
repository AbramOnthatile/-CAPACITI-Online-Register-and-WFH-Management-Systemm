import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Bell, Menu, Shield, GraduationCap, Award, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../api/types';
import { formatSastDate } from '../../lib/time';
import Avatar from './Avatar';

const roleBadges = {
  [UserRole.CANDIDATE]: { label: 'Candidate', icon: GraduationCap, style: 'border-primary-600/20 bg-primary-600/10 text-primary-600' },
  [UserRole.TECH_CHAMP]: { label: 'Tech Champion', icon: Award, style: 'border-navy/20 bg-navy/10 text-navy' },
  [UserRole.ADMIN]: { label: 'Administrator', icon: Shield, style: 'border-salmon/20 bg-salmon/10 text-salmon' },
};

/**
 * Sticky app header. `mobileTabs` switches the phone layout to an app-style bar
 * (brand icon + title, no hamburger) because navigation lives in the bottom tab bar.
 */
const TopBar = ({ onOpenMenu, title, subtitle, mobileTabs = false }) => {
  const { user, logout } = useAuth();
  const { notifications } = useApp();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const currentTimeIso = currentTime.toISOString();
  const formattedTime = formatSastDate(currentTimeIso, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedDate = formatSastDate(currentTimeIso, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const roleBadge = roleBadges[user?.role] ?? roleBadges[UserRole.ADMIN];
  const RoleIcon = roleBadge.icon;
  const hasUnread = notifications.some((item) => !item.read);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {mobileTabs ? (
            <img src="/images/capaciti-icon.svg" alt="" className="h-8 w-8 shrink-0 object-contain md:hidden" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          ) : (
            <button type="button" onClick={onOpenMenu} className="icon-btn h-9 w-9 md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight text-navy sm:text-lg">{title || 'Dashboard'}</h1>
            {subtitle && <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-1.5 text-xs text-slate-700 lg:flex">
          <Clock className="h-3.5 w-3.5 text-primary-600" />
          <span className="font-semibold">{formattedDate}</span>
          <span className="text-slate-300">|</span>
          <span className="font-mono font-bold tabular-nums text-navy">{formattedTime} SAST</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className={`pill hidden sm:inline-flex ${roleBadge.style}`}>
            <RoleIcon className="h-3 w-3" />
            {roleBadge.label}
          </span>

          {user?.role === UserRole.CANDIDATE && (
            <Link to="/candidate/notifications" className="icon-btn relative h-9 w-9" aria-label={hasUnread ? 'Notifications (unread)' : 'Notifications'}>
              <Bell className="h-4 w-4" />
              {hasUnread && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-salmon ring-2 ring-white" />}
            </Link>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl p-0.5 transition-colors hover:bg-slate-100 xl:pr-2"
              aria-haspopup="menu"
              aria-expanded={profileDropdownOpen}
              aria-label="Account menu"
            >
              <Avatar name={user?.fullName} size="sm" className="h-9 w-9" />
              <span className="hidden text-left xl:block">
                <span className="block text-xs font-bold leading-none text-navy">{user?.fullName}</span>
                <span className="mt-0.5 block text-[10px] text-slate-400">{roleBadge.label}</span>
              </span>
              <ChevronDown className="hidden h-3.5 w-3.5 text-slate-400 xl:block" />
            </button>

            {profileDropdownOpen && (
              <div role="menu" className="surface absolute right-0 z-50 mt-2 w-64 p-1.5" style={{ boxShadow: 'var(--shadow-raised)' }}>
                <div className="border-b border-slate-100 p-3">
                  <p className="truncate text-sm font-bold text-navy">{user?.fullName}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">{user?.email}</p>
                  <span className={`pill mt-2 ${roleBadge.style}`}>{roleBadge.label}</span>
                </div>
                <div className="pt-1.5">
                  {user?.role === UserRole.CANDIDATE && (
                    <Link
                      to="/candidate/profile"
                      role="menuitem"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <User className="h-4 w-4 text-slate-400" />
                      My profile
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
