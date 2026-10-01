import { Home, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ErrorPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
    <div className="card max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">404</p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">The page you are looking for does not exist or has moved.</p>
      <Link to="/login" className="btn-primary mt-6 inline-flex">
        <Home className="mr-2 h-4 w-4" />
        Return Home
      </Link>
    </div>
  </div>
);

export default ErrorPage;
