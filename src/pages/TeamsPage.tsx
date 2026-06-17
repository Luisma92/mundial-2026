import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Search, Star } from 'lucide-react';
import { useStandings, useMatches } from '@/hooks/useWorldCup';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { clsx } from 'clsx';
import type { Team } from '@/lib/types';
import { useFavorites } from '@/lib/favorites';

export function TeamsPage() {
  const standingsQ = useStandings();
  const matchesQ = useMatches();
  const { favorites, toggle, isFavorite, count } = useFavorites();
  const [search, setSearch] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const allTeams = useMemo<Team[]>(() => {
    const set = new Map<string, Team>();
    for (const group of standingsQ.data ?? []) {
      for (const s of group.standings) set.set(s.team.id, s.team);
    }
    for (const match of matchesQ.data ?? []) {
      set.set(match.home.team.id, match.home.team);
      set.set(match.away.team.id, match.away.team);
    }
    return Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [standingsQ.data, matchesQ.data]);

  const filtered = useMemo(() => {
    let teams = allTeams;
    if (onlyFavorites) {
      teams = teams.filter((t) => isFavorite(t.abbreviation));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      teams = teams.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.abbreviation.toLowerCase().includes(q),
      );
    }
    return [...teams].sort((a, b) => {
      const af = isFavorite(a.abbreviation) ? 1 : 0;
      const bf = isFavorite(b.abbreviation) ? 1 : 0;
      if (af !== bf) return bf - af;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [allTeams, search, onlyFavorites, favorites, isFavorite]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight">
            <span className="text-gradient-pitch">Equipos</span>
          </h1>
          <p className="text-sm text-night-400 mt-1">
            {allTeams.length} selecciones · Tocá la estrella para seguir una selección
            {count > 0 && (
              <span className="ml-2 chip bg-pitch-500/15 text-pitch-300">
                {count} {count === 1 ? 'favorita' : 'favoritas'}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setOnlyFavorites((v) => !v)}
            disabled={count === 0}
            className={clsx(
              'inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-ring shrink-0',
              count === 0
                ? 'bg-white/[0.02] text-night-500 cursor-not-allowed'
                : onlyFavorites
                  ? 'bg-pitch-500 text-white shadow-lg shadow-pitch-500/20'
                  : 'bg-white/[0.04] border border-white/10 text-night-200 hover:bg-white/[0.08] hover:text-white',
            )}
          >
            <Star className={clsx('w-4 h-4', onlyFavorites && 'fill-current')} />
            Mis favoritas
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar selección..."
              className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-3 py-2.5 text-sm placeholder:text-night-500 focus:outline-none focus:ring-2 focus:ring-pitch-400 focus:bg-white/[0.06]"
            />
          </div>
        </div>
      </header>

      {count === 0 && !standingsQ.isLoading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl glass-strong p-5 sm:p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-pitch-500/5 via-transparent to-argentina-500/5 pointer-events-none" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-pitch-500/20 flex items-center justify-center shrink-0">
              <Star className="w-6 h-6 text-pitch-300" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-display font-black text-white">Elegí tus selecciones favoritas</h2>
              <p className="text-sm text-night-300 mt-1">
                Tocá la estrella en cualquier equipo para seguirlo. Personalizamos tu experiencia con resaltados, filtros
                en el calendario y rankings de goleadores de tus selecciones.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {standingsQ.isLoading || matchesQ.isLoading ? (
        <div className="rounded-2xl glass p-12"><Spinner label="Cargando equipos..." /></div>
      ) : standingsQ.isError ? (
        <ErrorState message={(standingsQ.error as Error).message} onRetry={() => standingsQ.refetch()} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        >
          {filtered.map((team, idx) => {
            const fav = isFavorite(team.abbreviation);
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.015, 0.4) }}
                className="relative group"
              >
                <Link
                  to={`/equipos/${team.abbreviation.toLowerCase()}`}
                  className={clsx(
                    'group/team relative flex flex-col items-center gap-2 rounded-2xl p-4 transition-all focus-ring border',
                    fav
                      ? 'glass-strong border-pitch-500/40 hover:border-pitch-500/70 bg-pitch-900/20'
                      : 'glass border-white/5 hover:border-white/20 hover:bg-white/[0.04]',
                  )}
                >
                  <TeamFlag
                    team={team}
                    size="xl"
                    showRing={fav}
                    ringColor={team.color}
                  />
                  <div className="text-center w-full min-w-0">
                    <div className={clsx('text-sm font-bold truncate', fav ? 'text-pitch-200' : 'text-white')}>
                      {team.shortName}
                    </div>
                    <div className="text-[10px] text-night-400 uppercase tracking-wider mt-0.5">{team.abbreviation}</div>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggle(team.abbreviation);
                  }}
                  aria-label={fav ? `Quitar ${team.shortName} de favoritas` : `Marcar ${team.shortName} como favorita`}
                  className={clsx(
                    'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all focus-ring',
                    fav
                      ? 'bg-pitch-500 text-white shadow-lg shadow-pitch-500/30 hover:bg-pitch-400'
                      : 'bg-night-900/80 text-night-400 opacity-0 group-hover:opacity-100 hover:bg-pitch-500/30 hover:text-pitch-200',
                  )}
                >
                  <Star className={clsx('w-4 h-4', fav && 'fill-current')} />
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {filtered.length === 0 && !standingsQ.isLoading && !standingsQ.isError && (
        <div className="rounded-2xl glass p-8 text-center text-night-300 text-sm">
          {onlyFavorites && count === 0
            ? 'No seguís ninguna selección todavía. Tocá una estrella para empezar.'
            : onlyFavorites
              ? `No hay favoritas que coincidan con "${search}".`
              : `No se encontró "${search}".`}
        </div>
      )}
    </div>
  );
}
