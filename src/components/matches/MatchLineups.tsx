import { motion } from 'framer-motion';
import { useState } from 'react';
import type { LineupPlayer, TeamLineup, PlayerPositionGroup } from '@/lib/types';

interface MatchLineupsProps {
  lineups: [TeamLineup, TeamLineup];
}

const ROW_ORDER: PlayerPositionGroup[] = ['GK', 'DEF', 'MID', 'FWD'];

export function MatchLineups({ lineups }: MatchLineupsProps) {
  if (!lineups[0] || !lineups[1]) return null;
  const home = lineups[0].homeAway === 'home' ? lineups[0] : lineups[1];
  const away = lineups[0].homeAway === 'away' ? lineups[0] : lineups[1];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="space-y-4"
    >
      <div className="flex items-end justify-between gap-3 border-b border-white/5 pb-3">
        <h2 className="text-xl font-display font-black text-white uppercase tracking-tight inline-flex items-center gap-2">
          <span className="text-pitch-400">●</span>
          Alineaciones
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-night-300">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: home.team.color }} />
            <span className="font-mono font-bold text-pitch-300">{home.formation || '—'}</span>
            <span className="text-night-400">{home.team.shortName}</span>
          </span>
          <span className="text-night-600">vs</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono font-bold text-pitch-300">{away.formation || '—'}</span>
            <span className="text-night-400">{away.team.shortName}</span>
            <span className="w-2 h-2 rounded-full" style={{ background: away.team.color }} />
          </span>
        </div>
      </div>

      <FullPitch home={home} away={away} />
    </motion.section>
  );
}

interface FullPitchProps {
  home: TeamLineup;
  away: TeamLineup;
}

function FullPitch({ home, away }: FullPitchProps) {
  // Parse formation like "4-4-2" → [4, 4, 2] (DEF, MID, FWD)
  const homeFormation = parseFormation(home.formation);
  const awayFormation = parseFormation(away.formation);

  const homeRows = groupByRow(home.players.filter((p) => p.starter));
  const awayRows = groupByRow(away.players.filter((p) => p.starter));

  // Y positions (top → bottom): GK near goal, FWD near opponent goal
  const homeY: Record<PlayerPositionGroup, number> = {
    GK: 88,
    DEF: 70,
    MID: 52,
    FWD: 32,
  };
  const awayY: Record<PlayerPositionGroup, number> = {
    GK: 12,
    DEF: 30,
    MID: 48,
    FWD: 68,
  };

  const homeSubs = home.players.filter((p) => !p.starter);
  const awaySubs = away.players.filter((p) => !p.starter);

  return (
    <div className="rounded-2xl glass overflow-hidden">
      <div className="relative w-full aspect-[5/6] sm:aspect-[16/11] bg-pitch-900">
        {/* Pitch markings — single field, no orientation flip needed */}
        <PitchMarkings />
        {/* Subtle grass stripes */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent 0, transparent 36px, rgba(255,255,255,0.4) 36px, rgba(255,255,255,0.4) 38px)',
          }}
        />

        {/* Home team: bottom half, attacking up */}
        {ROW_ORDER.map((row) =>
          homeRows[row].map((player, idx) => (
            <PlayerMarker
              key={`home-${row}-${player.id}`}
              player={player}
              leftPct={horizontalPosition(row, idx, homeRows[row].length, homeFormation)}
              topPct={homeY[row]}
              teamColor={home.team.color}
              align="up"
              delay={player.formationPlace * 0.04}
            />
          )),
        )}

        {/* Away team: top half, attacking down */}
        {ROW_ORDER.map((row) =>
          awayRows[row].map((player, idx) => (
            <PlayerMarker
              key={`away-${row}-${player.id}`}
              player={player}
              leftPct={horizontalPosition(row, idx, awayRows[row].length, awayFormation)}
              topPct={awayY[row]}
              teamColor={away.team.color}
              align="down"
              delay={player.formationPlace * 0.04}
            />
          )),
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-white/5">
        <SubsSection lineup={home} subs={homeSubs} align="left" />
        <SubsSection lineup={away} subs={awaySubs} align="right" />
      </div>
    </div>
  );
}

function groupByRow(players: LineupPlayer[]): Record<PlayerPositionGroup, LineupPlayer[]> {
  const rows: Record<PlayerPositionGroup, LineupPlayer[]> = { GK: [], DEF: [], MID: [], FWD: [] };
  for (const p of players) rows[p.position.group].push(p);
  for (const k of ROW_ORDER) {
    rows[k].sort((a, b) => a.formationPlace - b.formationPlace);
  }
  return rows;
}

