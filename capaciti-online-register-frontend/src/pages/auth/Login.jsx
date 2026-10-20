import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/common/BrandLogo';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: 'candidate@capaciti.test', password: 'Password123!' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const nextErrors = {};
    if (!form.email) nextErrors.email = 'Email is required';
    if (!form.password) nextErrors.password = 'Password is required';
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (!result.success) {
      setErrors({ form: result.message });
      return;
    }

    const rolePath = {
      candidate: '/candidate/dashboard',
      'tech-champion': '/champion/dashboard',
      admin: '/admin/dashboard',
    };

    navigate(rolePath[result.user.role] || '/login');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-pink/40 px-4 py-6 sm:px-6">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-navy/10 bg-white shadow-[0_30px_90px_-35px_rgba(29,41,81,0.5)] md:grid-cols-2">
        <aside className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden bg-navy px-7 py-8 text-white sm:px-10 md:min-h-[38rem] md:px-12 md:py-10">
          <div className="absolute inset-0 bg-gradient-to-br from-pink/45 via-pink/10 to-primary-600/25" />
          <div className="absolute -right-14 -top-14 h-48 w-48 rotate-12 border-[28px] border-salmon/20" />
          <div className="absolute -bottom-16 -left-16 h-56 w-56 rotate-45 bg-primary-600/20" />
          <div className="relative z-20">
            <BrandLogo className="relative z-20 max-w-[14rem] drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]" />
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-white">Online Register & WFH Management</p>
            <h1 className="mt-4 max-w-md text-3xl font-black leading-tight tracking-[-0.04em] text-white drop-shadow-sm sm:text-4xl">Built for stronger, more connected work.</h1>
          </div>
          <div className="relative z-10 mt-10 space-y-4 text-sm leading-6 text-white">
            <p className="font-medium">Track attendance, submit WFH requests, and review progress in one secure platform.</p>
            <div className="rounded-2xl border border-white/20 bg-navy/70 p-4 shadow-lg backdrop-blur-md">
              <p className="font-bold text-white">Demo access</p>
              <p className="mt-2 break-all text-white/90">candidate@capaciti.test / champion@capaciti.test / admin@capaciti.test</p>
              <p className="mt-1 text-white/90">Password: Password123!</p>
            </div>
          </div>
        </aside>

        <div className="bg-white px-6 py-8 text-navy sm:px-10 md:px-12 md:py-10">
          <div className="mb-8">
            <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-salmon">Welcome back</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-navy">Sign in</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Enter your details to access your CAPACITI workspace.</p>
          </div>

          <form className="space-y-5 text-navy" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700">Email address</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input text-slate-800 placeholder:text-slate-400"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && <p id="email-error" className="mt-1.5 text-sm font-medium text-red-600">{errors.email}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="text-sm font-bold text-slate-700">Password</label>
                <span className="text-xs font-medium text-primary-600">Secure login</span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="input pr-12 text-slate-800 placeholder:text-slate-400"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 my-auto rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-navy focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="mt-1.5 text-sm font-medium text-red-600">{errors.password}</p>}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-600" />
              Remember me
            </label>

            {errors.form && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errors.form}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-base">
              <LogIn className="mr-2 h-5 w-5" />
              {loading ? 'Logging in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Login;
