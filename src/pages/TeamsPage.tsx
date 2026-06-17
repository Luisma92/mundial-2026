import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Search, Star, ChevronRight, Globe } from 'lucide-react';
import { useStandings, useMatches } from '@/hooks/useWorldCup';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { clsx } from 'clsx';
import type { Team } from '@/lib/types';
import { useFavorites } from '@/lib/favorites';
import { getConfederation, isPlaceholderTeam } from '@/lib/teams';
import { TOURNAMENT } from '@/lib/constants';

type SortMode = 'confederation' | 'alphabetical' | 'favorites';

export function TeamsPage() {
  const standingsQ = useStandings();
  const matchesQ = useMatches();
  const { favorites, toggle, isFavorite, count: favCount } = useFavorites();
  const [search, setSearch] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('confederation');

  const allTeams = useMemo<Team[]>(() => {
    const set = new Map<string, Team>();
    for (const group of standingsQ.data ?? []) {
      for (const s of group.standings) {
        if (!isPlaceholderTeam(s.team.abbreviation)) set.set(s.team.id, s.team);
      }
    }
    for (const match of matchesQ.data ?? []) {
      if (!isPlaceholderTeam(match.home.team.abbreviation)) set.set(match.home.team.id, match.home.team);
      if (!isPlaceholderTeam(match.away.team.abbreviation)) set.set(match.away.team.id, match.away.team);
    }
    return Array.from(set.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [standingsQ.data, matchesQ.data]);

  const favoriteTeams = useMemo(
    () => allTeams.filter((t) => isFavorite(t.abbreviation)),
    [allTeams, isFavorite, favorites],
  );

  const filtered = useMemo(() => {
    let teams = allTeams;
    if (onlyFavorites) teams = teams.filter((t) => isFavorite(t.abbreviation));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      teams = teams.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.abbreviation.toLowerCase().includes(q),
      );
    }
    const sorted = [...teams];
    if (sortMode === 'favorites') {
      sorted.sort((a, b) => {
        const af = isFavorite(a.abbreviation) ? 1 : 0;
        const bf = isFavorite(b.abbreviation) ? 1 : 0;
        if (af !== bf) return bf - af;
        return a.name.localeCompare(b.name, 'es');
      });
    } else if (sortMode === 'alphabetical') {
      sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    } else {
      sorted.sort((a, b) => {
        const ac = getConfederation(a.abbreviation)?.code ?? 'ZZZ';
        const bc = getConfederation(b.abbreviation)?.code ?? 'ZZZ';
        if (ac !== bc) return ac.localeCompare(bc);
        return a.name.localeCompare(b.name, 'es');
      });
    }
    return sorted;
  }, [allTeams, search, onlyFavorites, sortMode, favorites, isFavorite]);

  const confedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of allTeams) {
      const c = getConfederation(t.abbreviation);
      const code = c?.code ?? 'Otros';
      counts[code] = (counts[code] ?? 0) + 1;
    }
    return counts;
  }, [allTeams]);

  const grouped = useMemo(() => {
    if (sortMode !== 'confederation') return null;
    const groups: Record<string, Team[]> = {};
    for (const t of filtered) {
      const code = getConfederation(t.abbreviation)?.code ?? 'Otros';
      groups[code] = [...(groups[code] ?? []), t];
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, sortMode]);

  const isLoading = standingsQ.isLoading || matchesQ.isLoading;
  const isError = standingsQ.isError;

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-3xl pitch-pattern border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-night-900/80 via-night-900/60 to-night-900/80" />
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-pitch-500/15 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-argentina-500/15 blur-3xl" />
        <div className="relative px-6 sm:px-10 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full glass-strong text-[10px] uppercase tracking-widest text-night-300">
                <Globe className="w-3 h-3" /> {TOURNAMENT.teams} selecciones · 6 confederaciones
              </div>
              <h1 className="font-display font-black text-4xl sm:text-5xl text-white leading-none tracking-tight">
                <span className="text-gradient-pitch">Equipos</span> del Mundial
              </h1>
              <p className="text-sm text-night-300 mt-2 max-w-xl">
                Tocá la estrella para seguir una selección. Vamos a personalizar tus partidos, alertas y estadísticas.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 min-w-[260px]">
              <StatPill label="Equipos" value={allTeams.length} accent="text-white" />
              <StatPill label="Mis favoritas" value={favCount} accent={favCount > 0 ? 'text-pitch-300' : 'text-night-400'} />
              <StatPill label="Grupos" value={TOURNAMENT.groups} accent="text-argentina-300" />
            </div>
          </div>
        </div>
      </header>

      {favCount === 0 && !isLoading && (
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
                Tocá la estrella en cualquier equipo para seguirlo. Personalizamos tu experiencia con resaltados,
                filtros en el calendario y rankings de goleadores de tus selecciones.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {favCount > 0 && favoriteTeams.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-end justify-between gap-3 border-b border-pitch-500/20 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-pitch-300 mb-1">
                <Star className="w-3 h-3 fill-current" /> Tus favoritas
              </div>
              <h2 className="font-display font-black text-xl text-white">{favoriteTeams.length} seguidas</h2>
            </div>
            <button
              onClick={() => setOnlyFavorites((v) => !v)}
              className={clsx(
                'inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors focus-ring',
                onlyFavorites
                  ? 'bg-pitch-500 text-white'
                  : 'bg-white/[0.04] text-night-300 hover:bg-white/[0.08] hover:text-white border border-white/10',
              )}
            >
              {onlyFavorites ? 'Viendo solo favoritas' : 'Ver solo favoritas'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {favoriteTeams.map((team, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="snap-start shrink-0 w-44"
              >
                <FavoriteRailCard team={team} onUnfollow={() => toggle(team.abbreviation)} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-display font-black text-white">
              {onlyFavorites ? 'Mis favoritas' : 'Todas las selecciones'}
            </h2>
            <span className="text-[10px] text-night-400 uppercase tracking-widest">
              {filtered.length} {filtered.length === 1 ? 'equipo' : 'equipos'}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-white/[0.04] rounded-xl p-0.5 border border-white/10">
              <SortButton active={sortMode === 'confederation'} onClick={() => setSortMode('confederation')}>
                Confederación
              </SortButton>
              <SortButton active={sortMode === 'alphabetical'} onClick={() => setSortMode('alphabetical')}>
                A-Z
              </SortButton>
              <SortButton active={sortMode === 'favorites'} onClick={() => setSortMode('favorites')}>
                Favoritas
              </SortButton>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar selección..."
                className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-3 py-2 text-sm placeholder:text-night-500 focus:outline-none focus:ring-2 focus:ring-pitch-400 focus:bg-white/[0.06]"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl glass p-12"><Spinner label="Cargando equipos..." /></div>
        ) : isError ? (
          <ErrorState message={(standingsQ.error as Error).message} onRetry={() => standingsQ.refetch()} />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl glass p-8 text-center text-night-300 text-sm">
            {onlyFavorites && favCount === 0
              ? 'No seguís ninguna selección todavía. Tocá una estrella para empezar.'
              : onlyFavorites
                ? `No hay favoritas que coincidan con "${search}".`
                : `No se encontró "${search}".`}
          </div>
        ) : grouped ? (
          <div className="space-y-8">
            {grouped.map(([code, teams]) => (
              <div key={code} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-widest text-night-300 font-bold">
                    {getConfederationLabel(code)}
                  </span>
                  <span className="text-[10px] text-night-500">· {teams.length} equipos</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                <TeamGrid teams={teams} isFavorite={isFavorite} toggle={toggle} />
              </div>
            ))}
          </div>
        ) : (
          <TeamGrid teams={filtered} isFavorite={isFavorite} toggle={toggle} />
        )}
      </section>

      {Object.keys(confedCounts).length > 0 && (
        <section className="rounded-2xl glass p-5">
          <h3 className="text-xs font-bold text-night-400 uppercase tracking-widest mb-3">Distribución por confederación</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(confedCounts)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([code, count]) => (
                <ConfedPill key={code} code={code} count={count} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl glass-strong p-3 text-center">
      <div className={clsx('font-mono font-black text-2xl tabular-nums leading-none', accent)}>{value}</div>
      <div className="text-[9px] uppercase tracking-widest text-night-400 mt-1.5">{label}</div>
    </div>
  );
}

function SortButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
        active ? 'bg-pitch-500 text-white shadow-sm' : 'text-night-300 hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function FavoriteRailCard({ team, onUnfollow }: { team: Team; onUnfollow: () => void }) {
  return (
    <Link
      to={`/equipos/${team.abbreviation.toLowerCase()}`}
      className="relative block rounded-2xl glass-strong border border-pitch-500/40 hover:border-pitch-500/70 p-4 group focus-ring transition-all hover:-translate-y-0.5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pitch-500/10 to-transparent rounded-2xl pointer-events-none" />
      <div className="relative flex flex-col items-center gap-2">
        <TeamFlag team={team} size="lg" showRing ringColor={team.color} />
        <div className="text-center w-full">
          <div className="text-sm font-bold text-white truncate">{team.shortName}</div>
          <div className="text-[10px] text-night-400 uppercase tracking-wider">{team.abbreviation}</div>
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUnfollow();
          }}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-pitch-500 text-white flex items-center justify-center hover:bg-pitch-400 focus-ring"
          aria-label={`Quitar ${team.shortName} de favoritas`}
        >
          <Star className="w-3 h-3 fill-current" />
        </button>
      </div>
    </Link>
  );
}

interface TeamGridProps {
  teams: Team[];
  isFavorite: (abbr: string) => boolean;
  toggle: (abbr: string) => boolean;
}

function TeamGrid({ teams, isFavorite, toggle }: TeamGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
    >
      {teams.map((team, idx) => {
        const fav = isFavorite(team.abbreviation);
        return (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.012, 0.4) }}
            className="relative group"
          >
            <Link
              to={`/equipos/${team.abbreviation.toLowerCase()}`}
              className={clsx(
                'group/team relative flex flex-col items-center gap-2 rounded-2xl p-4 transition-all focus-ring border h-full',
                fav
                  ? 'glass-strong border-pitch-500/40 hover:border-pitch-500/70 bg-pitch-900/20'
                  : 'glass border-white/5 hover:border-white/20 hover:bg-white/[0.04]',
              )}
            >
              <TeamFlag team={team} size="xl" showRing={fav} ringColor={team.color} />
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
  );
}

function ConfedPill({ code, count }: { code: string; count: number }) {
  const confedConf: Record<string, { color: string; label: string }> = {
    UEFA: { color: 'text-sky-300 bg-sky-500/15', label: 'UEFA' },
    CONMEBOL: { color: 'text-yellow-300 bg-yellow-500/15', label: 'CONMEBOL' },
    CONCACAF: { color: 'text-emerald-300 bg-emerald-500/15', label: 'CONCACAF' },
    AFC: { color: 'text-orange-300 bg-orange-500/15', label: 'AFC' },
    CAF: { color: 'text-purple-300 bg-purple-500/15', label: 'CAF' },
    OFC: { color: 'text-pink-300 bg-pink-500/15', label: 'OFC' },
    Otros: { color: 'text-night-300 bg-white/10', label: 'Otros' },
  };
  const c = confedConf[code] ?? confedConf.Otros;
  return (
    <div className={clsx('rounded-xl p-3 text-center', c.color)}>
      <div className="font-mono font-black text-xl tabular-nums">{count}</div>
      <div className="text-[9px] uppercase tracking-widest mt-0.5 opacity-90">{c.label}</div>
    </div>
  );
}

function getConfederationLabel(code: string): string {
  return code;
}
