import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AccessDeniedPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FC] p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-black text-[#1D2951]">Access Restricted</h1>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          Your current CAPACITI system role does not have authorization to view this module. Please switch to an authorized role.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1D2951] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0F172A] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Your Portal</span>
        </Link>
      </div>
    </div>
  );
};

export default AccessDeniedPage;
