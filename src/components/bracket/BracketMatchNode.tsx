import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { Check, Sparkles } from 'lucide-react';
import type { Team, MatchStatus } from '@/lib/types';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { LiveBadge } from '@/components/matches/LiveBadge';
import { clsx } from 'clsx';

interface BracketMatchNodeProps {
  match: BracketNodeMatch;
  size?: 'sm' | 'md';
  predictionAbbr?: string;
  onPredict?: (winnerAbbr: string) => void;
  showPredictionControls?: boolean;
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

export function BracketMatchNode({ match, size = 'sm', predictionAbbr, onPredict, showPredictionControls }: BracketMatchNodeProps) {
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

  const homeIsPredicted = predictionAbbr?.toUpperCase() === homeTeam.abbreviation.toUpperCase();
  const awayIsPredicted = predictionAbbr?.toUpperCase() === awayTeam.abbreviation.toUpperCase();

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
            {homeIsPredicted && (
              <span title="Tu predicción">
                <Sparkles className="w-3 h-3 text-yellow-300 shrink-0" />
              </span>
            )}
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
            {awayIsPredicted && (
              <span title="Tu predicción">
                <Sparkles className="w-3 h-3 text-yellow-300 shrink-0" />
              </span>
            )}
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
      {showPredictionControls && onPredict && (
        <div className="border-t border-white/5 grid grid-cols-2 gap-px bg-white/5">
          <button
            onClick={(e) => {
              e.preventDefault();
              onPredict(homeTeam.abbreviation);
            }}
            className={clsx(
              'px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors focus-ring',
              homeIsPredicted
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-transparent text-night-400 hover:bg-white/5 hover:text-white',
            )}
          >
            {homeIsPredicted ? <Check className="w-3 h-3 inline mr-1" /> : null}
            {homeTeam.abbreviation}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onPredict(awayTeam.abbreviation);
            }}
            className={clsx(
              'px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors focus-ring',
              awayIsPredicted
                ? 'bg-yellow-500/20 text-yellow-300'
                : 'bg-transparent text-night-400 hover:bg-white/5 hover:text-white',
            )}
          >
            {awayIsPredicted ? <Check className="w-3 h-3 inline mr-1" /> : null}
            {awayTeam.abbreviation}
          </button>
        </div>
      )}
    </motion.div>
  );
}