function parseFormation(formation: string | undefined): number[] {
  if (!formation) return [4, 4, 2];
  const match = formation.match(/(\d+)-(\d+)-(\d+)/);
  if (!match) return [4, 4, 2];
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

// Distribute horizontally within each row.
// For DEF/MID/FWD: spread evenly across pitch width.
// For GK: center.
function horizontalPosition(
  row: PlayerPositionGroup,
  idx: number,
  count: number,
  _formation: number[],
): number {
  if (row === 'GK') return 50;
  const slots = count;
  if (slots === 1) return 50;
  const margin = 12;
  const usable = 100 - margin * 2;
  const step = usable / (slots - 1);
  return margin + step * idx;
}

interface PlayerMarkerProps {
  player: LineupPlayer;
  leftPct: number;
  topPct: number;
  teamColor: string;
  align: 'up' | 'down';
  delay: number;
}

function PlayerMarker({ player, leftPct, topPct, teamColor, align, delay }: PlayerMarkerProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [jerseyFailed, setJerseyFailed] = useState(false);
  const useJersey = player.jerseyImageUrl && !jerseyFailed;
  const usePhoto = player.headshotUrl && !imgFailed;

  const labelOffset = align === 'up' ? 'top-full mt-1' : 'bottom-full mb-1';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.4 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay }}
      className="absolute z-10"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative">
        {useJersey ? (
          <img
            src={player.jerseyImageUrl}
            alt={player.name}
            loading="lazy"
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg"
            onError={() => setJerseyFailed(true)}
          />
        ) : usePhoto ? (
          <img
            src={player.headshotUrl}
            alt={player.name}
            loading="lazy"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-white/50 bg-night-800"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full ring-2 ring-white/40 flex items-center justify-center font-display font-black text-sm text-white drop-shadow-md"
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
          className="absolute -bottom-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full ring-2 ring-night-900 text-[9px] font-mono font-bold text-white flex items-center justify-center shadow"
          style={{ background: teamColor }}
        >
          {player.jersey}
        </div>
      </div>

      {/* Name label — appears on opposite side of attack direction */}
      <div className={`absolute left-1/2 -translate-x-1/2 ${labelOffset} hidden sm:block`}>
        <div className="px-1.5 py-0.5 rounded bg-night-900/85 backdrop-blur-sm ring-1 ring-white/10 whitespace-nowrap max-w-[80px] truncate">
          <span className="text-[10px] font-bold text-white leading-tight">
            {player.shortName.split(' ').pop() || player.shortName}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function PitchMarkings() {
  return (
    <svg
      viewBox="0 0 100 130"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
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
      {/* Half-moon top (penalty arc) */}
      <path d="M 42 18 Q 50 24 58 18" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" fill="none" />
      <path d="M 42 112 Q 50 106 58 112" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" fill="none" />
    </svg>
  );
}

interface SubsSectionProps {
  lineup: TeamLineup;
  subs: LineupPlayer[];
  align: 'left' | 'right';
}

function SubsSection({ lineup, subs, align }: SubsSectionProps) {
  if (subs.length === 0) return <div />;
  return (
    <div className={clsx2('p-3', align === 'right' && 'sm:border-l border-white/5')}>
      <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-night-400">
        <span className="w-2 h-2 rounded-full" style={{ background: lineup.team.color }} />
        <span className="font-bold">{lineup.team.shortName} · Suplentes</span>
        <span>· {subs.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {subs.slice(0, 12).map((p) => (
          <SubChip key={p.id} player={p} teamColor={lineup.team.color} />
        ))}
      </div>
    </div>
  );
}

function SubChip({ player, teamColor }: { player: LineupPlayer; teamColor: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [jerseyFailed, setJerseyFailed] = useState(false);
  const useJersey = player.jerseyImageUrl && !jerseyFailed;
  const usePhoto = player.headshotUrl && !imgFailed;

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/5 px-2 py-1 text-[11px]">
      <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 bg-night-800">
        {useJersey ? (
          <img src={player.jerseyImageUrl} alt={player.name} className="w-full h-full object-contain" onError={() => setJerseyFailed(true)} />
        ) : usePhoto ? (
          <img src={player.headshotUrl} alt={player.name} className="w-full h-full object-cover" onError={() => setImgFailed(true)} />
        ) : (
          <span
            className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white"
            style={{ background: `linear-gradient(135deg, ${teamColor} 0%, ${darken(teamColor, 30)} 100%)` }}
          >
            {player.shortName.charAt(0)}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <div className="font-bold text-white truncate leading-tight">{player.shortName.split(' ').pop()}</div>
        <div className="text-[9px] text-night-400 uppercase tracking-wider">
          #{player.jersey} · {player.position.abbreviation}
        </div>
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

// Lightweight clsx replacement to avoid extra import
function clsx2(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(' ');
}
