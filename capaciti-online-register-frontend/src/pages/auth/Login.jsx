import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft md:grid-cols-2">
        <div className="grid-hero flex flex-col justify-between bg-primary-600 p-8 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-100">CAPACITI</p>
            <h1 className="mt-4 text-4xl font-bold">Online Register & WFH Management</h1>
          </div>
          <div className="mt-8 space-y-4 text-sm text-primary-50">
            <p>Track attendance, submit WFH requests, and review progress in one secure platform.</p>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="font-semibold">Demo access</p>
              <p className="mt-2">candidate@capaciti.test / champion@capaciti.test / admin@capaciti.test</p>
              <p className="mt-1 text-primary-100">Password: Password123!</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary-600">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Sign in</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  aria-invalid={Boolean(errors.password)}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-3 my-auto text-slate-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-primary-600" />
                Remember me
              </label>
            </div>

            {errors.form && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errors.form}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
