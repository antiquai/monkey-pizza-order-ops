import { type FC } from "react";

type BadgeType = 'success' | 'pending' | 'sent_to_oven' | 'cancelled' | 'delivery';

interface BadgeProps {
  type: BadgeType;
}

const config: Record<BadgeType, {
  label: string;
  icon: string;
  classes: string;
  spin?: boolean;
}> = {
  success: {
    label: 'Success',
    icon: 'ti-circle-check',
    classes: 'bg-green-500/15 border border-green-500/40 text-green-800',
  },
  pending: {
    label: 'Pending',
    icon: 'ti-loader-2',
    classes: 'bg-amber-500/15 border border-amber-500/40 text-amber-800',
    spin: true,
  },
  sent_to_oven: {
    label: 'Sent to oven',
    icon: 'ti-flame',
    classes: 'bg-blue-500/15 border border-blue-500/40 text-blue-800',
  },
  cancelled: {
    label: 'Cancelled',
    icon: 'ti-circle-x',
    classes: 'bg-red-500/15 border border-red-500/40 text-red-800',
  },
  delivery: {
    label: 'Out for delivery',
    icon: 'ti-bike',
    classes: 'bg-zinc-900 border border-zinc-900 text-white',
  },
};

export const Badge: FC<BadgeProps> = ({ type }) => {
  const { label, icon, classes, spin } = config[type];

  return (
    <span className={`
      inline-flex items-center justify-center gap-1.5
      px-3 py-1 rounded-full
      text-[11px] font-semibold tracking-widest uppercase
      backdrop-blur-sm whitespace-nowrap
      ${classes}
    `}>
      <i className={`ti ${icon} text-sm ${spin ? 'animate-spin' : ''}`} aria-hidden="true" />
      {label}
    </span>
  );
};