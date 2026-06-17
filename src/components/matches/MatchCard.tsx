import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { MapPin, Tv } from 'lucide-react';
import { clsx } from 'clsx';
import type { Match } from '@/lib/types';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { LiveBadge } from './LiveBadge';
import { ScoreDisplay } from './ScoreDisplay';
import { formatMatchTime, isMatchToday, formatMatchDate } from '@/lib/format';
import { useFavorites } from '@/lib/favorites';

interface MatchCardProps {
  match: Match;
  variant?: 'default' | 'compact' | 'featured' | 'minimal';
  showDate?: boolean;
}

export function MatchCard({ match, variant = 'default', showDate = true }: MatchCardProps) {
  const { isFavorite } = useFavorites();
  const homeFav = isFavorite(match.home.team.abbreviation);
  const awayFav = isFavorite(match.away.team.abbreviation);
  const isLive = match.status === 'in_progress' || match.status === 'halftime';
  const isFinished = match.status === 'final';
  const hasScore = isLive || isFinished;

  if (variant === 'minimal') {
    return (
      <Link
        to={`/partidos/${match.id}`}
        className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] px-3 py-2 transition-colors focus-ring"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <TeamFlag team={match.home.team} size="xs" />
          <span className="text-xs text-night-100 truncate">{match.home.team.shortName}</span>
        </div>
        {hasScore && match.score ? (
          <ScoreDisplay home={match.score.home} away={match.score.away} size="sm" highlight={isLive} />
        ) : (
          <span className="text-[10px] text-night-300 font-mono">{formatMatchTime(match.startTimeUtc)}</span>
        )}
        <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
          <span className="text-xs text-night-100 truncate text-right">{match.away.team.shortName}</span>
          <TeamFlag team={match.away.team} size="xs" />
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/partidos/${match.id}`}
        className="flex items-center gap-3 rounded-xl glass hover:bg-white/[0.05] px-3 py-2.5 transition-colors focus-ring"
      >
        <div className="flex-1 flex items-center justify-end gap-2 min-w-0">
          <span className="text-sm text-white truncate">{match.home.team.shortName}</span>
          <TeamFlag team={match.home.team} size="sm" />
        </div>
        <div className="w-20 text-center">
          {hasScore && match.score ? (
            <ScoreDisplay home={match.score.home} away={match.score.away} size="sm" highlight={isLive} />
          ) : (
            <span className="text-sm font-mono text-night-200">{formatMatchTime(match.startTimeUtc)}</span>
          )}
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <TeamFlag team={match.away.team} size="sm" />
          <span className="text-sm text-white truncate">{match.away.team.shortName}</span>
        </div>
      </Link>
    );
  }

  const isFeatured = variant === 'featured';

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={clsx(
        'relative rounded-2xl overflow-hidden group focus-within:ring-2 focus-within:ring-pitch-400',
        isFeatured ? 'glass-strong p-6' : 'glass p-5',
        isLive && 'ring-1 ring-red-500/30',
      )}
    >
      <Link to={`/partidos/${match.id}`} className="absolute inset-0 z-10" aria-label="Ver detalles del partido" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4 text-xs">
          <div className="flex items-center gap-2 text-night-300">
            {match.group && (
              <span className="chip bg-white/5 text-night-200">
                {match.group}
              </span>
            )}
            <span>{match.round}</span>
          </div>
          {isLive ? (
            <LiveBadge minute={match.minute} clock={match.clock} />
          ) : isFinished ? (
            <span className="chip bg-night-700 text-night-300">FINAL</span>
          ) : showDate ? (
            <span className="chip bg-white/5 text-night-300">
              {isMatchToday(match.startTimeUtc) ? `Hoy · ${formatMatchTime(match.startTimeUtc)}` : formatMatchDate(match.startTimeUtc)}
            </span>
          ) : (
            <span className="chip bg-white/5 text-night-300">{formatMatchTime(match.startTimeUtc)}</span>
          )}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <TeamSide team={match.home.team} score={match.score?.home} winner={isFinished && match.winner === 'home'} isLive={isLive} align="right" featured={isFeatured} isFav={homeFav} />
          <div className="text-center min-w-[60px]">
            {hasScore && match.score ? (
              <ScoreDisplay home={match.score.home} away={match.score.away} size={isFeatured ? 'lg' : 'md'} highlight={isLive} />
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className={clsx('font-mono font-bold', isFeatured ? 'text-3xl' : 'text-2xl', 'text-white')}>
                  {formatMatchTime(match.startTimeUtc)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-night-400">
                  {isMatchToday(match.startTimeUtc) ? 'Hoy' : 'Kickoff'}
                </span>
              </div>
            )}
          </div>
          <TeamSide team={match.away.team} score={match.score?.away} winner={isFinished && match.winner === 'away'} isLive={isLive} align="left" featured={isFeatured} isFav={awayFav} />
        </div>

        {(match.venue || match.broadcasters.length > 0) && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-night-400">
            {match.venue && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {match.venue}
              </span>
            )}
            {match.broadcasters.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Tv className="w-3 h-3" />
                {match.broadcasters.slice(0, 3).join(' · ')}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface TeamSideProps {
  team: Match['home']['team'];
  score?: number;
  winner: boolean;
  isLive: boolean;
  align: 'left' | 'right';
  featured: boolean;
  isFav: boolean;
}

function TeamSide({ team, score, winner, align, featured, isFav }: TeamSideProps) {
  return (
    <div className={clsx('flex items-center gap-3', align === 'right' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
      <TeamFlag team={team} size={featured ? 'xl' : 'lg'} showRing={winner || isFav} ringColor={winner ? '#22c55e' : team.color} />
      <div className={clsx('min-w-0', align === 'right' ? 'items-end' : 'items-start', 'flex flex-col')}>
        <span className={clsx('font-bold text-white truncate max-w-[140px]', featured ? 'text-base' : 'text-sm')}>
          {team.shortName}
        </span>
        <span className="text-[10px] text-night-400 uppercase tracking-wider">{team.abbreviation}</span>
        {score !== undefined && winner && (
          <span className="text-[10px] text-pitch-400 font-bold uppercase tracking-wider mt-0.5">Ganador</span>
        )}
      </div>
    </div>
  );
}
