import { useEffect, useId } from 'react';
import { X } from 'lucide-react';

/**
 * Dialog that renders as a bottom sheet on phones and a centred card from `sm` up.
 * `footer` is laid out as stacked full-width buttons on mobile and a right-aligned row on larger screens.
 */
const Modal = ({ title, description, children, footer, onClose, closeDisabled = false, size = 'md', as: Tag = 'section', onSubmit }) => {
  const titleId = useId();

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape' && !closeDisabled) onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, closeDisabled]);

  return (
    <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !closeDisabled) onClose?.(); }}>
      <Tag
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={onSubmit}
        className={`sheet ${size === 'lg' ? 'sm:max-w-xl' : ''}`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 id={titleId} className="text-lg font-extrabold text-navy">{title}</h3>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} disabled={closeDisabled} className="btn btn-ghost btn-sm -mr-2 -mt-1 h-9 w-9 p-0" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">{footer}</div>}
      </Tag>
    </div>
  );
};

export default Modal;
