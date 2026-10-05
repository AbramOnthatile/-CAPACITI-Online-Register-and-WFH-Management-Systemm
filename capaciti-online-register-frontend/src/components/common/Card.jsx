const Card = ({ title, subtitle, actions, children, className = '' }) => (
  <div className={`card ${className}`}>
    {(title || subtitle || actions) && (
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          {title && <h3 className="text-lg font-semibold text-slate-900">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions}
      </div>
    )}
    <div className="p-5">{children}</div>
  </div>
);

export default Card;
