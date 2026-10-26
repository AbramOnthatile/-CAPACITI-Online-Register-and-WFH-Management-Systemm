const Card = ({ title, subtitle, actions, children, className = '', headerClassName = '', contentClassName = '' }) => (
  <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_12px_-2px_rgba(29,41,81,0.04)] transition-all hover:border-slate-300/90 ${className}`}>
    {(title || subtitle || actions) && (
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4.5 ${headerClassName}`}>
        <div>
          {title && <h3 className="text-base font-bold tracking-tight text-[#1D2951]">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={`p-6 ${contentClassName}`}>{children}</div>
  </div>
);

export default Card;
