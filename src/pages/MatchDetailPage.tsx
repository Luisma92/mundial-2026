import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, MapPin, Tv, Trophy, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useMatches } from '@/hooks/useWorldCup';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { LiveBadge } from '@/components/matches/LiveBadge';
import { ScoreDisplay } from '@/components/matches/ScoreDisplay';
import { MatchTimeline } from '@/components/matches/MatchTimeline';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { formatMatchDate, formatMatchTime, timeUntil } from '@/lib/format';

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useMatches();

  const match = useMemo(() => data?.find((m) => m.id === id), [data, id]);

  if (isLoading) {
    return <div className="rounded-2xl glass p-12"><Spinner label="Cargando partido..." /></div>;
  }
  if (isError) return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (!match) {
    return (
      <div className="space-y-4">
        <Link to="/calendario" className="inline-flex items-center gap-1 text-sm text-night-300 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Calendario
        </Link>
        <div className="rounded-2xl glass p-12 text-center text-night-300">
          Partido no encontrado.
        </div>
      </div>
    );
  }

  const isLive = match.status === 'in_progress' || match.status === 'halftime';
  const isFinished = match.status === 'final';
  const hasEvents = match.events && match.events.length > 0;

  return (
    <div className="space-y-6">
      <Link to="/calendario" className="inline-flex items-center gap-1 text-sm text-night-300 hover:text-white focus-ring rounded">
        <ArrowLeft className="w-4 h-4" />
        Volver al calendario
      </Link>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl glass-strong overflow-hidden relative"
      >
        <div className="absolute inset-0 pitch-pattern opacity-30" />
        <div className="relative p-8 sm:p-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            {match.group && <span className="chip bg-white/10 text-night-100">{match.group}</span>}
            <span className="chip bg-white/10 text-night-100">{match.round}</span>
            {isLive ? (
              <LiveBadge minute={match.minute} clock={match.clock} />
            ) : isFinished ? (
              <span className="chip bg-night-700 text-night-300">FINAL</span>
            ) : (
              <span className="chip bg-pitch-500/20 text-pitch-300">
                <CalendarIcon className="w-3 h-3" />
                {formatMatchDate(match.startTimeUtc)}
              </span>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 mt-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <TeamFlag team={match.home.team} size="2xl" showRing ringColor={match.home.team.color} />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">{match.home.team.name}</h2>
              <span className="text-[10px] text-night-400 uppercase tracking-widest">{match.home.team.abbreviation}</span>
            </div>

            <div className="px-2">
              {match.score && (isLive || isFinished) ? (
                <ScoreDisplay home={match.score.home} away={match.score.away} size="hero" highlight={isLive} />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="font-mono font-black text-5xl sm:text-6xl text-white">{formatMatchTime(match.startTimeUtc)}</span>
                  <span className="text-[10px] text-night-400 uppercase tracking-wider">{timeUntil(match.startTimeUtc)}</span>
                </div>
              )}
              {(isLive || isFinished) && (
                <div className="mt-3 text-xs text-night-400">
                  {match.clock && isLive ? `${match.clock} · ${match.minute ?? 0}'` : match.statusDetail}
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-3 text-center">
              <TeamFlag team={match.away.team} size="2xl" showRing ringColor={match.away.team.color} />
              <h2 className="font-display font-black text-2xl sm:text-3xl text-white">{match.away.team.name}</h2>
              <span className="text-[10px] text-night-400 uppercase tracking-widest">{match.away.team.abbreviation}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoCard icon={MapPin} label="Estadio" value={match.venue || 'Por confirmar'} />
        <InfoCard icon={CalendarIcon} label="Fecha y hora" value={`${formatMatchDate(match.startTimeUtc)} · ${formatMatchTime(match.startTimeUtc)}`} />
        {match.broadcasters.length > 0 && (
          <InfoCard icon={Tv} label="Transmite" value={match.broadcasters.join(' · ')} />
        )}
        <InfoCard icon={Trophy} label="Fase" value={match.round || match.phase} />
      </div>

      {hasEvents ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-display font-black text-white uppercase tracking-tight inline-flex items-center gap-2">
            <span className="text-pitch-400">●</span>
            Eventos del partido
            <span className="text-xs text-night-400 font-normal normal-case tracking-normal">· {match.events!.length}</span>
          </h2>
          <div className="rounded-2xl glass p-6">
            <MatchTimeline
              events={match.events!}
              homeAbbr={match.home.team.abbreviation}
              awayAbbr={match.away.team.abbreviation}
            />
          </div>
        </motion.section>
      ) : null}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="rounded-2xl glass p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-night-400 mb-2">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-white text-sm">{value}</div>
    </div>
  );
}
