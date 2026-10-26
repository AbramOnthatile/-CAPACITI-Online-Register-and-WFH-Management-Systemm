import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AccessDeniedPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
    <div className="surface w-full max-w-md p-6 text-center sm:p-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
        <ShieldAlert className="h-7 w-7" />
      </span>
      <h1 className="page-title mt-4">Access restricted</h1>
      <p className="page-subtitle mt-2">Your current CAPACITI system role does not have authorization to view this module. Please switch to an authorized role.</p>
      <Link to="/" className="btn btn-dark mt-6 w-full sm:w-auto">
        <ArrowLeft className="h-4 w-4" />
        Back to your portal
      </Link>
    </div>
  </div>
);

export default AccessDeniedPage;
