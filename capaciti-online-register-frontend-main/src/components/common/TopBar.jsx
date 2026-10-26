import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Bell, Menu, Shield, GraduationCap, Award, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, WfhStatus } from '../../api/types';
import StatusBadge from './StatusBadge';
import { demoOnly } from '../../mocks/demoOnly';

const TopBar = ({ onOpenMenu, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
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

  const formattedTime = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(currentTime);

  const formattedDate = new Intl.DateTimeFormat('en-ZA', {
    timeZone: 'Africa/Johannesburg',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(currentTime);

  const getRoleBadge = () => {
    if (user?.role === UserRole.CANDIDATE) {
      return {
        label: 'Candidate',
        icon: GraduationCap,
        style: 'bg-[#6115D0]/10 text-[#6115D0] border-[#6115D0]/20',
      };
    }
    if (user?.role === UserRole.TECH_CHAMP) {
      return {
        label: 'Tech Champion',
        icon: Award,
        style: 'bg-[#1D2951]/10 text-[#1D2951] border-[#1D2951]/20',
      };
    }
    return {
      label: 'Administrator',
      icon: Shield,
      style: 'bg-[#F25251]/10 text-[#F25251] border-[#F25251]/20',
    };
  };

  const roleBadge = getRoleBadge();
  const RoleIcon = roleBadge.icon;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 md:px-8">
      {/* Left: Mobile Toggle & Context Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="rounded-xl border border-slate-200 p-2 text-[#1D2951] hover:bg-slate-100 md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base font-bold tracking-tight text-[#1D2951] sm:text-lg leading-tight">
            {title || 'Dashboard'}
          </h1>
          {subtitle && (
            <p className="hidden text-xs font-medium text-slate-500 sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Center: Live Digital Clock (SAST) */}
      <div className="hidden items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-1.5 text-xs text-slate-700 lg:flex">
        <Clock className="h-3.5 w-3.5 text-[#6115D0]" />
        <span className="font-semibold">{formattedDate}</span>
        <span className="text-slate-300">|</span>
        <span className="font-mono tabular-nums font-bold text-[#1D2951]">{formattedTime} SAST</span>
      </div>

      {/* Right: Notifications & User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Tag */}
        <div
          className={`hidden sm:inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${roleBadge.style}`}
        >
          <RoleIcon className="h-3.5 w-3.5" />
          <span>{roleBadge.label}</span>
        </div>

        {/* Notifications (Candidate only) */}
        {user?.role === UserRole.CANDIDATE && (
          <button
            type="button"
            disabled
            aria-disabled="true"
            title={demoOnly.notice}
            className="relative rounded-xl border border-slate-200 p-2 text-slate-600 opacity-70"
            aria-label="Notifications (demo only)"
          >
            <Bell className="h-4 w-4" />
            {/* MOCK-ONLY: not in backend */}
            <span className="absolute -right-2 -top-2"><StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge></span>
          </button>
        )}

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl border border-transparent p-1 hover:border-slate-200 hover:bg-slate-50 transition-all text-left"
          >
            <div className="h-8 w-8 overflow-hidden rounded-full border border-slate-200 bg-[#1D2951] shrink-0">
              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                {user?.fullName?.split(/\s+/).map((name) => name[0]).join('').slice(0, 2)}
              </div>
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-bold text-[#1D2951] leading-none">{user?.fullName}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{roleBadge.label}</p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden xl:block" />
          </button>

          {/* Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 z-50">
              <div className="p-3 border-b border-slate-100">
                <p className="text-xs font-bold text-[#1D2951] truncate">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">{user?.email}</p>
                <span className="mt-2 inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                  {roleBadge.label}
                </span>
              </div>

              {user?.role === UserRole.CANDIDATE && (
                <Link
                  to="/candidate/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>View Trainee Profile</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
