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
        <div
          className={clsx(
            'relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 ring-2',
            ring,
            'bg-gradient-to-br',
            player.position.group === 'GK' && 'from-yellow-500/30 to-night-900',
            player.position.group === 'DEF' && 'from-sky-500/30 to-night-900',
            player.position.group === 'MID' && 'from-emerald-500/30 to-night-900',
            player.position.group === 'FWD' && 'from-red-500/30 to-night-900',
          )}
        >
          {player.headshotUrl && !imgFailed ? (
            <img
              src={player.headshotUrl}
              alt={player.name}
              loading="lazy"
              className="w-full h-full object-cover"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
              {initials || '?'}
            </div>
          )}
          {player.stats.appearances > 0 && (
            <div className="absolute -bottom-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-pitch-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-night-900">
              {player.stats.appearances}
            </div>
          )}
        </div>

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
