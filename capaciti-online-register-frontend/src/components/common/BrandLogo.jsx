const BrandLogo = ({ compact = false, className = '' }) => (
  <img
    src="/images/capaciti-logo1.png"
    alt="CAPACITI — A Division of UVU Africa"
    className={`h-auto object-contain ${compact ? 'w-11' : 'w-full max-w-[13rem]'} ${className}`}
  />
);

export default BrandLogo;
