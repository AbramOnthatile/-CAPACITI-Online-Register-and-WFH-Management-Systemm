import { Link } from 'react-router-dom';

const BrandLogo = ({ compact = false, className = '', to = '/' }) => {
  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      {compact ? (
        <img
          src="/images/capaciti-icon.svg"
          alt="CAPACITI icon"
          className="h-9 w-9 object-contain drop-shadow-sm"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div className="flex items-center gap-3">
          <img
            src="/images/capaciti-icon.svg"
            alt="CAPACITI icon"
            className="h-9 w-9 object-contain drop-shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-[#1D2951] leading-none">
              CAPA<span className="text-[#6115D0]">CITI</span>
            </span>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#F25251] mt-0.5">
              UVU Africa Division
            </span>
          </div>
        </div>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="inline-block transition-opacity hover:opacity-90">{content}</Link>;
  }

  return content;
};

export default BrandLogo;
