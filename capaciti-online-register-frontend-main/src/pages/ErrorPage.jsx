import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const ErrorPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
    <div className="surface w-full max-w-md p-6 text-center sm:p-8">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-salmon/10 text-salmon">
        <AlertCircle className="h-7 w-7" />
      </span>
      <h1 className="page-title mt-4">Page not found</h1>
      <p className="page-subtitle mt-2">The requested page could not be located in the CAPACITI Workforce Management System.</p>
      <Link to="/" className="btn btn-primary mt-6 w-full sm:w-auto">
        <ArrowLeft className="h-4 w-4" />
        Return to dashboard
      </Link>
    </div>
  </div>
);

export default ErrorPage;
