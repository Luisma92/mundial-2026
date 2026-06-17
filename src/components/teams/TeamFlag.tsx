import { clsx } from 'clsx';
import { useState } from 'react';
import type { Team } from '@/lib/types';

interface TeamFlagProps {
  team: Team;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showRing?: boolean;
  ringColor?: string;
}

const SIZE_MAP: Record<NonNullable<TeamFlagProps['size']>, string> = {
  xs: 'w-5 h-3.5',
  sm: 'w-7 h-5',
  md: 'w-10 h-7',
  lg: 'w-14 h-10',
  xl: 'w-20 h-14',
  '2xl': 'w-28 h-20',
};

export function TeamFlag({ team, size = 'md', className, showRing = false, ringColor }: TeamFlagProps) {
  const [errored, setErrored] = useState(false);
  const initials = team.shortName.slice(0, 3).toUpperCase();
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[3px] shadow-sm shrink-0',
        SIZE_MAP[size],
        showRing && 'ring-2 ring-offset-1 ring-offset-night-900',
        className,
      )}
      style={showRing ? { boxShadow: `0 0 0 2px ${ringColor ?? team.color}` } : undefined}
      title={team.name}
    >
      {!errored ? (
        <img
          src={team.flagUrl}
          alt={team.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-[8px] font-bold text-white/90"
          style={{ background: `linear-gradient(135deg, ${team.color} 0%, ${team.color}cc 100%)` }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
