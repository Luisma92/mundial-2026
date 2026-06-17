import { motion } from 'framer-motion';
import { Link } from 'react-router';
import type { Team, MatchStatus } from '@/lib/types';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { LiveBadge } from '@/components/matches/LiveBadge';
import { clsx } from 'clsx';

interface BracketMatchNodeProps {
  match: BracketNodeMatch;
  size?: 'sm' | 'md';
}

export interface BracketNodeMatch {
  id: string;
  status: MatchStatus;
  homeTeam: Team | null;
  awayTeam: Team | null;
  homeScore: number | null;
  awayScore: number | null;
  winner?: 'home' | 'away' | 'draw';
  minute?: number;
  clock?: string;
}

export function BracketMatchNode({ match, size = 'sm' }: BracketMatchNodeProps) {
  const isLive = match.status === 'in_progress' || match.status === 'halftime';
  const hasScore = match.status === 'final' || match.status === 'in_progress' || match.status === 'halftime';
  const homeTeam = match.homeTeam;
  const awayTeam = match.awayTeam;
  const homeScore = match.homeScore;
  const awayScore = match.awayScore;
  const winner = match.winner;

  if (!homeTeam || !awayTeam) {
    return (
      <div className={clsx('rounded-lg glass border border-dashed border-white/10 p-2', size === 'sm' ? 'text-[10px]' : 'text-xs')}>
        <div className="flex items-center justify-between gap-2 text-night-400">
          <span className="truncate">Por definir</span>
          <span className="text-night-500">vs</span>
          <span className="truncate">Por definir</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={clsx(
        'rounded-lg glass overflow-hidden',
        isLive && 'ring-1 ring-red-500/40',
        size === 'sm' ? 'text-[11px]' : 'text-xs',
      )}
    >
      <Link to={`/partidos/${match.id}`} className="block focus-ring rounded-lg">
        <div className={clsx('flex items-center justify-between px-2 py-1.5', winner === 'home' && 'bg-pitch-500/10')}>
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamFlag team={homeTeam} size="xs" />
            <span className={clsx('truncate font-medium', winner === 'home' ? 'text-pitch-300' : 'text-white')}>
              {homeTeam.shortName}
            </span>
          </div>
          <span className={clsx('font-mono font-bold tabular-nums w-5 text-center', winner === 'home' ? 'text-pitch-300' : 'text-white')}>
            {hasScore && homeScore !== null ? homeScore : '-'}
          </span>
        </div>
        <div className="border-t border-white/5 flex items-center justify-between px-2 py-1.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <TeamFlag team={awayTeam} size="xs" />
            <span className={clsx('truncate font-medium', winner === 'away' ? 'text-pitch-300' : 'text-white')}>
              {awayTeam.shortName}
            </span>
          </div>
          <span className={clsx('font-mono font-bold tabular-nums w-5 text-center', winner === 'away' ? 'text-pitch-300' : 'text-white')}>
            {hasScore && awayScore !== null ? awayScore : '-'}
          </span>
        </div>
        {isLive && (
          <div className="px-2 py-1 flex justify-center bg-red-500/10">
            <LiveBadge size="sm" minute={match.minute} clock={match.clock} />
          </div>
        )}
      </Link>
    </motion.div>
  );
}
