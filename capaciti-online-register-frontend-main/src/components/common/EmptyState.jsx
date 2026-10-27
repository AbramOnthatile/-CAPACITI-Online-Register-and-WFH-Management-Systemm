const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => (
  <div className={`empty-state ${className}`}>
    {Icon && (
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
    )}
    {title && <p className="mt-3 text-sm font-bold text-navy">{title}</p>}
    {description && <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
