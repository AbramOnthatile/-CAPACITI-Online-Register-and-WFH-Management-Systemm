import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Standard page heading used by every screen: optional back link, eyebrow,
 * title, description and a right-aligned action area that sits under the title until there is room beside it (lg).
 */
const PageHeader = ({ eyebrow, title, description, actions, backTo, backLabel = 'Back', eyebrowClassName = '' }) => (
  <header className="page-header">
    <div className="flex min-w-0 items-start gap-3">
      {backTo && (
        <Link to={backTo} className="icon-btn mt-0.5" aria-label={backLabel} title={backLabel}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}
      <div className="min-w-0">
        {eyebrow && <p className={`eyebrow ${eyebrowClassName}`}>{eyebrow}</p>}
        <h2 className={`page-title break-words ${eyebrow ? 'mt-1' : ''}`}>{title}</h2>
        {description && <p className="page-subtitle mt-1">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end [&>*]:flex-1 sm:[&>*]:flex-none">{actions}</div>}
  </header>
);

export default PageHeader;
