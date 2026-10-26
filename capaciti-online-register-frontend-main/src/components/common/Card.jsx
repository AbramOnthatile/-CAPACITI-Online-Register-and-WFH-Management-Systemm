const Card = ({ title, subtitle, actions, children, className = '', headerClassName = '', contentClassName = '', as: Tag = 'section' }) => (
  <Tag className={`surface ${className}`}>
    {(title || subtitle || actions) && (
      <div className={`card-header ${headerClassName}`}>
        <div className="min-w-0">
          {title && <h3 className="section-title">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={`card-body ${contentClassName}`}>{children}</div>
  </Tag>
);

export default Card;
