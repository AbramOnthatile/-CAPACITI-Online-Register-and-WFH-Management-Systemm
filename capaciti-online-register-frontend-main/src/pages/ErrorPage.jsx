import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const ErrorPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FC] p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F25251]/10 text-[#F25251]">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-black text-[#1D2951]">Page Not Found</h1>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          The requested page could not be located in the CAPACITI Workforce Management System.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#6115D0] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#4F11AA] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default ErrorPage;
