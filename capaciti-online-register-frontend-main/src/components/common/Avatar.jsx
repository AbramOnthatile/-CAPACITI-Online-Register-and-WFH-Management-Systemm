const sizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-base',
  xl: 'h-24 w-24 text-2xl',
};

export const initials = (name = '') => name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const Avatar = ({ name, size = 'md', className = '' }) => (
  <span className={`avatar ${sizes[size] ?? sizes.md} ${className}`} aria-hidden="true">
    {initials(name)}
  </span>
);

export default Avatar;
