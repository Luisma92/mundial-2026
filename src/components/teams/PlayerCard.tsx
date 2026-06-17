import { motion } from 'framer-motion';
import { useState } from 'react';
import { clsx } from 'clsx';
import { ShieldAlert, Goal } from 'lucide-react';
import type { Player, PlayerPositionGroup } from '@/lib/types';

interface PlayerCardProps {
  player: Player;
}

const GROUP_RING: Record<PlayerPositionGroup, string> = {
  GK: 'ring-yellow-500/40',
  DEF: 'ring-sky-500/40',
  MID: 'ring-emerald-500/40',
  FWD: 'ring-red-500/40',
};

const GROUP_LABEL: Record<PlayerPositionGroup, string> = {
  GK: 'Arquero',
  DEF: 'Defensor',
  MID: 'Mediocampista',
  FWD: 'Delantero',
};

export function PlayerCard({ player }: PlayerCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const stats = player.stats;
  const ring = GROUP_RING[player.position.group];
  const initials = player.shortName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase();

  const hasPhoto = !!player.headshotUrl && !imgFailed;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={clsx(
        'relative rounded-2xl glass p-4 flex flex-col gap-3 hover:bg-white/[0.04] transition-colors ring-1',
        ring,
      )}
    >
      <div className="flex items-start gap-3">
        <PlayerAvatar
          player={player}
          initials={initials}
          ringClass={ring}
          hasPhoto={hasPhoto}
          onPhotoError={() => setImgFailed(true)}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-bold text-white text-sm leading-tight truncate">{player.shortName || player.name}</span>
            {player.jersey && (
              <span className="text-[10px] font-mono text-night-400">#{player.jersey}</span>
            )}
          </div>
          <div className="text-[10px] text-night-400 uppercase tracking-wider mt-0.5">{GROUP_LABEL[player.position.group]}</div>
          {player.age !== undefined && (
            <div className="text-[10px] text-night-500 mt-0.5">{player.age} años · {player.position.abbreviation}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/5">
        <StatCell label="Goles" value={stats.goals} highlight={stats.goals > 0} icon={<Goal className="w-3 h-3" />} />
        <StatCell label="Asist" value={stats.assists} highlight={stats.assists > 0} />
        <StatCell label="PJ" value={stats.appearances} />
        <StatCell label="Tiros" value={stats.shots} subValue={stats.shotsOnTarget} />
      </div>

      {player.position.group === 'GK' && (stats.saves !== undefined || stats.goalsConceded !== undefined) && (
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
          <StatCell label="Atajadas" value={stats.saves ?? 0} highlight={(stats.saves ?? 0) > 0} />
          <StatCell label="Goles rec." value={stats.goalsConceded ?? 0} accent={(stats.goalsConceded ?? 0) > 0 ? 'text-red-400' : ''} />
          <StatCell label="Clean sheet" value={stats.cleanSheets ?? 0} highlight={(stats.cleanSheets ?? 0) > 0} icon={<ShieldAlert className="w-3 h-3" />} />
        </div>
      )}

      {(stats.yellowCards > 0 || stats.redCards > 0) && (
        <div className="flex items-center gap-2 text-[10px]">
          {stats.yellowCards > 0 && (
            <span className="inline-flex items-center gap-1 text-yellow-300">
              <span className="w-2.5 h-3.5 bg-yellow-400 rounded-sm" />
              {stats.yellowCards}
            </span>
          )}
          {stats.redCards > 0 && (
            <span className="inline-flex items-center gap-1 text-red-400">
              <span className="w-2.5 h-3.5 bg-red-500 rounded-sm" />
              {stats.redCards}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

interface PlayerAvatarProps {
  player: Player;
  initials: string;
  ringClass: string;
  hasPhoto: boolean;
  onPhotoError: () => void;
}

function PlayerAvatar({ player, initials, ringClass, hasPhoto, onPhotoError }: PlayerAvatarProps) {
  if (hasPhoto && player.headshotUrl) {
    return (
      <div className={clsx('relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 ring-2', ringClass)}>
        <img
          src={player.headshotUrl}
          alt={player.name}
          loading="lazy"
          className="w-full h-full object-cover bg-night-800"
          onError={onPhotoError}
        />
        {player.stats.appearances > 0 && (
          <div className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-pitch-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-night-900">
            {player.stats.appearances}
          </div>
        )}
      </div>
    );
  }

  const baseColor = player.color || '#444';
  const jersey = player.jersey ?? '';
  return (
    <div
      className={clsx('relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 ring-2', ringClass)}
      style={{
        background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}cc 60%, ${darken(baseColor, 30)} 100%)`,
      }}
      aria-label={player.name}
    >
      <div
        className="absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          background: 'repeating-linear-gradient(135deg, transparent 0, transparent 6px, rgba(255,255,255,0.4) 6px, rgba(255,255,255,0.4) 7px)',
        }}
      />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)',
        }}
      />
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        <span className="font-display font-black text-2xl text-white drop-shadow-md leading-none tracking-tighter">
          {initials || '?'}
        </span>
        {jersey && (
          <span className="font-mono font-bold text-[10px] text-white/90 mt-0.5">#{jersey}</span>
        )}
      </div>
      {player.stats.appearances > 0 && (
        <div className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-pitch-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-night-900">
          {player.stats.appearances}
        </div>
      )}
    </div>
  );
}

function darken(hex: string, amount: number): string {
  const m = hex.match(/^#?([a-f0-9]{6})$/i);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const f = 1 - amount / 100;
  r = Math.max(0, Math.min(255, Math.round(r * f)));
  g = Math.max(0, Math.min(255, Math.round(g * f)));
  b = Math.max(0, Math.min(255, Math.round(b * f)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface StatCellProps {
  label: string;
  value: number;
  subValue?: number;
  highlight?: boolean;
  accent?: string;
  icon?: React.ReactNode;
}

function StatCell({ label, value, subValue, highlight, accent, icon }: StatCellProps) {
  return (
    <div className="text-center">
      <div
        className={clsx(
          'font-mono font-black text-base tabular-nums leading-none',
          highlight ? 'text-pitch-300' : accent ?? 'text-white',
        )}
      >
        {value}
        {subValue !== undefined && subValue > 0 && (
          <span className="text-[9px] text-night-400 font-normal">/{subValue}</span>
        )}
        {icon && <span className="inline-flex items-center ml-0.5">{icon}</span>}
      </div>
      <div className="text-[9px] uppercase tracking-widest text-night-400 mt-1">{label}</div>
    </div>
  );
}

