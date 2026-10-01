import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const AccessDeniedPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
    <div className="card max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">403</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 text-sm text-slate-600">You do not have permission to access this section of the platform.</p>
      <Link to="/login" className="btn-secondary mt-6 inline-flex">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Return to login
      </Link>
    </div>
  </div>
);

export default AccessDeniedPage;
