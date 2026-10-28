import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, Sparkles, Shield, GraduationCap, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, WfhStatus } from '../../api/types';
import StatusBadge from '../../components/common/StatusBadge';
import { demoOnly } from '../../mocks/demoOnly';
import { useMocks } from '../../api/mockMode';
import { ApiError, getFieldError, getUserErrorMessage } from '../../api/client';

const rolePath = {
  [UserRole.CANDIDATE]: '/candidate/dashboard',
  [UserRole.TECH_CHAMP]: '/champion/dashboard',
  [UserRole.ADMIN]: '/admin/dashboard',
};
const iconByRole = {
  [UserRole.CANDIDATE]: GraduationCap,
  [UserRole.TECH_CHAMP]: Award,
  [UserRole.ADMIN]: Shield,
};
const Login = () => {
  const navigate = useNavigate();
  const { user, login, loading: authLoading, error: authError } = useAuth();
  const demoAccounts = demoOnly.demoAccounts.map((account) => ({ ...account, icon: iconByRole[account.role] }));
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // If already authenticated, redirect to the user's portal
  useEffect(() => {
    if (user) {
      navigate(rolePath[user.role] || '/candidate/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) nextErrors.email = 'Email address is required';
    if (!form.password.trim()) nextErrors.password = 'Password is required';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    await authenticate(form.email, form.password);
  };

  const authenticate = async (email, password) => {
    setLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setErrors({ form: result.message });
        return;
      }
      navigate(rolePath[result.user.role] || '/login');
    } catch (loginError) {
      setErrors({
        form: getUserErrorMessage(loginError, 'Sign in failed.'),
        ...(loginError instanceof ApiError ? loginError.fieldErrors : {}),
      });
    } finally {
      setLoading(false);
    }
  };

  // One feedback line: this sign-in's error, or a failed session check when there is none.
  const feedback = errors.form ?? authError?.message;

  // Signs straight in with the seeded demo password; without one configured it only fills the email.
  const handleDemoLogin = (email) => {
    const password = useMocks ? 'mock' : demoOnly.password;
    setForm({ email, password: '' });
    setErrors({});
    if (password) void authenticate(email, password);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FC] p-4 sm:p-6 lg:p-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-[0_24px_64px_-12px_rgba(29,41,81,0.12)] md:grid-cols-12">
        {/* Left Brand & Demo Access Panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-[#1D2951] p-8 text-white md:col-span-5 lg:p-10">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#6115D0]/30 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#F25251]/20 blur-3xl pointer-events-none" />

          {/* Top: Logo & Division */}
          <div className="relative z-10">
            <div className="inline-flex rounded-lg bg-white px-3 py-2">
              <img
                src="/images/capaciti-logo1.png"
                alt="CAPACITI, a division of UVU Africa"
                className="h-12 w-auto max-w-full object-contain"
              />
            </div>

            <div className="mt-10 space-y-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase text-[#F1D1D1]">
                Workforce Management System
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-white">
                Online Register & Remote Work Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Role-based platform for daily attendance, work-from-home requests, check-ins, and support.
              </p>
            </div>
          </div>

          {/* 1-Click Demo Sign-in Section */}
          <div className="relative z-10 mt-8 rounded-2xl border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#F1D1D1] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#F25251]" />
                Demo Accounts
              </p>
            </div>
            <div className="space-y-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    disabled={loading || authLoading}
                    aria-disabled={loading || authLoading}
                    title={!useMocks && !demoOnly.password ? demoOnly.notice : undefined}
                    onClick={() => handleDemoLogin(acc.email)}
                    aria-pressed={form.email === acc.email}
                    className={`group flex w-full items-center justify-between rounded-xl p-2.5 text-xs text-white transition-all text-left ring-1 ${
                      form.email === acc.email ? 'bg-white/20 ring-white/60' : 'bg-white/10 ring-transparent hover:bg-white/20'
                    }`}
                  >
                    {/* MOCK-ONLY: not in backend */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 shrink-0">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="font-bold leading-tight truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-300 truncate">{acc.title} · {acc.email}</p>
                      </div>
                    </div>
                    {/* MOCK-ONLY: not in backend */}
                    <StatusBadge status={WfhStatus.PENDING}>Demo</StatusBadge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="p-8 sm:p-10 md:col-span-7 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#1D2951]">Welcome Back</h2>
            <p className="mt-1 text-xs text-slate-500">
              Enter your account credentials to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <input
                type="email"
                autoComplete="email"
                className="input text-xs"
                placeholder="name@capaciti.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              {(getFieldError(errors, 'email') || errors.email) && <p className="mt-1 text-xs font-medium text-rose-600">{getFieldError(errors, 'email') || errors.email}</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-10 text-xs"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {(getFieldError(errors, 'password') || errors.password) && <p className="mt-1 text-xs font-medium text-rose-600">{getFieldError(errors, 'password') || errors.password}</p>}
            </div>

            {feedback && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || authLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#6115D0] py-3 text-xs font-bold text-white shadow-md hover:bg-[#4F11AA] transition-all disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>{authLoading ? 'Checking session...' : loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default Login;
