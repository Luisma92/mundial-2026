import { useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, TrendingUp, Goal } from 'lucide-react';
import { useStandings, useTeamMatches } from '@/hooks/useWorldCup';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { MatchCard } from '@/components/matches/MatchCard';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { buildTeamFromAbbr } from '@/lib/teams';
import { clsx } from 'clsx';

export function TeamDetailPage() {
  const { abbr } = useParams<{ abbr: string }>();
  const upperAbbr = (abbr ?? '').toUpperCase();
  const standingsQ = useStandings();
  const matchesQ = useTeamMatches(upperAbbr);

  const standing = useMemo(() => {
    if (!standingsQ.data) return null;
    for (const group of standingsQ.data) {
      const s = group.standings.find((s) => s.team.abbreviation.toUpperCase() === upperAbbr);
      if (s) return { ...s, groupLetter: group.letter };
    }
    return null;
  }, [standingsQ.data, upperAbbr]);

  const team = standing?.team ?? buildTeamFromAbbr(upperAbbr, `team-${upperAbbr}`);
  const matches = matchesQ.data ?? [];
  const played = matches.filter((m) => m.status === 'final' || m.status === 'in_progress');
  const upcoming = matches.filter((m) => m.status === 'scheduled');

  const stats = useMemo(() => {
    let gf = 0;
    let ga = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;
    for (const m of played) {
      const isHome = m.home.team.abbreviation.toUpperCase() === upperAbbr;
      const score = m.score;
      if (!score) continue;
      const our = isHome ? score.home : score.away;
      const their = isHome ? score.away : score.home;
      gf += our;
      ga += their;
      if (our > their) wins++;
      else if (our < their) losses++;
      else draws++;
    }
    return { gf, ga, wins, draws, losses, played: played.length, diff: gf - ga };
  }, [played, upperAbbr]);

  const isFav = team.isFavorite;
  const teamBgGradient = isFav
    ? team.abbreviation === 'ESP'
      ? 'gradient-spain'
      : team.abbreviation === 'ARG'
        ? 'gradient-argentina'
        : 'gradient-pitch'
    : 'gradient-pitch';

  return (
    <div className="space-y-8">
      <Link to="/equipos" className="inline-flex items-center gap-1 text-sm text-night-300 hover:text-white focus-ring rounded">
        <ArrowLeft className="w-4 h-4" />
        Volver a equipos
      </Link>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx('relative overflow-hidden rounded-3xl border border-white/5')}
      >
        <div className={clsx(teamBgGradient, 'absolute inset-0 opacity-20')} />
        <div className="absolute inset-0 bg-gradient-to-b from-night-900/40 via-night-900/60 to-night-900/90" />

        <div className="relative p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <TeamFlag team={team} size="2xl" showRing ringColor={team.color} />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-night-300 uppercase tracking-widest mb-1">
              {standing ? `Grupo ${standing.groupLetter} · Posición ${standing.position}` : 'Selección nacional'}
              {isFav && <span className="ml-2 chip bg-pitch-500/20 text-pitch-300">★ Favorita</span>}
            </div>
            <h1 className="font-display font-black text-5xl sm:text-6xl text-white leading-none tracking-tight">
              {team.name}
            </h1>
            <div className="mt-2 text-sm text-night-200 uppercase tracking-wider">
              {team.abbreviation}
            </div>
          </div>
        </div>
      </motion.div>

      {standing && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Trophy} label="Puntos" value={standing.points} accent="text-pitch-300" />
          <StatCard icon={TrendingUp} label="Posición" value={`#${standing.position}`} />
          <StatCard icon={Goal} label="Goles a favor" value={stats.gf} />
          <StatCard icon={Goal} label="Goles en contra" value={stats.ga} accent="text-red-400" />
          <StatCard label="PJ" value={stats.played} />
          <StatCard label="G / E / P" value={`${stats.wins} · ${stats.draws} · ${stats.losses}`} />
          <StatCard label="Diferencia" value={stats.diff > 0 ? `+${stats.diff}` : stats.diff} accent={stats.diff > 0 ? 'text-pitch-300' : stats.diff < 0 ? 'text-red-400' : undefined} />
          <StatCard label="GF / Partido" value={stats.played > 0 ? (stats.gf / stats.played).toFixed(2) : '—'} />
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-display font-black text-white uppercase tracking-tight">Próximos partidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {upcoming.slice(0, 6).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-display font-black text-white uppercase tracking-tight">Historial</h2>
        {matchesQ.isLoading ? (
          <div className="rounded-2xl glass p-8"><Spinner /></div>
        ) : matchesQ.isError ? (
          <ErrorState message={(matchesQ.error as Error).message} onRetry={() => matchesQ.refetch()} />
        ) : played.length === 0 ? (
          <div className="rounded-2xl glass p-8 text-center text-night-300 text-sm">
            Aún no jugó partidos finalizados.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {played.slice(0, 12).map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon?: typeof Trophy; label: string; value: string | number; accent?: string }) {
  return (
    <div className="rounded-2xl glass p-4">
      <div className="text-[10px] uppercase tracking-widest text-night-400 mb-1 inline-flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className={clsx('font-mono font-black text-2xl tabular-nums', accent ?? 'text-white')}>
        {value}
      </div>
    </div>
  );
}
