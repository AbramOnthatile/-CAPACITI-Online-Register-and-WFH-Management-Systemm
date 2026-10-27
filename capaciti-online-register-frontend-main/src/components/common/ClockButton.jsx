import { CheckCircle2, Clock, LogOut } from 'lucide-react';

const actionIcons = {
  'clock-in': CheckCircle2,
  'clock-out': LogOut,
};

const actionLabels = {
  'clock-in': 'Clock in',
  'clock-out': 'Clock out',
};

const ClockButton = ({
  action = 'clock-in',
  label = actionLabels[action],
  disabled = false,
  pending = false,
  onClick,
  className,
  iconClassName = 'h-5 w-5',
  icon,
}) => {
  const Icon = pending ? Clock : icon ?? actionIcons[action];

  return (
    <button
      type="button"
      disabled={disabled || pending}
      aria-busy={pending}
      onClick={onClick}
      className={className}
    >
      <Icon className={iconClassName} />
      {pending ? 'Saving...' : label}
    </button>
  );
};

export default ClockButton;
