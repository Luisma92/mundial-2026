import { motion } from 'framer-motion';
import { useState } from 'react';
import type { LineupPlayer, TeamLineup } from '@/lib/types';

interface MatchLineupsProps {
  lineups: [TeamLineup, TeamLineup];
}

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
  const homeSubs = home.players.filter((p) => !p.starter);
  const awaySubs = away.players.filter((p) => !p.starter);

  return (
    <div className="rounded-2xl glass overflow-hidden">
      <div className="relative w-full bg-pitch-900 mx-auto" style={{ aspectRatio: '5/4', maxHeight: '680px', maxWidth: '760px' }}>
        <PitchMarkings />

        {/* Top half (0–50% of pitch): away team — GK at top, FWD at center */}
        <HalfOfPitch lineup={away} orientation="top" />

        {/* Bottom half (50–100% of pitch): home team — FWD at center, GK at bottom */}
        <HalfOfPitch lineup={home} orientation="bottom" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-white/5">
        <SubsSection lineup={home} subs={homeSubs} align="left" />
        <SubsSection lineup={away} subs={awaySubs} align="right" />
      </div>
    </div>
  );
}

interface HalfOfPitchProps {
  lineup: TeamLineup;
  orientation: 'top' | 'bottom';
}

function HalfOfPitch({ lineup, orientation }: HalfOfPitchProps) {
  const layout = buildLayout(lineup);
  if (layout.length === 0) return null;

  // Y positions within the half (0 = own edge, 100 = center line).
  // For top half: row 0 = GK (top, own goal), row N-1 = FWD (near center).
  // For bottom half: same row order, but Y is mirrored so GK ends at bottom.
  const rows = orientation === 'top' ? layout : [...layout].reverse();

  const N = rows.length;
  const positions = Array.from({ length: N }, (_, i) =>
    N === 1 ? 50 : 8 + (i / (N - 1)) * 84,
  );

  return (
    <div
      className="absolute left-0 right-0 pointer-events-none"
      style={{
        top: orientation === 'top' ? '0%' : '50%',
        bottom: orientation === 'top' ? '50%' : '0%',
      }}
    >
      {rows.map((row, idx) => (
        <div
          key={row.type}
          className="absolute left-0 right-0 flex justify-around items-center px-[5%]"
          style={{ top: `${positions[idx]}%`, transform: 'translateY(-50%)' }}
        >
          {row.players.map((p) => (
            <PlayerMarker key={p.id} player={p} teamColor={lineup.team.color} />
          ))}
        </div>
      ))}
    </div>
  );
}

type LayoutRow = {
  type: 'GK' | 'DEF' | 'DM' | 'MID' | 'AM' | 'FWD';
  players: LineupPlayer[];
};

function buildLayout(lineup: TeamLineup): LayoutRow[] {
  const starters = lineup.players.filter((p) => p.starter);
  const gks = starters.filter((p) => p.position.group === 'GK').sort(byFormationPlace);
  const defs = starters.filter((p) => p.position.group === 'DEF').sort(byFormationPlace);
  const fwds = starters.filter((p) => p.position.group === 'FWD').sort(byFormationPlace);
  const mids = starters.filter((p) => p.position.group === 'MID').sort(byFormationPlace);

  const formation = lineup.formation || '';
  const splitMid = formation === '4-2-3-1' || formation === '4-1-4-1';

  const amTypes = new Set(['AM', 'AM-R', 'AM-L', 'CAM', 'RAM', 'LAM']);
  let dmPlayers: LineupPlayer[] = [];
  let midPlayers: LineupPlayer[] = [];

  if (splitMid) {
    dmPlayers = mids.filter((p) => !amTypes.has(p.position.abbreviation));
    const amPlayers = mids.filter((p) => amTypes.has(p.position.abbreviation));
    if (formation === '4-2-3-1') {
      // Need exactly 2 DM, 3 AM. If classification is off, fallback to order split.
      const target = 2;
      if (dmPlayers.length !== target) {
        dmPlayers = mids.slice(0, target);
        midPlayers = [];
      } else {
        midPlayers = amPlayers;
      }
    } else {
      // 4-1-4-1: 1 DM + 4 MID. DM is the lone defensive mid.
      if (dmPlayers.length === 1) {
        midPlayers = amPlayers;
      } else {
        dmPlayers = mids.slice(0, 1);
        midPlayers = mids.slice(1);
      }
    }
  } else {
    midPlayers = mids;
  }

  const layout: LayoutRow[] = [];
  if (gks.length > 0) layout.push({ type: 'GK', players: gks });
  if (defs.length > 0) layout.push({ type: 'DEF', players: defs });
  if (dmPlayers.length > 0) layout.push({ type: 'DM', players: dmPlayers });
  if (midPlayers.length > 0) layout.push({ type: 'MID', players: midPlayers });
  if (fwds.length > 0) layout.push({ type: 'FWD', players: fwds });

  return layout;
}

function byFormationPlace(a: LineupPlayer, b: LineupPlayer): number {
  return a.formationPlace - b.formationPlace;
}

interface PlayerMarkerProps {
  player: LineupPlayer;
  teamColor: string;
}

function PlayerMarker({ player, teamColor }: PlayerMarkerProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const [jerseyFailed, setJerseyFailed] = useState(false);
  const useJersey = player.jerseyImageUrl && !jerseyFailed;
  const usePhoto = player.headshotUrl && !imgFailed;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22, delay: player.formationPlace * 0.025 }}
      className="flex flex-col items-center gap-1 group pointer-events-auto"
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
          className="absolute -bottom-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full ring-2 ring-night-900 text-[10px] font-mono font-bold text-white flex items-center justify-center shadow"
          style={{ background: teamColor }}
        >
          {player.jersey}
        </div>
      </div>
      <div className="hidden sm:block px-1.5 py-0.5 rounded bg-night-900/85 backdrop-blur-sm ring-1 ring-white/10 max-w-[88px] text-center">
        <div className="text-[10px] font-bold text-white leading-tight truncate">
          {player.shortName.split(' ').pop() || player.shortName}
        </div>
      </div>
    </motion.div>
  );
}

function PitchMarkings() {
  return (
    <svg
      viewBox="0 0 100 140"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <rect x="2" y="2" width="96" height="136" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" />
      <circle cx="50" cy="70" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" fill="none" />
      <rect x="22" y="2" width="56" height="16" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      <rect x="35" y="2" width="30" height="7" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      <rect x="22" y="122" width="56" height="16" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      <rect x="35" y="131" width="30" height="7" stroke="rgba(255,255,255,0.3)" strokeWidth="0.4" fill="none" />
      <circle cx="50" cy="11" r="0.8" fill="rgba(255,255,255,0.5)" />
      <circle cx="50" cy="129" r="0.8" fill="rgba(255,255,255,0.5)" />
      <circle cx="50" cy="70" r="0.8" fill="rgba(255,255,255,0.5)" />
      <path d="M 42 18 Q 50 24 58 18" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" fill="none" />
      <path d="M 42 122 Q 50 116 58 122" stroke="rgba(255,255,255,0.25)" strokeWidth="0.4" fill="none" />
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
    <div className={cx('p-3', align === 'right' && 'sm:border-l border-white/5')}>
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

function cx(...args: (string | false | undefined | null)[]): string {
  return args.filter(Boolean).join(' ');
}
