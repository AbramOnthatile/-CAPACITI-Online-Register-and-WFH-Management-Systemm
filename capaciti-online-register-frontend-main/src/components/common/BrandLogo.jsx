import { Link } from 'react-router-dom';

const BrandLogo = ({ compact = false, className = '', to = '/' }) => {
  const logo = (
    <img
      src={compact ? '/images/capaciti-icon.png' : '/images/capaciti-logo1.png'}
      alt={compact ? 'CAPACITI icon' : 'CAPACITI, a division of UVU Africa'}
      className={compact ? 'h-9 w-9 object-contain drop-shadow-sm' : 'h-9 w-auto max-w-[165px] object-contain'}
    />
  );

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {compact ? (
        logo
      ) : (
        logo
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="inline-block transition-opacity hover:opacity-90">{content}</Link>;
  }

  return content;
};

export default BrandLogo;
