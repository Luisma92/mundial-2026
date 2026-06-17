import { motion } from 'framer-motion';
import { useState } from 'react';
import type { LineupPlayer, TeamLineup, PlayerPositionGroup } from '@/lib/types';

interface MatchLineupsProps {
  lineups: [TeamLineup, TeamLineup];
}

const ROW_ORDER: PlayerPositionGroup[] = ['GK', 'DEF', 'MID', 'FWD'];

const GROUP_LABEL: Record<PlayerPositionGroup, string> = {
  GK: 'Arquero',
  DEF: 'Defensa',
  MID: 'Mediocampo',
  FWD: 'Ataque',
};

export function MatchLineups({ lineups }: MatchLineupsProps) {
  if (!lineups[0] || !lineups[1]) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-4"
    >
      <div className="flex items-end justify-between border-b border-white/5 pb-3">
        <h2 className="text-xl font-display font-black text-white uppercase tracking-tight inline-flex items-center gap-2">
          <span className="text-pitch-400">●</span>
          Alineaciones
        </h2>
        <div className="text-[11px] text-night-300 hidden sm:flex items-center gap-3">
          {lineups.map((l, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5">
              <span className="font-mono font-bold text-pitch-300">{l.formation || '—'}</span>
              <span className="text-night-400">{l.team.shortName}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {lineups.map((lineup, sideIdx) => (
          <LineupSide key={lineup.homeAway} lineup={lineup} side={sideIdx === 0 ? 'left' : 'right'} />
        ))}
      </div>
    </motion.section>
  );
}

interface LineupSideProps {
  lineup: TeamLineup;
  side: 'left' | 'right';
}

function LineupSide({ lineup, side }: LineupSideProps) {
  const starters = lineup.players.filter((p) => p.starter).sort((a, b) => a.formationPlace - b.formationPlace);
  const subs = lineup.players.filter((p) => !p.starter);

  return (
    <div className="rounded-2xl glass overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: lineup.team.color }} />
          <span className="font-bold text-white text-sm">{lineup.team.shortName}</span>
          <span className="text-[10px] uppercase tracking-widest text-night-400">
            {lineup.homeAway === 'home' ? 'Local' : 'Visitante'}
          </span>
        </div>
        <span className="font-mono font-bold text-pitch-300 text-sm">{lineup.formation || '—'}</span>
      </div>

      <PitchView players={starters} side={side} teamColor={lineup.team.color} />

      {subs.length > 0 && (
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-night-400">
            <span className="font-bold">Suplentes</span>
            <span>· {subs.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {subs.slice(0, 12).map((p) => (
              <SubChip key={p.id} player={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PitchViewProps {
  players: LineupPlayer[];
  side: 'left' | 'right';
  teamColor: string;
}

function PitchView({ players, side, teamColor }: PitchViewProps) {
  // Group players by position row
  const rows: Record<PlayerPositionGroup, LineupPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) rows[p.position.group].push(p);

  // Sort by formationPlace so left→right order is consistent
  for (const k of ROW_ORDER) {
    rows[k].sort((a, b) => a.formationPlace - b.formationPlace);
  }

  // Vertical position of each row (top to bottom)
  // GK at 12% from top, DEF at 35%, MID at 58%, FWD at 82%
  const rowTop: Record<PlayerPositionGroup, string> = {
    GK: '8%',
    DEF: '32%',
    MID: '55%',
    FWD: '78%',
  };

  return (
    <div className="relative w-full aspect-[3/4] sm:aspect-[4/5] bg-pitch-900 overflow-hidden">
      {/* Pitch markings */}
      <PitchMarkings side={side} />
      <div
        className="absolute inset-0 opacity-15"
        style={{ background: 'repeating-linear-gradient(0deg, transparent 0, transparent 22px, rgba(255,255,255,0.5) 22px, rgba(255,255,255,0.5) 24px)' }}
      />

      {/* Players on the pitch */}
      {ROW_ORDER.map((rowKey) =>
        rows[rowKey].map((player, idx) => {
          const total = rows[rowKey].length;
          // Distribute horizontally: 50% center for single, spread evenly for multiple
          const leftPct = total === 1 ? 50 : ((idx + 1) / (total + 1)) * 100;
          return (
            <PlayerMarker
              key={`${rowKey}-${player.id}`}
              player={player}
              left={leftPct}
              top={rowTop[rowKey]}
              teamColor={teamColor}
              side={side}
            />
          );
        }),
      )}
    </div>
  );
}

interface PlayerMarkerProps {
  player: LineupPlayer;
  left: number;
  top: string;
  teamColor: string;
  side: 'left' | 'right';
}

function PlayerMarker({ player, left, top, teamColor }: PlayerMarkerProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [jerseyFailed, setJerseyFailed] = useState(false);
  const useJersey = player.jerseyImageUrl && !jerseyFailed;
  const usePhoto = player.headshotUrl && !imgFailed;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24, delay: player.formationPlace * 0.04 }}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
      style={{ left: `${left}%`, top }}
    >
      <div className="relative">
        {useJersey ? (
          <img
            src={player.jerseyImageUrl}
            alt={player.name}
            loading="lazy"
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain drop-shadow-lg"
            onError={() => setJerseyFailed(true)}
          />
        ) : usePhoto ? (
          <img
            src={player.headshotUrl}
            alt={player.name}
            loading="lazy"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-white/40 bg-night-800"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full ring-2 ring-white/40 flex items-center justify-center font-display font-black text-sm text-white drop-shadow-md"
            style={{
              background: `linear-gradient(135deg, ${teamColor} 0%, ${darken(teamColor, 30)} 100%)`,
            }}
          >
            {player.shortName
              .split(/\s+/)
              .slice(0, 2)
              .map((s) => s[0])
              .join('')
              .toUpperCase()}
          </div>
        )}
        <div
          className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full ring-2 ring-night-900 text-[9px] font-mono font-bold text-white flex items-center justify-center"
          style={{ background: teamColor }}
        >
          {player.jersey}
        </div>
      </div>
      <div className="hidden sm:block text-center max-w-[64px]">
        <div className="text-[9px] font-bold text-white leading-tight drop-shadow-md truncate">
          {player.shortName.split(' ').pop() || player.shortName}
        </div>
      </div>
    </motion.div>
  );
}

function PitchMarkings({ side }: { side: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 100 130"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ transform: side === 'right' ? 'scaleX(-1)' : undefined }}
    >
      {/* Outer pitch */}
      <rect x="2" y="2" width="96" height="126" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      {/* Center line */}
      <line x1="2" y1="65" x2="98" y2="65" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
      {/* Center circle */}
      <circle cx="50" cy="65" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" fill="none" />
      {/* Penalty box top */}
      <rect x="22" y="2" width="56" height="16" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      {/* Goal area top */}
      <rect x="35" y="2" width="30" height="7" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      {/* Penalty box bottom */}
      <rect x="22" y="112" width="56" height="16" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      {/* Goal area bottom */}
      <rect x="35" y="121" width="30" height="7" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      {/* Penalty spots */}
      <circle cx="50" cy="11" r="0.7" fill="rgba(255,255,255,0.5)" />
      <circle cx="50" cy="119" r="0.7" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

function SubChip({ player }: { player: LineupPlayer }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [jerseyFailed, setJerseyFailed] = useState(false);
  const useJersey = player.jerseyImageUrl && !jerseyFailed;
  const usePhoto = player.headshotUrl && !imgFailed;

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/5 px-2 py-1 text-[11px]">
      <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-night-800" style={{ background: !useJersey && !usePhoto ? `linear-gradient(135deg, ${'#666'}, #333)` : undefined }}>
        {useJersey ? (
          <img src={player.jerseyImageUrl} alt={player.name} className="w-full h-full object-contain" onError={() => setJerseyFailed(true)} />
        ) : usePhoto ? (
          <img src={player.headshotUrl} alt={player.name} className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
        ) : (
          <span className="text-[9px] font-bold text-white">{player.shortName.charAt(0)}</span>
        )}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-white truncate leading-tight">{player.shortName.split(' ').pop()}</div>
        <div className="text-[9px] text-night-400 uppercase tracking-wider">#{player.jersey} · {GROUP_LABEL[player.position.group]}</div>
      </div>
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
