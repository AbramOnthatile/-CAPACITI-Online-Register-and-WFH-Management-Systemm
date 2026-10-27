import Alert from './Alert';

export const Skeleton = ({ label = 'Loading data' }) => (
  <div role="status" aria-label={label} aria-busy="true" className="animate-pulse space-y-3">
    <span className="sr-only">{label}</span>
    <span className="block h-4 rounded bg-slate-200" />
    <span className="block h-4 w-3/4 rounded bg-slate-200" />
    <span className="block h-4 w-1/2 rounded bg-slate-200" />
  </div>
);

export const ErrorState = ({ message }) => (
  message ? <Alert>{message}</Alert> : null
);
