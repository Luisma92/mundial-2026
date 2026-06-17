import { useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, TrendingUp, Goal, Star, Users } from 'lucide-react';
import { useStandings, useTeamMatches, useTeamRoster } from '@/hooks/useWorldCup';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { PlayerCard } from '@/components/teams/PlayerCard';
import { MatchCard } from '@/components/matches/MatchCard';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { buildTeamFromAbbr } from '@/lib/teams';
import { clsx } from 'clsx';
import { useFavorites } from '@/lib/favorites';
import type { Player, PlayerPositionGroup } from '@/lib/types';

const POSITION_GROUP_ORDER: PlayerPositionGroup[] = ['GK', 'DEF', 'MID', 'FWD'];
const POSITION_GROUP_LABEL: Record<PlayerPositionGroup, string> = {
  GK: 'Arqueros',
  DEF: 'Defensores',
  MID: 'Mediocampistas',
  FWD: 'Delanteros',
};

export function TeamDetailPage() {
  const { abbr } = useParams<{ abbr: string }>();
  const upperAbbr = (abbr ?? '').toUpperCase();
  const standingsQ = useStandings();
  const matchesQ = useTeamMatches(upperAbbr);
  const rosterQ = useTeamRoster(upperAbbr);
  const { toggle, isFavorite } = useFavorites();
  const isFav = isFavorite(upperAbbr);

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

  const players = rosterQ.data ?? [];
  const playersByGroup = useMemo(() => {
    const groups: Record<PlayerPositionGroup, Player[]> = { GK: [], DEF: [], MID: [], FWD: [] };
    for (const p of players) groups[p.position.group].push(p);
    for (const k of POSITION_GROUP_ORDER) {
      groups[k].sort((a, b) => {
        if (b.stats.goals !== a.stats.goals) return b.stats.goals - a.stats.goals;
        if (b.stats.assists !== a.stats.assists) return b.stats.assists - a.stats.assists;
        return b.stats.appearances - a.stats.appearances;
      });
    }
    return groups;
  }, [players]);

  const topScorers = useMemo(() => {
    return players
      .filter((p) => p.stats.goals > 0)
      .sort((a, b) => b.stats.goals - a.stats.goals)
      .slice(0, 3);
  }, [players]);

  const teamBgGradient = 'gradient-pitch';

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
            <button
              onClick={() => toggle(upperAbbr)}
              className={clsx(
                'mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all focus-ring',
                isFav
                  ? 'bg-pitch-500/20 text-pitch-200 hover:bg-pitch-500/30 border border-pitch-500/40'
                  : 'bg-white/[0.06] text-white hover:bg-pitch-500 hover:shadow-lg hover:shadow-pitch-500/20 border border-white/10',
              )}
              aria-pressed={isFav}
            >
              <Star className={clsx('w-4 h-4', isFav && 'fill-current')} />
              {isFav ? 'Siguiendo' : 'Seguir esta selección'}
            </button>
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

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pitch-400" />
            <h2 className="text-lg font-display font-black text-white uppercase tracking-tight">Plantilla</h2>
            {rosterQ.data && (
              <span className="text-[10px] text-night-400 uppercase tracking-widest">
                {players.length} jugadores
              </span>
            )}
          </div>
        </div>

        {rosterQ.isLoading ? (
          <div className="rounded-2xl glass p-8"><Spinner label="Cargando plantilla..." /></div>
        ) : rosterQ.isError ? (
          <ErrorState message={(rosterQ.error as Error).message} onRetry={() => rosterQ.refetch()} />
        ) : players.length === 0 ? (
          <div className="rounded-2xl glass p-8 text-center text-night-300 text-sm">
            Plantilla no disponible para esta selección.
          </div>
        ) : (
          <>
            {topScorers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl glass-strong p-5 sm:p-6 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pitch-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <Goal className="w-4 h-4 text-pitch-300" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Goleadores del Mundial</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {topScorers.map((player, idx) => (
                      <div key={player.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/5 p-3">
                        <div className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0',
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-300' : idx === 1 ? 'bg-slate-300/20 text-slate-200' : 'bg-orange-500/20 text-orange-300',
                        )}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-white truncate">{player.shortName}</div>
                          <div className="text-[10px] text-night-400 uppercase tracking-wider">{player.position.abbreviation} · {player.jersey ? `#${player.jersey}` : '—'}</div>
                        </div>
                        <div className="font-mono font-black text-xl text-pitch-300 tabular-nums">{player.stats.goals}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-6">
              {POSITION_GROUP_ORDER.map((group) => {
                const list = playersByGroup[group];
                if (list.length === 0) return null;
                return (
                  <div key={group} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-night-300 uppercase tracking-widest">
                        {POSITION_GROUP_LABEL[group]}
                      </span>
                      <span className="text-night-500">· {list.length}</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {list.map((player, idx) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02 }}
                        >
                          <PlayerCard player={player} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

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
